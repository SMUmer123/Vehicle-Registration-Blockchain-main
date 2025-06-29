import React, { useState, useEffect } from "react";
import Web3 from "web3";
import { contractABI, contractAddress } from "../config";

// Enhanced CSS for styling the ownership history component
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
    borderBottom: '2px solid #0066cc',
    paddingBottom: '10px',
    color: '#333',
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
  currentOwnerDot: {
    backgroundColor: '#4CAF50',
  },
  previousOwnerDot: {
    backgroundColor: '#0066cc',
  },
  initialOwnerDot: {
    backgroundColor: '#FF9800',
  },
  ownerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
    flexWrap: 'wrap',
  },
  ownerTitle: {
    fontSize: '1.1em',
    fontWeight: 'bold',
    marginBottom: '5px',
    color: '#333',
  },
  ownerBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.8em',
    fontWeight: 'bold',
    color: 'white',
  },
  currentBadge: {
    backgroundColor: '#4CAF50',
  },
  initialBadge: {
    backgroundColor: '#FF9800',
  },
  previousBadge: {
    backgroundColor: '#0066cc',
  },
  ownerDetails: {
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
  ownershipDuration: {
    backgroundColor: '#f5f5f5',
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
    color: '#666',
    textAlign: 'center',
    padding: '20px',
  },
  button: {
    padding: '12px 20px',
    backgroundColor: '#0066cc',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '15px',
    fontSize: '1em',
    fontWeight: 'bold',
    transition: 'background-color 0.3s',
  },
  buttonHover: {
    backgroundColor: '#0052a3',
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #eee',
  },
  statItem: {
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '1.5em',
    fontWeight: 'bold',
    color: '#0066cc',
  },
  statLabel: {
    fontSize: '0.9em',
    color: '#666',
    marginTop: '4px',
  }
};

const OwnershipHistory = ({ vehicleId }) => {
  const [ownershipHistory, setOwnershipHistory] = useState([]);
  const [ownerDetails, setOwnerDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (showHistory && ownershipHistory.length === 0) {
      fetchOwnershipHistory();
    }
  }, [showHistory, vehicleId]);

  const fetchOwnershipHistory = async () => {
    setLoading(true);
    try {
      const web3 = new Web3(Web3.givenProvider || "http://127.0.0.1:7545");
      const registrationContract = new web3.eth.Contract(
        contractABI,
        contractAddress
      );
      
      // Call the contract function to get ownership history
      const result = await registrationContract.methods.getVehicleOwnershipHistory(vehicleId).call();
      
      // Format the history
      const owners = result.owners;
      const dates = result.dates;
      
      // Create history array with owner addresses and dates
      const history = [];
      for (let i = 0; i < owners.length; i++) {
        const timestamp = parseInt(dates[i]);
        
        // Skip entries with timestamp 0
        if (timestamp === 0) continue;
        
        const date = new Date(timestamp * 1000);
        history.push({
          owner: owners[i],
          date: date.toLocaleDateString() + ' ' + date.toLocaleTimeString(),
          formattedDate: formatDate(date),
          timestamp: timestamp * 1000,
          chronologicalIndex: i,
          ownershipStartDate: date
        });
      }
      
      // Calculate ownership duration for each owner
      for (let i = 0; i < history.length; i++) {
        if (i < history.length - 1) {
          // Not the current owner - calculate duration until next transfer
          const nextTransfer = history[i + 1];
          const duration = nextTransfer.timestamp - history[i].timestamp;
          history[i].ownershipDuration = formatDuration(duration);
        } else {
          // Current owner - calculate duration until now
          const duration = Date.now() - history[i].timestamp;
          history[i].ownershipDuration = formatDuration(duration);
          history[i].isCurrentOwner = true;
        }
      }
      
      // Sort history by timestamp (newest first for display)
      history.sort((a, b) => b.timestamp - a.timestamp);
      
      setOwnershipHistory(history);
      
      // Fetch detailed owner information
      await fetchOwnerDetails(owners.filter((_, index) => parseInt(dates[index]) !== 0));
    } catch (error) {
      console.error("Error fetching ownership history:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchOwnerDetails = async (owners) => {
    try {
      const web3 = new Web3(Web3.givenProvider || "http://127.0.0.1:7545");
      const registrationContract = new web3.eth.Contract(
        contractABI,
        contractAddress
      );
      
      const details = {};
      
      for (const address of owners) {
        try {
          // Get user ID from address
          const userId = await registrationContract.methods.getUserIdByAddress(address).call();
          
          if (userId && userId !== '0') {
            // Get user details
            const user = await registrationContract.methods.users(userId).call();
            details[address] = {
              name: user.name || "Unknown",
              email: user.email || "Not available",
              cnic: user.cnic || "Not available",
              userId: userId,
              approvedByGovt: user.approvedByGovt,
              wallet: user.wallet
            };
          } else {
            details[address] = {
              name: "Unknown User",
              email: "Not available",
              cnic: "Not available",
              userId: "Unknown",
              approvedByGovt: false,
              wallet: address
            };
          }
        } catch (err) {
          console.error(`Error fetching details for address ${address}:`, err);
          details[address] = {
            name: "Error loading",
            email: "Not available",
            cnic: "Not available",
            userId: "Unknown",
            approvedByGovt: false,
            wallet: address
          };
        }
      }
      
      setOwnerDetails(details);
    } catch (error) {
      console.error("Error fetching owner details:", error);
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

  const formatDuration = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}, ${months % 12} month${(months % 12) !== 1 ? 's' : ''}`;
    } else if (months > 0) {
      return `${months} month${months > 1 ? 's' : ''}, ${days % 30} day${(days % 30) !== 1 ? 's' : ''}`;
    } else if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}, ${hours % 24} hour${(hours % 24) !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}, ${minutes % 60} minute${(minutes % 60) !== 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}, ${seconds % 60} second${(seconds % 60) !== 1 ? 's' : ''}`;
    } else {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
  };
  
  const shortenAddress = (address) => {
    return address.substring(0, 8) + '...' + address.substring(address.length - 6);
  };

  const getOwnerTitle = (entry, index) => {
    if (index === 0) {
      return 'Current Owner';
    } else if (entry.chronologicalIndex === 0) {
      return 'Initial Owner';
    } else {
      return `Owner #${entry.chronologicalIndex + 1}`;
    }
  };

  const getOwnerBadge = (entry, index) => {
    let badgeStyle = { ...styles.ownerBadge };
    let badgeText = '';

    if (index === 0) {
      badgeStyle = { ...badgeStyle, ...styles.currentBadge };
      badgeText = 'CURRENT';
    } else if (entry.chronologicalIndex === 0) {
      badgeStyle = { ...badgeStyle, ...styles.initialBadge };
      badgeText = 'INITIAL';
    } else {
      badgeStyle = { ...badgeStyle, ...styles.previousBadge };
      badgeText = 'PREVIOUS';
    }

    return <span style={badgeStyle}>{badgeText}</span>;
  };

  const getDotStyle = (entry, index) => {
    if (index === 0) {
      return { ...styles.timelineDot, ...styles.currentOwnerDot };
    } else if (entry.chronologicalIndex === 0) {
      return { ...styles.timelineDot, ...styles.initialOwnerDot };
    } else {
      return { ...styles.timelineDot, ...styles.previousOwnerDot };
    }
  };

  const getOwnershipStats = () => {
    if (ownershipHistory.length === 0) return null;

    const totalOwners = ownershipHistory.length;
    const totalTransfers = totalOwners - 1;
    const currentOwner = ownershipHistory[0];
    const initialOwner = ownershipHistory.find(h => h.chronologicalIndex === 0);
    
    const vehicleAge = initialOwner ? Date.now() - initialOwner.timestamp : 0;
    const currentOwnershipDuration = currentOwner ? Date.now() - currentOwner.timestamp : 0;

    return {
      totalOwners,
      totalTransfers,
      vehicleAge: formatDuration(vehicleAge),
      currentOwnershipDuration: formatDuration(currentOwnershipDuration)
    };
  };

  const stats = getOwnershipStats();

  return (
    <div style={styles.container}>
      <button 
        onClick={() => setShowHistory(!showHistory)} 
        style={styles.button}
        onMouseEnter={(e) => e.target.style.backgroundColor = styles.buttonHover.backgroundColor}
        onMouseLeave={(e) => e.target.style.backgroundColor = styles.button.backgroundColor}
      >
        {showHistory ? "Hide Ownership History" : "Show Detailed Ownership History"}
      </button>
      
      {showHistory && (
        <>
          <h3 style={styles.title}>Complete Vehicle Ownership History</h3>
          
          {stats && (
            <div style={styles.statsContainer}>
              <div style={styles.statItem}>
                <div style={styles.statNumber}>{stats.totalOwners}</div>
                <div style={styles.statLabel}>Total Owners</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statNumber}>{stats.totalTransfers}</div>
                <div style={styles.statLabel}>Transfers</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statNumber}>{stats.vehicleAge.split(',')[0]}</div>
                <div style={styles.statLabel}>Vehicle Age</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statNumber}>{stats.currentOwnershipDuration.split(',')[0]}</div>
                <div style={styles.statLabel}>Current Ownership</div>
              </div>
            </div>
          )}
          
          {loading ? (
            <p style={styles.loadingText}>Loading detailed ownership history...</p>
          ) : ownershipHistory.length > 0 ? (
            <ul style={styles.timeline}>
              {ownershipHistory.map((entry, index) => {
                const details = ownerDetails[entry.owner] || {};
                return (
                  <li key={`${entry.owner}-${entry.timestamp}`} style={styles.timelineItem}>
                    <div style={getDotStyle(entry, index)}></div>
                    
                    <div style={styles.ownerHeader}>
                      <div>
                        <div style={styles.ownerTitle}>
                          {getOwnerTitle(entry, index)}
                        </div>
                      </div>
                      {getOwnerBadge(entry, index)}
                    </div>
                    
                    <div style={styles.ownerDetails}>
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Owner Name</div>
                        <div style={styles.detailValue}>
                          {details.name || "Loading..."}
                        </div>
                      </div>
                      
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Email Address</div>
                        <div style={styles.detailValue}>
                          {details.email || "Loading..."}
                        </div>
                      </div>
                      
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>CNIC</div>
                        <div style={styles.detailValue}>
                          {details.cnic || "Loading..."}
                        </div>
                      </div>
                      
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Wallet Address</div>
                        <div style={styles.detailValue}>
                          {shortenAddress(entry.owner)}
                        </div>
                      </div>
                      
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>User ID</div>
                        <div style={styles.detailValue}>
                          #{details.userId || "Loading..."}
                        </div>
                      </div>
                      
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Government Status</div>
                        <div style={styles.detailValue}>
                          {details.approvedByGovt ? "✅ Approved" : "❌ Not Approved"}
                        </div>
                      </div>
                      
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Ownership Started</div>
                        <div style={styles.detailValue}>
                          {entry.formattedDate}
                        </div>
                      </div>
                      
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Exact Date & Time</div>
                        <div style={styles.detailValue}>
                          {entry.date}
                        </div>
                      </div>
                    </div>
                    
                    <div style={styles.ownershipDuration}>
                      <strong>Ownership Duration:</strong> {entry.ownershipDuration}
                      {entry.isCurrentOwner && " (ongoing)"}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p style={styles.noHistoryText}>No ownership history available for this vehicle</p>
          )}
        </>
      )}
    </div>
  );
};

export default OwnershipHistory;