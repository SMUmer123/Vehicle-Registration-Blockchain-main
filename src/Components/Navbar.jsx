import React, { useEffect, useState } from "react";
import "./UserLogin.css";
import "./Navbar.css";
import ProfileModal from "./ProfileModal"; // Fixed import name

const Navbar = () => {
  const [email, setEmail] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    // Load user data from localStorage
    const storedEmail = window.localStorage.getItem("email");
    const storedWallet = window.localStorage.getItem("walletAddress");
    
    if (storedEmail) setEmail(storedEmail);
    if (storedWallet) setWalletAddress(storedWallet);
    
    // Optional: You could also fetch the wallet address from MetaMask here
    // instead of in the ProfileModal component
  }, []);

  const handleLogout = () => {
    window.localStorage.removeItem("email");
    window.localStorage.removeItem("walletAddress");
    window.location.href = "/";
  };

  return (
    <>
      <div className="navbar"  >
        <h1 className="navbar h1" onClick={() => (window.location.href = "/")}>
        USER DASHBOARD
        </h1>

        <h3 className="navbar h3">
          User Email: {email}
        </h3>

        <div className="
.navbar button ">
          <button onClick={() => (window.location.href = "/home")}>Home</button>
          <button onClick={() => (window.location.href = "/new")}>Register Vehicle</button>
          <button onClick={() => (window.location.href = "/transfer")}>Transfer Ownership</button>
          <button onClick={() => setShowProfile(true)}>My Profile</button>
          <button onClick={handleLogout} className="logoutbutton" style={{ backgroundColor: "red", fontWeight: "bold", color: "white" }}>
            Logout
          </button>
        </div>
      </div>

      {showProfile && (
        <ProfileModal 
          walletAddress={walletAddress} 
          onClose={() => setShowProfile(false)} 
        />
      )}
    </>
  );
};

export default Navbar;