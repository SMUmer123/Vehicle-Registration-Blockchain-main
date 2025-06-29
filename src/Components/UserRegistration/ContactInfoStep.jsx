import React from "react";

// Validation functions
const validatePhone = (phone) => {
  // Phone format: +92-300-1234567 or 03001234567
  const re = /^(\+92|0)[0-9]{3}[0-9]{7}$/;
  return re.test(phone.replace(/-/g, "")) ? null : "Enter a valid Pakistan phone number";
};

const validatePostalCode = (code) => {
  const re = /^[0-9]{5}$/;
  return re.test(code) ? null : "Postal code must be 5 digits";
};

const ContactInfoStep = ({ formData, updateFormData, errors, setErrors, nextStep, prevStep }) => {
  // Format phone number
  const formatPhoneNumber = (e) => {
    let value = e.target.value.replace(/[^\d+]/g, ''); // Allow digits and +
    
    if (value.startsWith('+92')) {
      // Format as +92-XXX-XXXXXXX
      if (value.length <= 3) {
        updateFormData({ phoneNumber: value });
      } else if (value.length <= 6) {
        updateFormData({ phoneNumber: `${value.slice(0, 3)}-${value.slice(3)}` });
      } else {
        updateFormData({ phoneNumber: `${value.slice(0, 3)}-${value.slice(3, 6)}-${value.slice(6, 13)}` });
      }
    } else {
      // Format as 03XX-XXXXXXX
      if (value.length <= 4) {
        updateFormData({ phoneNumber: value });
      } else {
        updateFormData({ phoneNumber: `${value.slice(0, 4)}-${value.slice(4, 11)}` });
      }
    }
    
    // Validate on change
    setErrors(prev => ({ ...prev, phoneNumber: validatePhone(value) }));
  };
  
  // Handle input changes
  const handleChange = (e) => {
    const { id, value } = e.target;
    updateFormData({ [id]: value });
    
    // Validate on change
    if (id === "address") {
      setErrors(prev => ({ ...prev, address: value ? null : "Address is required" }));
    } else if (id === "city") {
      setErrors(prev => ({ ...prev, city: value ? null : "City is required" }));
    } else if (id === "province") {
      setErrors(prev => ({ ...prev, province: value ? null : "Province is required" }));
    } else if (id === "postalCode") {
      const cleanValue = value.replace(/[^\d]/g, '');
      updateFormData({ postalCode: cleanValue });
      setErrors(prev => ({ ...prev, postalCode: validatePostalCode(cleanValue) }));
    }
  };
  
  // Validate the form
  const validateForm = () => {
    const newErrors = {
      phoneNumber: validatePhone(formData.phoneNumber),
      address: formData.address ? null : "Address is required",
      city: formData.city ? null : "City is required",
      province: formData.province ? null : "Province is required",
      postalCode: validatePostalCode(formData.postalCode)
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
        <h2>Contact Information</h2>
        <p>Please provide your contact details</p>
        
        <div className="input-field">
          <label htmlFor="phoneNumber">Phone Number*</label>
          <input
            id="phoneNumber"
            type="text"
            className={errors.phoneNumber ? 'error' : ''}
            placeholder="+92-300-1234567 or 0300-1234567"
            value={formData.phoneNumber}
            onChange={formatPhoneNumber}
            maxLength="13"
            required
          />
          {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
        </div>
        
        <div className="input-field">
          <label htmlFor="address">Complete Address*</label>
          <textarea
            id="address"
            className={errors.address ? 'error' : ''}
            placeholder="Your complete address"
            value={formData.address}
            onChange={handleChange}
            required
            rows="2"
          />
          {errors.address && <span className="error-text">{errors.address}</span>}
        </div>
        
        <div className="input-group">
          <div className="input-field">
            <label htmlFor="city">City*</label>
            <input
              id="city"
              type="text"
              className={errors.city ? 'error' : ''}
              placeholder="City"
              value={formData.city}
              onChange={handleChange}
              required
            />
            {errors.city && <span className="error-text">{errors.city}</span>}
          </div>
          
          <div className="input-field">
            <label htmlFor="province">Province*</label>
            <select
              id="province"
              className={errors.province ? 'error' : ''}
              value={formData.province}
              onChange={handleChange}
              required
            >
              <option value="">Select Province</option>
              <option value="Punjab">Punjab</option>
              <option value="Sindh">Sindh</option>
              <option value="KPK">Khyber Pakhtunkhwa</option>
              <option value="Balochistan">Balochistan</option>
              <option value="GB">Gilgit-Baltistan</option>
              <option value="AJK">Azad Jammu & Kashmir</option>
              <option value="ICT">Islamabad Capital Territory</option>
            </select>
            {errors.province && <span className="error-text">{errors.province}</span>}
          </div>
        </div>
        
        <div className="input-field">
          <label htmlFor="postalCode">Postal Code*</label>
          <input
            id="postalCode"
            type="text"
            className={errors.postalCode ? 'error' : ''}
            placeholder="5-digit postal code"
            value={formData.postalCode}
            onChange={handleChange}
            maxLength="5"
            required
          />
          {errors.postalCode && <span className="error-text">{errors.postalCode}</span>}
        </div>
      </div>
      
      <div className="step-controls">
        <button type="button" className="prev-btn" onClick={prevStep}>Previous</button>
        <button type="submit" className="next-btn">Next Step</button>
      </div>
    </form>
  );
};

export default ContactInfoStep;