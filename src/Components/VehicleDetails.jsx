import React from "react";
import OwnershipHistory from "./OwnershipHistory";
import "./StolenHistory"
import "./VehicleDetails.css";
import StolenHistory from "./StolenHistory";

const VehicleDetails = ({ vehicle, onClose }) => {
  return (
    <div className="vehicle-details-overlay">
      <div className="vehicle-details-container">
        <button className="close-button" onClick={onClose}>×</button>
        
        <div className="vehicle-details-header">
          <h2>Vehicle Details</h2>
          <div className="status-tag">
            {vehicle.approved ? "✓ Approved" : "⏳ Pending"}
          </div>
        </div>
        
        <div className="vehicle-details-body">
          <div className="details-left">
            <img 
              src={vehicle.imageHash} 
              alt="Vehicle" 
              className="vehicle-image" 
            />
            
            <div className="document-section">
              <h3>Vehicle Documents</h3>
              <a 
                href={vehicle.documentHash} 
                target="_blank" 
                rel="noopener noreferrer"
                className="document-link"
              >
                📄 Download Registration Document
              </a>
            </div>
          </div>
          
          <div className="details-right">
            <div className="details-section">
              <h3>Vehicle Information</h3>
              <table className="details-table">
                <tbody>
                  <tr>
                    <td>Vehicle No:</td>
                    <td>{vehicle.vehicleNo}</td>
                  </tr>
                  <tr>
                    <td>Engine/VIN No:</td>
                    <td>{vehicle.vin}</td>
                  </tr>
                  <tr>
                    <td>Make:</td>
                    <td>{vehicle.vehicleMake}</td>
                  </tr>
                  <tr>
                    <td>Model:</td>
                    <td>{vehicle.vehicleModel}</td>
                  </tr>
                  <tr>
                    <td>Model Year:</td>
                    <td>{vehicle.vehicleModelYear}</td>
                  </tr>
                  <tr>
                    <td>Registration Year:</td>
                    <td>{vehicle.vehicleRegistrationYear}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="details-section">
              <h3>Owner Information</h3>
              <table className="details-table">
                <tbody>
                  <tr>
                    <td>Owner Address:</td>
                    <td className="wallet-address">{vehicle.ownerWallet}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="details-section">
  <h3>Security Status</h3>
  <table className="details-table">
    <tbody>
      <tr>
        <td>Current Status:</td>
        <td className={vehicle.isStolen ? "stolen-status" : "normal-status"}>
          {vehicle.isStolen ? "🚨 REPORTED STOLEN" : "✅ Normal"}
        </td>
      </tr>
    </tbody>
  </table>
</div>
<StolenHistory vehicleId={vehicle.id} isCurrentlyStolen={vehicle.isStolen} />
            
            {/* Ownership History Component */}
            <OwnershipHistory vehicleId={vehicle.id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetails;