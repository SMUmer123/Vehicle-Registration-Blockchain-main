import React, { useState, useRef, useEffect } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import Web3 from "web3";
import { contractABI, contractAddress } from "../config";
import './VehicleVerification.css'

const captchakey = process.env.REACT_APP_SITE_KEY;

const VehicleVerificationPage = () => {
  const [searchType, setSearchType] = useState("vehicleNo");
  const [searchValue, setSearchValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [captchaValue, setCaptchaValue] = useState(null);
  const [vehicleData, setVehicleData] = useState(null);
  const [ownerData, setOwnerData] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const captchaRef = useRef();
  const resultsRef = useRef();

  const handleCaptchaChange = (value) => {
    setCaptchaValue(value);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setShowResults(false);
    setVehicleData(null);
    setOwnerData(null);

    if (!searchValue.trim()) {
      setError(`Please enter a ${searchType === 'vehicleNo' ? 'vehicle registration number' : 'VIN number'}`);
      return;
    }

    if (!captchaValue) {
      setError("Please complete the reCAPTCHA");
      return;
    }

    await searchVehicle();
  };

  const searchVehicle = async () => {
    setIsLoading(true);
    try {
      const web3 = new Web3(Web3.givenProvider || "https://sepolia.infura.io/v3/72b21a83a137415db2e410edf564d559");
      const registrationContract = new web3.eth.Contract(
        contractABI,
        contractAddress
      );

      let vehicleId = null;

      if (searchType === 'vehicleNo') {
        const exists = await registrationContract.methods.vehicleExists(searchValue).call();
        if (!exists) {
          setError("Vehicle not found with this registration number");
          setIsLoading(false);
          return;
        }
        
        vehicleId = await registrationContract.methods.getVehicleId(searchValue).call();
      } else {
        const registrationCount = await registrationContract.methods.registrationCount().call();
        let foundVehicle = null;
        
        for (let i = 1; i <= registrationCount; i++) {
          const vehicle = await registrationContract.methods.vehicleRegistrations(i).call();
          if (vehicle.vin.toLowerCase() === searchValue.toLowerCase()) {
            foundVehicle = vehicle;
            vehicleId = i;
            break;
          }
        }
        
        if (!foundVehicle) {
          setError("Vehicle not found with this VIN number");
          setIsLoading(false);
          return;
        }
      }

      const vehicle = await registrationContract.methods.vehicleRegistrations(vehicleId).call();
      
      let owner = null;
      try {
        const ownerId = await registrationContract.methods.getUserIdByAddress(vehicle.ownerWallet).call();
        if (ownerId && ownerId !== '0') {
          owner = await registrationContract.methods.users(ownerId).call();
        }
      } catch (err) {
        console.error("Error fetching owner details:", err);
      }

      setVehicleData(vehicle);
      setOwnerData(owner);
      setShowResults(true);
    } catch (error) {
      console.error("Error searching vehicle:", error);
      setError("An error occurred while searching. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSearchValue("");
    setSearchType("vehicleNo");
    setError("");
    setCaptchaValue(null);
    setVehicleData(null);
    setOwnerData(null);
    setShowResults(false);
    captchaRef.current?.reset();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Not available";
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const shortenAddress = (address) => {
    if (!address) return "Not available";
    return address.substring(0, 8) + '...' + address.substring(address.length - 6);
  };

  const getVehicleStatusClass = () => {
    if (!vehicleData) return '';
    if (!vehicleData.approved) return 'pending-status';
    if (vehicleData.isStolen) return 'stolen-status';
    return 'approved-status';
  };

  const getStatusBadge = () => {
    if (!vehicleData.approved) {
      return <span className="status-badge status-pending">⏳ Registration Pending</span>;
    }
    if (vehicleData.isStolen) {
      return <span className="status-badge status-stolen">🚨 Reported Stolen</span>;
    }
    return <span className="status-badge status-verified">✅ Verified & Clear</span>;
  };

  // Scroll to results when showResults changes to true
  useEffect(() => {
    if (showResults && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showResults]);

  // Format current date and time
  const currentDateTime = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true,
    timeZone: 'Europe/Bucharest', // EEST
  });

  return (
    <div className="vehicle-verification-container">
      <div className="main-wrapper">
        {/* Search Form */}
        <div className="search-form-card">
          <h1 className="page-title">
            Vehicle Verification System
          </h1>

          {/* Search Type Selection */}
          <div className="search-type-section">
            <label className="search-type-label">
              Search By:
            </label>
            <div className="radio-group">
              <label className={`radio-option ${searchType === "vehicleNo" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="searchType"
                  value="vehicleNo"
                  className="radio-input"
                  checked={searchType === "vehicleNo"}
                  onChange={(e) => setSearchType(e.target.value)}
                />
                <span className="radio-label-text">
                  Vehicle Registration Number
                </span>
              </label>
              <label className={`radio-option ${searchType === "vin" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="searchType"
                  value="vin"
                  className="radio-input"
                  checked={searchType === "vin"}
                  onChange={(e) => setSearchType(e.target.value)}
                />
                <span className="radio-label-text">
                  VIN (Vehicle Identification Number)
                </span>
              </label>
            </div>
          </div>

          {/* Search Input */}
          <div className="input-group">
            <label htmlFor="searchValue" className="input-label">
              {searchType === 'vehicleNo' ? 'Vehicle Registration Number' : 'VIN Number'} 
              <span className="required-asterisk">*</span>
            </label>
            <input
              type="text"
              id="searchValue"
              className="search-input"
              placeholder={searchType === 'vehicleNo' ? 'e.g. ABC-1234' : 'e.g. 1HGCM82633A123456'}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value.toUpperCase())}
            />
          </div>

          {/* reCAPTCHA */}
          <div className="captcha-container">
            <ReCAPTCHA
              ref={captchaRef}
              sitekey={captchakey}
              onChange={handleCaptchaChange}
            />
          </div>

          {/* Error */}
          {error && <div className="error-message">{error}</div>}

          {/* Buttons */}
          <div className="button-group">
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading && <div className="loading-spinner"></div>}
              {isLoading ? "Searching..." : "Search Vehicle"}
            </button>
            <button
              onClick={handleClear}
              className="btn btn-secondary"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Vehicle Details Results */}
        {showResults && vehicleData && (
          <div className={`results-card ${getVehicleStatusClass()}`} ref={resultsRef}>
            <div className="results-header">
              <h2 className="results-title">
                Vehicle Details
                {getStatusBadge()}
              </h2>
            </div>

            {/* Show pending message if not approved */}
            {!vehicleData.approved ? (
              <div className="pending-message">
                <div className="pending-icon">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="pending-content">
                  <h3>Registration Pending Approval</h3>
                  <p>
                    This vehicle's registration is currently pending approval by the authorities. 
                    Complete vehicle details will be available once the registration is approved.
                  </p>
                  <div className="basic-info">
                    <p><strong>Registration Number:</strong> {vehicleData.vehicleNo}</p>
                    <p><strong>VIN:</strong> {vehicleData.vin}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="details-grid">
                {/* Vehicle Information */}
                <div className="details-section vehicle-details">
                  <h3 className="section-title">
                    Vehicle Information
                  </h3>
                  {vehicleData.imageHash && (
                    <img src={vehicleData.imageHash} className="vehicle-image" alt="Vehicle" />
                  )}
                  <div className="detail-item">
                    <dt className="detail-label">Registration ID</dt>
                    <dd className="detail-value">#{vehicleData.id}</dd>
                  </div>
                  
                  <div className="detail-item">
                    <dt className="detail-label">Registration Number</dt>
                    <dd className="detail-value monospace">{vehicleData.vehicleNo}</dd>
                  </div>
                  
                  <div className="detail-item">
                    <dt className="detail-label">VIN Number</dt>
                    <dd className="detail-value monospace">{vehicleData.vin}</dd>
                  </div>
                  
                  <div className="detail-item">
                    <dt className="detail-label">Make</dt>
                    <dd className="detail-value">{vehicleData.vehicleMake}</dd>
                  </div>
                  
                  <div className="detail-item">
                    <dt className="detail-label">Model</dt>
                    <dd className="detail-value">{vehicleData.vehicleModel}</dd>
                  </div>
                  
                  <div className="detail-item">
                    <dt className="detail-label">Model Year</dt>
                    <dd className="detail-value">{vehicleData.vehicleModelYear}</dd>
                  </div>

                  <div className="detail-item">
                    <dt className="detail-label">Security Status</dt>
                    <dd className={`detail-value ${vehicleData.isStolen ? 'status-stolen-text' : 'status-clear-text'}`}>
                      {vehicleData.isStolen ? (
                        <>🚨 Vehicle Reported Stolen</>
                      ) : (
                        <>✅ Vehicle Clear - No Issues</>
                      )}
                    </dd>
                  </div>
                  
                  <div className="detail-item">
                    <dt className="detail-label">Registration Year</dt>
                    <dd className="detail-value">{vehicleData.vehicleRegistrationYear}</dd>
                  </div>
                </div>

                {/* Current Owner Information */}
                <div className="details-section">
                  <h3 className="section-title">
                    Current Owner
                  </h3>
                  
                  {ownerData ? (
                    <>
                      <div className="detail-item">
                        <dt className="detail-label">Owner Name</dt>
                        <dd className="detail-value">{ownerData.name}</dd>
                      </div>
                      
                      <div className="detail-item">
                        <dt className="detail-label">Government Status</dt>
                        <dd className="detail-value">
                          {ownerData.approvedByGovt ? (
                            <span className="status-approved-text">✅ Approved</span>
                          ) : (
                            <span className="status-pending-text">⏳ Pending</span>
                          )}
                        </dd>
                      </div>
                    </>
                  ) : (
                    <div className="detail-value">
                      Owner information not available
                    </div>
                  )}
                  
                  <div className="detail-item">
                    <dt className="detail-label">Wallet Address</dt>
                    <dd className="detail-value monospace">{shortenAddress(vehicleData.ownerWallet)}</dd>
                  </div>
                </div>

                {/* Registration Details */}
                <div className="details-section">
                  <h3 className="section-title">
                    Registration Details
                  </h3>
                  
                  <div className="detail-item">
                    <dt className="detail-label">Registration Status</dt>
                    <dd className="detail-value">
                      <span className="status-approved-text">
                        ✅ Approved & Active
                      </span>
                    </dd>
                  </div>
                </div>
              </div>
            )}

            {/* Date and Time for Printing */}
            <div className="print-date-time">
              <strong>Generated on:</strong> {currentDateTime}
            </div>

            {/* Security Notice */}
            <div className={`security-notice ${getVehicleStatusClass()}`}>
              <div className="security-icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="security-content">
                <h3>{vehicleData.approved ? 'Verification Complete' : 'Registration Pending'}</h3>
                <p>
                  This information is retrieved from the blockchain and represents the current verified status of the vehicle. 
                  All data is cryptographically secured and tamper-proof.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button
                onClick={() => window.print()}
                className="action-btn action-btn-outline"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Details
              </button>
              
              <button
                onClick={handleClear}
                className="action-btn action-btn-primary"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search Another Vehicle
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleVerificationPage;