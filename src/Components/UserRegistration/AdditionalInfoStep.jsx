import React from "react";

const AdditionalInfoStep = ({ formData, updateFormData, errors, setErrors, nextStep, prevStep }) => {
  // Handle input changes
  const handleChange = (e) => {
    const { id, value } = e.target;
    updateFormData({ [id]: value });
    
    // Validate on change
    if (id === "dateOfBirth") {
      setErrors(prev => ({ ...prev, dateOfBirth: value ? null : "Date of birth is required" }));
    } else if (id === "gender") {
      setErrors(prev => ({ ...prev, gender: value ? null : "Gender is required" }));
    }
  };
  
  // Validate the form
  const validateForm = () => {
    const newErrors = {
      dateOfBirth: formData.dateOfBirth ? null : "Date of birth is required",
      gender: formData.gender ? null : "Gender is required",
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
        <h2>Additional Information</h2>
        <p>Almost done! Just a few more details about you</p>
        
        <div className="input-group">
          <div className="input-field">
            <label htmlFor="dateOfBirth">Date of Birth*</label>
            <input
              id="dateOfBirth"
              type="date"
              className={errors.dateOfBirth ? 'error' : ''}
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
            />
            {errors.dateOfBirth && <span className="error-text">{errors.dateOfBirth}</span>}
          </div>
          
          <div className="input-field">
            <label htmlFor="gender">Gender*</label>
            <select
              id="gender"
              className={errors.gender ? 'error' : ''}
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
            {errors.gender && <span className="error-text">{errors.gender}</span>}
          </div>
        </div>
        
        <div className="input-field">
          <label htmlFor="occupation">Occupation</label>
          <input
            id="occupation"
            type="text"
            placeholder="Your occupation"
            value={formData.occupation}
            onChange={handleChange}
          />
        </div>
      </div>
      
      <div className="step-controls">
        <button type="button" className="prev-btn" onClick={prevStep}>Previous</button>
        <button type="submit" className="next-btn">Next Step</button>
      </div>
    </form>
  );
};

export default AdditionalInfoStep;