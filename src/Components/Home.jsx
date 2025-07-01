import React, { useState, useEffect } from "react";
import Web3 from "web3";
import { contractABI, contractAddress } from "../config";
import HomeCard from "./HomeCard";
import Navbar from "./Navbar";
import UserTransactions from "./UserTransactions";
import "./UserLogin.css";
import "./Home.css";

// Pinata configuration - Add these to your environment variables
const PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.REACT_APP_PINATA_SECRET_API_KEY;
const PINATA_GATEWAY = process.env.REACT_APP_PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs/";

const Home = () => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState("");
  const [userRegistrationContract, setUserRegistrationContract] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [previousVehicles, setPreviousVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [localStorageEmail, setLocalStorageEmail] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("approved");
  const [selectedView, setSelectedView] = useState("vehicles");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Recovery modal states
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [currentVehicleId, setCurrentVehicleId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingRecoveryRequests, setPendingRecoveryRequests] = useState(new Set());

  useEffect(() => {
    const loadBlockchainData = async () => {
      setInitialLoading(true); 
      try {
        if (!window.ethereum) {
          console.log("Please install MetaMask!");
            setInitialLoading(false);
          return;
        }

        const web3Instance = new Web3(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });

        const accounts = await web3Instance.eth.getAccounts();
        const wallet = accounts[0];
        setAccount(wallet);

        const contractInstance = new web3Instance.eth.Contract(contractABI, contractAddress);
        setWeb3(web3Instance);
        setUserRegistrationContract(contractInstance);

        const storedEmail = window.localStorage.getItem("email");
        setLocalStorageEmail(storedEmail);

        await fetchVehicleByWallet(contractInstance, wallet);
        await fetchPreviousVehicles(contractInstance, wallet);

        window.ethereum.on("accountsChanged", async (accounts) => {
          if (accounts.length > 0) {
            const newAccount = accounts[0];
            setAccount(newAccount);
            await fetchVehicleByWallet(contractInstance, newAccount);
            await fetchPreviousVehicles(contractInstance, newAccount);
          } else {
            setAccount("");
            setVehicles([]);
            setPreviousVehicles([]);
            setFilteredVehicles([]);
          }
        });
      } catch (error) {
        console.error("Error loading blockchain data:", error);
      }finally{
        setInitialLoading(false); 
      }
    };

    loadBlockchainData();
  }, []);

  useEffect(() => {
    filterVehicles();
  }, [vehicles, previousVehicles, selectedFilter]);

  const fetchVehicleByWallet = async (contract, wallet) => {
    try {
      const total = await contract.methods.registrationCount().call();
      const myVehicles = [];

      for (let i = 1; i <= total; i++) {
        const vehicle = await contract.methods.vehicleRegistrations(i).call();
        if (vehicle.ownerWallet.toLowerCase() === wallet.toLowerCase()) {
          myVehicles.push(vehicle);
        }
      }

      setVehicles(myVehicles);
      await loadUserPendingRecoveryRequests(contract, wallet);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      setVehicles([]);
      setFilteredVehicles([]);
    }
  };

  const fetchPreviousVehicles = async (contract, wallet) => {
    try {
      const total = await contract.methods.registrationCount().call();
      const myPreviousVehicles = [];

      for (let i = 1; i <= total; i++) {
        const vehicle = await contract.methods.vehicleRegistrations(i).call();
        
        // Skip if current owner
        if (vehicle.ownerWallet.toLowerCase() === wallet.toLowerCase()) {
          continue;
        }

        // Get ownership history
        try {
          const ownershipHistory = await contract.methods.getVehicleOwnershipHistory(i).call();
          const owners = ownershipHistory[0]; // owners array
          
          // Check if user was a previous owner
          const wasPreviousOwner = owners.some(owner => 
            owner.toLowerCase() === wallet.toLowerCase()
          );

          if (wasPreviousOwner) {
            // Add a flag to identify as previous vehicle
            const vehicleWithFlag = {
              ...vehicle,
              isPreviousOwner: true
            };
            myPreviousVehicles.push(vehicleWithFlag);
          }
        } catch (historyError) {
          console.log(`Could not fetch history for vehicle ${i}:`, historyError);
        }
      }

      setPreviousVehicles(myPreviousVehicles);
    } catch (error) {
      console.error("Error fetching previous vehicles:", error);
      setPreviousVehicles([]);
    }
  };

  // File upload to Pinata IPFS
  const uploadToPinata = async (file) => {
    if (!file) {
      throw new Error("No file selected");
    }

    if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
      throw new Error("Pinata API credentials not configured");
    }

    const formData = new FormData();
    formData.append("file", file);

    const metadata = JSON.stringify({
      name: `recovery-document-${file.name}-${Date.now()}`,
      keyvalues: {
        uploadedBy: account,
        timestamp: new Date().toISOString(),
        fileType: file.type,
        fileSize: file.size,
        purpose: "vehicle-recovery"
      }
    });
    formData.append("pinataMetadata", metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append("pinataOptions", options);

    try {
      setUploadingFile(true);
      setUploadProgress(0);

      const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          "pinata_api_key": PINATA_API_KEY,
          "pinata_secret_api_key": PINATA_SECRET_API_KEY,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Upload failed: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      setUploadProgress(100);
      
      return {
        hash: result.IpfsHash,
        size: result.PinSize,
        timestamp: result.Timestamp,
        url: `${PINATA_GATEWAY}${result.IpfsHash}`
      };
    } catch (error) {
      console.error("Error uploading to Pinata:", error);
      throw error;
    } finally {
      setUploadingFile(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size should be less than 10MB");
        return;
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];

      if (!allowedTypes.includes(file.type)) {
        alert("Supported file types: Images (JPEG, PNG, GIF, WebP), PDF, Word documents, Text files");
        return;
      }

      setSelectedFile(file);
    }
  };

  // Open recovery modal
  const openRecoveryModal = (vehicleId) => {
    setCurrentVehicleId(vehicleId);
    setShowRecoveryModal(true);
    setSelectedFile(null);
    setUploadProgress(0);
  };

  // Close recovery modal
  const closeRecoveryModal = () => {
    setShowRecoveryModal(false);
    setCurrentVehicleId(null);
    setSelectedFile(null);
    setUploadProgress(0);
  };

  // Submit recovery request with file upload
  const submitRecoveryRequest = async () => {
    if (!userRegistrationContract) {
      alert("Contract not loaded");
      return;
    }
    if (hasPendingRecoveryRequest(currentVehicleId)) {
      alert("You already have a pending recovery request for this vehicle.");
      return;
    }

    if (!selectedFile) {
      alert("Please select a recovery document first");
      return;
    }

    try {
      setLoading(true);
      
      // Upload file to IPFS first
      const uploadResult = await uploadToPinata(selectedFile);
      
      // Submit recovery request with the hash
      await userRegistrationContract.methods
        .requestVehicleRecovery(currentVehicleId, `${PINATA_GATEWAY}${uploadResult.hash}`)
        .send({ from: account });

      setPendingRecoveryRequests(prev => new Set([...prev, currentVehicleId.toString()]));
      alert(`✅ Recovery request submitted successfully!\nDocument uploaded to IPFS: ${uploadResult.hash}`);
      
      // Refresh vehicles and close modal
      await fetchVehicleByWallet(userRegistrationContract, account);
      await loadUserPendingRecoveryRequests(userRegistrationContract, account);

      closeRecoveryModal();
      
    } catch (error) {
      console.error("Error submitting recovery request:", error);
      alert("❌ Failed to submit recovery request: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterVehicles = () => {
    let filtered = [];
    
    switch (selectedFilter) {
      case "approved":
        filtered = vehicles.filter(vehicle => vehicle.approved === true && !vehicle.isStolen);
        break;
      case "requested":
        filtered = vehicles.filter(vehicle => vehicle.approved === false);
        break;
      case "stolen":
        filtered = vehicles.filter(vehicle => vehicle.isStolen === true);
        break;
      case "previous":
        filtered = previousVehicles;
        break;
      case "all":
        filtered = vehicles;
        break;
      default:
        filtered = vehicles.filter(vehicle => vehicle.approved === true && !vehicle.isStolen);
        break;
    }
    
    setFilteredVehicles(filtered);
  };

  const reportVehicleStolen = async (vehicleId) => {
    if (!userRegistrationContract) {
      alert("Contract not loaded");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to report this vehicle as stolen? This action cannot be undone by you."
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      await userRegistrationContract.methods
        .reportVehicleStolen(vehicleId)
        .send({ from: account });
      
      alert("✅ Vehicle reported as stolen successfully!");
      await fetchVehicleByWallet(userRegistrationContract, account);
    } catch (error) {
      console.error("Error reporting vehicle stolen:", error);
      alert("❌ Failed to report vehicle stolen: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getFilterTitle = () => {
    switch (selectedFilter) {
      case "approved":
        return "My Vehicles";
      case "requested":
        return "Requested Vehicles";
      case "stolen":
        return "Stolen Vehicles";
      case "previous":
        return "Previously Owned Vehicles";
      case "all":
        return "All Vehicles";
      default:
        return "My Vehicles";
    }
  };

  const getVehicleCount = (filter) => {
    switch (filter) {
      case "approved":
        return vehicles.filter(vehicle => vehicle.approved === true && !vehicle.isStolen).length;
      case "requested":
        return vehicles.filter(vehicle => vehicle.approved === false).length;
      case "stolen":
        return vehicles.filter(vehicle => vehicle.isStolen === true).length;
      case "previous":
        return previousVehicles.length;
      case "all":
        return vehicles.length;
      default:
        return vehicles.length;
    }
  };

  const loadUserPendingRecoveryRequests = async (contractInstance, userAddress) => {
    try {
      const requestCount = await contractInstance.methods.recoveryRequestCount().call();
      const pendingVehicleIds = new Set();
      
      for (let i = 1; i <= requestCount; i++) {
        try {
          const request = await contractInstance.methods.recoveryRequests(i).call();
          
          if (request.vehicleId && 
              request.vehicleId != 0 && 
              !request.completed && 
              !request.approved &&
              request.requestedBy.toLowerCase() === userAddress.toLowerCase()) {
            pendingVehicleIds.add(request.vehicleId.toString());
          }
        } catch (error) {
          continue;
        }
      }
      
      setPendingRecoveryRequests(pendingVehicleIds);
    } catch (error) {
      console.error("Error loading user pending recovery requests:", error);
    }
  };

  const hasPendingRecoveryRequest = (vehicleId) => {
    return pendingRecoveryRequests.has(vehicleId.toString());
  };
  

  return (
    <div>
      <Navbar />
      <div className="home-container">
        {/* Sidebar */}
        <div className="sidebar">
          <h3 className="sidebar-title">Filter Vehicles</h3>
          <div className="sidebar-buttons">
            <button 
              className={`sidebar-btn ${selectedView === "vehicles" && selectedFilter === "approved" ? "active" : ""}`}
              onClick={() => {
                setSelectedView("vehicles");
                setSelectedFilter("approved");
              }}
            >
              My Vehicles ({getVehicleCount("approved")})
            </button>
            <button 
              className={`sidebar-btn ${selectedView === "vehicles" && selectedFilter === "requested" ? "active" : ""}`}
              onClick={() => {
                setSelectedView("vehicles");
                setSelectedFilter("requested");
              }}
            >
              Requested Vehicles ({getVehicleCount("requested")})
            </button>
            <button 
              className={`sidebar-btn stolen-btn ${selectedView === "vehicles" && selectedFilter === "stolen" ? "active" : ""}`}
              onClick={() => {
                setSelectedView("vehicles");
                setSelectedFilter("stolen");
              }}
            >
              🚨 Stolen Vehicles ({getVehicleCount("stolen")})
            </button>
            <button 
              className={`sidebar-btn ${selectedView === "vehicles" && selectedFilter === "previous" ? "active" : ""}`}
              onClick={() => {
                setSelectedView("vehicles");
                setSelectedFilter("previous");
              }}
            >
              📜 Previous Vehicles ({getVehicleCount("previous")})
            </button>
            <button 
              className={`sidebar-btn ${selectedView === "vehicles" && selectedFilter === "all" ? "active" : ""}`}
              onClick={() => {
                setSelectedView("vehicles");
                setSelectedFilter("all");
              }}
            >
              All Vehicles ({getVehicleCount("all")})
            </button>
            <button 
              className={`sidebar-btn ${selectedView === "transactions" ? "active" : ""}`}
              onClick={() => setSelectedView("transactions")}
            >
              📊 Transaction History
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
         {(initialLoading && vehicles.length === 0) ? ( 
    <div className="initial-loading-container">
      <div className="loading-spinner"></div>
      <h2>Loading Vehicle Data...</h2>
      <p>Connecting to blockchain and fetching your vehicles...</p>
    </div> ) : selectedView === "vehicles" ? (
          
            <>
              <h1 style={{ marginTop: "10px", marginBottom: "20px" }}>
                {getFilterTitle()}
              </h1>
              {loading && (
                <div className="loading-message">
                  <p>🔄 Processing transaction...</p>
                </div>
              )}
              <div className="homecardMain">
                {filteredVehicles.length > 0 ? (
                  filteredVehicles.map((vehicle, index) => (
                    <div key={index} className="vehicle-card-container">
                      <HomeCard 
                        user={vehicle} 
                        index={vehicles.indexOf(vehicle)} 
                        isStolen={vehicle.isStolen}
                        isPreviousOwner={vehicle.isPreviousOwner}
                      />
                      {selectedFilter === "previous" && (
                        <div className="previous-owner-badge">
                          <span className="previous-text">📜 Previously Owned</span>
                          <p className="previous-info">
                            You were a previous owner of this vehicle.
                            Current owner: {vehicle.ownerWallet}
                          </p>
                        </div>
                      )}
                      {vehicle.approved && !vehicle.isStolen && !vehicle.isPreviousOwner && (
                        <div className="vehicle-actions">
                          <button 
                            className="report-stolen-btn"
                            onClick={() => reportVehicleStolen(vehicle.id)}
                            disabled={loading}
                            title="Report this vehicle as stolen"
                          >
                            🚨 Report Stolen
                          </button>
                        </div>
                      )}
                      {vehicle.isStolen && !vehicle.isPreviousOwner && (
                        <div className="stolen-banner">
                          <span className="stolen-text">🚨 REPORTED STOLEN</span>
                          <p className="stolen-info">
                            This vehicle has been reported as stolen. 
                            Contact authorities if found.
                          </p>
                          <div className="vehicle-actions">
                            {hasPendingRecoveryRequest(vehicle.id) ? (
                              <div className="pending-request-info">
                                <button 
                                  className="recovery-request-btn pending"
                                  disabled={true}
                                  title="Recovery request already submitted and pending approval"
                                >
                                  ⏳ Recovery Request Pending
                                </button>
                                <p className="pending-text">
                                  Your recovery request is being reviewed by authorities.
                                </p>
                              </div>
                            ) : (
                              <button 
                                className="recovery-request-btn"
                                onClick={() => openRecoveryModal(vehicle.id)}
                                disabled={loading}
                                title="Request vehicle recovery with document upload"
                              >
                                📋 Request Recovery
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p style={{ marginLeft: "20px", fontSize: "18px" }}>
                    {selectedFilter === "approved" 
                      ? "No approved vehicles found with this wallet address."
                      : selectedFilter === "requested"
                      ? "No requested vehicles found with this wallet address."
                      : selectedFilter === "stolen"
                      ? "No stolen vehicles reported with this wallet address."
                      : selectedFilter === "previous"
                      ? "No previously owned vehicles found for this wallet address."
                      : "No vehicle registered with this wallet address."
                    }
                  </p>
                )}
              </div>
            </>
          ) : (
            <UserTransactions />
          )}
        </div>
      </div>

      {/* Recovery Request Modal */}
      {showRecoveryModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>🔄 Request Vehicle Recovery</h2>
              <button className="close-btn" onClick={closeRecoveryModal}>✕</button>
            </div>
            
            <div className="modal-body">
              <p className="modal-description">
                Please upload supporting documents for your vehicle recovery request. 
                The document will be securely stored on IPFS and reviewed by authorities.
              </p>
              
              <div className="file-upload-section">
                <div className="file-input-container">
                  <label htmlFor="recovery-file-input" className="file-input-label">
                    📎 Select Recovery Document
                  </label>
                  <input
                    id="recovery-file-input"
                    type="file"
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    disabled={uploadingFile || loading}
                    className="file-input-hidden"
                  />
                </div>
                
                {selectedFile && (
                  <div className="selected-file-info">
                    <div className="file-details">
                      <p><strong>📄 File:</strong> {selectedFile.name}</p>
                      <p><strong>📏 Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      <p><strong>📋 Type:</strong> {selectedFile.type}</p>
                    </div>
                  </div>
                )}
                
                {uploadingFile && (
                  <div className="upload-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p>Uploading to IPFS... {uploadProgress}%</p>
                  </div>
                )}
              </div>
              
              <div className="supported-formats">
                <p><strong>Supported formats:</strong></p>
                <ul>
                  <li>Images: JPEG, PNG, GIF, WebP</li>
                  <li>Documents: PDF, Word (.doc, .docx), Text files</li>
                  <li>Maximum size: 10MB</li>
                </ul>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="cancel-btn" 
                onClick={closeRecoveryModal}
                disabled={loading || uploadingFile}
              >
                Cancel
              </button>
              <button 
                className="submit-btn" 
                onClick={submitRecoveryRequest}
                disabled={!selectedFile || loading || uploadingFile}
              >
                {loading ? "🔄 Submitting..." : "📤 Submit Recovery Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;