import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, User, CheckCircle, XCircle, Car, AlertTriangle, RefreshCw, Shield, Link as LinkIcon, Github, Monitor } from 'lucide-react';

const VehicleBlockchainPresentation = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const slideRefs = useRef([]);

  const slides = [
    { id: 'title', title: 'Vehicle Registration via Blockchain' },
    { id: 'user-registration', title: 'User Registration' },
    { id: 'user-approval', title: 'User Approval / Decline' },
    { id: 'vehicle-registration', title: 'Vehicle Registration' },
    { id: 'vehicle-approval', title: 'Vehicle Approval / Decline' },
    { id: 'stolen-recovered', title: 'Stolen or Recovered' },
    { id: 'ownership-transfer', title: 'Ownership Transfer' },
    { id: 'footer', title: 'Get Started' }
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (isAnimating) return;
      
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const newSlide = Math.floor(scrollPosition / windowHeight);
      
      if (newSlide !== currentSlide && newSlide >= 0 && newSlide < slides.length) {
        setCurrentSlide(newSlide);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentSlide, isAnimating]);

  const scrollToSlide = (index) => {
    setIsAnimating(true);
    const targetPosition = index * window.innerHeight;
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
    setTimeout(() => setIsAnimating(false), 1000);
  };

  return (
    <div className={`presentation-container ${darkMode ? 'dark' : ''}`}>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          overflow-x: hidden;
        }

        .presentation-container {
          --primary-color: #3b82f6;
          --secondary-color: #10b981;
          --danger-color: #ef4444;
          --warning-color: #f59e0b;
          --text-primary: #1f2937;
          --text-secondary: #6b7280;
          --bg-primary: #ffffff;
          --bg-secondary: #f9fafb;
          --border-color: #e5e7eb;
        }

        .presentation-container.dark {
          --text-primary: #f9fafb;
          --text-secondary: #d1d5db;
          --bg-primary: #111827;
          --bg-secondary: #1f2937;
          --border-color: #374151;
        }

        .slide {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          background: var(--bg-primary);
          color: var(--text-primary);
          overflow: hidden;
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .slide-content {
          text-align: center;
          max-width: 800px;
          padding: 2rem;
          z-index: 2;
        }

        .blockchain-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0.1;
          background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
          z-index: 1;
        }

        .blockchain-bg::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 60%, rgba(239, 68, 68, 0.2) 0%, transparent 50%);
          animation: pulse 4s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }

        .title-slide {
          background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
          color: white;
        }

        .title-slide h1 {
          font-size: 4rem;
          font-weight: 800;
          margin-bottom: 1rem;
          animation: slideInFromTop 1s ease-out;
        }

        .title-slide .subtitle {
          font-size: 1.5rem;
          margin-bottom: 3rem;
          opacity: 0.9;
          animation: slideInFromBottom 1s ease-out 0.3s both;
        }

        .scroll-indicator {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          cursor: pointer;
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
          40% { transform: translateX(-50%) translateY(-10px); }
          60% { transform: translateX(-50%) translateY(-5px); }
        }

        .workflow-slide {
          padding: 4rem 2rem;
        }

        .step-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }

        .step-icon {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          animation: scaleIn 0.8s ease-out;
          position: relative;
        }

        .step-icon.user { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; }
        .step-icon.approval { background: linear-gradient(135deg, #10b981, #047857); color: white; }
        .step-icon.decline { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }
        .step-icon.vehicle { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; }
        .step-icon.alert { background: linear-gradient(135deg, #ef4444, #b91c1c); color: white; }
        .step-icon.transfer { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; }

        .step-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          animation: slideInFromLeft 0.8s ease-out 0.2s both;
        }

        .step-description {
          font-size: 1.2rem;
          color: var(--text-secondary);
          line-height: 1.6;
          animation: slideInFromRight 0.8s ease-out 0.4s both;
        }

        .animation-demo {
          margin: 2rem 0;
          padding: 2rem;
          border: 2px dashed var(--border-color);
          border-radius: 12px;
          background: var(--bg-secondary);
          animation: fadeIn 1s ease-out 0.6s both;
        }

        .form-animation {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .form-field {
          padding: 0.75rem 1rem;
          border: 2px solid var(--border-color);
          border-radius: 8px;
          background: var(--bg-primary);
          color: var(--text-primary);
          min-width: 150px;
          animation: fillForm 2s ease-in-out infinite;
        }

        @keyframes fillForm {
          0%, 100% { border-color: var(--border-color); }
          50% { border-color: var(--primary-color); }
        }

        .approval-stamp {
          display: inline-block;
          padding: 1rem 2rem;
          border: 3px solid var(--secondary-color);
          border-radius: 8px;
          color: var(--secondary-color);
          font-weight: bold;
          font-size: 1.5rem;
          animation: stampEffect 1.5s ease-in-out;
          transform-origin: center;
        }

        @keyframes stampEffect {
          0% { transform: scale(0) rotate(-10deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(-5deg); opacity: 0.8; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }

        .decline-stamp {
          color: var(--danger-color);
          border-color: var(--danger-color);
          animation: declineEffect 1.5s ease-in-out;
        }

        @keyframes declineEffect {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }

        .vehicle-icon {
          font-size: 4rem;
          animation: vehicleApproval 2s ease-in-out infinite;
        }

        @keyframes vehicleApproval {
          0%, 100% { transform: scale(1); filter: hue-rotate(0deg); }
          50% { transform: scale(1.05); filter: hue-rotate(120deg); }
        }

        .alert-animation {
          animation: alertFlash 1s ease-in-out infinite;
        }

        @keyframes alertFlash {
          0%, 100% { background-color: var(--danger-color); }
          50% { background-color: #dc2626; }
        }

        .transfer-animation {
          display: flex;
          align-items: center;
          gap: 2rem;
          justify-content: center;
        }

        .user-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .transfer-arrow {
          animation: transferMove 2s ease-in-out infinite;
        }

        @keyframes transferMove {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(20px); }
        }

        .footer-slide {
          background: linear-gradient(135deg, var(--bg-secondary), var(--bg-primary));
          padding: 4rem 2rem;
        }

        .footer-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .footer-card {
          background: var(--bg-primary);
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border: 1px solid var(--border-color);
        }

        .footer-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .dark-mode-toggle {
          position: fixed;
          top: 2rem;
          right: 2rem;
          background: var(--bg-primary);
          border: 2px solid var(--border-color);
          border-radius: 50%;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 1000;
          transition: all 0.3s ease;
        }

        .dark-mode-toggle:hover {
          transform: scale(1.1);
        }

        .slide-indicator {
          position: fixed;
          right: 2rem;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          z-index: 1000;
        }

        .indicator-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--text-secondary);
          cursor: pointer;
          transition: all 0.3s ease;
          opacity: 0.5;
        }

        .indicator-dot.active {
          background: var(--primary-color);
          opacity: 1;
          transform: scale(1.2);
        }

        @keyframes slideInFromTop {
          from { transform: translateY(-100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes slideInFromBottom {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes slideInFromLeft {
          from { transform: translateX(-100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        @keyframes slideInFromRight {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 768px) {
          .title-slide h1 { font-size: 2.5rem; }
          .title-slide .subtitle { font-size: 1.2rem; }
          .step-title { font-size: 2rem; }
          .step-icon { width: 80px; height: 80px; font-size: 2rem; }
          .slide-content { padding: 1rem; }
          .footer-content { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Dark Mode Toggle */}
      <button 
        className="dark-mode-toggle"
        onClick={() => setDarkMode(!darkMode)}
        title="Toggle Dark Mode"
      >
        {darkMode ? '☀️' : '🌙'}
      </button>

      {/* Slide Indicator */}
      <div className="slide-indicator">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`indicator-dot ${currentSlide === index ? 'active' : ''}`}
            onClick={() => scrollToSlide(index)}
          />
        ))}
      </div>

      {/* Slide 1: Title */}
      <div className="slide title-slide">
        <div className="blockchain-bg"></div>
        <div className="slide-content">
          <h1>Vehicle Registration via Blockchain</h1>
          <p className="subtitle">A decentralized, secure vehicle registration and verification system</p>
          <div className="scroll-indicator" onClick={() => scrollToSlide(1)}>
            <ChevronDown size={32} />
            <p>Scroll to explore workflow</p>
          </div>
        </div>
      </div>

      {/* Slide 2: User Registration */}
      <div className="slide workflow-slide">
        <div className="slide-content">
          <div className="step-container">
            <div className="step-icon user">
              <User size={48} />
            </div>
            <h2 className="step-title">🧑‍💼 User Registration</h2>
            <p className="step-description">
              Users connect their MetaMask wallet and submit their personal information for verification.
              The system validates the wallet connection and prepares the registration for government approval.
            </p>
            <div className="animation-demo">
              <div className="form-animation">
                <input className="form-field" placeholder="Full Name" readOnly />
                <input className="form-field" placeholder="ID Number" readOnly />
                <input className="form-field" placeholder="Wallet Address" readOnly />
              </div>
              <p style={{marginTop: '1rem', color: 'var(--warning-color)', fontWeight: 'bold'}}>
                Status: Pending Approval
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Slide 3: User Approval/Decline */}
      <div className="slide workflow-slide">
        <div className="slide-content">
          <div className="step-container">
            <div className="step-icon approval">
              <CheckCircle size={48} />
            </div>
            <h2 className="step-title">✅❌ User Approval / Decline</h2>
            <p className="step-description">
              Government officials review the submitted user information and either approve or reject the registration.
              Approved users can proceed to register vehicles, while declined users must resubmit with correct information.
            </p>
            <div className="animation-demo">
              <div className="approval-stamp">APPROVED</div>
              <p style={{marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
                Or declined with reason for rejection
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Slide 4: Vehicle Registration */}
      <div className="slide workflow-slide">
        <div className="slide-content">
          <div className="step-container">
            <div className="step-icon vehicle">
              <Car size={48} />
            </div>
            <h2 className="step-title">🚗 Vehicle Registration</h2>
            <p className="step-description">
              Approved users can now submit their vehicle details including make, model, VIN, and ownership documents.
              Each vehicle gets a unique blockchain record that cannot be tampered with.
            </p>
            <div className="animation-demo">
              <div className="form-animation">
                <input className="form-field" placeholder="Vehicle Make" readOnly />
                <input className="form-field" placeholder="Vehicle Model" readOnly />
                <input className="form-field" placeholder="VIN Number" readOnly />
              </div>
              <div className="vehicle-icon" style={{fontSize: '3rem', margin: '1rem 0'}}>🚗</div>
              <p style={{color: 'var(--warning-color)', fontWeight: 'bold'}}>
                Status: Waiting for Government Approval
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Slide 5: Vehicle Approval/Decline */}
      <div className="slide workflow-slide">
        <div className="slide-content">
          <div className="step-container">
            <div className="step-icon approval">
              <Shield size={48} />
            </div>
            <h2 className="step-title">🔎 ✅❌ Vehicle Approval / Decline</h2>
            <p className="step-description">
              Government verifies vehicle documents, checks for liens, and validates ownership.
              Approved vehicles receive an official blockchain certificate and can be transferred or traded.
            </p>
            <div className="animation-demo">
              <div className="vehicle-icon">🚗</div>
              <div style={{margin: '1rem 0', display: 'flex', gap: '2rem', justifyContent: 'center'}}>
                <div className="approval-stamp">VERIFIED</div>
                <span style={{fontSize: '1.2rem'}}>or</span>
                <div className="approval-stamp decline-stamp">REJECTED</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slide 6: Stolen or Recovered */}
      <div className="slide workflow-slide">
        <div className="slide-content">
          <div className="step-container">
            <div className="step-icon alert alert-animation">
              <AlertTriangle size={48} />
            </div>
            <h2 className="step-title">🚨 Stolen or Recovered</h2>
            <p className="step-description">
              Vehicle owners or law enforcement can mark vehicles as stolen, creating an immutable record.
              When recovered, the status is updated, providing complete theft history transparency.
            </p>
            <div className="animation-demo">
              <div style={{display: 'flex', alignItems: 'center', gap: '2rem', justifyContent: 'center'}}>
                <div style={{fontSize: '3rem'}}>🚗</div>
                <div style={{fontSize: '2rem'}}>→</div>
                <div style={{fontSize: '2rem', color: 'var(--danger-color)'}}>🚨</div>
                <div style={{fontSize: '2rem'}}>→</div>
                <div style={{fontSize: '2rem', color: 'var(--secondary-color)'}}>✅</div>
              </div>
              <p style={{marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
                Stolen → Alert Broadcasted → Recovered & Verified
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Slide 7: Ownership Transfer */}
      <div className="slide workflow-slide">
        <div className="slide-content">
          <div className="step-container">
            <div className="step-icon transfer">
              <RefreshCw size={48} />
            </div>
            <h2 className="step-title">🔁 Ownership Transfer</h2>
            <p className="step-description">
              Vehicle ownership can be transferred securely through smart contracts.
              Both parties sign the transaction, and government approval ensures legitimate transfers.
            </p>
            <div className="animation-demo">
              <div className="transfer-animation">
                <div className="user-avatar">👤</div>
                <div className="transfer-arrow">🔑➡️</div>
                <div className="user-avatar">👤</div>
              </div>
              <p style={{marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
                Owner A → Transfer Key → Owner B
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Slide 8: Footer */}
      <div className="slide footer-slide">
        <div className="slide-content">
          <h2 style={{marginBottom: '3rem', fontSize: '2.5rem'}}>Get Started</h2>
          <div className="footer-content">
            <div className="footer-card">
              <Github size={48} style={{marginBottom: '1rem', color: 'var(--primary-color)'}} />
              <h3 style={{marginBottom: '1rem'}}>View Source Code</h3>
              <p style={{color: 'var(--text-secondary)', marginBottom: '1rem'}}>
                Explore the complete blockchain implementation on GitHub
              </p>
              <button style={{
                background: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}>
                GitHub Repository
              </button>
            </div>
            
            <div className="footer-card">
              <Monitor size={48} style={{marginBottom: '1rem', color: 'var(--secondary-color)'}} />
              <h3 style={{marginBottom: '1rem'}}>Live Demo</h3>
              <p style={{color: 'var(--text-secondary)', marginBottom: '1rem'}}>
                Try the interactive demo with sample data
              </p>
              <button style={{
                background: 'var(--secondary-color)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}>
                Launch Demo
              </button>
            </div>
            
            <div className="footer-card">
              <LinkIcon size={48} style={{marginBottom: '1rem', color: 'var(--warning-color)'}} />
              <h3 style={{marginBottom: '1rem'}}>Documentation</h3>
              <p style={{color: 'var(--text-secondary)', marginBottom: '1rem'}}>
                Learn how to implement and deploy the system
              </p>
              <button style={{
                background: 'var(--warning-color)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}>
                Read Docs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleBlockchainPresentation;