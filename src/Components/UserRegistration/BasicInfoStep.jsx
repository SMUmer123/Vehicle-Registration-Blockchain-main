import React from "react";

// Validation functions
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email) ? null : "Please enter a valid email address";
};

const validatePassword = (password) => {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Password must contain at least one special character";
  return null;
};

const BasicInfoStep = ({ formData, updateFormData, errors, setErrors, nextStep }) => {
  // Handle input changes
  const handleChange = (e) => {
    const { id, value } = e.target;
    updateFormData({ [id]: value });
    
    // Validate on change
    if (id === "email") {
      setErrors(prev => ({ ...prev, email: validateEmail(value) }));
    } else if (id === "name") {
      setErrors(prev => ({ ...prev, name: value ? null : "Name is required" }));
    } else if (id === "password") {
      setErrors(prev => ({ 
        ...prev, 
        password: validatePassword(value),
        confirmPassword: value === formData.confirmPassword ? null : "Passwords do not match"
      }));
    } else if (id === "confirmPassword") {
      setErrors(prev => ({ 
        ...prev, 
        confirmPassword: value === formData.password ? null : "Passwords do not match" 
      }));
    }
  };
  
  // Validate the form
  const validateForm = () => {
    const newErrors = {
      email: validateEmail(formData.email),
      name: formData.name ? null : "Name is required",
      password: validatePassword(formData.password),
      confirmPassword: formData.password === formData.confirmPassword ? null : "Passwords do not match",
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
        <h2>Basic Information</h2>
        <p>Let's start with your basic details</p>
        
        <div className="input-field">
          <label htmlFor="email">Email Address*</label>
          <input
            id="email"
            type="email"
            className={errors.email ? 'error' : ''}
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>
        
        <div className="input-field">
          <label htmlFor="name">Full Name*</label>
          <input
            id="name"
            type="text"
            className={errors.name ? 'error' : ''}
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>
        
        <div className="input-field">
          <label htmlFor="password">Password*</label>
          <input
            id="password"
            type="password"
            className={errors.password ? 'error' : ''}
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          {errors.password && <span className="error-text">{errors.password}</span>}
        </div>
        
        <div className="input-field">
          <label htmlFor="confirmPassword">Confirm Password*</label>
          <input
            id="confirmPassword"
            type="password"
            className={errors.confirmPassword ? 'error' : ''}
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
        </div>
      </div>
      
      <div className="step-controls">
        <button type="submit" className="next-btn">Next Step</button>
      </div>
    </form>
  );
};

export default BasicInfoStep;