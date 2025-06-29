import React from 'react';
import './Registration.css';
import './EmailVerification.css';

const EmailVerificationStep = ({
  formData,
  otp,
  setOtp,
  otpSent,
  otpVerified,
  otpLoading,
  otpTimer,
  sendOTP,
  verifyOTP,
  resendOTP,
  nextStep,
  prevStep
}) => {
  // Format timer display
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && otp.length === 6) {
      verifyOTP();
    }
  };

  return (
    <div className="form-step">
      <div className="step-header">
        <h2>Email Verification</h2>
        <p>We need to verify your email address before proceeding</p>
      </div>

      <div className="verification-container">
        <div className="email-display">
          <p><strong>Email:</strong> {formData.email}</p>
        </div>

        {!otpSent ? (
          <div className="send-otp-section">
            <p>Click the button below to send a verification code to your email</p>
            <button 
              type="button" 
              className="send-otp-btn"
              onClick={sendOTP}
              disabled={otpLoading}
            >
              {otpLoading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </div>
        ) : (
          <div className="otp-input-section">
            <div className="otp-instructions">
              <p>Enter the 6-digit verification code sent to your email</p>
              {otpTimer > 0 && (
                <p className="timer-text">Code expires in: {formatTimer(otpTimer)}</p>
              )}
            </div>

            <div className="otp-input-container">
              <input
                type="text"
                value={otp}
                onChange={handleOtpChange}
                onKeyPress={handleKeyPress}
                placeholder="Enter 6-digit code"
                className="otp-input"
                maxLength={6}
                disabled={otpVerified}
              />
              
              {otpVerified && (
                <div className="verification-success">
                  <span className="success-icon">✓</span>
                  <span>Verified</span>
                </div>
              )}
            </div>

            <div className="otp-actions">
              <button 
                type="button" 
                className="verify-btn"
                onClick={verifyOTP}
                disabled={otp.length !== 6 || otpVerified}
              >
                Verify Code
              </button>

              <div className="resend-section">
                {otpTimer === 0 ? (
                  <button 
                    type="button" 
                    className="resend-btn"
                    onClick={resendOTP}
                  >
                    Resend Code
                  </button>
                ) : (
                  <p className="resend-timer">
                    Resend available in {formatTimer(otpTimer)}
                  </p>
                )}
              </div>
            </div>

            <div className="email-tips">
              <p><strong>Tips:</strong></p>
              <ul>
                <li>Check your spam/junk folder if you don't see the email</li>
                <li>Make sure {formData.email} is correct</li>
                <li>The code is valid for 5 minutes</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="form-navigation">
        <button type="button" className="prev-btn" onClick={prevStep}>
          Previous
        </button>
        
        {otpVerified && (
          <button type="button" className="next-btn" onClick={nextStep}>
            Continue
          </button>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationStep;