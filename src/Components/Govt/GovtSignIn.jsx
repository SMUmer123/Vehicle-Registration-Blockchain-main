import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Web3 from "web3";
import { contractABI, contractAddress } from "../../config";
import "./GovtSignIn.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/ReactToastify.css';

const GovtSignIn = () => {
  const [account, setAccount] = useState("");
  const navigate = useNavigate();

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

  const connectWallet = async () => {
    if (!window.ethereum) {
      notify("⚠️ MetaMask not detected!", "warning");
      return;
    }

    try {
      const web3 = new Web3(window.ethereum);
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const currentAccount = accounts[0];

      // Check if the connected account is the government address
      const contract = new web3.eth.Contract(contractABI, contractAddress);
      const govtAddress = await contract.methods.government().call();

      if (currentAccount.toLowerCase() !== govtAddress.toLowerCase()) {
        notify("❌ Unauthorized: You are not the government official.", "error");
        return;
      }

      setAccount(currentAccount);
      notify("✅ Wallet connected successfully!", "success");
      navigate("/govtDashboard");
    } catch (error) {
      console.error("MetaMask connection error:", error);
      notify(`❌ Failed to connect MetaMask: ${error.message}`, "error");
    }
  };

  return (
    <div className="gov-login-main">
      <div className="gov-login-card">
        <div className="gov-login-sidebar">
          <h1>Gov Portal</h1>
          <p>Secure access for government officials</p>
        </div>
        <div className="gov-login-form">
          <h2>Government Login</h2>
          <p>Connect your MetaMask wallet to continue</p>
          <button className="gov-login-btn" onClick={connectWallet}>
            Connect MetaMask
          </button>
          {account && <p style={{ marginTop: "10px" }}>Connected: {account}</p>}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default GovtSignIn;