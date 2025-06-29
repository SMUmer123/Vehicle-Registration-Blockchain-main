import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import './TransactionViewer.css'
/* global BigInt */

const TransactionViewer = ({ web3, contract, account }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (web3 && contract && account) {
      loadTransactions();
    }
  }, [web3, contract, account, filter]);

  const loadTransactions = async () => {
    setLoading(true);
    setLoadingProgress(0);
    try {
      // Step 1: Get all events
      setLoadingProgress(10);
      const events = await contract.getPastEvents('allEvents', {
        fromBlock: 0,
        toBlock: 'latest'
      });

      const filteredEvents = events.filter(event => event.event !== "OwnershipTransferred");
      
      if (filteredEvents.length === 0) {
        setTransactions([]);
        return;
      }

      setLoadingProgress(25);

      // Step 2: Get unique transaction hashes and block numbers
      const uniqueTxHashes = [...new Set(filteredEvents.map(event => event.transactionHash))];
      const uniqueBlockNumbers = [...new Set(filteredEvents.map(event => event.blockNumber))];
      
      setLoadingProgress(30);

      // Step 3: Batch fetch transactions and receipts
      const batchSize = 10;
      const transactions = new Map();
      const receipts = new Map();
      const blocks = new Map();

      // Batch fetch transactions
      for (let i = 0; i < uniqueTxHashes.length; i += batchSize) {
        const batch = uniqueTxHashes.slice(i, i + batchSize);
        const batchPromises = batch.map(async (hash) => {
          try {
            const [tx, receipt] = await Promise.all([
              web3.eth.getTransaction(hash),
              web3.eth.getTransactionReceipt(hash)
            ]);
            transactions.set(hash, tx);
            receipts.set(hash, receipt);
          } catch (error) {
            console.warn(`Failed to fetch transaction ${hash}:`, error);
          }
        });
        
        await Promise.all(batchPromises);
        setLoadingProgress(30 + (i / uniqueTxHashes.length) * 40);
      }

      setLoadingProgress(70);

      // Batch fetch blocks
      for (let i = 0; i < uniqueBlockNumbers.length; i += batchSize) {
        const batch = uniqueBlockNumbers.slice(i, i + batchSize);
        const batchPromises = batch.map(async (blockNumber) => {
          try {
            const block = await web3.eth.getBlock(blockNumber);
            blocks.set(blockNumber, block);
          } catch (error) {
            console.warn(`Failed to fetch block ${blockNumber}:`, error);
          }
        });
        
        await Promise.all(batchPromises);
        setLoadingProgress(70 + (i / uniqueBlockNumbers.length) * 20);
      }

      setLoadingProgress(90);

      // Step 4: Process events with cached data
      const allTransactions = [];
      
      for (const event of filteredEvents) {
        const txHash = event.transactionHash;
        const transaction = transactions.get(txHash);
        const receipt = receipts.get(txHash);
        const block = blocks.get(event.blockNumber);

        if (!transaction || !receipt || !block) {
          continue;
        }

        const txData = {
          hash: txHash,
          blockNumber: transaction.blockNumber,
          timestamp: new Date(Number(block.timestamp) * 1000),
          from: transaction.from,
          to: transaction.to,
          value: web3.utils.fromWei(transaction.value || '0', 'ether'),
          gasUsed: receipt.gasUsed,
          gasPrice: transaction.gasPrice,
          gasFee: web3.utils.fromWei((BigInt(receipt.gasUsed) * BigInt(transaction.gasPrice)).toString(), 'ether'),
          status: receipt.status ? 'Success' : 'Failed',
          eventType: event.event,
          eventData: event.returnValues,
          methodName: getMethodName(transaction.input)
        };

        allTransactions.push(txData);
      }

      // Filter transactions based on selected filter
      let filteredTransactions = allTransactions;
      if (filter !== 'all') {
        filteredTransactions = allTransactions.filter(tx => {
          switch (filter) {
            case 'user_approvals':
              return tx.eventType === 'UserApproved';
            case 'vehicle_approvals':
              return tx.eventType === 'VehicleApproved';
            case 'transfer_approvals':
              return tx.eventType === 'OwnershipTransferApproved';
            case 'registrations':
              return tx.eventType === 'UserRegistered' || tx.eventType === 'VehicleRegistered';
            case 'transfers':
              return tx.eventType === 'OwnershipTransferRequested' || tx.eventType === 'TransferAcceptedAndPaid' || tx.eventType === 'FundsTransferred';
            case 'stolen_recovery':
              return tx.eventType === 'VehicleReportedStolen' || tx.eventType === 'VehicleRecovered' || tx.eventType === 'RecoveryRequested' || tx.eventType === 'RecoveryApproved' || tx.eventType === 'RecoveryDeclined';
            case 'declined':
              return tx.eventType === 'UserDeclined' || tx.eventType === 'VehicleDeclined' || tx.eventType === 'OwnershipTransferDeclined';
            default:
              return true;
          }
        });
      }

      // Apply search filter
      if (searchTerm) {
        filteredTransactions = filteredTransactions.filter(tx =>
          tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.eventType.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Sort transactions
      filteredTransactions.sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return b.timestamp - a.timestamp;
          case 'oldest':
            return a.timestamp - b.timestamp;
          case 'highest_gas':
            return parseFloat(b.gasFee) - parseFloat(a.gasFee);
          case 'lowest_gas':
            return parseFloat(a.gasFee) - parseFloat(b.gasFee);
          default:
            return b.timestamp - a.timestamp;
        }
      });

      setTransactions(filteredTransactions);
      setLoadingProgress(100);
    } catch (error) {
      console.error('Error loading transactions:', error);
      alert('Failed to load transactions: ' + error.message);
    } finally {
      setLoading(false);
      setLoadingProgress(0);
    }
  };

  const getMethodName = (input) => {
    if (!input || input === '0x') return 'Transfer';
    
    const methodSignatures = {
      '0x9b19251a': 'registerUser',
      '0x7c2ba5fd': 'approveUser',
      '0xf8b2cb4f': 'registerVehicle',
      '0xa4b91a01': 'approveVehicle',
      '0x8da5cb5b': 'requestOwnershipTransfer',
      '0x1674b567': 'approveOwnershipTransfer',
      '0x1b8e3c61': 'acceptTransferAndPay',
      '0x5e3b3b3c': 'reportVehicleStolen',
      '0x7a0b3b3d': 'markVehicleRecovered',
      '0x9c4b3b3e': 'requestVehicleRecovery',
      '0x8d5b3b3f': 'approveRecoveryRequest',
      '0x7e6b3b40': 'declineRecoveryRequest',
      '0x6f7b3b41': 'declineUser',
      '0x5g8c3b42': 'declineVehicle',
      '0x4h9d3b43': 'declineOwnershipTransfer'
    };

    const methodId = input.slice(0, 10);
    return methodSignatures[methodId] || 'Unknown Method';
  };

  const formatAddress = (address) => {
    return address;
  };

  const getEventDescription = (tx) => {
    switch (tx.eventType) {
      case 'UserRegistered':
        return `User registered: ${formatAddress(tx.eventData.wallet || 'N/A')}`;
      case 'UserApproved':
        return `User approved: ${formatAddress(tx.eventData.wallet || tx.from)}`;
      case 'UserDeclined':
        return `User declined: ${formatAddress(tx.eventData.wallet || 'N/A')} - Reason: ${tx.eventData.reason || 'N/A'}`;
      case 'VehicleRegistered':
        return `Vehicle register request: ${tx.eventData.vehicleNo || 'N/A'} (VIN: ${tx.eventData.vin || 'N/A'})`;
      case 'VehicleApproved':
        return `Vehicle approved: ${tx.eventData.vehicleNo || 'N/A'} (VIN: ${tx.eventData.vin || 'N/A'})`;
      case 'VehicleDeclined':
        return `Vehicle declined: ${tx.eventData.vehicleNo || 'N/A'} - Reason: ${tx.eventData.reason || 'N/A'}`;
      case 'OwnershipTransferRequested':
        return (
          `Transfer requested:\n` +
          `Vehicle No: ${tx.eventData.vehicleNo || 'N/A'}\n` +
          `VIN: ${tx.eventData.vin || 'N/A'}\n` +
          `From: ${formatAddress(tx.eventData.currentOwner || 'N/A')}\n` +
          `To: ${formatAddress(tx.eventData.newOwner || 'N/A')}\n` +
          `Amount: ${web3.utils.fromWei(tx.eventData.transferAmount || '0', 'ether')} ETH`
        );
      case 'TransferAcceptedAndPaid':
        return (
          `Transfer accepted:\n` +
          `Request ID: ${tx.eventData.requestId || 'N/A'}\n` +
          `By: ${formatAddress(tx.eventData.newOwner || 'N/A')}\n` +
          `Amount: ${web3.utils.fromWei(tx.eventData.amount || '0', 'ether')} ETH`
        );
      case 'OwnershipTransferApproved':
        return (
          `Transfer approved:\n` +
          `Vehicle No: ${tx.eventData.vehicleNo || 'N/A'}\n` +
          `Previous Owner: ${formatAddress(tx.eventData.oldOwner || 'N/A')}\n` +
          `New Owner: ${formatAddress(tx.eventData.newOwner || 'N/A')}`
        );
      case 'OwnershipTransferred':
        return (
          `Ownership transferred:\n` +
          `Vehicle ID: ${tx.eventData.registerId || 'N/A'}\n` +
          `From: ${formatAddress(tx.eventData.oldOwner || 'N/A')}\n` +
          `To: ${formatAddress(tx.eventData.newOwner || 'N/A')}`
        );
      case 'FundsTransferred':
        return (
          `Funds transferred:\n` +
          `Request ID: ${tx.eventData.requestId || 'N/A'}\n` +
          `To: ${formatAddress(tx.eventData.to || 'N/A')}\n` +
          `Amount: ${web3.utils.fromWei(tx.eventData.amount || '0', 'ether')} ETH`
        );
      case 'OwnershipTransferDeclined':
        return (
          `Transfer declined:\n` +
          `Vehicle No: ${tx.eventData.vehicleNo || 'N/A'}\n` +
          `From: ${formatAddress(tx.eventData.currentOwner || 'N/A')}\n` +
          `To: ${formatAddress(tx.eventData.newOwner || 'N/A')}\n` +
          `Reason: ${tx.eventData.reason || 'N/A'}`
        );
      case 'VehicleReportedStolen':
        return (
          `Vehicle reported stolen:\n` +
          `Vehicle No: ${tx.eventData.vehicleNo || 'N/A'}\n` +
          `Reported by: ${formatAddress(tx.eventData.reportedBy || 'N/A')}`
        );
      case 'VehicleRecovered':
        return (
          `Vehicle recovered:\n` +
          `Vehicle No: ${tx.eventData.vehicleNo || 'N/A'}\n` +
          `Recovered by: ${formatAddress(tx.eventData.recoveredBy || 'N/A')}`
        );
      case 'RecoveryRequested':
        return (
          `Recovery requested:\n` +
          `Vehicle No: ${tx.eventData.vehicleNo || 'N/A'}\n` +
          `Request ID: ${tx.eventData.requestId || 'N/A'}\n` +
          `Requested by: ${formatAddress(tx.eventData.requestedBy || 'N/A')}`
        );
      case 'RecoveryApproved':
        return (
          `Recovery approved:\n` +
          `Vehicle No: ${tx.eventData.vehicleNo || 'N/A'}\n` +
          `Request ID: ${tx.eventData.requestId || 'N/A'}\n` +
          `Approved by: ${formatAddress(tx.eventData.approvedBy || 'N/A')}`
        );
      case 'RecoveryDeclined':
        return (
          `Recovery declined:\n` +
          `Vehicle No: ${tx.eventData.vehicleNo || 'N/A'}\n` +
          `Request ID: ${tx.eventData.requestId || 'N/A'}\n` +
          `Reason: ${tx.eventData.reason || 'N/A'}`
        );
      default:
        return `${tx.eventType || 'Transaction'}`;
    }
  };

  const exportTransactions = () => {
    const headers = [
      'Hash',
      'Timestamp',
      'Event Type',
      'Description',
      'From',
      'To',
      'Value (ETH)',
      'Gas Fee (ETH)',
      'Status'
    ];

    const rows = transactions.map(tx => [
      tx.hash,
      tx.timestamp.toISOString(),
      tx.eventType,
      getEventDescription(tx).replace(/[\n\r,]+/g, ' | '),
      tx.from,
      tx.to || 'N/A',
      tx.value,
      tx.gasFee,
      tx.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `government_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="transaction-viewer" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>
          📊 Government Transaction History
        </h2>
        
        {/* Controls */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '15px', 
          marginBottom: '20px',
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px'
        }}>
          <div>
            <label style={{ fontWeight: 'bold', marginRight: '8px' }}>Filter:</label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            >
              <option value="all">All Transactions</option>
              <option value="user_approvals">User Approvals</option>
              <option value="vehicle_approvals">Vehicle Approvals</option>
              <option value="transfer_approvals">Transfer Approvals</option>
              <option value="registrations">Registrations</option>
              <option value="transfers">Transfers</option>
              <option value="stolen_recovery">Stolen & Recovery</option>
              <option value="declined">Declined Actions</option>
            </select>
          </div>

          <div>
            <label style={{ fontWeight: 'bold', marginRight: '8px' }}>Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest_gas">Highest Gas Fee</option>
              <option value="lowest_gas">Lowest Gas Fee</option>
            </select>
          </div>

          <div>
            <label style={{ fontWeight: 'bold', marginRight: '8px' }}>Search:</label>
            <input
              type="text"
              placeholder="Hash, address, or event type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                minWidth: '200px'
              }}
            />
          </div>

          <button
            onClick={loadTransactions}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? `🔄 Loading... ${loadingProgress}%` : '🔄 Refresh'}
          </button>

          <button
            onClick={exportTransactions}
            disabled={transactions.length === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: transactions.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            📥 Export CSV
          </button>
        </div>

        {/* Loading Progress Bar */}
        {loading && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e0e0e0',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${loadingProgress}%`,
                height: '100%',
                backgroundColor: '#3498db',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
              Loading transactions... {loadingProgress}%
            </p>
          </div>
        )}

        {/* Summary Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '20px'
        }}>
          <div style={{
            backgroundColor: '#e8f6fd',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#2980b9' }}>
              {transactions.length}
            </h3>
            <p style={{ margin: 0, fontSize: '14px' }}>Total Transactions</p>
          </div>
          
          <div style={{
            backgroundColor: '#e8f5e8',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#27ae60' }}>
              {transactions.filter(tx => tx.status === 'Success').length}
            </h3>
            <p style={{ margin: 0, fontSize: '14px' }}>Successful</p>
          </div>
          
          <div style={{
            backgroundColor: '#fef2e8',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#f39c12' }}>
              {transactions.reduce((sum, tx) => sum + parseFloat(tx.gasFee), 0).toFixed(6)}
            </h3>
            <p style={{ margin: 0, fontSize: '14px' }}>Total Gas (ETH)</p>
          </div>
        
        </div>
      </div>

      {/* Transaction List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>🔄 Loading transactions... {loadingProgress}%</p>
        </div>
      ) : transactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>📭 No transactions found</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#34495e', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Timestamp</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Event</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Description</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Transaction ID/Hash</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>From</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Gas Fee</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, index) => (
                <tr 
                  key={tx.hash} 
                  style={{
                    backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                    borderBottom: '1px solid #eee'
                  }}
                >
                  <td style={{ padding: '12px' }}>
                    {tx.timestamp.toLocaleDateString()} <br />
                    <small style={{ color: '#666' }}>
                      {tx.timestamp.toLocaleTimeString()}
                    </small>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2'
                    }}>
                      {tx.eventType}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    {getEventDescription(tx)}
                  </td>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px' }}>
                    <a 
                      href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#3498db', textDecoration: 'none' }}
                    >
                      {formatAddress(tx.hash)}
                    </a>
                  </td>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px' }}>
                    {formatAddress(tx.from)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {parseFloat(tx.gasFee).toFixed(6)} ETH
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: tx.status === 'Success' ? '#e8f5e8' : '#ffe8e8',
                      color: tx.status === 'Success' ? '#27ae60' : '#e74c3c'
                    }}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TransactionViewer;