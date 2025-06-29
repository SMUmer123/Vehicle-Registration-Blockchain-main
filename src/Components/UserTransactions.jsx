import React, { useState, useEffect } from "react";
import Web3 from "web3";
import { contractABI, contractAddress } from "../config";
import { Search, Filter, ExternalLink, Clock, Hash, User, Car, ArrowUpRight, ArrowDownLeft, CheckCircle, XCircle, AlertTriangle, Shield } from "lucide-react";
import "./UserTransactions.css"; // Import the CSS file

const UserTransactions = () => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadBlockchainData = async () => {
      try {
        if (!window.ethereum) {
          console.log("Please install MetaMask!");
          return;
        }

        const web3Instance = new Web3(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });

        const accounts = await web3Instance.eth.getAccounts();
        const wallet = accounts[0];
        setAccount(wallet);

        const contractInstance = new web3Instance.eth.Contract(contractABI, contractAddress);
        setWeb3(web3Instance);
        setContract(contractInstance);

        await fetchUserTransactions(contractInstance, wallet, web3Instance);

        window.ethereum.on("accountsChanged", async (accounts) => {
          if (accounts.length > 0) {
            const newAccount = accounts[0];
            setAccount(newAccount);
            await fetchUserTransactions(contractInstance, newAccount, web3Instance);
          }
        });
      } catch (error) {
        console.error("Error loading blockchain data:", error);
        setLoading(false);
      }
    };

    loadBlockchainData();
  }, []);

  const fetchUserTransactions = async (contract, wallet, web3Instance) => {
    setLoading(true);
    try {
      const userTransactions = [];
      const walletLower = wallet.toLowerCase();

      // Fetch ALL User Registration Events and filter manually
      const allUserRegisteredEvents = await contract.getPastEvents('UserRegistered', {
        fromBlock: 0,
        toBlock: 'latest'
      });

      for (let event of allUserRegisteredEvents) {
        // Only include if the wallet matches current user
        if (event.returnValues.wallet.toLowerCase() === walletLower) {
          const block = await web3Instance.eth.getBlock(event.blockNumber);
          userTransactions.push({
            type: 'User Registration',
            hash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: new Date(block.timestamp * 1000),
            status: 'Completed',
            details: {
              userId: event.returnValues.userId,
              email: event.returnValues.email,
              wallet: event.returnValues.wallet
            }
          });
        }
      }

      // Fetch ALL User Approval Events and filter manually
      const allUserApprovedEvents = await contract.getPastEvents('UserApproved', {
        fromBlock: 0,
        toBlock: 'latest'
      });

      for (let event of allUserApprovedEvents) {
        // Only include if the wallet matches current user
        if (event.returnValues.wallet.toLowerCase() === walletLower) {
          const block = await web3Instance.eth.getBlock(event.blockNumber);
          userTransactions.push({
            type: 'User Approval',
            hash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: new Date(block.timestamp * 1000),
            status: 'Completed',
            details: {
              userId: event.returnValues.userId,
              wallet: event.returnValues.wallet
            }
          });
        }
      }

      // Fetch ALL User Declined Events and filter manually
      const allUserDeclinedEvents = await contract.getPastEvents('UserDeclined', {
        fromBlock: 0,
        toBlock: 'latest'
      });

      for (let event of allUserDeclinedEvents) {
        // Only include if the wallet matches current user
        if (event.returnValues.wallet.toLowerCase() === walletLower) {
          const block = await web3Instance.eth.getBlock(event.blockNumber);
          userTransactions.push({
            type: 'User Declined',
            hash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: new Date(block.timestamp * 1000),
            status: 'Declined',
            details: {
              userId: event.returnValues.userId,
              wallet: event.returnValues.wallet,
              reason: event.returnValues.reason
            }
          });
        }
      }

      // Fetch ALL Vehicle Registration Events and filter manually
      const allVehicleRegisteredEvents = await contract.getPastEvents('VehicleRegistered', {
        fromBlock: 0,
        toBlock: 'latest'
      });

      for (let event of allVehicleRegisteredEvents) {
        // Only include if the ownerWallet matches current user
        if (event.returnValues.ownerWallet.toLowerCase() === walletLower) {
          const block = await web3Instance.eth.getBlock(event.blockNumber);
          userTransactions.push({
            type: 'Vehicle Registration',
            hash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: new Date(block.timestamp * 1000),
            status: 'Completed',
            details: {
              registerId: event.returnValues.registerId,
              vehicleNo: event.returnValues.vehicleNo,
              vin: event.returnValues.vin,
              ownerWallet: event.returnValues.ownerWallet
            }
          });
        }
      }

      // Fetch ALL Vehicle Approval Events and filter manually
      const allVehicleApprovedEvents = await contract.getPastEvents('VehicleApproved', {
        fromBlock: 0,
        toBlock: 'latest'
      });

      for (let event of allVehicleApprovedEvents) {
        // Only include if the ownerWallet matches current user
        if (event.returnValues.ownerWallet.toLowerCase() === walletLower) {
          const block = await web3Instance.eth.getBlock(event.blockNumber);
          userTransactions.push({
            type: 'Vehicle Approval',
            hash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: new Date(block.timestamp * 1000),
            status: 'Completed',
            details: {
              registerId: event.returnValues.registerId,
              vehicleNo: event.returnValues.vehicleNo,
              vin: event.returnValues.vin,
              ownerWallet: event.returnValues.ownerWallet
            }
          });
        }
      }

      // Fetch ALL Vehicle Declined Events and filter manually
      const allVehicleDeclinedEvents = await contract.getPastEvents('VehicleDeclined', {
        fromBlock: 0,
        toBlock: 'latest'
      });

      for (let event of allVehicleDeclinedEvents) {
        // Get vehicle details to check if it belongs to current user
        // Since the event doesn't include ownerWallet, we need to check the registerId
        try {
          const vehicleDetails = await contract.methods.vehicleRegistrations(event.returnValues.registerId).call();
          if (vehicleDetails.ownerWallet.toLowerCase() === walletLower) {
            const block = await web3Instance.eth.getBlock(event.blockNumber);
            userTransactions.push({
              type: 'Vehicle Declined',
              hash: event.transactionHash,
              blockNumber: event.blockNumber,
              timestamp: new Date(block.timestamp * 1000),
              status: 'Declined',
              details: {
                registerId: event.returnValues.registerId,
                vehicleNo: event.returnValues.vehicleNo,
                reason: event.returnValues.reason
              }
            });
          }
        } catch (error) {
          // Vehicle might have been deleted, skip this entry
          console.log("Vehicle details not found for declined vehicle:", event.returnValues.registerId);
        }
      }

      // Fetch ALL Vehicle Reported Stolen Events and filter manually
      const allVehicleReportedStolenEvents = await contract.getPastEvents('VehicleReportedStolen', {
        fromBlock: 0,
        toBlock: 'latest'
      });

      for (let event of allVehicleReportedStolenEvents) {
        // Only include if the reportedBy matches current user
        if (event.returnValues.reportedBy.toLowerCase() === walletLower) {
          const block = await web3Instance.eth.getBlock(event.blockNumber);
          userTransactions.push({
            type: 'Vehicle Reported Stolen',
            hash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: new Date(block.timestamp * 1000),
            status: 'Completed',
            details: {
              vehicleId: event.returnValues.vehicleId,
              vehicleNo: event.returnValues.vehicleNo,
              reportedBy: event.returnValues.reportedBy
            }
          });
        }
      }

      // Fetch ALL Vehicle Recovered Events and filter manually
      const allVehicleRecoveredEvents = await contract.getPastEvents('VehicleRecovered', {
        fromBlock: 0,
        toBlock: 'latest'
      });

      for (let event of allVehicleRecoveredEvents) {
        // Check if the vehicle belongs to current user
        try {
          const vehicleDetails = await contract.methods.vehicleRegistrations(event.returnValues.vehicleId).call();
          if (vehicleDetails.ownerWallet.toLowerCase() === walletLower) {
            const block = await web3Instance.eth.getBlock(event.blockNumber);
            userTransactions.push({
              type: 'Vehicle Recovered',
              hash: event.transactionHash,
              blockNumber: event.blockNumber,
              timestamp: new Date(block.timestamp * 1000),
              status: 'Completed',
              details: {
                vehicleId: event.returnValues.vehicleId,
                vehicleNo: event.returnValues.vehicleNo,
                recoveredBy: event.returnValues.recoveredBy
              }
            });
          }
        } catch (error) {
          console.log("Vehicle details not found for recovered vehicle:", event.returnValues.vehicleId);
        }
      }

      // Fetch ALL Ownership Transfer Request Events and filter manually
      const allTransferRequestedEvents = await contract.getPastEvents('OwnershipTransferRequested', {
        fromBlock: 0,
        toBlock: 'latest'
      });

      for (let event of allTransferRequestedEvents) {
        const currentOwner = event.returnValues.currentOwner.toLowerCase();
        const newOwner = event.returnValues.newOwner.toLowerCase();
        
        // Only include if current user is either sender or receiver
        if (currentOwner === walletLower || newOwner === walletLower) {
          const block = await web3Instance.eth.getBlock(event.blockNumber);
          const transactionType = currentOwner === walletLower ? 
            'Transfer Request (Sender)' : 'Transfer Request (Receiver)';
          
          userTransactions.push({
            type: transactionType,
            hash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: new Date(block.timestamp * 1000),
            status: 'Completed',
            details: {
              requestId: event.returnValues.requestId,
              vehicleNo: event.returnValues.vehicleNo,
              vin: event.returnValues.vin,
              registrationId: event.returnValues.registrationId,
              currentOwner: event.returnValues.currentOwner,
              newOwner: event.returnValues.newOwner
            }
          });
        }
      }

      // Fetch ALL Ownership Transfer Approval Events and filter manually
      const allTransferApprovedEvents = await contract.getPastEvents('OwnershipTransferApproved', {
        fromBlock: 0,
        toBlock: 'latest'
      });

      for (let event of allTransferApprovedEvents) {
        const oldOwner = event.returnValues.oldOwner.toLowerCase();
        const newOwner = event.returnValues.newOwner.toLowerCase();
        
        // Only include if current user is either sender or receiver
        if (oldOwner === walletLower || newOwner === walletLower) {
          const block = await web3Instance.eth.getBlock(event.blockNumber);
          const transactionType = oldOwner === walletLower ? 
            'Transfer Approved (Sender)' : 'Transfer Approved (Receiver)';
          
          userTransactions.push({
            type: transactionType,
            hash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: new Date(block.timestamp * 1000),
            status: 'Completed',
            details: {
              requestId: event.returnValues.requestId,
              vehicleNo: event.returnValues.vehicleNo,
              oldOwner: event.returnValues.oldOwner,
              newOwner: event.returnValues.newOwner
            }
          });
        }
      }

      // Fetch ALL Ownership Transfer Declined Events and filter manually
      const allTransferDeclinedEvents = await contract.getPastEvents('OwnershipTransferDeclined', {
        fromBlock: 0,
        toBlock: 'latest'
      });

      for (let event of allTransferDeclinedEvents) {
        const currentOwner = event.returnValues.currentOwner.toLowerCase();
        const newOwner = event.returnValues.newOwner.toLowerCase();
        
        // Only include if current user is either sender or receiver
        if (currentOwner === walletLower || newOwner === walletLower) {
          const block = await web3Instance.eth.getBlock(event.blockNumber);
          const transactionType = currentOwner === walletLower ? 
            'Transfer Declined (Sender)' : 'Transfer Declined (Receiver)';
          
          userTransactions.push({
            type: transactionType,
            hash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: new Date(block.timestamp * 1000),
            status: 'Declined',
            details: {
              requestId: event.returnValues.requestId,
              vehicleNo: event.returnValues.vehicleNo,
              currentOwner: event.returnValues.currentOwner,
              newOwner: event.returnValues.newOwner,
              reason: event.returnValues.reason
            }
          });
        }
      }

      // Fetch ALL Ownership Transferred Events and filter manually
      const allOwnershipTransferredEvents = await contract.getPastEvents('OwnershipTransferred', {
        fromBlock: 0,
        toBlock: 'latest'
      });

      for (let event of allOwnershipTransferredEvents) {
        const oldOwner = event.returnValues.oldOwner.toLowerCase();
        const newOwner = event.returnValues.newOwner.toLowerCase();
        
        // Only include if current user is either sender or receiver
        if (oldOwner === walletLower || newOwner === walletLower) {
          const block = await web3Instance.eth.getBlock(event.blockNumber);
          const transactionType = oldOwner === walletLower ? 
            'Ownership Transferred (Sender)' : 'Ownership Transferred (Receiver)';
          
          userTransactions.push({
            type: transactionType,
            hash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: new Date(block.timestamp * 1000),
            status: 'Completed',
            details: {
              registerId: event.returnValues.registerId,
              oldOwner: event.returnValues.oldOwner,
              newOwner: event.returnValues.newOwner
            }
          });
        }
      }

      // Remove duplicates based on transaction hash and type
      const uniqueTransactions = userTransactions.filter((transaction, index, self) => 
        index === self.findIndex((t) => t.hash === transaction.hash && t.type === transaction.type)
      );

      // Sort transactions by timestamp (most recent first)
      uniqueTransactions.sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(uniqueTransactions);
    } catch (error) {
      console.error("Error fetching user transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTransactions = () => {
    let filtered = transactions;
    
    if (selectedTab !== "all") {
      const filterMap = {
        "registration": ["User Registration", "Vehicle Registration"],
        "approval": ["User Approval", "Vehicle Approval"],
        "declined": ["User Declined", "Vehicle Declined", "Transfer Declined (Sender)", "Transfer Declined (Receiver)"],
        "security": ["Vehicle Reported Stolen", "Vehicle Recovered"],
        "transfer": ["Transfer Request (Sender)", "Transfer Request (Receiver)", 
                     "Transfer Approved (Sender)", "Transfer Approved (Receiver)",
                     "Ownership Transferred (Sender)", "Ownership Transferred (Receiver)"]
      };
      filtered = transactions.filter(tx => filterMap[selectedTab]?.includes(tx.type));
    }

    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(tx.details).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getTransactionIcon = (type) => {
    const iconMap = {
      "User Registration": <User className="icon" />,
      "User Approval": <CheckCircle className="icon" />,
      "User Declined": <XCircle className="icon" />,
      "Vehicle Registration": <Car className="icon" />,
      "Vehicle Approval": <CheckCircle className="icon" />,
      "Vehicle Declined": <XCircle className="icon" />,
      "Vehicle Reported Stolen": <AlertTriangle className="icon" />,
      "Vehicle Recovered": <Shield className="icon" />,
      "Transfer Request (Sender)": <ArrowUpRight className="icon" />,
      "Transfer Request (Receiver)": <ArrowDownLeft className="icon" />,
      "Transfer Approved (Sender)": <CheckCircle className="icon" />,
      "Transfer Approved (Receiver)": <CheckCircle className="icon" />,
      "Transfer Declined (Sender)": <XCircle className="icon" />,
      "Transfer Declined (Receiver)": <XCircle className="icon" />,
      "Ownership Transferred (Sender)": <ArrowUpRight className="icon" />,
      "Ownership Transferred (Receiver)": <ArrowDownLeft className="icon" />
    };
    return iconMap[type] || <Hash className="icon" />;
  };

  const getTransactionColor = (type) => {
    if (type.includes("Registration")) return "transaction-blue";
    if (type.includes("Approval")) return "transaction-green";
    if (type.includes("Declined")) return "transaction-red";
    if (type.includes("Stolen") || type.includes("Recovered")) return "transaction-orange";
    if (type.includes("Transfer")) return "transaction-purple";
    return "transaction-gray";
  };

  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'completed': return "status-completed";
      case 'pending': return "status-pending";
      case 'failed': return "status-failed";
      case 'declined': return "status-declined";
      default: return "status-default";
    }
  };

  const formatAddress = (address) => {
    return address;
  };

  const formatDateTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner"></div>
          <p className="loading-text">Loading your transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      <div className="content-wrapper">
        {/* Header Section */}
        <div className="header-section">
          <div className="header-content">
            <div className="header-info">
              <h1 className="main-title">Transaction History</h1>
              <p className="subtitle">Track all your blockchain activities and transactions</p>
              <div className="wallet-info">
                
                <span className="connected-text">Connected to</span>
                <span className="wallet-address">{formatAddress(account)}</span>
              </div>
            </div>
            
            {/* Search */}
            <div className="search-container">
              <div className="search-input-wrapper">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          {[
            { label: "Total Transactions", value: transactions.length, color: "blue", icon: <Hash className="stat-icon" /> },
            { label: "Registrations", value: transactions.filter(tx => tx.type.includes("Registration")).length, color: "green", icon: <User className="stat-icon" /> },
            { label: "Approvals", value: transactions.filter(tx => tx.type.includes("Approval")).length, color: "yellow", icon: <CheckCircle className="stat-icon" /> },
            { label: "Transfers", value: transactions.filter(tx => tx.type.includes("Transfer")).length, color: "purple", icon: <ArrowUpRight className="stat-icon" /> },
            { label: "Declined", value: transactions.filter(tx => tx.type.includes("Declined")).length, color: "red", icon: <XCircle className="stat-icon" /> },
            { label: "Security Events", value: transactions.filter(tx => tx.type.includes("Stolen") || tx.type.includes("Recovered")).length, color: "orange", icon: <AlertTriangle className="stat-icon" /> }
          ].map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-content">
                <div className="stat-info">
                  <p className="stat-label">{stat.label}</p>
                  <p className={`stat-value stat-${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`stat-icon-container stat-icon-${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="filter-section">
          <div className="filter-header">
            <div className="filter-title">
              <Filter className="filter-icon" />
              <h3 className="section-title">Filter Transactions</h3>
            </div>
            <div className="tabs-container">
              {[
                { key: "all", label: "All Transactions", count: transactions.length },
                { key: "registration", label: "Registrations", count: transactions.filter(tx => tx.type.includes("Registration")).length },
                { key: "approval", label: "Approvals", count: transactions.filter(tx => tx.type.includes("Approval")).length },
                { key: "transfer", label: "Transfers", count: transactions.filter(tx => tx.type.includes("Transfer")).length },
                { key: "declined", label: "Declined", count: transactions.filter(tx => tx.type.includes("Declined")).length },
                { key: "security", label: "Security", count: transactions.filter(tx => tx.type.includes("Stolen") || tx.type.includes("Recovered")).length }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key)}
                  className={`tab-button ${selectedTab === tab.key ? 'tab-active' : 'tab-inactive'}`}
                >
                  {tab.label}
                  <span className={`tab-count ${selectedTab === tab.key ? 'count-active' : 'count-inactive'}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Transaction List */}
          <div className="transactions-container">
            {getFilteredTransactions().length > 0 ? (
              <div className="transactions-list">
                {getFilteredTransactions().map((transaction, index) => (
                  <div key={index} className="transaction-card">
                    {/* Transaction Header */}
                    <div className="transaction-header">
                      <div className="transaction-info">
                        <div className={`transaction-icon-container ${getTransactionColor(transaction.type)}`}>
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div className="transaction-details">
                          <h3 className="transaction-title">{transaction.type}</h3>
                          <div className="transaction-meta">
                            <div className="meta-item">
                              <Clock className="meta-icon" />
                              {formatDateTime(transaction.timestamp)}
                            </div>
                            <div className="meta-item">
                              <Hash className="meta-icon" />
                              Block {transaction.blockNumber.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className={`status-badge ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </div>
                    </div>

                    {/* Transaction Hash */}
                    <div className="hash-section">
                      <div className="hash-content">
                        <div className="hash-info">
                          <p className="hash-label">Transaction Hash</p>
                          <p className="hash-value">{transaction.hash}</p>
                        </div>
                        <a 
                          href={`https://sepolia.etherscan.io/tx/${transaction.hash}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="etherscan-button"
                        >
                          View on Etherscan
                          <ExternalLink className="external-icon" />
                        </a>
                      </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="details-section">
                      <h4 className="details-title">
                        <Hash className="details-icon" />
                        Transaction Details
                      </h4>
                      <div className="details-grid">
                        {Object.entries(transaction.details).map(([key, value]) => (
                          <div key={key} className="detail-item">
                            <p className="detail-key">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                            <p className="detail-value">
                              {typeof value === 'string' && value.startsWith('0x') ? formatAddress(value) : value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-content">
                  <div className="empty-icon-container">
                    <Search className="empty-icon" />
                  </div>
                  <h3 className="empty-title">No Transactions Found</h3>
                  <p className="empty-description">
                    {selectedTab === "all" 
                      ? searchTerm 
                        ? `No transactions match "${searchTerm}"`
                        : "You haven't made any transactions yet."
                      : `No ${selectedTab} transactions found for your account.`
                    }
                  </p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="clear-search-button"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTransactions;