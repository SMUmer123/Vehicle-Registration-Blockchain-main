// src/components/NadraVerificationStep.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Papa from 'papaparse';
import nadraCsvFile from '../UserRegistration/data.csv'; // Your actual CSV file
import './Registration.css';




const NadraVerificationStep = ({
  formData,
  nadraVerified,
  setNadraVerified,
  nextStep,
  prevStep
}) => {
  const [verifying, setVerifying] = useState(false);
  const [nadraDatabase, setNadraDatabase] = useState({}); // Will hold CNIC → data
  
const [feedback, setFeedback] = useState(null); // null | 'success' | 'error'
  // Load and parse CSV only once when component mounts
  useEffect(() => {
    fetch(nadraCsvFile)
      .then(response => response.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          complete: (result) => {
            const db = {};
            result.data.forEach(row => {
              // Adjust these column names to match your CSV exactly!
              const cnic = row['CNIC'] || row['cnic'] || row['Cnic'] || row['NIC'];
              if (cnic) {
                db[cnic.trim()] = {
                  name: (row['Name'] || row['name'] || '').trim(),
                  dateOfBirth: row['Date of Birth'] || row['DOB'] || row['dob'] || '',
                  cnicIssuanceDate: row['Issuance Date'] || row['Issue Date'] || row['issuance_date'] || '',
                  cnicExpiryDate: row['Expiry Date'] || row['expiry_date'] || ''
                };
              }
            });
            setNadraDatabase(db);
           
          },
          error: (error) => {
            console.error("CSV parse error:", error);
            toast.error("Failed to load NADRA data");
          }
        });
      })
      .catch(err => {
        console.error("Failed to fetch CSV:", err);
        toast.error("Could not load NADRA database");
      });
  }, []);

  const verifyWithNadra = async () => {
  setVerifying(true);
  await new Promise(r => setTimeout(r, 1500));

  const record = nadraDatabase[formData.cnic?.trim()];

  if (!record) {
    setFeedback('error');
    setVerifying(false);
    return;
  }

  const isMatch =
    record.name.toLowerCase() === formData.name.trim().toLowerCase() &&
    record.dateOfBirth === formData.dateOfBirth &&
    record.cnicIssuanceDate === formData.cnicIssuanceDate &&
    record.cnicExpiryDate === formData.cnicExpiryDate;

  if (isMatch) {
    setNadraVerified(true);
    setFeedback('success');
  } else {
    setFeedback('error');
  }

  setVerifying(false);
};

  return (
    <div className="form-step">
      
      <div className="step-header">
        <h2>NADRA Identity Verification</h2>
        <p>Verifying your details against official NADRA records</p>
      </div>

      <div className="verification-container">
        <div className="details-display">
          <h3>Your Submitted Information</h3>
          <div className="review-grid">
            <div className="review-item"><label>Full Name:</label><span>{formData.name}</span></div>
            <div className="review-item"><label>CNIC:</label><span>{formData.cnic}</span></div>
            <div className="review-item"><label>Date of Birth:</label><span>{formData.dateOfBirth || '—'}</span></div>
            <div className="review-item"><label>Issuance Date:</label><span>{formData.cnicIssuanceDate || '—'}</span></div>
            <div className="review-item"><label>Expiry Date:</label><span>{formData.cnicExpiryDate || '—'}</span></div>
          </div>
        </div>

        {!nadraVerified ? (
          <div className="verify-section" style={{ textAlign: 'center', margin: '2rem 0' }}>
            <button
              type="button"
              className="verify-btn"
              onClick={verifyWithNadra}
              disabled={verifying || Object.keys(nadraDatabase).length === 0}
              style={{ padding: '12px 32px', fontSize: '1.1rem' }}
            >
              {verifying ? 'Verifying with NADRA...' : 'Verify Identity with NADRA'}
            </button>
            {Object.keys(nadraDatabase).length === 0 && (
              <p style={{ marginTop: '1rem', color: '#999' }}>Loading NADRA database...</p>
            )}
          </div>
        ) : (
          <div className="verification-success">
            
          </div>
        )}
      </div>

      <div className="form-navigation">
        <button type="button" className="prev-btn" onClick={prevStep}>
          Previous
        </button>

        {nadraVerified && (
          <button type="button" className="next-btn" onClick={nextStep}>
            Continue to Email Verification
          </button>
        )}
      </div>
      {feedback && (
  <div className="verification-feedback-overlay" onClick={() => setFeedback(null)}>
    <div className={`verification-feedback-card ${feedback}`} onClick={e => e.stopPropagation()}>
      <div className="verification-feedback-icon">
        {feedback === 'success' ? 'Success' : 'Error'}
      </div>
      <h3>{feedback === 'success' ? 'NADRA Verified!' : 'Verification Failed'}</h3>
      <p>
        {feedback === 'success'
          ? 'Your identity has been successfully verified with NADRA Pakistan.'
          : 'The information you provided does not match NADRA records.'}
      </p>
      <button className="close-feedback-btn" onClick={() => {
        setFeedback(null);
        if (feedback === 'success') nextStep(); // Auto proceed on success
      }}>
        {feedback === 'success' ? 'Continue' : 'Try Again'}
      </button>
    </div>
  </div>
)}
    </div>
    
  );
};

export default NadraVerificationStep;