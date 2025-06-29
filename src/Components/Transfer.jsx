import React, { useEffect, useState } from "react";
import Web3 from "web3";
import { contractABI, contractAddress } from "../config";
import { useNavigate } from "react-router-dom";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import "./Transfer.css";
import Navbar from "./Navbar";

const VehicleTransfer = () => {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");
  const [userVehicles, setUserVehicles] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("myVehicles");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [newOwnerWallet, setNewOwnerWallet] = useState("");
  const [newOwnerDetails, setNewOwnerDetails] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [incomingTransfers, setIncomingTransfers] = useState([]);
// Update the view state to include new option

  const navigate = useNavigate();
  const db = getFirestore();

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) {
        alert("⚠️ MetaMask not detected");
        return navigate("/login");
      }

      try {
        const web3Instance = new Web3(window.ethereum);
        const accounts = await web3Instance.eth.requestAccounts();
        const currentAccount = accounts[0];

        const contractInstance = new web3Instance.eth.Contract(contractABI, contractAddress);
        
        // Check if user is registered and approved
        const isRegistered = await contractInstance.methods.isRegistered(currentAccount).call();
        if (!isRegistered) {
          alert("You must register first");
          return navigate("/register");
        }
        
        const userId = await contractInstance.methods.getUserIdByAddress(currentAccount).call();
        const user = await contractInstance.methods.users(userId).call();
        
        if (!user.approvedByGovt) {
          alert("Your account is not yet approved by the government");
          return navigate("/dashboard");
        }

        setWeb3(web3Instance);
        setContract(contractInstance);
        setAccount(currentAccount);

        await loadUserDataAndTransfers(contractInstance, currentAccount);
      } catch (error) {
        console.error("Initialization error:", error);
        alert("Failed to initialize: " + error.message);
      }
    };

    init();
  }, [navigate]);

  const loadUserDataAndTransfers = async (contractInstance, currentAccount) => {
    try {
      // Load user's vehicles (excluding those with pending transfers)
      await loadUserVehicles(contractInstance, currentAccount);
      
      // Load pending transfers
      await loadPendingTransfers(contractInstance, currentAccount);
        await loadIncomingTransfers(contractInstance, currentAccount);
      
    } catch (error) {
      console.error("Error loading data:", error);
      setErrorMessage("Failed to load user data and transfers");
    } finally {
      setLoading(false);
    }
  };

  const loadUserVehicles = async (contractInstance, walletAddress) => {
    const vehicleCount = await contractInstance.methods.registrationCount().call();
    const transferCount = await contractInstance.methods.transferRequestCount().call();
    
    // Get all pending transfer vehicle IDs
    const pendingTransferVehicleIds = new Set();
    for (let i = 1; i <= transferCount; i++) {
      try {
        const transfer = await contractInstance.methods.getTransferRequest(i).call();
        if (transfer.currentOwner.toLowerCase() === walletAddress.toLowerCase() && 
            !transfer.completed && !transfer.approved) {
          pendingTransferVehicleIds.add(parseInt(transfer.registrationId));
        }
      } catch (error) {
        // Transfer might be deleted, continue
        continue;
      }
    }
    
    const vehicles = [];
    
    for (let i = 1; i <= vehicleCount; i++) {
      try {
        const vehicle = await contractInstance.methods.vehicleRegistrations(i).call();
        if (vehicle.ownerWallet.toLowerCase() === walletAddress.toLowerCase() && 
            vehicle.approved && 
            !pendingTransferVehicleIds.has(parseInt(vehicle.id))) {
          vehicles.push({
            id: vehicle.id,
            vehicleNo: vehicle.vehicleNo,
            vehicleMake: vehicle.vehicleMake,
            vehicleModel: vehicle.vehicleModel,
            vehicleModelYear: vehicle.vehicleModelYear,
            isStolen: vehicle.isStolen
          });
        }
      } catch (error) {
        // Vehicle might be deleted, continue
        continue;
      }
    }
    
    setUserVehicles(vehicles);
  };

const loadPendingTransfers = async (contractInstance, walletAddress) => {
  const transferCount = await contractInstance.methods.transferRequestCount().call();
  const transfers = [];
  
  for (let i = 1; i <= transferCount; i++) {
    try {
      const transfer = await contractInstance.methods.getTransferRequest(i).call();
      
      // Show transfers initiated by current user that are not completed
      if (transfer.currentOwner.toLowerCase() === walletAddress.toLowerCase() && !transfer.completed) {
        // Get vehicle details
        const vehicle = await contractInstance.methods.vehicleRegistrations(transfer.registrationId).call();
        transfers.push({
          requestId: i,
          registrationId: transfer.registrationId,
          vehicleNo: vehicle.vehicleNo,
          vehicleMake: vehicle.vehicleMake,
          vehicleModel: vehicle.vehicleModel,
          newOwner: transfer.newOwner,
          transferAmount: transfer.transferAmount || "0",        // Now this should work
          newOwnerAccepted: transfer.newOwnerAccepted || false,  // Now this should work
          approved: transfer.approved,
          completed: transfer.completed
        });
      }
    } catch (error) {
      // Transfer might be deleted, continue
      continue;
    }
  }
  
  setPendingTransfers(transfers);
};

  const validateNewOwner = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      
      if (!web3.utils.isAddress(newOwnerWallet)) {
        setErrorMessage("Invalid wallet address");
        setLoading(false);
        return;
      }
      
      if (newOwnerWallet.toLowerCase() === account.toLowerCase()) {
        setErrorMessage("You cannot transfer vehicle to yourself");
        setLoading(false);
        return;
      }
      
      // Check if new owner is registered and approved
      const isRegistered = await contract.methods.isRegistered(newOwnerWallet).call();
      if (!isRegistered) {
        setErrorMessage("The new owner must be registered in the system");
        setLoading(false);
        return;
      }
      
      const newOwnerId = await contract.methods.getUserIdByAddress(newOwnerWallet).call();
      const newOwner = await contract.methods.users(newOwnerId).call();
      
      if (!newOwner.approvedByGovt) {
        setErrorMessage("The new owner must be approved by the government");
        setLoading(false);
        return;
      }
      
      // Set new owner details for confirmation
      setNewOwnerDetails({
        name: newOwner.name,
        email: newOwner.email,
        wallet: newOwner.wallet
      });
      
      setShowConfirmation(true);
      
    } catch (error) {
      console.error("Validation error:", error);
      setErrorMessage("Failed to validate new owner: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmTransfer = async (vehicleId) => {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");
      
      // Get vehicle number
      const vehicle = await contract.methods.vehicleRegistrations(vehicleId).call();
      
      // Request ownership transfer
        await contract.methods.requestOwnershipTransfer(
      vehicle.vehicleNo, 
      newOwnerWallet, 
      web3.utils.toWei(transferAmount, 'ether')
    ).send({ from: account });
      
      // Update Firebase
      await updateTransferRequestInFirebase(vehicle.vehicleNo, newOwnerWallet);
      
      setSuccessMessage("Transfer request submitted successfully! Waiting for government approval.");
      
      // Reset form
      setNewOwnerWallet("");
      setNewOwnerDetails(null);
      setShowConfirmation(false);
      setSelectedVehicle(null);
      setTransferAmount("");
      
      // Reload data
      await loadUserDataAndTransfers(contract, account);
      
    } catch (error) {
      console.error("Transfer request error:", error);
      setErrorMessage("Failed to request transfer: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTransferRequestInFirebase = async (vehicleNo, newOwnerWallet) => {
    try {
      const vehicleRef = doc(db, "vehicles", vehicleNo);
      
      await updateDoc(vehicleRef, {
        transferRequestedTo: newOwnerWallet,
        transferRequestDate: new Date().toISOString(),
        transferStatus: "pending"
      });
      
      console.log("Transfer request updated in Firebase");
    } catch (error) {
      console.error("Error updating transfer in Firebase:", error);
      // Continue even if Firebase update fails
    }
  };

  const cancelTransfer = () => {
    setSelectedVehicle(null);
    setNewOwnerWallet("");
    setNewOwnerDetails(null);
    setShowConfirmation(false);
    setErrorMessage("");
    setTransferAmount("");
  };

  // Helper function to safely format Wei to Ether
const formatTransferAmount = (amount) => {
  try {
    if (!amount || amount === "0") return "0";
    // Ensure amount is a string
    const amountStr = typeof amount === 'string' ? amount : amount.toString();
    return web3.utils.fromWei(amountStr, 'ether');
  } catch (error) {
    console.error("Error formatting transfer amount:", error);
    return "0";
  }
};

const loadIncomingTransfers = async (contractInstance, walletAddress) => {
  const transferCount = await contractInstance.methods.transferRequestCount().call();
  const transfers = [];
  
  for (let i = 1; i <= transferCount; i++) {
    try {
      const transfer = await contractInstance.methods.getTransferRequest(i).call();
      
      // Show transfers where current user is the new owner and not completed
      if (transfer.newOwner.toLowerCase() === walletAddress.toLowerCase() && 
          !transfer.completed) {
        
        // Get vehicle details
        const vehicle = await contractInstance.methods.vehicleRegistrations(transfer.registrationId).call();
        
        // Get current owner details
        const currentOwnerId = await contractInstance.methods.getUserIdByAddress(transfer.currentOwner).call();
        const currentOwnerDetails = await contractInstance.methods.users(currentOwnerId).call();
        
        transfers.push({
          requestId: i,
          registrationId: transfer.registrationId,
          vehicleNo: vehicle.vehicleNo,
          vehicleMake: vehicle.vehicleMake,
          vehicleModel: vehicle.vehicleModel,
          vehicleModelYear: vehicle.vehicleModelYear,
          currentOwner: transfer.currentOwner,
          currentOwnerName: currentOwnerDetails.name,
          transferAmount: transfer.transferAmount ? transfer.transferAmount.toString() : "0", // Convert to string
          newOwnerAccepted: transfer.newOwnerAccepted || false,
          approved: transfer.approved,
          completed: transfer.completed
        });
      }
    } catch (error) {
      continue;
    }
  }
  
  setIncomingTransfers(transfers);
};
const acceptTransferAndPay = async (requestId, transferAmount) => {
  try {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    
    // Ensure transferAmount is a string
    const amountStr = typeof transferAmount === 'string' ? transferAmount : transferAmount.toString();
    
    // Call smart contract function
    await contract.methods.acceptTransferAndPay(requestId)
      .send({ 
        from: account,
        value: amountStr  // Use the string amount directly
      });
    
    setSuccessMessage("Transfer accepted and payment sent! Waiting for government approval.");
    
    // Reload data
    await loadUserDataAndTransfers(contract, account);
    
  } catch (error) {
    console.error("Accept transfer error:", error);
    setErrorMessage("Failed to accept transfer: " + error.message);
  } finally {
    setLoading(false);
  }
};

  if (loading) return (
    <div className="loading-container">
      <p className="loading-text">🔄 Loading...</p>
    </div>
  );

  return (
    <div>
      <Navbar/>
      <div className="vehicle-transfer-container">
        {/* Top Navigation Bar */}
        <div className="vehicle-navbar">
          <h2 className="navbar-title">🚗 Vehicle Transfer System</h2>
          <div className="navbar-buttons">
  <button onClick={() => setView("myVehicles")} className={view === "myVehicles" ? "active" : ""}>
    My Vehicles
  </button>
  <button 
    onClick={() => setView("pendingTransfers")} 
    className={view === "pendingTransfers" ? "active" : ""}
  >
    My Transfer Requests
  </button>
  <button 
    onClick={() => setView("incomingTransfers")} 
    className={view === "incomingTransfers" ? "active" : ""}
  >
    Incoming Requests
  </button>
</div>
        </div>

        {/* Error and Success Messages */}
        {errorMessage && (
          <div className="error-message">
            <p>❌ {errorMessage}</p>
            <button onClick={() => setErrorMessage("")}>Clear</button>
          </div>
        )}
        
        {successMessage && (
          <div className="success-message">
            <p>✅ {successMessage}</p>
            <button onClick={() => setSuccessMessage("")}>Clear</button>
          </div>
        )}

        {/* My Vehicles Section */}
        {view === "myVehicles" && (
          <div className="vehicle-section">
            <h3>My Vehicles</h3>
            {userVehicles.length === 0 ? (
              <p className="no-data-message">You don't have any available vehicles for transfer</p>
            ) : (
              <ul className="vehicle-list">
                {userVehicles.map((vehicle, index) => (
                  <li className="vehicle-item" key={index}>
                    <div className="vehicle-details">
                      <h4>{vehicle.vehicleNo}</h4>
                      <p>{vehicle.vehicleMake} {vehicle.vehicleModel} ({vehicle.vehicleModelYear})</p>
                      {vehicle.isStolen && <p className="stolen-badge">⚠️ Reported as Stolen</p>}
                    </div>
                    
                    {!vehicle.isStolen && (
                      <div className="transfer-form">
                        <button 
                          onClick={() => {
                            if (selectedVehicle === vehicle.id) {
                              cancelTransfer();
                            } else {
                              setSelectedVehicle(vehicle.id);
                              setNewOwnerWallet("");
                              setNewOwnerDetails(null);
                              setShowConfirmation(false);
                              setTransferAmount("");
                            }
                          }}
                          className="transfer-button"
                        >
                          {selectedVehicle === vehicle.id ? "Cancel" : "Transfer Ownership"}
                        </button>
                        
                        {selectedVehicle === vehicle.id && !showConfirmation && (
                          <div className="transfer-input-group">
                            <input 
                              type="text" 
                              placeholder="New Owner Wallet Address" 
                              value={newOwnerWallet}
                              onChange={(e) => setNewOwnerWallet(e.target.value)}
                              className="wallet-input"
                            />
                            <input 
                              type="number" 
                              placeholder="Transfer Amount (ETH)" 
                              value={transferAmount}
                              onChange={(e) => setTransferAmount(e.target.value)}
                              className="amount-input"
                              step="0.01"
                              min="0"
                            />
                            <button 
                              onClick={validateNewOwner}
                              className="validate-button"
                              disabled={!newOwnerWallet.trim() || !transferAmount.trim()}
                            >
                              Validate & Preview
                            </button>
                          </div>
                        )}
                        
                        {selectedVehicle === vehicle.id && showConfirmation && newOwnerDetails && (
                          <div className="confirmation-section">
                            <h4>🔍 New Owner Details</h4>
                            <div className="owner-details">
                              <p><strong>Name:</strong> {newOwnerDetails.name}</p>
                              <p><strong>Email:</strong> {newOwnerDetails.email}</p>
                              <p><strong>Wallet:</strong> {newOwnerDetails.wallet}</p>
                              <p><strong>Transfer Amount:</strong> {transferAmount} ETH</p>
                            </div>
                            <div className="confirmation-buttons">
                              <button 
                                onClick={() => confirmTransfer(vehicle.id)}
                                className="confirm-button"
                              >
                                ✅ Confirm Transfer
                              </button>
                              <button 
                                onClick={cancelTransfer}
                                className="cancel-button"
                              >
                                ❌ Cancel
                              </button>
                            </div>
                            <p className="transfer-note">
                              <strong>Note:</strong> This will submit a transfer request that requires government approval.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {vehicle.isStolen && (
                      <div className="stolen-notice">
                        <p>⚠️ This vehicle is reported as stolen and cannot be transferred.</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Pending Transfers Section */}
        {view === "pendingTransfers" && (
          <div className="transfers-section">
            <h3>My Transfer Requests</h3>
            {pendingTransfers.length === 0 ? (
              <p className="no-data-message">No pending transfers</p>
            ) : (
              <ul className="transfers-list">
                {pendingTransfers.map((transfer, index) => (
                  <li className="transfer-item" key={index}>
                    <div className="transfer-details">
                      <h4>Vehicle: {transfer.vehicleNo}</h4>
                      <p>{transfer.vehicleMake} {transfer.vehicleModel}</p>
                      <p><strong>Transfer To:</strong> {transfer.newOwner}</p>
                      <p><strong>Transfer Amount:</strong> {formatTransferAmount(transfer.transferAmount)} ETH</p>
                      <p>
                        <strong>Payment Status:</strong>
                        <span className={`status-badge ${transfer.newOwnerAccepted ? 'accepted' : 'pending'}`}>
                          {transfer.newOwnerAccepted ? "💰 Payment Received" : "⏳ Waiting for Payment"}
                        </span>
                      </p>
                      <p>
                        <strong>Government Status:</strong> 
                        <span className={`status-badge ${transfer.approved ? 'approved' : 'pending'}`}>
                          {transfer.approved ? "✅ Approved by Government" : "⏳ Waiting for Government Approval"}
                        </span>
                      </p>
                    </div>
                    {!transfer.newOwnerAccepted && (
                      <div className="waiting-payment-notice">
                        <p>⏳ Waiting for the new owner to accept and pay {formatTransferAmount(transfer.transferAmount)} ETH</p>
                      </div>
                    )}
                    {transfer.newOwnerAccepted && !transfer.approved && (
                      <div className="payment-received-notice">
                        <p>💰 Payment of {formatTransferAmount(transfer.transferAmount)} ETH received and held in escrow</p>
                        <p>⏳ Waiting for government approval to complete the transfer</p>
                      </div>
                    )}
                    {transfer.approved && (
                      <div className="transfer-completed-notice">
                        <p>✅ Transfer approved and completed! Payment of {formatTransferAmount(transfer.transferAmount)} ETH has been released to you.</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
           {/* Incoming Transfer Requests Section */}
{view === "incomingTransfers" && (
  <div className="transfers-section">
    <h3>Incoming Transfer Requests</h3>
    {incomingTransfers.length === 0 ? (
      <p className="no-data-message">No incoming transfer requests</p>
    ) : (
      <ul className="transfers-list">
        {incomingTransfers.map((transfer, index) => (
          <li className="transfer-item" key={index}>
            <div className="transfer-details">
              <h4>Vehicle: {transfer.vehicleNo}</h4>
              <p>{transfer.vehicleMake} {transfer.vehicleModel} ({transfer.vehicleModelYear})</p>
              <p><strong>From:</strong> {transfer.currentOwnerName} ({transfer.currentOwner})</p>
              <p><strong>Transfer Amount:</strong> {formatTransferAmount(transfer.transferAmount)} ETH</p>
              <p>
                <strong>Status:</strong>
                <span className={`status-badge ${
                  transfer.approved ? 'approved' : 
                  transfer.newOwnerAccepted ? 'accepted' : 'pending'
                }`}>
                  {transfer.approved ? "✅ Approved by Government" :
                   transfer.newOwnerAccepted ? "💰 Paid - Waiting for Government Approval" :
                   "⏳ Waiting for Your Acceptance"}
                </span>
              </p>
            </div>
            
            {!transfer.newOwnerAccepted && !transfer.approved && (
              <div className="accept-section">
                <div className="payment-info">
                  <p><strong>You need to pay: {formatTransferAmount(transfer.transferAmount)} ETH</strong></p>
                  <p className="payment-note">
                    💡 Your payment will be held in escrow until government approval.
                    If declined, you'll get a full refund.
                  </p>
                </div>
                <button 
                  onClick={() => acceptTransferAndPay(transfer.requestId, transfer.transferAmount)}
                  className="accept-payment-button"
                >
                  💰 Accept & Pay {formatTransferAmount(transfer.transferAmount)} ETH
                </button>
              </div>
            )}
            
            {transfer.newOwnerAccepted && !transfer.approved && (
              <div className="waiting-approval">
                <p>✅ Payment sent! Waiting for government approval.</p>
                <p>💰 Amount: {formatTransferAmount(transfer.transferAmount)} ETH (held in escrow)</p>
              </div>
            )}
            
            {transfer.approved && (
              <div className="transfer-completed">
                <p>🎉 Transfer completed! You are now the owner of this vehicle.</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    )}
  </div>
)}
      </div>
    </div>
  );
};

export default VehicleTransfer;