import React, { useState, useEffect } from "react";
import Web3 from "web3";
import CryptoJS from "crypto-js";
import { contractABI, contractAddress } from "../../config";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./login.css";

const UserLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState("");
  const [userRegistrationContract, setUserRegistrationContract] = useState(null);

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

  const connectMetaMask = async () => {
    try {
      if (!window.ethereum) {
        notify("⚠️ Please install MetaMask", "error");
        return;
      }

      const web3Instance = new Web3(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const accounts = await web3Instance.eth.getAccounts();
      setAccount(accounts[0]);
      setWeb3(web3Instance);

      const contract = new web3Instance.eth.Contract(contractABI, contractAddress);
      setUserRegistrationContract(contract);

      notify("✅ MetaMask connected: " + accounts[0], "success");
    } catch (error) {
      console.error("MetaMask connection error:", error);
      notify("❌ Failed to connect MetaMask", "error");
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        setAccount(accounts[0] || "");
        notify("🔄 MetaMask account changed", "info");
      });
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      if (!userRegistrationContract) {
        notify("❌ Smart contract not loaded!", "error");
        return;
      }

      if (!email || !password) {
        notify("⚠️ Please enter email and password", "error");
        return;
      }

      if (!account) {
        notify("⚠️ Please connect MetaMask first", "error");
        return;
      }

      // Verify credentials using smart contract
      const isValid = await userRegistrationContract.methods.verifyLogin(email, CryptoJS.SHA256(password).toString()).call();
      const registeredAddress = await userRegistrationContract.methods.getUserWallet(email).call();

      

      if (!isValid) {
        notify("❌ Invalid email or password", "error");
        return;
      }

      if (registeredAddress.toLowerCase() !== account.toLowerCase()) {
        notify("❌ Wrong MetaMask account connected", "error");
        return;
      }

      // ✅ Login success
      notify("✅ Login Successful", "success");
      localStorage.setItem("email", email);
      localStorage.setItem("walletAddress",account);

      setTimeout(() => {
        window.location.href = "/home";
      }, 1500);
    } catch (error) {
      console.error("Login error:", error);
      notify("❌ Login failed", "error");
    }
  };

return (
  <div>
    <ToastContainer />
    <div className="container" id="container">
      <div className="form-container sign-in">
        <form onSubmit={handleLogin}>
          <h1>Sign In</h1>

          {!account && (
            <p style={{ color: "red" }}>
              ⚠️ Please connect MetaMask before signing in.
            </p>
          )}

          <input
            type="email"
            className="login-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={!account}
          />

          <input
            type="password"
            className="login-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={!account}
          />

          <button type="submit" disabled={!account}>
            Sign In
          </button>

          <button
            type="button"
            className="connect-wallet-btn"
            onClick={async () => {
              try {
                if (!window.ethereum) {
                  notify("⚠️ Please install MetaMask", "error");
                  return;
                }
                const web3Instance = new Web3(window.ethereum);
                const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
                setAccount(accounts[0]);
                setWeb3(web3Instance);
                const contract = new web3Instance.eth.Contract(contractABI, contractAddress);
                setUserRegistrationContract(contract);
                notify("✅ Wallet connected", "success");
              } catch (error) {
                console.error(error);
                notify("❌ Wallet connection failed", "error");
              }
            }}
            style={{ marginTop: "10px" }}
          >
            {account
              ? `✅ Connected: ${account.slice(0, 6)}...${account.slice(-4)}`
              : "🔗 Connect MetaMask"}
          </button>
        </form>
      </div>

      <div className="toggle-container">
        <div className="toggle">
          <div className="toggle-panel toggle-right">
            <h1 style={{ color: "white" }}>Hello, Friend!</h1>
            <p>New here? Create an account.</p>
            <button
              className="hidden"
              onClick={() => (window.location.href = "/register")}
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

};

export default UserLogin;
