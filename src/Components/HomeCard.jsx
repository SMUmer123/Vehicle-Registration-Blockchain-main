import React, { useState } from "react";
import "./HomeCard.css";
import VehicleDetails from "./VehicleDetails";

const HomeCard = (props) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const handleViewDetails = () => {
    setShowDetails(true);
  };
  
  const handleCloseDetails = () => {
    setShowDetails(false);
  };
  

  
  return (
  <>
    <div className={`homecard ${props.user.approved} ${props.user.isStolen ? 'stolen' : ''}`}>
      <div className="status-badge">
        {props.user.isStolen 
          ? "🚨 STOLEN" 
          : props.user.approved 
            ? "✓ Approved" 
            : "⏳ Pending"
        }
      </div>
      
      <h2>
        {props.user.isStolen 
          ? "STOLEN VEHICLE" 
          : props.user.approved 
            ? "Approved" 
            : "Not Approved"
        }
      </h2>
      
      <img src={props.user.imageHash} alt="vehicle" />
      
      <div className="vehicle-info">
        <div className="info-item">
          <span className="info-label">Vehicle No:</span>
          <span className="info-value">{props.user.vehicleNo}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Engine No:</span>
          <span className="info-value">{props.user.vin}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Make:</span>
          <span className="info-value">{props.user.vehicleMake}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Model:</span>
          <span className="info-value">{props.user.vehicleModel}</span>
        </div>
      </div>
      
      <a href={props.user.documentHash} target="_blank" rel="noopener noreferrer">
        📄 Download Document
      </a>
      
      <div className="homecard-actions">
        {props.user.approved  && (
          <button className="view-details-btn" onClick={handleViewDetails}>
            View details
          </button>
        )}
      </div>
    </div>
    
    {/* Render VehicleDetails modal when showDetails is true */}
    {showDetails && (
      <VehicleDetails 
        vehicle={props.user} 
        onClose={handleCloseDetails}
      />
    )}
  </>
);
};

export default HomeCard;