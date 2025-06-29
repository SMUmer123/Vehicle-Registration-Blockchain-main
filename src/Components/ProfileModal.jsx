import React, { useEffect, useState, useRef } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../Firebase/config";
import "./ProfileModal.css";

const ProfileModal = ({ walletAddress, onClose }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const modalRef = useRef(null);

  // Fetch user data from Firebase using the provided wallet address
  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!walletAddress) {
          setLoading(false);
          return;
        }

        console.log("Fetching user for wallet:", walletAddress);
        
        // First try the direct approach - case sensitive lookup
        const docRef = doc(db, "users", walletAddress);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data());
          console.log("User data found with exact address match:", docSnap.data());
        } else {
          // If no match, try a case-insensitive query
          console.log("No direct match, trying case-insensitive search...");
          
          // Create a query against the users collection
          const usersRef = collection(db, "users");
          
          // Get all users (in a real app with many users, you'd need a different approach)
          const querySnapshot = await getDocs(usersRef);
          
          let found = false;
          querySnapshot.forEach((doc) => {
            // Compare addresses case-insensitively
            if (doc.id.toLowerCase() === walletAddress.toLowerCase()) {
              setUserData(doc.data());
              console.log("User data found with case-insensitive match:", doc.data());
              found = true;
            }
          });
          
          if (!found) {
            console.log("No user found with this wallet address!");
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    };

    fetchUser();
  }, [walletAddress]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div className="modal-overlay">
      <div className="modal-content" ref={modalRef}>
        <h2>User Profile</h2>
        {loading ? (
          <p>Loading...</p>
        ) : userData ? (
          <div className="profile-details">
            <p><strong>Name:</strong> {userData.name}</p>
            <p><strong>Email:</strong> {userData.email}</p>
            <p><strong>CNIC:</strong> {userData.cnic}</p>
            <p><strong>Wallet Address:</strong> {walletAddress}</p>
            {/* Add other fields as needed */}
          </div>
        ) : (
          <p>No profile data found. Please ensure your wallet is correctly connected.</p>
        )}
        <button onClick={onClose} className="close-button">Close</button>
      </div>
    </div>
  );
};

export default ProfileModal;