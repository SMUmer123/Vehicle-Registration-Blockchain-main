import React from 'react';
import './Registration.css';

const ReviewSubmitStep = ({
  formData,
  errors,
  account,
  isLoading,
  otpVerified, // New prop
  handleManualRegister,
  handleGoogleSignUp,
  prevStep,
  goToStep
}) => {
  return (
    <div className="form-step">
      <div className="step-header">
        <h2>Review & Submit</h2>
        <p>Please review your information before submitting</p>
      </div>

      {/* Email Verification Status */}
      <div className="verification-status">
        <div className={`status-badge ${otpVerified ? 'verified' : 'pending'}`}>
          <span className="status-icon">
            {otpVerified ? '✓' : '⚠️'}
          </span>
          <span>
            Email {otpVerified ? 'Verified' : 'Not Verified'}
          </span>
        </div>
        {!otpVerified && (
          <button 
            type="button" 
            className="verify-email-btn"
            onClick={() => goToStep(5)}
          >
            Verify Email
          </button>
        )}
      </div>

      <div className="review-sections">
        {/* Basic Information */}
        <div className="review-section">
          <h3>Basic Information</h3>
          <div className="review-grid">
            <div className="review-item">
              <label>Email:</label>
              <span>{formData.email}</span>
              <button 
                type="button" 
                className="edit-btn"
                onClick={() => goToStep(1)}
              >
                Edit
              </button>
            </div>
            <div className="review-item">
              <label>Name:</label>
              <span>{formData.name}</span>
              <button 
                type="button" 
                className="edit-btn"
                onClick={() => goToStep(1)}
              >
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* CNIC Information */}
        <div className="review-section">
          <h3>CNIC Information</h3>
          <div className="review-grid">
            <div className="review-item">
              <label>CNIC:</label>
              <span>{formData.cnic}</span>
              <button 
                type="button" 
                className="edit-btn"
                onClick={() => goToStep(2)}
              >
                Edit
              </button>
            </div>
            <div className="review-item">
              <label>Issuance Date:</label>
              <span>{formData.cnicIssuanceDate}</span>
              <button 
                type="button" 
                className="edit-btn"
                onClick={() => goToStep(2)}
              >
                Edit
              </button>
            </div>
            <div className="review-item">
              <label>Expiry Date:</label>
              <span>{formData.cnicExpiryDate}</span>
              <button 
                type="button" 
                className="edit-btn"
                onClick={() => goToStep(2)}
              >
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="review-section">
          <h3>Contact Information</h3>
          <div className="review-grid">
            <div className="review-item">
              <label>Phone:</label>
              <span>{formData.phoneNumber}</span>
              <button 
                type="button" 
                className="edit-btn"
                onClick={() => goToStep(3)}
              >
                Edit
              </button>
            </div>
            <div className="review-item">
              <label>Address:</label>
              <span>{formData.address}</span>
              <button 
                type="button" 
                className="edit-btn"
                onClick={() => goToStep(3)}
              >
                Edit
              </button>
            </div>
            <div className="review-item">
              <label>City:</label>
              <span>{formData.city}</span>
              <button 
                type="button" 
                className="edit-btn"
                onClick={() => goToStep(3)}
              >
                Edit
              </button>
            </div>
            <div className="review-item">
              <label>Province:</label>
              <span>{formData.province}</span>
              <button 
                type="button" 
                className="edit-btn"
                onClick={() => goToStep(3)}
              >
                Edit
              </button>
            </div>
            <div className="review-item">
              <label>Postal Code:</label>
              <span>{formData.postalCode}</span>
              <button 
                type="button" 
                className="edit-btn"
                onClick={() => goToStep(3)}
              >
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="review-section">
          <h3>Additional Information</h3>
          <div className="review-grid">
            <div className="review-item">
              <label>Date of Birth:</label>
              <span>{formData.dateOfBirth}</span>
              <button 
                type="button" 
                className="edit-btn"
                onClick={() => goToStep(4)}
              >
                Edit
              </button>
            </div>
            <div className="review-item">
              <label>Gender:</label>
              <span>{formData.gender}</span>
              <button 
                type="button" 
                className="edit-btn"
                onClick={() => goToStep(4)}
              >
                Edit
              </button>
            </div>
            <div className="review-item">
              <label>Occupation:</label>
              <span>{formData.occupation}</span>
              <button 
                type="button" 
                className="edit-btn"
                onClick={() => goToStep(4)}
              >
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Wallet Information */}
        <div className="review-section">
          <h3>Wallet Information</h3>
          <div className="review-grid">
            <div className="review-item">
              <label>Connected Wallet:</label>
              <span>{account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Not Connected"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Warning if email not verified */}
      {!otpVerified && (
        <div className="warning-message">
          <p>⚠️ Please verify your email address before submitting the form.</p>
        </div>
      )}

      {/* Submit Buttons */}
      <div className="submit-section">
        <button
          type="button"
          className="manual-register-btn"
          onClick={handleManualRegister}
          disabled={isLoading || !account || !otpVerified}
        >
          {isLoading ? "Registering..." : "Submit Request"}
        </button>
      </div>

      <div className="form-navigation">
        <button type="button" className="prev-btn" onClick={prevStep}>
          Previous
        </button>
      </div>
    </div>
  );
};

export default ReviewSubmitStep;