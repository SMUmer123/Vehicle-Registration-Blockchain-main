import React from "react";

// Validation function
const validateCnic = (cnic) => {
  // CNIC format: 12345-1234567-1
  const re = /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/;
  return re.test(cnic) ? null : "CNIC must be in format: 12345-1234567-1";
};

const validateDates = (issuanceDate, expiryDate) => {
  if (issuanceDate && expiryDate && new Date(expiryDate) <= new Date(issuanceDate)) {
    return "Expiry date must be after issuance date";
  }
  return null;
};

const CnicInfoStep = ({ formData, updateFormData, errors, setErrors, nextStep, prevStep }) => {
  // Format CNIC input
  const formatCNIC = (e) => {
    let value = e.target.value.replace(/[^\d]/g, ''); // Remove non-digit characters
    
    // Format as 12345-1234567-1
    if (value.length <= 5) {
      updateFormData({ cnic: value });
    } else if (value.length <= 12) {
      updateFormData({ cnic: `${value.slice(0, 5)}-${value.slice(5)}` });
    } else if (value.length <= 13) {
      updateFormData({ cnic: `${value.slice(0, 5)}-${value.slice(5, 12)}-${value.slice(12)}` });
    }
    
    // Validate on change
    setErrors(prev => ({ ...prev, cnic: validateCnic(`${value.slice(0, 5)}-${value.slice(5, 12)}-${value.slice(12)}`) }));
  };
  
  // Handle date inputs
  const handleDateChange = (e) => {
    const { id, value } = e.target;
    updateFormData({ [id]: value });
    
    // Validate on change
    if (id === "cnicIssuanceDate") {
      setErrors(prev => ({
        ...prev,
        cnicIssuanceDate: value ? null : "Issuance date is required",
        dateValidation: value && formData.cnicExpiryDate ? 
          validateDates(value, formData.cnicExpiryDate) : prev.dateValidation
      }));
    } else if (id === "cnicExpiryDate") {
      setErrors(prev => ({
        ...prev,
        cnicExpiryDate: value ? null : "Expiry date is required",
        dateValidation: formData.cnicIssuanceDate && value ? 
          validateDates(formData.cnicIssuanceDate, value) : prev.dateValidation
      }));
    }
  };
  
  // Validate the form
  const validateForm = () => {
    const newErrors = {
      cnic: validateCnic(formData.cnic),
      cnicIssuanceDate: formData.cnicIssuanceDate ? null : "Issuance date is required",
      cnicExpiryDate: formData.cnicExpiryDate ? null : "Expiry date is required",
      dateValidation: validateDates(formData.cnicIssuanceDate, formData.cnicExpiryDate)
    };
    
    setErrors(prev => ({ ...prev, ...newErrors }));
    
    return !Object.values(newErrors).some(error => error !== null);
  };
  
  // Handle next step
  const handleNext = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      nextStep();
    }
  };

  return (
    <form onSubmit={handleNext}>
      <div className="step-content">
        <h2>CNIC Information</h2>
        <p>Please provide your Computerized National ID Card details</p>
        
        <div className="input-field">
          <label htmlFor="cnic">CNIC Number*</label>
          <input
            id="cnic"
            type="text"
            className={errors.cnic ? 'error' : ''}
            placeholder="12345-1234567-1"
            value={formData.cnic}
            onChange={formatCNIC}
            maxLength="15"
            required
          />
          {errors.cnic && <span className="error-text">{errors.cnic}</span>}
        </div>
        
        <div className="input-group">
          <div className="input-field">
            <label htmlFor="cnicIssuanceDate">Date of Issuance*</label>
            <input
              id="cnicIssuanceDate"
              type="date"
              className={errors.cnicIssuanceDate ? 'error' : ''}
              value={formData.cnicIssuanceDate}
              onChange={handleDateChange}
              required
            />
            {errors.cnicIssuanceDate && <span className="error-text">{errors.cnicIssuanceDate}</span>}
          </div>
          
          <div className="input-field">
            <label htmlFor="cnicExpiryDate">Date of Expiry*</label>
            <input
              id="cnicExpiryDate"
              type="date"
              className={errors.cnicExpiryDate || errors.dateValidation ? 'error' : ''}
              value={formData.cnicExpiryDate}
              onChange={handleDateChange}
              required
            />
            {errors.cnicExpiryDate && <span className="error-text">{errors.cnicExpiryDate}</span>}
            {errors.dateValidation && <span className="error-text">{errors.dateValidation}</span>}
          </div>
        </div>
      </div>
      
      <div className="step-controls">
        <button type="button" className="prev-btn" onClick={prevStep}>Previous</button>
        <button type="submit" className="next-btn">Next Step</button>
      </div>
    </form>
  );
};

export default CnicInfoStep;