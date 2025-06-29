import React, { useState, useEffect } from "react";
import Web3 from "web3";
import { contractABI, contractAddress } from "../config";

const styles = {
  container: {
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '12px',
    backgroundColor: '#f9f9f9',
    marginTop: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: '1.4em',
    marginBottom: '20px',
    fontWeight: 'bold',
    borderBottom: '2px solid #dc3545',
    paddingBottom: '10px',
    color: '#333',
  },
  button: {
    padding: '12px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '15px',
    fontSize: '1em',
    fontWeight: 'bold',
    transition: 'background-color 0.3s',
  },
  timeline: {
    listStyleType: 'none',
    padding: '0',
    margin: '0',
    borderLeft: '3px solid #ddd',
    paddingLeft: '30px',
  },
  timelineItem: {
    marginBottom: '25px',
    position: 'relative',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    border: '1px solid #eee',
  },
  timelineDot: {
    position: 'absolute',
    left: '-36px',
    top: '20px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '3px solid white',
    boxShadow: '0 0 0 3px #ddd',
  },
  stolenDot: {
    backgroundColor: '#dc3545',
  },
  recoveredDot: {
    backgroundColor: '#28a745',
  },
  eventHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
    flexWrap: 'wrap',
  },
  eventTitle: {
    fontSize: '1.1em',
    fontWeight: 'bold',
    marginBottom: '5px',
    color: '#333',
  },
  eventBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.8em',
    fontWeight: 'bold',
    color: 'white',
  },
  stolenBadge: {
    backgroundColor: '#dc3545',
  },
  recoveredBadge: {
    backgroundColor: '#28a745',
  },
  eventDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '15px',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  detailLabel: {
    fontSize: '0.85em',
    fontWeight: 'bold',
    color: '#666',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  detailValue: {
    fontSize: '0.95em',
    color: '#333',
    wordBreak: 'break-all',
  },
  notes: {
    backgroundColor: '#f8f9fa',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '0.9em',
    color: '#666',
    fontStyle: 'italic',
    marginTop: '10px',
  },
  loadingText: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '20px',
  },
  noHistoryText: {
    color: '#28a745',
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#d4edda',
    borderRadius: '6px',
    border: '1px solid #c3e6cb',
  },
  currentStatus: {
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '1.1em',
  },
  statusNormal: {
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb',
  },
  statusStolen: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
  }
};

const StolenHistory = ({ vehicleId, isCurrentlyStolen }) => {
  const [stolenHistory, setStolenHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (showHistory && stolenHistory.length === 0) {
      fetchStolenHistory();
    }
  }, [showHistory, vehicleId]);

  const fetchStolenHistory = async () => {
    setLoading(true);
    try {
      const web3 = new Web3(Web3.givenProvider || "http://127.0.0.1:7545");
      const contract = new web3.eth.Contract(contractABI, contractAddress);
      
      const result = await contract.methods.getVehicleStolenHistory(vehicleId).call();
      
      const history = [];
      for (let i = 0; i < result.timestamps.length; i++) {
        const timestamp = parseInt(result.timestamps[i]) * 1000;
        const date = new Date(timestamp);
        
        history.push({
          timestamp: timestamp,
          actionBy: result.actionBy[i],
          isStolen: result.stolenStatus[i],
          notes: result.notes[i],
          formattedDate: formatDate(date),
          exactDate: date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
        });
      }
      
      // Sort by timestamp (newest first)
      history.sort((a, b) => b.timestamp - a.timestamp);
      setStolenHistory(history);
    } catch (error) {
      console.error("Error fetching stolen history:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)} weeks ago`;
    } else if (diffDays < 365) {
      return `${Math.floor(diffDays / 30)} months ago`;
    } else {
      return `${Math.floor(diffDays / 365)} years ago`;
    }
  };

  const shortenAddress = (address) => {
    return address.substring(0, 8) + '...' + address.substring(address.length - 6);
  };

  const getDotStyle = (isStolen) => {
    return {
      ...styles.timelineDot,
      ...(isStolen ? styles.stolenDot : styles.recoveredDot)
    };
  };

  const getEventBadge = (isStolen) => {
    const badgeStyle = {
      ...styles.eventBadge,
      ...(isStolen ? styles.stolenBadge : styles.recoveredBadge)
    };
    
    return (
      <span style={badgeStyle}>
        {isStolen ? "🚨 STOLEN" : "✅ RECOVERED"}
      </span>
    );
  };

  return (
    <div style={styles.container}>
      {/* Current Status */}
      <div style={{
        ...styles.currentStatus,
        ...(isCurrentlyStolen ? styles.statusStolen : styles.statusNormal)
      }}>
        {isCurrentlyStolen ? "🚨 CURRENTLY REPORTED AS STOLEN" : "✅ VEHICLE STATUS: NORMAL"}
      </div>

      <button 
        onClick={() => setShowHistory(!showHistory)} 
        style={styles.button}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
      >
        {showHistory ? "Hide Security History" : "Show Security History"}
      </button>
      
      {showHistory && (
        <>
          <h3 style={styles.title}>🔒 Vehicle Security History</h3>
          
          {loading ? (
            <p style={styles.loadingText}>Loading security history...</p>
          ) : stolenHistory.length > 0 ? (
            <ul style={styles.timeline}>
              {stolenHistory.map((entry, index) => (
                <li key={`${entry.timestamp}-${index}`} style={styles.timelineItem}>
                  <div style={getDotStyle(entry.isStolen)}></div>
                  
                  <div style={styles.eventHeader}>
                    <div>
                      <div style={styles.eventTitle}>
                        {entry.isStolen ? "🚨 Vehicle Reported Stolen" : "✅ Vehicle Recovered"}
                      </div>
                    </div>
                    {getEventBadge(entry.isStolen)}
                  </div>
                  
                  <div style={styles.eventDetails}>
                    <div style={styles.detailItem}>
                      <div style={styles.detailLabel}>Action By</div>
                      <div style={styles.detailValue}>
                        {shortenAddress(entry.actionBy)}
                      </div>
                    </div>
                    
                    <div style={styles.detailItem}>
                      <div style={styles.detailLabel}>When</div>
                      <div style={styles.detailValue}>
                        {entry.formattedDate}
                      </div>
                    </div>
                    
                    <div style={styles.detailItem}>
                      <div style={styles.detailLabel}>Exact Date & Time</div>
                      <div style={styles.detailValue}>
                        {entry.exactDate}
                      </div>
                    </div>
                    
                    <div style={styles.detailItem}>
                      <div style={styles.detailLabel}>Status Change</div>
                      <div style={styles.detailValue}>
                        {entry.isStolen ? "Normal → Stolen" : "Stolen → Recovered"}
                      </div>
                    </div>
                  </div>
                  
                  {entry.notes && (
                    <div style={styles.notes}>
                      <strong>Notes:</strong> {entry.notes}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div style={styles.noHistoryText}>
              🎉 No security incidents reported for this vehicle. Clean history!
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StolenHistory;