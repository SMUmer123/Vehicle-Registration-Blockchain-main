import React, { useState, useEffect } from "react";
import CryptoJS from "crypto-js";
import Web3 from "web3";
import emailjs from 'emailjs-com';
import { contractABI, contractAddress } from "../../config";
import { ToastContainer, toast } from "react-toastify";
import {
  auth,
  provider,
  signInWithPopup,
  db
} from "../../Firebase/config";
import { doc, setDoc, getDocs, collection, query, where } from "firebase/firestore";
import "react-toastify/dist/ReactToastify.css";
import "./Registration.css"

// Import step components
import BasicInfoStep from "./BasicInfoStep";
import CnicInfoStep from "./CnicInfoStep";
import ContactInfoStep from "./ContactInfoStep";
import AdditionalInfoStep from "./AdditionalInfoStep";
import NadraVerificationStep from "./NadraVerificationStep"; // New component
import EmailVerificationStep from "./EmailVerificationStep";
import ReviewSubmitStep from "./ReviewSubmitStep";

const UserRegistration = () => {
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7; // Increased to 7 to include NADRA verification
  
  // Form data state
  const [formData, setFormData] = useState({
    // Basic Info
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
    
    // CNIC Related Info
    cnic: "",
    cnicIssuanceDate: "",
    cnicExpiryDate: "",
    
    // Contact Info
    phoneNumber: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    
    // Additional Bio Info
    dateOfBirth: "",
    gender: "",
    occupation: "",
  });
  
  // Form validation
  const [errors, setErrors] = useState({});
  
  // Web3 related states
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // NADRA verification state
  const [nadraVerified, setNadraVerified] = useState(false);

  // Email OTP verification states
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Toast helper
  const notify = (msg, type = "info") => {
    toast[type](msg, {
      position: "top-center",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      theme: "dark",
    });
  };

  useEffect(() => {
    let isMounted = true;

    const initBlockchain = async () => {
      try {
        if (!window.ethereum) {
          notify("⚠️ Please install MetaMask", "error");
          return;
        }

        const web3Instance = new Web3(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const accounts = await web3Instance.eth.getAccounts();

        if (isMounted) {
          setWeb3(web3Instance);
          setAccount(accounts[0]);
          const contractInstance = new web3Instance.eth.Contract(contractABI, contractAddress);
          setContract(contractInstance);
        }
      } catch (error) {
        console.error("Blockchain initialization error:", error);
        notify("❌ Failed to connect to MetaMask", "error");
      }
    };

    initBlockchain();

    return () => {
      isMounted = false;
    };
  }, []);

  // OTP Timer effect
  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(otpTimer - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Generate 6-digit OTP
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Send OTP to email
  const sendOTP = async () => {
    if (!formData.email) {
      notify("⚠️ Please enter email address first", "warning");
      return;
    }

    setOtpLoading(true);
    
    try {
      // Check if email already exists
      const emailExists = await isEmailRegistered(formData.email);
      if (emailExists) {
        notify("⚠️ Email already registered!", "warning");
        setOtpLoading(false);
        return;
      }

      const newOtp = generateOTP();
      setGeneratedOtp(newOtp);
      
      // Here you would integrate with your email service (e.g., EmailJS, Firebase Functions, etc.)
      // For demonstration, I'll show the structure
      
      // Example with EmailJS (you need to install and configure emailjs-com)
      
      await emailjs.send(
        process.env.REACT_APP_SERVICE_ID,
        process.env.REACT_APP_TEMPLETE_ID,
        {
          email: formData.email,
         passcode: newOtp,
        },
        process.env.REACT_APP_PUBLIC_KEY
      );
      
      
     
      
      setOtpSent(true);
      setOtpTimer(300); // 5 minutes timer
      notify("✅ OTP sent to your email!", "success");
      
    } catch (error) {
      console.error("Error sending OTP:", error);
      notify("❌ Failed to send OTP. Please try again.", "error");
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP
  const verifyOTP = () => {
    if (!otp) {
      notify("⚠️ Please enter OTP", "warning");
      return;
    }

    if (otp === generatedOtp) {
      setOtpVerified(true);
      notify("✅ Email verified successfully!", "success");
      nextStep(); // Move to final step
    } else {
      notify("❌ Invalid OTP. Please try again.", "error");
      setOtp("");
    }
  };

  // Resend OTP
  const resendOTP = async () => {
    if (otpTimer > 0) {
      notify(`⏱️ Please wait ${otpTimer} seconds before resending`, "warning");
      return;
    }
    
    setOtp("");
    setOtpSent(false);
    setOtpVerified(false);
    await sendOTP();
  };

  // Update form data
  const updateFormData = (newData) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  // Navigation functions
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const goToStep = (step) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
      window.scrollTo(0, 0);
    }
  };
  
  const isEmailRegistered = async (email) => {
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  // Manual registration
  const handleManualRegister = async () => {
    if (!otpVerified) {
      notify("⚠️ Please verify your email first", "warning");
      return;
    }

    if (!nadraVerified) {
      notify("⚠️ Please verify NADRA details first", "warning");
      return;
    }

    if (!contract || !account) {
      notify("⛔ Web3 not initialized", "error");
      return;
    }

    setIsLoading(true);

    try {
      const isRegistered = await contract.methods.isRegistered(account).call();
      if (isRegistered) {
        notify("⚠️ MetaMask address already registered!", "warning");
        setIsLoading(false);
        return;
      }

      // Register on blockchain
      await contract.methods
         .registerUser(formData.email, formData.name, formData.cnic, CryptoJS.SHA256(formData.password).toString())
         .send({ from: account });

      // Store extended data in Firebase
      await setDoc(doc(db, "users", account), {
        // Basic info
        email: formData.email,
        name: formData.name,
        wallet: account,
        approved: false,
        emailVerified: true, // Mark email as verified
        
        // CNIC info
        cnic: formData.cnic,
        cnicIssuanceDate: formData.cnicIssuanceDate,
        cnicExpiryDate: formData.cnicExpiryDate,
        
        // Contact info
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        city: formData.city,
        province: formData.province,
        postalCode: formData.postalCode,
        
        // Bio info
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        occupation: formData.occupation,
        
        // Timestamps
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      notify("✅ Registration successful! Awaiting approval.", "success");
      setTimeout(() => (window.location.href = "/"), 1500);
    } catch (err) {
      console.error(err);
      notify("❌ Registration failed: " + (err.message || "Unknown error"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Google registration
  const handleGoogleSignUp = async () => {
    if (!otpVerified) {
      notify("⚠️ Please verify your email first", "warning");
      return;
    }

    if (!nadraVerified) {
      notify("⚠️ Please verify NADRA details first", "warning");
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!account || !contract) {
        notify("⚠️ Connect MetaMask first", "warning");
        setIsLoading(false);
        return;
      }

      const isRegistered = await contract.methods.isRegistered(account).call();
      if (isRegistered) {
        notify("⚠️ MetaMask address already registered!", "warning");
        setIsLoading(false);
        return;
      }

      // Register on blockchain (minimal data)
      await contract.methods
        .registerUser(user.email, formData.name || user.displayName || "Google User", formData.password, formData.cnic)
        .send({ from: account });

      // Store extended data in Firebase
      await setDoc(doc(db, "users", account), {
        // Basic info - from Google Auth
        email: user.email,
        name: formData.name || user.displayName || "Google User",
        wallet: account,
        approved: false,
        emailVerified: true, // Mark email as verified
        
        // CNIC info
        cnic: formData.cnic,
        cnicIssuanceDate: formData.cnicIssuanceDate,
        cnicExpiryDate: formData.cnicExpiryDate,
        
        // Contact info
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        city: formData.city,
        province: formData.province,
        postalCode: formData.postalCode,
        
        // Bio info
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        occupation: formData.occupation,
        
        // Auth method
        authMethod: "google",
        
        // Timestamps
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      notify("✅ Google Registration successful! Awaiting approval.", "success");
      setTimeout(() => (window.location.href = "/"), 1500);
    } catch (err) {
      console.error(err);
      notify("❌ Google Signup failed: " + (err.message || "Unknown error"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep 
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
            setErrors={setErrors}
            nextStep={nextStep}
          />
        );
      case 2:
        return (
          <CnicInfoStep 
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
            setErrors={setErrors}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 3:
        return (
          <ContactInfoStep 
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
            setErrors={setErrors}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 4:
        return (
          <AdditionalInfoStep 
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
            setErrors={setErrors}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 5:
        return (
          <NadraVerificationStep 
            formData={formData}
            nadraVerified={nadraVerified}
            setNadraVerified={setNadraVerified}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 6:
        return (
          <EmailVerificationStep 
            formData={formData}
            otp={otp}
            setOtp={setOtp}
            otpSent={otpSent}
            otpVerified={otpVerified}
            otpLoading={otpLoading}
            otpTimer={otpTimer}
            sendOTP={sendOTP}
            verifyOTP={verifyOTP}
            resendOTP={resendOTP}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 7:
        return (
          <ReviewSubmitStep 
            formData={formData}
            errors={errors}
            account={account}
            isLoading={isLoading}
            otpVerified={otpVerified}
            nadraVerified={nadraVerified} // Added prop
            handleManualRegister={handleManualRegister}
            handleGoogleSignUp={handleGoogleSignUp}
            prevStep={prevStep}
            goToStep={goToStep}
          />
        );
      default:
        return null;
    }
  };

  return (

    <div className="registration-main">
   
      <ToastContainer />
      <div className="registration-card">
        <div className="registration-form-section">
          <div className="form-header">
            <h1>Register</h1>
            <div className="progress-bar">
              <div className="progress-steps">
                {[...Array(totalSteps)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`step ${i + 1 <= currentStep ? 'active' : ''}`}
                    onClick={() => i + 1 < currentStep && goToStep(i + 1)}
                  >
                    <span>{i + 1}</span>
                  </div>
                ))}
              </div>
              <div className="progress-line">
                <div className="progress" style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}></div>
              </div>
            </div>
            {account && (
              <div className="wallet-badge">
                <span>Wallet: {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Not Connected"}</span>
              </div>
            )}
          </div>
          
          {renderStep()}
        </div>

        <div className="registration-sidebar">
          <div className="sidebar-content">
            <p>Already have an account?</p>
            <button
              className="sign-in-btn"
              onClick={() => (window.location.href = "/login")}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  
  );
};

export default UserRegistration;