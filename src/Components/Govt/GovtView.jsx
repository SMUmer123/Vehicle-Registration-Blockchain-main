import React, { useEffect, useState } from "react";
import Web3 from "web3";
import { contractABI, contractAddress } from "../../config";
import { useNavigate } from "react-router-dom";
import "./GovtView.css";
import TransactionViewer from "./TransactionViewer";
// Import Firebase
import { getFirestore, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
// Import VehicleDetails component
import VehicleDetails from "./../VehicleDetails";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/ReactToastify.css';
import sendNotificationEmail from './EmailService';

const GovDashboard = () => {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingVehicles, setPendingVehicles] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("users");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [transferDetails, setTransferDetails] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [stolenVehicles, setStolenVehicles] = useState([]);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineType, setDeclineType] = useState("");
  const [declineTarget, setDeclineTarget] = useState(null);
  const [declineReason, setDeclineReason] = useState("");
  const [recoveryRequests, setRecoveryRequests] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);
  const [vehicleFilters, setVehicleFilters] = useState({
    approved: null,
    stolen: null,
    make: '',
    vehicleNo: '',
    owner: ''
  });

  const navigate = useNavigate();
  const db = getFirestore();

  const notify = (message, type = "info") => {
    toast[type](message, {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "dark",
    });
  };

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) {
        notify("⚠️ MetaMask not detected", "warning");
        return navigate("/govtLogin");
      }

      try {
        const web3Instance = new Web3(window.ethereum);
        const accounts = await web3Instance.eth.requestAccounts();
        const currentAccount = accounts[0];

        const contractInstance = new web3Instance.eth.Contract(contractABI, contractAddress);
        const govtAddress = await contractInstance.methods.government().call();

        if (currentAccount.toLowerCase() !== govtAddress.toLowerCase()) {
          alert("❌ Unauthorized. You are not the government.");
          return navigate("/govtLogin");
        }

        setWeb3(web3Instance);
        setContract(contractInstance);
        setAccount(currentAccount);

        // Load initial data for the default view ("users")
        await loadPendingUsersAndVehicles(contractInstance);
      } catch (error) {
        console.error("Initialization error:", error);
        alert("Failed to initialize: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [navigate]);

  const loadPendingUsersAndVehicles = async (contractInstance) => {
    try {
      setLoading(true);
      const userCount = await contractInstance.methods.userCount().call();
      const vehicleCount = await contractInstance.methods.registrationCount().call();

      const users = [];
      for (let i = 1; i <= userCount; i++) {
        const user = await contractInstance.methods.users(i).call();
        if (!user.approvedByGovt && user.email !== "") users.push(user);
      }

      const vehicles = [];
      for (let i = 1; i <= vehicleCount; i++) {
        const vehicle = await contractInstance.methods.vehicleRegistrations(i).call();
        if (!vehicle.approved && vehicle.vehicleNo !== "") vehicles.push(vehicle);
      }

      setPendingUsers(users);
      setPendingVehicles(vehicles);
    } catch (error) {
      console.error("Error loading pending users and vehicles:", error);
      notify("❌ Failed to load pending users and vehicles", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadPendingTransfers = async (contractInstance) => {
    try {
      setLoading(true);
      const transferCount = await contractInstance.methods.transferRequestCount().call();
      const transfers = [];

      for (let i = 1; i <= transferCount; i++) {
        const transfer = await contractInstance.methods.getTransferRequest(i).call();
        if (
          transfer.registrationId !== "0" &&
          transfer.currentOwner !== "0x0000000000000000000000000000000000000000" &&
          transfer.newOwnerAccepted &&
          !transfer.approved &&
          !transfer.completed
        ) {
          const vehicle = await contractInstance.methods.vehicleRegistrations(transfer.registrationId).call();
          transfers.push({
            requestId: i,
            registrationId: transfer.registrationId,
            vehicleNo: vehicle.vehicleNo,
            vehicleMake: vehicle.vehicleMake,
            vehicleModel: vehicle.vehicleModel,
            vehicleYear: vehicle.vehicleModelYear,
            currentOwner: transfer.currentOwner,
            newOwner: transfer.newOwner,
            transferAmount: transfer.transferAmount,
            newOwnerAccepted: transfer.newOwnerAccepted
          });
        }
      }

      setPendingTransfers(transfers);
    } catch (error) {
      console.error("Error loading pending transfers:", error);
      notify("❌ Failed to load pending transfers", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadRecoveryRequests = async (contractInstance) => {
    try {
      setLoading(true);
      const requestCount = await contractInstance.methods.recoveryRequestCount().call();
      const requests = [];

      for (let i = 1; i <= requestCount; i++) {
        try {
          const request = await contractInstance.methods.recoveryRequests(i).call();
          if (request.vehicleId && request.vehicleId != 0 && !request.completed && !request.approved) {
            const vehicle = await contractInstance.methods.vehicleRegistrations(request.vehicleId).call();
            requests.push({
              ...request,
              requestId: i,
              vehicleDetails: vehicle
            });
          }
        } catch (error) {
          console.log(`Skipping request ${i}:`, error.message);
          continue;
        }
      }

      setRecoveryRequests(requests);
    } catch (error) {
      console.error("Error loading recovery requests:", error);
      notify("❌ Failed to load recovery requests", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadStolenVehicles = async (contractInstance) => {
    try {
      setLoading(true);
      const stolenVehicleIds = await contractInstance.methods.getStolenVehicles().call();
      const stolen = [];

      for (let i = 0; i < stolenVehicleIds.length; i++) {
        const vehicleId = stolenVehicleIds[i];
        const vehicle = await contractInstance.methods.vehicleRegistrations(vehicleId).call();
        stolen.push(vehicle);
      }

      setStolenVehicles(stolen);
    } catch (error) {
      console.error("Error loading stolen vehicles:", error);
      notify("❌ Failed to load stolen vehicles", "error");
    } finally {
      setLoading(false);
    }
  };

  const approveRecoveryRequest = async (requestId) => {
    try {
      setLoading(true);
      const request = await contract.methods.recoveryRequests(requestId).call();
      const vehicle = await contract.methods.vehicleRegistrations(request.vehicleId).call();
      const userRef = doc(db, "users", request.requestedBy);
      const userSnap = await getDoc(userRef);

      await contract.methods.approveRecoveryRequest(requestId).send({ from: account });

      if (userSnap.exists()) {
        const userData = userSnap.data();
        await sendNotificationEmail({
          recipientEmail: userData.email,
          subject: '🎉 Vehicle Recovery Request Approved',
          type: 'approval',
          userName: userData.name,
          actionType: 'Vehicle Recovery',
          status: 'Approved',
          details: `Your recovery request for vehicle ${vehicle.vehicleNo} (${vehicle.vehicleMake} ${vehicle.vehicleModel}) has been approved. The vehicle is no longer marked as stolen.`
        });
      }

      notify("✅ Recovery request approved successfully! Notification email sent.", "success");
      await loadRecoveryRequests(contract);
      await loadStolenVehicles(contract);
    } catch (error) {
      console.error("Approve recovery error:", error);
      notify("❌ Failed to approve recovery request: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const declineRecoveryRequest = async (requestId, reason) => {
    try {
      setLoading(true);
      const request = await contract.methods.recoveryRequests(requestId).call();
      const vehicle = await contract.methods.vehicleRegistrations(request.vehicleId).call();
      const userRef = doc(db, "users", request.requestedBy);
      const userSnap = await getDoc(userRef);

      await contract.methods.declineRecoveryRequest(requestId, reason).send({ from: account });

      if (userSnap.exists()) {
        const userData = userSnap.data();
        await sendNotificationEmail({
          recipientEmail: userData.email,
          subject: '❌ Vehicle Recovery Request Declined',
          type: 'decline',
          userName: userData.name,
          actionType: 'Vehicle Recovery',
          status: 'Declined',
          details: `Your recovery request for vehicle ${vehicle.vehicleNo} (${vehicle.vehicleMake} ${vehicle.vehicleModel}) has been declined.`,
          reason: reason
        });
      }

      notify("✅ Recovery request declined successfully! Notification email sent.", "success");
      await loadRecoveryRequests(contract);
    } catch (error) {
      console.error("Decline recovery error:", error);
      notify("❌ Failed to decline recovery request: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const updateUserApprovalInFirebase = async (userWallet) => {
    try {
      const userRef = doc(db, "users", userWallet);
      await updateDoc(userRef, {
        approved: true,
        updatedAt: new Date().toISOString()
      });
      console.log("Firebase user approval status updated successfully");
      return true;
    } catch (error) {
      console.error("Error updating Firebase user approval:", error);
      return false;
    }
  };

  const approveUser = async (userWallet) => {
    try {
      setLoading(true);
      await contract.methods.approveUser(userWallet).send({ from: account });
      const firebaseUpdateResult = await updateUserApprovalInFirebase(userWallet);
      const userRef = doc(db, "users", userWallet);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        await sendNotificationEmail({
          recipientEmail: userData.email,
          subject: '✅ Your Registration Has Been Approved',
          type: 'approval',
          userName: userData.name,
          actionType: 'User Registration',
          status: 'Approved',
          details: `Your account with wallet address ${userWallet} has been successfully approved by the government authority.`
        });
      }

      if (firebaseUpdateResult) {
        notify("✅ User approved successfully! Notification email sent.", "success");
      } else {
        notify("⚠️ User approved in blockchain but failed to update Firebase.", "warning");
      }

      await loadPendingUsersAndVehicles(contract);
    } catch (err) {
      console.error("User approval error:", err);
      notify("❌ User approval failed: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const updateVehicleApprovalInFirebase = async (regId) => {
    try {
      const vehicle = await contract.methods.vehicleRegistrations(regId).call();
      const vehicleNo = vehicle.vehicleNo;
      const vehicleRef = doc(db, "vehicles", vehicleNo);
      await updateDoc(vehicleRef, {
        approved: true,
        updatedAt: new Date().toISOString()
      });
      console.log("Firebase vehicle approval status updated successfully");
      return true;
    } catch (error) {
      console.error("Error updating Firebase vehicle approval:", error);
      return false;
    }
  };

  const approveVehicle = async (regId) => {
    try {
      setLoading(true);
      const vehicle = await contract.methods.vehicleRegistrations(regId).call();
      await contract.methods.approveVehicle(regId).send({ from: account });
      const firebaseUpdateResult = await updateVehicleApprovalInFirebase(regId);
      const userRef = doc(db, "users", vehicle.ownerWallet);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        await sendNotificationEmail({
          recipientEmail: userData.email,
          subject: '🚗 Your Vehicle Registration Has Been Approved',
          type: 'approval',
          userName: userData.name,
          actionType: 'Vehicle Registration',
          status: 'Approved',
          details: `Your vehicle ${vehicle.vehicleNo} (${vehicle.vehicleMake} ${vehicle.vehicleModel}) has been successfully approved.`
        });
      }

      if (firebaseUpdateResult) {
        notify("✅ Vehicle approved successfully! Notification email sent.", "success");
      } else {
        notify("⚠️ Vehicle approved in blockchain but failed to update Firebase.", "warning");
      }

      await loadPendingUsersAndVehicles(contract);
    } catch (err) {
      console.error("Vehicle approval error:", err);
      notify("❌ Vehicle approval failed: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const updateTransferCompletionInFirebase = async (vehicleNo, newOwnerWallet) => {
    try {
      const vehicleRef = doc(db, "vehicles", vehicleNo);
      await updateDoc(vehicleRef, {
        ownerWallet: newOwnerWallet,
        transferStatus: "completed",
        transferCompletionDate: new Date().toISOString()
      });
      console.log("Transfer completion updated in Firebase");
      return true;
    } catch (error) {
      console.error("Error updating transfer completion in Firebase:", error);
      return false;
    }
  };

  const approveTransfer = async (requestId) => {
    try {
      setLoading(true);
      const transfer = await contract.methods.getTransferRequest(requestId).call();
      const vehicle = await contract.methods.vehicleRegistrations(transfer.registrationId).call();
      await contract.methods.approveOwnershipTransfer(requestId).send({ from: account });
      const firebaseUpdateResult = await updateTransferCompletionInFirebase(vehicle.vehicleNo, transfer.newOwner);
      const currentOwnerRef = doc(db, "users", transfer.currentOwner);
      const newOwnerRef = doc(db, "users", transfer.newOwner);
      const [currentOwnerSnap, newOwnerSnap] = await Promise.all([
        getDoc(currentOwnerRef),
        getDoc(newOwnerRef)
      ]);

      if (currentOwnerSnap.exists()) {
        const currentOwnerData = currentOwnerSnap.data();
        await sendNotificationEmail({
          recipientEmail: currentOwnerData.email,
          subject: '✅ Vehicle Transfer Completed',
          type: 'transfer_complete',
          userName: currentOwnerData.name,
          actionType: 'Vehicle Transfer (Seller)',
          status: 'Completed',
          details: `The ownership transfer of your vehicle ${vehicle.vehicleNo} has been completed successfully.`
        });
      }

      if (newOwnerSnap.exists()) {
        const newOwnerData = newOwnerSnap.data();
        await sendNotificationEmail({
          recipientEmail: newOwnerData.email,
          subject: '🎉 Vehicle Transfer Complete - You are now the owner!',
          type: 'transfer_complete',
          userName: newOwnerData.name,
          actionType: 'Vehicle Transfer (Buyer)',
          status: 'Completed',
          details: `Congratulations! You are now the official owner of vehicle ${vehicle.vehicleNo} (${vehicle.vehicleMake} ${vehicle.vehicleModel}).`
        });
      }

      if (firebaseUpdateResult) {
        notify("✅ Transfer approved and completed successfully! Notification emails sent.", "success");
      } else {
        notify("⚠️ Transfer approved in blockchain but failed to update Firebase.", "warning");
      }

      await loadPendingTransfers(contract);
      setShowTransferModal(false);
    } catch (error) {
      console.error("Transfer approval error:", error);
      notify("❌ Transfer approval failed: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (wallet) => {
    try {
      setLoading(true);
      const userRef = doc(db, "users", wallet);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setUserDetails(userSnap.data());
        setShowModal(true);
      } else {
        alert("User details not found in Firebase");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      alert("Failed to fetch user details: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicleDetails = async (regId) => {
    try {
      setLoading(true);
      const vehicle = await contract.methods.vehicleRegistrations(regId).call();
      const vehicleRef = doc(db, "vehicles", vehicle.vehicleNo);
      const vehicleSnap = await getDoc(vehicleRef);

      let vehicleDetails = {
        ...vehicle,
        ...(vehicleSnap.exists() ? vehicleSnap.data() : {})
      };

      setSelectedVehicle(vehicleDetails);
      setShowVehicleModal(true);
    } catch (error) {
      console.error("Error fetching vehicle details:", error);
      alert("Failed to fetch vehicle details: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransferDetails = async (transfer) => {
    try {
      setLoading(true);
      const currentOwnerRef = doc(db, "users", transfer.currentOwner);
      const currentOwnerSnap = await getDoc(currentOwnerRef);
      const newOwnerRef = doc(db, "users", transfer.newOwner);
      const newOwnerSnap = await getDoc(newOwnerRef);
      const vehicle = await contract.methods.vehicleRegistrations(transfer.registrationId).call();
      const vehicleRef = doc(db, "vehicles", transfer.vehicleNo);
      const vehicleSnap = await getDoc(vehicleRef);

      let transferInfo = {
        ...transfer,
        currentOwnerDetails: currentOwnerSnap.exists() ? currentOwnerSnap.data() : null,
        newOwnerDetails: newOwnerSnap.exists() ? newOwnerSnap.data() : null,
        vehicleDetails: {
          ...vehicle,
          ...(vehicleSnap.exists() ? vehicleSnap.data() : {})
        }
      };

      setTransferDetails(transferInfo);
      setShowTransferModal(true);
    } catch (error) {
      console.error("Error fetching transfer details:", error);
      alert("Failed to fetch transfer details: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setUserDetails(null);
  };

  const closeVehicleModal = () => {
    setShowVehicleModal(false);
    setSelectedVehicle(null);
  };

  const closeTransferModal = () => {
    setShowTransferModal(false);
    setTransferDetails(null);
  };

  const handleLogout = () => {
    window.localStorage.removeItem("email");
    window.localStorage.removeItem("walletAddress");
    window.location.href = "/";
  };

  const declineUser = async (userWallet, reason) => {
    try {
      setLoading(true);
      const userRef = doc(db, "users", userWallet);
      const userSnap = await getDoc(userRef);
      let userData = null;

      if (userSnap.exists()) {
        userData = userSnap.data();
      }

      await contract.methods.declineUser(userWallet, reason).send({ from: account });
      await deleteDoc(doc(db, "users", userWallet));

      if (userData) {
        await sendNotificationEmail({
          recipientEmail: userData.email,
          subject: '❌ Your Registration Has Been Declined',
          type: 'decline',
          userName: userData.name,
          actionType: 'User Registration',
          status: 'Declined',
          details: `Your registration request has been declined.`,
          reason: reason
        });
      }

      notify("✅ User declined successfully! Notification email sent.", "success");
      await loadPendingUsersAndVehicles(contract);
    } catch (error) {
      console.error("User decline error:", error);
      notify("❌ User decline failed: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const declineVehicle = async (regId, reason) => {
    try {
      setLoading(true);
      const vehicle = await contract.methods.vehicleRegistrations(regId).call();
      const userRef = doc(db, "users", vehicle.ownerWallet);
      const userSnap = await getDoc(userRef);
      let userData = null;

      if (userSnap.exists()) {
        userData = userSnap.data();
      }

      await contract.methods.declineVehicle(regId, reason).send({ from: account });

      if (userData) {
        await sendNotificationEmail({
          recipientEmail: userData.email,
          subject: '❌ Your Vehicle Registration Has Been Declined',
          type: 'decline',
          userName: userData.name,
          actionType: 'Vehicle Registration',
          status: 'Declined',
          details: `Your vehicle registration for ${vehicle.vehicleNo} (${vehicle.vehicleMake} ${vehicle.vehicleModel}) has been declined.`,
          reason: reason
        });
      }

      notify("✅ Vehicle declined successfully! Notification email sent.", "success");
      await loadPendingUsersAndVehicles(contract);
    } catch (error) {
      console.error("Vehicle decline error:", error);
      notify("❌ Vehicle decline failed: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const declineTransfer = async (requestId, reason) => {
    try {
      setLoading(true);
      const transfer = await contract.methods.getTransferRequest(requestId).call();
      const vehicle = await contract.methods.vehicleRegistrations(transfer.registrationId).call();
      const currentOwnerRef = doc(db, "users", transfer.currentOwner);
      const newOwnerRef = doc(db, "users", transfer.newOwner);
      const [currentOwnerSnap, newOwnerSnap] = await Promise.all([
        getDoc(currentOwnerRef),
        getDoc(newOwnerRef)
      ]);

      await contract.methods.declineOwnershipTransfer(requestId, reason).send({ from: account });

      if (currentOwnerSnap.exists()) {
        const currentOwnerData = currentOwnerSnap.data();
        await sendNotificationEmail({
          recipientEmail: currentOwnerData.email,
          subject: '❌ Vehicle Transfer Request Declined',
          type: 'decline',
          userName: currentOwnerData.name,
          actionType: 'Vehicle Transfer (Seller)',
          status: 'Declined',
          details: `The transfer request for your vehicle ${vehicle.vehicleNo} has been declined by the government.`,
          reason: reason
        });
      }

      if (newOwnerSnap.exists()) {
        const newOwnerData = newOwnerSnap.data();
        await sendNotificationEmail({
          recipientEmail: newOwnerData.email,
          subject: '❌ Vehicle Transfer Request Declined',
          type: 'decline',
          userName: newOwnerData.name,
          actionType: 'Vehicle Transfer (Buyer)',
          status: 'Declined',
          details: `The transfer request for vehicle ${vehicle.vehicleNo} (${vehicle.vehicleMake} ${vehicle.vehicleModel}) has been declined by the government.`,
          reason: reason
        });
      }

      notify("✅ Transfer declined successfully! Notification emails sent.", "success");
      await loadPendingTransfers(contract);
    } catch (error) {
      console.error("Transfer decline error:", error);
      notify("❌ Transfer decline failed: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllVehicles = async () => {
    try {
      setLoading(true);
      const registrationCount = await contract.methods.registrationCount().call();
      const vehicles = [];

      for (let i = 1; i <= registrationCount; i++) {
        try {
          const vehicle = await contract.methods.vehicleRegistrations(i).call();
          if (vehicle.vehicleNo && vehicle.vehicleNo !== '') {
            vehicles.push({
              id: vehicle.id,
              ownerWallet: vehicle.ownerWallet,
              vehicleNo: vehicle.vehicleNo,
              vin: vehicle.vin,
              vehicleMake: vehicle.vehicleMake,
              vehicleModel: vehicle.vehicleModel,
              vehicleModelYear: vehicle.vehicleModelYear,
              vehicleRegistrationYear: vehicle.vehicleRegistrationYear,
              approved: vehicle.approved,
              documentHash: vehicle.documentHash,
              imageHash: vehicle.imageHash,
              isStolen: vehicle.isStolen
            });
          }
        } catch (error) {
          continue;
        }
      }

      setAllVehicles(vehicles);
    } catch (error) {
      console.error('Error fetching all vehicles:', error);
      toast.error('Error fetching vehicles');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAllVehicles = () => {
    return allVehicles.filter(vehicle => {
      if (vehicleFilters.approved !== null && vehicle.approved !== vehicleFilters.approved) {
        return false;
      }
      if (vehicleFilters.stolen !== null && vehicle.isStolen !== vehicleFilters.stolen) {
        return false;
      }
      if (vehicleFilters.make && !vehicle.vehicleMake.toLowerCase().includes(vehicleFilters.make.toLowerCase())) {
        return false;
      }
      if (vehicleFilters.vehicleNo && !vehicle.vehicleNo.toLowerCase().includes(vehicleFilters.vehicleNo.toLowerCase())) {
        return false;
      }
      if (vehicleFilters.owner && !vehicle.ownerWallet.toLowerCase().includes(vehicleFilters.owner.toLowerCase())) {
        return false;
      }
      return true;
    });
  };

  const openDeclineModal = (type, target) => {
    setDeclineType(type);
    setDeclineTarget(target);
    setShowDeclineModal(true);
    setDeclineReason("");
  };

  const fetchVehicleID = async (vehicleID) => {
    const id = await contract.methods.getVehicleId(vehicleID).call();
    return fetchVehicleDetails(id);
  };

  const handleDecline = () => {
    if (!declineReason.trim()) {
      alert("Please provide a reason for declining");
      return;
    }

    switch (declineType) {
      case "user":
        declineUser(declineTarget.wallet, declineReason);
        break;
      case "vehicle":
        declineVehicle(declineTarget.id, declineReason);
        break;
      case "transfer":
        declineTransfer(declineTarget.requestId, declineReason);
        break;
      case "stolenrecovered":
        declineRecoveryRequest(declineTarget, declineReason);
        break;
    }

    setShowDeclineModal(false);
  };

  return (
  <div className="gov-dashboard-container">
    <div className="gov-navbar">
      <h2 className="navbar-title">🚔 Government Dashboard</h2>
      <div className="navbar-buttons">
        <button 
          onClick={() => {
            setView("users");
            loadPendingUsersAndVehicles(contract);
          }} 
          className={view === "users" ? "active" : ""}
        >
          Pending Users
        </button>
        <button 
          onClick={() => {
            setView("vehicles");
            loadPendingUsersAndVehicles(contract);
          }} 
          className={view === "vehicles" ? "active" : ""}
        >
          Pending Vehicles
        </button>
        <button 
          onClick={() => {
            setView("transfers");
            loadPendingTransfers(contract);
          }} 
          className={view === "transfers" ? "active" : ""}
        >
          Pending Transfers
        </button>
        <button 
          onClick={() => {
            setView("stolen");
            loadRecoveryRequests(contract);
            loadStolenVehicles(contract);
          }} 
          className={view === "stolen" ? "active" : ""}
        >
          🚨 Stolen Vehicles
        </button>
        <button 
          onClick={() => {
            setView("allvehicles");
            fetchAllVehicles();
          }} 
          className={view === "allvehicles" ? "active" : ""}
        >
          📋 All Vehicles
        </button>
        <button 
          onClick={() => setView("transactions")} 
          className={view === "transactions" ? "active" : ""}
        >
          📊 All Transactions
        </button>
        <button 
          onClick={handleLogout} 
          className="logoutbutton" 
          style={{ backgroundColor: "red", fontWeight: "bold", color: "white" }}
        >
          Logout
        </button>
      </div>
    </div>

    {loading && (
      <div className="loading-container">
        <p className="loading-text">🔄 Loading {view}...</p>
      </div>
    )}

    {!loading && view === "users" && (
      <div className="dashboard-section">
        <h3>Pending Users</h3>
        {pendingUsers.length === 0 ? (
          <p className="no-data-message">No pending users to approve</p>
        ) : (
          <ul className="dashboard-list">
            {pendingUsers.map((user, index) => (
              <li className="dashboard-item" key={index}>
                <div className="item-details">
                  <strong>Email:</strong> {user.email} <br />
                  <strong>Wallet:</strong> {user.wallet}
                </div>
                <div className="action-buttons">
                  <button 
                    className="view-button"
                    onClick={() => fetchUserDetails(user.wallet)}
                  >
                    View Details
                  </button>
                  <button 
                    className="approve-button"
                    onClick={() => approveUser(user.wallet)}
                  >
                    Approve
                  </button>
                  <button 
                    className="decline-button"
                    onClick={() => openDeclineModal("user", user)}
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    )}

    {!loading && view === "transactions" && (
      <div className="dashboard-section">
        <TransactionViewer 
          web3={web3} 
          contract={contract} 
          account={account} 
        />
      </div>
    )}

    {!loading && view === "vehicles" && (
      <div className="dashboard-section">
        <h3>Pending Vehicles</h3>
        {pendingVehicles.length === 0 ? (
          <p className="no-data-message">No pending vehicles to approve</p>
        ) : (
          <ul className="dashboard-list">
            {pendingVehicles.map((v, index) => (
              <li className="dashboard-item" key={index}>
                <div className="item-details">
                  <strong>Vehicle:</strong> {v.vehicleNo} ({v.vehicleMake}) <br />
                  <strong>Owner:</strong> {v.ownerWallet}
                </div>
                <div className="action-buttons">
                  <button 
                    className="view-button"
                    onClick={() => fetchUserDetails(v.ownerWallet)}
                  >
                    View Owner Details
                  </button>
                  <button 
                    className="view-button"
                    onClick={() => fetchVehicleDetails(v.id)}
                  >
                    View Vehicle Details
                  </button>
                  <button 
                    className="approve-button"
                    onClick={() => approveVehicle(v.id)}
                  >
                    Approve
                  </button>
                  <button 
                    className="decline-button"
                    onClick={() => openDeclineModal("vehicle", v)}
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    )}

    {!loading && view === "transfers" && (
      <div className="dashboard-section">
        <h3>Pending Vehicle Transfers</h3>
        {pendingTransfers.length === 0 ? (
          <p className="no-data-message">No pending transfers awaiting government approval</p>
        ) : (
          <ul className="dashboard-list">
            {pendingTransfers.map((transfer, index) => (
              <li className="dashboard-item" key={index}>
                <div className="item-details">
                  <strong>Vehicle:</strong> {transfer.vehicleNo} ({transfer.vehicleMake} {transfer.vehicleModel}) <br />
                  <strong>From:</strong> {transfer.currentOwner.substring(0, 10)}...{transfer.currentOwner.substring(34)} <br />
                  <strong>To:</strong> {transfer.newOwner.substring(0, 10)}...{transfer.newOwner.substring(34)} <br />
                  <strong>Transfer Amount:</strong> {web3?.utils.fromWei(transfer.transferAmount, 'ether')} ETH <br />
                  <strong>Status:</strong> <span style={{color: 'green'}}>✅ Payment Received - Ready for Approval</span>
                </div>
                <div className="action-buttons">
                  <button 
                    className="view-button"
                    onClick={() => fetchTransferDetails(transfer)}
                  >
                    View Details
                  </button>
                  <button 
                    className="view-button"
                    onClick={() => fetchVehicleDetails(transfer.registrationId)}
                  >
                    View Vehicle Details
                  </button>
                  <button 
                    className="approve-button"
                    onClick={() => approveTransfer(transfer.requestId)}
                  >
                    Approve Transfer
                  </button>
                  <button 
                    className="decline-button"
                    onClick={() => openDeclineModal("transfer", transfer)}
                  >
                    Decline Transfer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    )}

    {!loading && view === "stolen" && (
      <div className="dashboard-section">
        <h3>Pending Recovery Requests ({recoveryRequests.length})</h3>
        {recoveryRequests.length > 0 ? (
          recoveryRequests.map((request, index) => (
            <div key={index} className="dashboard-list-card">
              <div className="card-content">
                <p><strong>Vehicle No:</strong> {request.vehicleDetails.vehicleNo}</p>
                <p><strong>VIN:</strong> {request.vehicleDetails.vin}</p>
                <p><strong>Make/Model:</strong> {request.vehicleDetails.vehicleMake} {request.vehicleDetails.vehicleModel}</p>
                <p><strong>Owner:</strong> {request.requestedBy}</p>
                <p><strong>Recovery Document:</strong> {request.recoveryDocumentHash}</p>
                <p><strong>Requested On:</strong> {new Date(request.timestamp * 1000).toLocaleString()}</p>
              </div>
              <div className="card-actions">
                <a 
                  href={request.recoveryDocumentHash} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="document-link"
                >
                  📄 View Recovery Document
                </a>
                <div className="vehicle-actions" style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '15px'
                }}>
                  <button 
                    className="view-button"
                    onClick={() => fetchVehicleID(request.vehicleDetails.vehicleNo)}
                    style={{flex: 1}}
                  >
                    📋 View Details
                  </button>
                  <button 
                    className="view-button"
                    onClick={() => fetchUserDetails(request.requestedBy)}
                    style={{flex: 1}}
                  >
                    👤 View Owner
                  </button>
                </div>
                <button 
                  className="approve-button"
                  onClick={() => approveRecoveryRequest(request.requestId)}
                  disabled={loading}
                >
                  Approve Recovery
                </button>
                <button 
                  className="decline-button"
                  onClick={() => openDeclineModal("stolenrecovered", request.requestId)}
                >
                  Decline Request
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-data-message">No pending recovery requests.</p>
        )}
      </div>
    )}

    {!loading && view === "allvehicles" && (
      <div className="dashboard-section">
        <div className="section-header">
          <h3>All Registered Vehicles ({getFilteredAllVehicles().length})</h3>
          <button 
            className="refresh-button"
            onClick={fetchAllVehicles}
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>
        
        <div className="filter-controls" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '10px',
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <select 
            value={vehicleFilters.approved === null ? '' : vehicleFilters.approved.toString()} 
            onChange={(e) => setVehicleFilters({
              ...vehicleFilters, 
              approved: e.target.value === '' ? null : e.target.value === 'true'
            })}
            style={{padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}}
          >
            <option value="">All Approval Status</option>
            <option value="true">✅ Approved Only</option>
            <option value="false">⏳ Pending Only</option>
          </select>
          
          <select 
            value={vehicleFilters.stolen === null ? '' : vehicleFilters.stolen.toString()} 
            onChange={(e) => setVehicleFilters({
              ...vehicleFilters, 
              stolen: e.target.value === '' ? null : e.target.value === 'true'
            })}
            style={{padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}}
          >
            <option value="">All Security Status</option>
            <option value="false">🔒 Safe Vehicles</option>
            <option value="true">🚨 Stolen Only</option>
          </select>
          
          <input
            type="text"
            placeholder="🔍 Search by Make (e.g., Honda)"
            value={vehicleFilters.make}
            onChange={(e) => setVehicleFilters({...vehicleFilters, make: e.target.value})}
            style={{padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}}
          />
          
          <input
            type="text"
            placeholder="🔍 Search by Vehicle No"
            value={vehicleFilters.vehicleNo}
            onChange={(e) => setVehicleFilters({...vehicleFilters, vehicleNo: e.target.value})}
            style={{padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}}
          />
          
          <input
            type="text"
            placeholder="🔍 Search by Owner Address"
            value={vehicleFilters.owner}
            onChange={(e) => setVehicleFilters({...vehicleFilters, owner: e.target.value})}
            style={{padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}}
          />
          
          <button 
            onClick={() => setVehicleFilters({
              approved: null,
              stolen: null,
              make: '',
              vehicleNo: '',
              owner: ''
            })}
            style={{
              padding: '8px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🗑️ Clear Filters
          </button>
        </div>

        {getFilteredAllVehicles().length === 0 ? (
          <p className="no-data-message">
            {allVehicles.length === 0 ? 'No vehicles registered yet' : 'No vehicles match the current filters'}
          </p>
        ) : (
          <div className="vehicles-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px'
          }}>
            {getFilteredAllVehicles().map(vehicle => (
              <div key={vehicle.id} className="vehicle-card" style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                backgroundColor: vehicle.isStolen ? '#ffebee' : vehicle.approved ? '#e8f5e8' : '#fff3cd'
              }}>
                <div className="vehicle-header" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <h4 style={{margin: 0, color: vehicle.isStolen ? '#d32f2f' : '#333'}}>
                    {vehicle.vehicleNo}
                  </h4>
                  <div>
                    {vehicle.isStolen && (
                      <span className="stolen-badge" style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: '#f44336',
                        color: 'white'
                      }}>
                        🚨 STOLEN
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="vehicle-details">
                  <p><strong>Make/Model:</strong> {vehicle.vehicleMake} {vehicle.vehicleModel}</p>
                  <p><strong>Year:</strong> {vehicle.vehicleModelYear}</p>
                  <p><strong>VIN:</strong> {vehicle.vin}</p>
                  <p><strong>Owner:</strong> 
                    <span style={{fontFamily: 'monospace', fontSize: '14px'}}>
                      {vehicle.ownerWallet.substring(0, 10)}...{vehicle.ownerWallet.substring(34)}
                    </span>
                  </p>
                </div>
                
                <div className="vehicle-actions" style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '15px'
                }}>
                  <button 
                    className="view-button"
                    onClick={() => fetchVehicleDetails(vehicle.id)}
                    style={{flex: 1}}
                  >
                    📋 View Details
                  </button>
                  <button 
                    className="view-button"
                    onClick={() => fetchUserDetails(vehicle.ownerWallet)}
                    style={{flex: 1}}
                  >
                    👤 View Owner
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="vehicles-summary" style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          <div className="summary-item" style={{textAlign: 'center'}}>
            <h4 style={{margin: '0 0 5px 0', color: '#333'}}>Total Vehicles</h4>
            <p style={{margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#007bff'}}>
              {allVehicles.length}
            </p>
          </div>
          <div className="summary-item" style={{textAlign: 'center'}}>
            <h4 style={{margin: '0 0 5px 0', color: '#333'}}>Approved</h4>
            <p style={{margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#28a745'}}>
              {allVehicles.filter(v => v.approved).length}
            </p>
          </div>
          <div className="summary-item" style={{textAlign: 'center'}}>
            <h4 style={{margin: '0 0 5px 0', color: '#333'}}>Pending</h4>
            <p style={{margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#ffc107'}}>
              {allVehicles.filter(v => !v.approved).length}
            </p>
          </div>
          <div className="summary-item" style={{textAlign: 'center'}}>
            <h4 style={{margin: '0 0 5px 0', color: '#333'}}>Stolen</h4>
            <p style={{margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#dc3545'}}>
              {allVehicles.filter(v => v.isStolen).length}
            </p>
          </div>
        </div>
      </div>
    )}

    {showDeclineModal && (
      <div className="modal-overlay" onClick={() => setShowDeclineModal(false)}>
        <div className="decline-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Decline {declineType}</h3>
            <button className="close-button" onClick={() => setShowDeclineModal(false)}>×</button>
          </div>
          <div className="modal-content">
            <label>Reason for declining:</label>
            <textarea 
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Please provide a reason for declining..."
              rows="4"
              style={{width: "100%", margin: "10px 0", padding: "10px"}}
            />
          </div>
          <div className="modal-footer">
            <button 
              className="decline-button"
              onClick={handleDecline}
            >
              Confirm Decline
            </button>
            <button 
              className="cancel-button"
              onClick={() => setShowDeclineModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}

    {showModal && userDetails && (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="user-details-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>User Details</h3>
            <button className="close-button" onClick={closeModal}>×</button>
          </div>
          <div className="modal-content">
            <div className="user-info-grid">
              <div className="info-item">
                <span className="info-label">Name:</span>
                <span className="info-value">{userDetails.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{userDetails.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Wallet:</span>
                <span className="info-value">{userDetails.wallet}</span>
              </div>
              <div className="info-item">
                <span className="info-label">CNIC:</span>
                <span className="info-value">{userDetails.cnic}</span>
              </div>
              <div className="info-item">
                <span className="info-label">CNIC Issue Date:</span>
                <span className="info-value">{userDetails.cnicIssuanceDate}</span>
              </div>
              <div className="info-item">
                <span className="info-label">CNIC Expiry Date:</span>
                <span className="info-value">{userDetails.cnicExpiryDate}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Date of Birth:</span>
                <span className="info-value">{userDetails.dateOfBirth}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Gender:</span>
                <span className="info-value">{userDetails.gender}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Phone Number:</span>
                <span className="info-value">{userDetails.phoneNumber}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Occupation:</span>
                <span className="info-value">{userDetails.occupation}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Address:</span>
                <span className="info-value">{userDetails.address}</span>
              </div>
              <div className="info-item">
                <span className="info-label">City:</span>
                <span className="info-value">{userDetails.city}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Province:</span>
                <span className="info-value">{userDetails.province}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Postal Code:</span>
                <span className="info-value">{userDetails.postalCode}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Account Created:</span>
                <span className="info-value">
                  {new Date(userDetails.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button 
              className="approve-button modal-approve-btn"
              onClick={() => {
                closeModal();
                const pendingUser = pendingUsers.find(u => u.wallet === userDetails.wallet);
                if (pendingUser) {
                  approveUser(userDetails.wallet);
                }
                const pendingVehicle = pendingVehicles.find(v => v.ownerWallet === userDetails.wallet);
                if (pendingVehicle && view === "vehicles") {
                  approveVehicle(pendingVehicle.id);
                }
              }}
            >
              Approve {view === "users" ? "User" : "Vehicle"}
            </button>
          </div>
        </div>
      </div>
    )}

    {showVehicleModal && selectedVehicle && (
      <div className="modal-overlay" onClick={closeVehicleModal}>
        <div className="vehicle-details-container" onClick={e => e.stopPropagation()}>
          <VehicleDetails vehicle={selectedVehicle} onClose={closeVehicleModal} />
        </div>
      </div>
    )}

    {showTransferModal && transferDetails && (
      <div className="modal-overlay" onClick={closeTransferModal}>
        <div className="transfer-details-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Transfer Details</h3>
            <button className="close-button" onClick={closeTransferModal}>×</button>
          </div>
          <div className="modal-content">
            <div className="transfer-details-section">
              <h4>Vehicle Information</h4>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Registration Number:</span>
                  <span className="info-value">{transferDetails.vehicleNo}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Make:</span>
                  <span className="info-value">{transferDetails.vehicleMake}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Model:</span>
                  <span className="info-value">{transferDetails.vehicleModel}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Year:</span>
                  <span className="info-value">{transferDetails.vehicleYear}</span>
                </div>
                <div className="info-item">
                  <button 
                    className="view-button full-width-btn"
                    onClick={() => fetchVehicleDetails(transferDetails.registrationId)}
                  >
                    View Complete Vehicle Details
                  </button>
                </div>
              </div>
            </div>

            <div className="transfer-details-section">
              <h4>Current Owner</h4>
              {transferDetails.currentOwnerDetails ? (
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Name:</span>
                    <span className="info-value">{transferDetails.currentOwnerDetails.name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Wallet:</span>
                    <span className="info-value">{transferDetails.currentOwner}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">CNIC:</span>
                    <span className="info-value">{transferDetails.currentOwnerDetails.cnic}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{transferDetails.currentOwnerDetails.email}</span>
                  </div>
                </div>
              ) : (
                <p>No detailed information available for current owner</p>
              )}
            </div>

            <div className="transfer-details-section">
              <h4>New Owner</h4>
              {transferDetails.newOwnerDetails ? (
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Name:</span>
                    <span className="info-value">{transferDetails.newOwnerDetails.name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Wallet:</span>
                    <span className="info-value">{transferDetails.newOwner}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">CNIC:</span>
                    <span className="info-value">{transferDetails.newOwnerDetails.cnic}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{transferDetails.newOwnerDetails.email}</span>
                  </div>
                </div>
              ) : (
                <p>No detailed information available for new owner</p>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button 
              className="approve-button modal-approve-btn"
              onClick={() => approveTransfer(transferDetails.requestId)}
            >
              Approve Transfer
            </button>
          </div>
        </div>
      </div>
    )}

    <ToastContainer />
  </div>
);
};

export default GovDashboard;