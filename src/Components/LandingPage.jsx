import React from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

const LandingPage = () => {
  return (
    <div className="landing-container">
      <div className="overlay">
        <div className="content">
          <img src="/logo.png" alt="VRB Logo" className="logo" />

          <h1>Vehicle Registration via Blockchain</h1>
          <p className="tagline">
            Secure your vehicle registration on the blockchain
          </p>

          <div className="btn-group">
            <Link to="/onlineVerification" className="btn verify-btn">
              🔍 Verify Vehicle
            </Link>
            <Link to="/register" className="btn">
              🚗 User Registration
            </Link>
            <Link to="/login" className="btn">
              🔑 User Login
            </Link>
            <Link to="/govtLogin" className="btn govt-btn">
              🏛 Government Dashboard
            </Link>
          </div>

          <div className="features">
            <div className="feature-card">
              <div className="icon-box">🛡️</div>
              <h3>Blockchain Security</h3>
              <p>Immutable records stored on decentralized blockchain</p>
            </div>

            <div className="feature-card">
              <div className="icon-box">⚡</div>
              <h3>Instant Verification</h3>
              <p>Verify vehicle authenticity in real-time</p>
            </div>

            <div className="feature-card">
              <div className="icon-box">📄</div>
              <h3>Digital Ownership</h3>
              <p>Secure digital proof of vehicle ownership</p>
            </div>
          </div>

          {/* ✅ Tutorial Video Section BELOW */}
          <div className="video-section">
            <h2 className="video-title">📽️ Tutorial Video</h2>

            <div className="video-wrapper">
              <iframe
                src="https://www.youtube.com/embed/TUsw2exMhnw?autoplay=0&mute=0&rel=0"
                title="Tutorial Video"
                frameBorder="0"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
