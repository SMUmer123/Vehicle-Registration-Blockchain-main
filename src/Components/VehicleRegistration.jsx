import React, { useState, useRef, useEffect } from "react";
import Web3 from "web3";
import { contractABI, contractAddress } from "../config";
import Navbar from "./Navbar";
// Import Firebase
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { db } from "../Firebase/config";
import "./VehicleRegistration.css"

const PINATA_SECRET_JWT = process.env.REACT_APP_PINATA_SECRET_JWT;

const VehicleRegistration = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentWallet, setCurrentWallet] = useState("");
  const [contractInstance, setContractInstance] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  const [username, setUsername] = useState(
    window.localStorage.getItem("username") || ""
  );
  const [registrationType, setRegistrationType] = useState(""); // "new" or "old"
const [isGeneratingVehicleNo, setIsGeneratingVehicleNo] = useState(false);
  const [vehicleNo, setVehicleNo] = useState("");
  const [vehicleEngineNo, setVehicleEngineNo] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleModelYear, setVehicleModelYear] = useState("");
  const [vehicleRegistrationYear, setVehicleRegistrationYear] = useState("");
  
  // New fields
  const [bodyType, setBodyType] = useState("");
  const [seatingCapacity, setSeatingCapacity] = useState("");
  const [cplcSafeCustody, setCplcSafeCustody] = useState("No");
  const [horsePower, setHorsePower] = useState("");
  
  const [document, setDocument] = useState(null);
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const inputFile = useRef(null);
  const inputImage = useRef(null);
  const [registrationStatus, setRegistrationStatus] = useState("");
  const [registrationProgress, setRegistrationProgress] = useState(0);
  
  // Validation states
  const [isCheckingVehicleNo, setIsCheckingVehicleNo] = useState(false);
  const [isCheckingEngineNo, setIsCheckingEngineNo] = useState(false);
  const [vehicleNoExists, setVehicleNoExists] = useState(false);
  const [engineNoExists, setEngineNoExists] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const pinataGateway = "https://gateway.pinata.cloud/ipfs/";

  // Get current wallet and initialize contract on component mount
  useEffect(() => {
    const initWallet = async () => {
      try {
        if (window.ethereum) {
          const web3 = new Web3(window.ethereum);
          const accounts = await web3.eth.getAccounts();
          if (accounts.length > 0) {
            setCurrentWallet(accounts[0]);
          } else {
            console.error("No accounts found");
          }
          
          // Initialize contract instance
          const contract = new web3.eth.Contract(contractABI, contractAddress);
          setContractInstance(contract);
        } else {
          console.error("MetaMask not detected");
        }
      } catch (error) {
        console.error("Error initializing wallet:", error);
      }
    };
    
    initWallet();
  }, []);

  // Check if vehicle number exists when it changes
  useEffect(() => {
    const checkVehicleNoExists = async () => {
      if (!vehicleNo || vehicleNo.trim() === '' || !contractInstance) return;
      
      try {
        setIsCheckingVehicleNo(true);
        // This assumes your contract has a method to check if a vehicle number exists
        const exists = await contractInstance.methods.vehicleExists(vehicleNo).call();
        setVehicleNoExists(exists);
        setIsCheckingVehicleNo(false);
      } catch (error) {
        console.error("Error checking vehicle number:", error);
        setIsCheckingVehicleNo(false);
      }
    };

    // Debounce the check to avoid too many blockchain calls
    const timer = setTimeout(checkVehicleNoExists, 500);
    return () => clearTimeout(timer);
  }, [vehicleNo, contractInstance]);

  // Check if engine number exists when it changes
  useEffect(() => {
    const checkEngineNoExists = async () => {
      if (!vehicleEngineNo || vehicleEngineNo.trim() === '' || !contractInstance) return;
      
      try {
        setIsCheckingEngineNo(true);
        // This assumes your contract has a method to check if an engine number exists
        const exists = await contractInstance.methods.vinExist(vehicleEngineNo).call();
        setEngineNoExists(exists);
        setIsCheckingEngineNo(false);
      } catch (error) {
        console.error("Error checking engine number:", error);
        setIsCheckingEngineNo(false);
      }
    };

    // Debounce the check to avoid too many blockchain calls
    const timer = setTimeout(checkEngineNoExists, 500);
    return () => clearTimeout(timer);
  }, [vehicleEngineNo, contractInstance]);

  // Handle file changes
  const handleDocumentChange = (e) => {
    if (e.target.files[0]) {
      setDocument(e.target.files[0]);
      setDocumentPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const uploadToPinata = async (file, name_) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const metadata = JSON.stringify({
        name: name_,
      });
      formData.append("pinataMetadata", metadata);

      const options = JSON.stringify({
        cidVersion: 0,
      });
      formData.append("pinataOptions", options);

      const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PINATA_SECRET_JWT}`,
        },
        body: formData,
      });

      const data = await response.json();
      setUploading(false);
      return data.IpfsHash;
    } catch (error) {
      console.error("Error uploading file to Pinata:", error);
      setUploading(false);
      return null;
    }
  };
const generateVehicleNumber = async () => {
  try {
    setIsGeneratingVehicleNo(true);
    
    // Query Firebase to get count of vehicles with XAA prefix
    const { collection, query, where, getDocs, orderBy, limit } = await import('firebase/firestore');
    const vehiclesRef = collection(db, "vehicles");
    const q = query(
      vehiclesRef, 
      where("vehicleNo", ">=", "XAA-000"),
      where("vehicleNo", "<=", "XAA-999"),
      orderBy("vehicleNo", "desc"),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    let nextNumber = 1;
    
    if (!querySnapshot.empty) {
      const lastVehicle = querySnapshot.docs[0].data();
      const lastNumber = parseInt(lastVehicle.vehicleNo.split('-')[1]);
      nextNumber = lastNumber + 1;
    }
    
    const generatedVehicleNo = `XAA-${nextNumber.toString().padStart(3, '0')}`;
    setVehicleNo(generatedVehicleNo);
    
    // Auto-set registration year to current year for new vehicles
    const currentYear = new Date().getFullYear().toString();
    setVehicleRegistrationYear(currentYear);
    
    setIsGeneratingVehicleNo(false);
  } catch (error) {
    console.error("Error generating vehicle number:", error);
    setIsGeneratingVehicleNo(false);
  }
};
  // Save vehicle data to Firebase
  const saveVehicleToFirebase = async (vehicleData) => {
    try {
      const vehicleRef = doc(db, "vehicles", vehicleData.vehicleNo);
      await setDoc(vehicleRef, {
        ...vehicleData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error("Error saving vehicle to Firebase:", error);
      return false;
    }
  };

  const validateVehicleNumber = (vehicleNo) => {
  // Pattern: Letters followed by hyphen followed by numbers (e.g., ABC-123, XYZ-4567)
  const vehicleNoPattern = /^[A-Z]+\-[0-9]+$/;
  return vehicleNoPattern.test(vehicleNo);
};

const validateNumericField = (value) => {
  // Check if value contains only numbers
  const numericPattern = /^[0-9]+$/;
  return numericPattern.test(value);
};

const validateModelYear = (year) => {
  const currentYear = new Date().getFullYear();
  const yearNum = parseInt(year);
  // Model year should be between 1900 and current year + 1
  return validateNumericField(year) && yearNum >= 1900 && yearNum < currentYear + 1;
};

const validateRegistrationYear = (year) => {
  const currentYear = new Date().getFullYear();
  const yearNum = parseInt(year);
  // Registration year should be between 1900 and current year
  return validateNumericField(year) && yearNum >= 1900 && yearNum <= currentYear;
};

const validateHorsePower = (horsePower) => {
  // Remove 'HP' suffix if present and check if remaining is numeric
  const cleanValue = horsePower.replace(/HP$/i, '').trim();
  return validateNumericField(cleanValue) && parseInt(cleanValue) > 0;
};

 const validateStep = (step) => {
  const errors = {};
  
  if (step === 0) {
    if (!vehicleNo) {
      errors.vehicleNo = "Vehicle number is required";
    } else if (!validateVehicleNumber(vehicleNo)) {
      errors.vehicleNo = "Vehicle number must be in format: Letters-Numbers (e.g., ABC-123)";
    }
    
    if (!vehicleEngineNo) errors.vehicleEngineNo = "Engine number is required";
     if (!vehicleMake) {
      errors.vehicleMake = "Make is required";
    } else if (!validateAlphabetsOnly(vehicleMake)) {
      errors.vehicleMake = "Make must contain only letters and spaces";
    }
    
    if (!vehicleModel) {
      errors.vehicleModel = "Model is required";
    } else if (!validateAlphabetsOnly(vehicleModel)) {
      errors.vehicleModel = "Model must contain only letters and spaces";
    }
  } else if (step === 1) {
    if (!vehicleModelYear) {
      errors.vehicleModelYear = "Model year is required";
    } else if (!validateModelYear(vehicleModelYear)) {
      errors.vehicleModelYear = "Model year must be a valid year (numbers only, 1900-" + (new Date().getFullYear() + 1) + ")";
    }
    
    if (!vehicleRegistrationYear) {
      errors.vehicleRegistrationYear = "Registration year is required";
    } else if (!validateRegistrationYear(vehicleRegistrationYear)) {
      errors.vehicleRegistrationYear = "Registration year must be a valid year (numbers only, 1900-" + new Date().getFullYear() + ")";
    }
    
    if (!bodyType) errors.bodyType = "Body type is required";
    if (!seatingCapacity) errors.seatingCapacity = "Seating capacity is required";
    
    if (!horsePower) {
      errors.horsePower = "Horse power is required";
    } else if (!validateHorsePower(horsePower)) {
      errors.horsePower = "Horse power must be a number (e.g., 150 or 150HP)";
    }
  } else if (step === 2) {
    if (!document) errors.document = "Document is required";
    if (!image) errors.image = "Vehicle image is required";
  }
  
  setFormErrors(errors);
  return Object.keys(errors).length === 0;
};
const handleVehicleNoChange = (e) => {
  const value = e.target.value.toUpperCase();
  setVehicleNo(value);
  
  // Real-time validation feedback
  if (value && !validateVehicleNumber(value)) {
    setFormErrors(prev => ({
      ...prev,
      vehicleNo: "Format should be: Letters-Numbers (e.g., ABC-123)"
    }));
  } else {
    setFormErrors(prev => {
      const newErrors = {...prev};
      delete newErrors.vehicleNo;
      return newErrors;
    });
  }
};

const handleModelYearChange = (e) => {
  const value = e.target.value;
  setVehicleModelYear(value);
  
  // Real-time validation feedback
  if (value && !validateModelYear(value)) {
    setFormErrors(prev => ({
      ...prev,
      vehicleModelYear: "Must be a valid year (numbers only)"
    }));
  } else {
    setFormErrors(prev => {
      const newErrors = {...prev};
      delete newErrors.vehicleModelYear;
      return newErrors;
    });
  }
};

const handleRegistrationYearChange = (e) => {
  const value = e.target.value;
  setVehicleRegistrationYear(value);
  
  // Real-time validation feedback
  if (value && !validateRegistrationYear(value)) {
    setFormErrors(prev => ({
      ...prev,
      vehicleRegistrationYear: "Must be a valid year (numbers only)"
    }));
  } else {
    setFormErrors(prev => {
      const newErrors = {...prev};
      delete newErrors.vehicleRegistrationYear;
      return newErrors;
    });
  }
};

const handleHorsePowerChange = (e) => {
  const value = e.target.value;
  setHorsePower(value);
  
  // Real-time validation feedback
  if (value && !validateHorsePower(value)) {
    setFormErrors(prev => ({
      ...prev,
      horsePower: "Must be a number (e.g., 150 or 150HP)"
    }));
  } else {
    setFormErrors(prev => {
      const newErrors = {...prev};
      delete newErrors.horsePower;
      return newErrors;
    });
  }
};
const handleMakeChange = (e) => {
  const value = e.target.value;
  setVehicleMake(value);
  
  // Real-time validation feedback
  if (value && !validateAlphabetsOnly(value)) {
    setFormErrors(prev => ({
      ...prev,
      vehicleMake: "Make must contain only letters and spaces"
    }));
  } else {
    setFormErrors(prev => {
      const newErrors = {...prev};
      delete newErrors.vehicleMake;
      return newErrors;
    });
  }
};

const handleModelChange = (e) => {
  const value = e.target.value;
  setVehicleModel(value);
  
  // Real-time validation feedback
  if (value && !validateAlphabetsOnly(value)) {
    setFormErrors(prev => ({
      ...prev,
      vehicleModel: "Model must contain only letters and spaces"
    }));
  } else {
    setFormErrors(prev => {
      const newErrors = {...prev};
      delete newErrors.vehicleModel;
      return newErrors;
    });
  }
};
const validateAlphabetsOnly = (value) => {
  // Pattern: Only letters and spaces allowed
  const alphabetPattern = /^[A-Za-z\s]+$/;
  return alphabetPattern.test(value);
};
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    // Validate all steps
    let isValid = true;
    for (let i = 0; i <= 2; i++) {
      if (!validateStep(i)) {
        isValid = false;
        setActiveStep(i);
        break;
      }
    }
    
    if (!isValid) return;
    
    // First check for duplicates
    if (vehicleNoExists) {
      alert("❌ This vehicle number is already registered. Please use a different number.");
      setActiveStep(0);
      return;
    }
    
    if (engineNoExists) {
      alert("❌ This engine number is already registered. Please check and try again.");
      setActiveStep(0);
      return;
    }
    
    setIsRegistering(true);
    setRegistrationStatus("Preparing registration...");
    setRegistrationProgress(10);
    
    try {
      const web3 = new Web3(Web3.givenProvider || "http://127.0.0.1:7545");
      const registrationContract = new web3.eth.Contract(contractABI, contractAddress);
      const accounts = await web3.eth.getAccounts();
      const currentAddress = accounts[0];
      
      // Check if user is registered and approved
      setRegistrationStatus("Checking user registration...");
      setRegistrationProgress(20);
      const isUserRegistered = await registrationContract.methods.isRegistered(currentAddress).call();
      
      if (!isUserRegistered) {
        setRegistrationStatus("");
        alert("❌ You must be a registered user to register a vehicle");
        setIsRegistering(false);
        return;
      }
      
      setRegistrationProgress(30);
      const userId = await registrationContract.methods.getUserIdByAddress(currentAddress).call();
      const user = await registrationContract.methods.users(userId).call();
      
      if (!user.approvedByGovt) {
        setRegistrationStatus("");
        alert("❌ Your account must be approved by the government before registering vehicles");
        setIsRegistering(false);
        return;
      }
  
      // Upload documents & images to Pinata
      setRegistrationStatus("Uploading documents to IPFS...");
      setRegistrationProgress(40);
      const documentHash = await uploadToPinata(document, `${vehicleNo} Document`);
      setRegistrationProgress(60);
      const imageHash = await uploadToPinata(image, `${vehicleNo} Image`);
      setRegistrationProgress(70);
  
      if (!documentHash || !imageHash) {
        setRegistrationStatus("");
        alert("❌ Failed to upload files to Pinata.");
        setIsRegistering(false);
        return;
      }
  
      const documentUrl = `${pinataGateway}${documentHash}`;
      const imageUrl = `${pinataGateway}${imageHash}`;
  
      // Register vehicle on blockchain - using currentAddress as ownerWallet
      setRegistrationStatus("Registering vehicle on blockchain...");
      setRegistrationProgress(80);
      await registrationContract.methods
        .registerVehicle(
          currentAddress, // Using current address as owner
          vehicleNo,
          vehicleEngineNo,
          vehicleMake,
          vehicleModel,
          vehicleModelYear,
          vehicleRegistrationYear,
          documentUrl,
          imageUrl
        )
        .send({ from: currentAddress });
      
      // Save additional data to Firebase
      setRegistrationStatus("Saving additional details to Firebase...");
      setRegistrationProgress(90);
      const vehicleData = {
        ownerWallet: currentAddress,
        vehicleNo,
        vehicleEngineNo,
        vehicleMake,
        vehicleModel,
        vehicleModelYear,
        vehicleRegistrationYear,
        documentUrl,
        imageUrl,
        // Additional fields
        bodyType,
        seatingCapacity,
        cplcSafeCustody,
        horsePower,
        approved: false
      };
      
      const firebaseSaveResult = await saveVehicleToFirebase(vehicleData);
      setRegistrationProgress(100);
      
      if (!firebaseSaveResult) {
        setRegistrationStatus("");
        alert("⚠️ Vehicle registered on blockchain but failed to save additional details to Firebase.");
        setIsRegistering(false);
        return;
      }
  
      setRegistrationStatus("Registration Complete!");
      setTimeout(() => {
        alert("✅ Vehicle registration submitted successfully! Waiting for government approval.");
        window.location.href = "/home";
      }, 1000);
    } catch (error) {
      console.error("Error registering vehicle:", error);
      setRegistrationStatus("");
      alert(`❌ Registration Failed: ${error.message}`);
    }
    setIsRegistering(false);
  };
  
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
  return (
    <div className="form-step">
      {/* Registration Type Selection */}
      {!registrationType && (
        <div className="registration-type-selection">
          <h3>Select Registration Type</h3>
          <div className="type-buttons">
            <button 
              className="type-button new-vehicle"
              onClick={() => {
                setRegistrationType("new");
                generateVehicleNumber();
              }}
            >
              <div className="type-icon">🆕</div>
              <div className="type-title">New Vehicle</div>
              <div className="type-desc">New Vehicle Number</div>
            </button>
            <button 
              className="type-button old-vehicle"
              onClick={() => setRegistrationType("old")}
            >
              <div className="type-icon">🚗</div>
              <div className="type-title">Old Vehicle</div>
              <div className="type-desc">Enter existing vehicle number</div>
            </button>
          </div>
        </div>
      )}

      {/* Form fields - only show after type selection */}
      {registrationType && (
        <>
          <div className="form-group">
            <label htmlFor="vehicleNo">Vehicle Number</label>
            <div className="vehicle-no-container">
              <input
  id="vehicleNo"
  type="text"
  value={vehicleNo}
  onChange={registrationType === "old" ? handleVehicleNoChange : undefined}
  placeholder={registrationType === "new" ? "Auto-generated" : "e.g., ABC-123"}
  maxLength={'7'}
  className={`form-control ${vehicleNoExists || formErrors.vehicleNo ? "error-input" : ""}`}
  disabled={registrationType === "new" || isGeneratingVehicleNo}
/>
             
            </div>
            {isCheckingVehicleNo && <span className="validating-text">Checking...</span>}
            {vehicleNoExists && <span className="error-text">This vehicle number is already registered</span>}
            {formErrors.vehicleNo && <span className="error-text">{formErrors.vehicleNo}</span>}
            {registrationType === "new" && <small className="helper-text">Availabe Number</small>}
          </div>
          
          {/* Reset button */}
          <button 
            type="button" 
            className="reset-type-btn"
            onClick={() => {
              setRegistrationType("");
              setVehicleNo("");
              setVehicleRegistrationYear("");
            }}
          >
            Change Registration Type
          </button>
          
          {/* Rest of your existing form fields */}
          
           <div className="form-group">
              <label htmlFor="vehicleEngineNo">chassis number</label>
              <input
                id="vehicleEngineNo"
                type="text"
                value={vehicleEngineNo}
                onChange={(e) => setVehicleEngineNo(e.target.value.toUpperCase())}
                placeholder="e.g., EN12345678"
                maxLength={'15'}
                className={`form-control ${engineNoExists || formErrors.vehicleEngineNo ? "error-input" : ""}`}
              />
              {isCheckingEngineNo && <span className="validating-text">Checking...</span>}
              {engineNoExists && <span className="error-text">This engine number is already registered</span>}
              {formErrors.vehicleEngineNo && <span className="error-text">{formErrors.vehicleEngineNo}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="currentWallet">Owner Address</label>
              <input
                id="currentWallet"
                type="text"
                value={currentWallet}
                disabled
                className="form-control disabled-input"
                title="Using current MetaMask wallet as owner"
              />
              <small className="helper-text">Using current MetaMask wallet as owner</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="vehicleMake">Vehicle Make</label>
              <input
  id="vehicleMake"
  type="text"
  value={vehicleMake}
  onChange={handleMakeChange}
  placeholder="e.g., Toyota"
  maxLength={'15'}
  className={`form-control ${formErrors.vehicleMake ? "error-input" : ""}`}
/>
              {formErrors.vehicleMake && <span className="error-text">{formErrors.vehicleMake}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="vehicleModel">Vehicle Model</label>
             <input
  id="vehicleModel"
  type="text"
  value={vehicleModel}
  onChange={handleModelChange}
  placeholder="e.g., Corolla"
  maxLength={'15'}
  className={`form-control ${formErrors.vehicleModel ? "error-input" : ""}`}
/>
              {formErrors.vehicleModel && <span className="error-text">{formErrors.vehicleModel}</span>}
            </div>
          
        </>
      )}
    </div>
  );
        
      case 1:
        return (
          <div className="form-step">
            <div className="form-group">
              <label htmlFor="vehicleModelYear">Model Year</label>
              <input
  id="vehicleModelYear"
  type="text"
  value={vehicleModelYear}
  onChange={handleModelYearChange}
  placeholder="e.g., 2023"
  className={`form-control ${formErrors.vehicleModelYear ? "error-input" : ""}`}
  maxLength="4"
/>
              {formErrors.vehicleModelYear && <span className="error-text">{formErrors.vehicleModelYear}</span>}
            </div>
            
            <div className="form-group">
  <label htmlFor="vehicleRegistrationYear">Registration Year</label>
  <input
  id="vehicleRegistrationYear"
  type="text"
  value={vehicleRegistrationYear}
  onChange={registrationType === "old" ? handleRegistrationYearChange : undefined}
  placeholder={registrationType === "new" ? "Auto-set to current year" : "e.g., 2025"}
  className={`form-control ${formErrors.vehicleRegistrationYear ? "error-input" : ""}`}
  disabled={registrationType === "new"}
  maxLength="4"
/>
  {formErrors.vehicleRegistrationYear && <span className="error-text">{formErrors.vehicleRegistrationYear}</span>}
  {registrationType === "new" && <small className="helper-text">Automatically set to current year for new vehicles</small>}
</div>
            
            <div className="form-group">
              <label htmlFor="bodyType">Body Type</label>
              <select
                id="bodyType"
                value={bodyType}
                onChange={(e) => setBodyType(e.target.value)}
                className={`form-control ${formErrors.bodyType ? "error-input" : ""}`}
              >
                <option value="">Select Body Type</option>
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Hatchback">Hatchback</option>
                <option value="Coupe">Coupe</option>
                <option value="Pickup">Pickup</option>
                <option value="Van">Van</option>
                <option value="Minivan">Minivan</option>
                <option value="Convertible">Convertible</option>
                <option value="Wagon">Wagon</option>
                <option value="Other">Other</option>
              </select>
              {formErrors.bodyType && <span className="error-text">{formErrors.bodyType}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="seatingCapacity">Seating Capacity</label>
              <input
                id="seatingCapacity"
                type="number"
                min="1"
                max="50"
                value={seatingCapacity}
                onChange={(e) => setSeatingCapacity(e.target.value)}
                placeholder="e.g., 5"
                className={`form-control ${formErrors.seatingCapacity ? "error-input" : ""}`}
              />
              {formErrors.seatingCapacity && <span className="error-text">{formErrors.seatingCapacity}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="cplcSafeCustody">CPLC Safe Custody</label>
              <select
                id="cplcSafeCustody"
                value={cplcSafeCustody}
                onChange={(e) => setCplcSafeCustody(e.target.value)}
                className="form-control"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="horsePower">Horse Power</label>
              <input
  id="horsePower"
  type="text"
  value={horsePower}
  onChange={handleHorsePowerChange}
  placeholder="e.g., 150 or 150HP"
  maxLength={'4'}
  className={`form-control ${formErrors.horsePower ? "error-input" : ""}`}
/>
              {formErrors.horsePower && <span className="error-text">{formErrors.horsePower}</span>}
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="form-step">
            <div className="document-upload">
              <h3>Documents & Images</h3>
              <p>Please upload required documents and vehicle images below.</p>
              
              <div className="form-group file-upload">
                <label htmlFor="document">Vehicle Document</label>
                <div className="file-input-container">
                  <input
                    id="document"
                    type="file"
                    onChange={handleDocumentChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    ref={inputFile}
                    className={formErrors.document ? "error-input" : ""}
                  />
                  <button className="upload-btn" onClick={() => inputFile.current.click()}>
                    Choose Document
                  </button>
                  <span className="file-name">{document ? document.name : "No file chosen"}</span>
                </div>
                {formErrors.document && <span className="error-text">{formErrors.document}</span>}
                
                {documentPreview && (
                  <div className="preview-container">
                    <a href={documentPreview} target="_blank" rel="noopener noreferrer" className="preview-button">
                      Preview Document
                    </a>
                  </div>
                )}
              </div>
              
              <div className="form-group file-upload">
                <label htmlFor="image">Vehicle Image</label>
                <div className="file-input-container">
                  <input
                    id="image"
                    type="file"
                    onChange={handleImageChange}
                    accept="image/*"
                    ref={inputImage}
                    className={formErrors.image ? "error-input" : ""}
                  />
                  <button className="upload-btn" onClick={() => inputImage.current.click()}>
                    Choose Image
                  </button>
                  <span className="file-name">{image ? image.name : "No file chosen"}</span>
                </div>
                {formErrors.image && <span className="error-text">{formErrors.image}</span>}
                
                {imagePreview && (
                  <div className="preview-container">
                    <div className="image-preview">
                      <img src={imagePreview} alt="Vehicle Preview" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="form-step confirmation-step">
            <h3>Review Registration Details</h3>
            <div className="confirmation-details">
              <div className="detail-group">
                <h4>Vehicle Information</h4>
                <div className="detail-row">
                  <span className="detail-label">Vehicle Number:</span>
                  <span className="detail-value">{vehicleNo}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Engine Number:</span>
                  <span className="detail-value">{vehicleEngineNo}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Make:</span>
                  <span className="detail-value">{vehicleMake}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Model:</span>
                  <span className="detail-value">{vehicleModel}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Model Year:</span>
                  <span className="detail-value">{vehicleModelYear}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Registration Year:</span>
                  <span className="detail-value">{vehicleRegistrationYear}</span>
                </div>
              </div>
              
              <div className="detail-group">
                <h4>Additional Details</h4>
                <div className="detail-row">
                  <span className="detail-label">Body Type:</span>
                  <span className="detail-value">{bodyType}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Seating Capacity:</span>
                  <span className="detail-value">{seatingCapacity}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">CPLC Safe Custody:</span>
                  <span className="detail-value">{cplcSafeCustody}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Horse Power:</span>
                  <span className="detail-value">{horsePower}</span>
                </div>
              </div>
              
              <div className="detail-group">
                <h4>Owner Information</h4>
                <div className="detail-row">
                  <span className="detail-label">Wallet Address:</span>
                  <span className="detail-value wallet-address">{currentWallet}</span>
                </div>
              </div>
              
              <div className="detail-group files-preview">
                <h4>Uploaded Files</h4>
                <div className="files-container">
                  <div className="file-preview">
                    <span className="file-label"></span>
                    <span className="file-name">{document ? document.name : "None"}</span>
                  </div>
                  <div className="file-preview">
                    <span className="file-label">Vehicle Image:</span>
                    <span className="file-name">{image ? image.name : "None"}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="submit-disclaimer">
              <p>
                By clicking "Submit Registration", you confirm that all the information provided is accurate and you are the legal owner of this vehicle. 
                The registration will be processed on the blockchain and will be pending until approved by the government authority.
              </p>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Get step status class
  const getStepStatusClass = (step) => {
    if (step < activeStep) return "completed";
    if (step === activeStep) return "active";
    return "pending";
  };
  
  return (
    <div>
      <Navbar />
      <div className="registration-container">
        <div className="registration-header">
          <h1>Vehicle Registration</h1>
          <p>Register your vehicle on the blockchain for secure and transparent ownership records</p>
        </div>
        
        {/* Stepper */}
        <div className="stepper">
          <div className={`step ${getStepStatusClass(0)}`}>
            <div className="step-icon">1</div>
            <div className="step-label">Basic Info</div>
          </div>
          <div className="step-connector"></div>
          <div className={`step ${getStepStatusClass(1)}`}>
            <div className="step-icon">2</div>
            <div className="step-label">Vehicle Details</div>
          </div>
          <div className="step-connector"></div>
          <div className={`step ${getStepStatusClass(2)}`}>
            <div className="step-icon">3</div>
            <div className="step-label">Documents</div>
          </div>
          <div className="step-connector"></div>
          <div className={`step ${getStepStatusClass(3)}`}>
            <div className="step-icon">4</div>
            <div className="step-label">Review</div>
          </div>
        </div>
        
        {/* Registration status */}
        {isRegistering && (
          <div className="registration-status">
            <div className="status-message">
              <p>{registrationStatus}</p>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${registrationProgress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Form content */}
        <div >
          {renderStepContent(activeStep)}
          
          {/* Navigation buttons */}
          <div className="form-navigation">
            <button 
              className="back-button" 
              onClick={handleBack} 
              disabled={activeStep === 0 || isRegistering}
            >
              Back
            </button>
            
            {activeStep < 3 ? (
              <button 
                className="next-button" 
                onClick={handleNext} 
                disabled={isRegistering}
              >
                Next
              </button>
            ) : (
              <button 
                className="submit-button" 
                onClick={handleSubmit} 
                disabled={isRegistering || vehicleNoExists || engineNoExists}
              >
                {isRegistering ? "Processing..." : "Submit Registration"}
              </button>
            )}
          </div>
        </div>
        
        <div className="info-section">
          <div className="info-icon">ℹ️</div>
          <div className="info-content">
            <h3>What happens next?</h3>
            <p>After submission, your vehicle registration will be pending until approved by the government authority. You will be notified once your registration is approved.</p>
         
          </div>
        </div>
      </div>
      </div>
  );
}
  export default VehicleRegistration;
      
      
        