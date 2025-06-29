// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./UserManagement.sol";

contract VehicleManagement is UserManagement {
    
    struct VehicleRegistration {
        uint id;
        address ownerWallet;
        string vehicleNo;
        string vin;
        string vehicleMake;
        string vehicleModel;
        string vehicleModelYear;
        string vehicleRegistrationYear;
        bool approved;
        string documentHash;
        string imageHash;
        address[] ownershipHistory; 
        uint[] ownershipDates;      
        bool isStolen;  
           
    }

    struct OwnershipTransferRequest {
        uint registrationId;
        address currentOwner;
        address newOwner;
        uint256 transferAmount;  // ADD THIS
        bool newOwnerAccepted;   // ADD THIS
        bool approved;
        bool completed;
    }

    struct StolenRecord {
    uint timestamp;
    address actionBy;     // who reported stolen or marked recovered
    bool isStolen;        // true = reported stolen, false = recovered
    string notes;         // optional notes
}

struct RecoveryRequest {
    uint vehicleId;
    address requestedBy;
    string recoveryDocumentHash;
    bool approved;
    bool completed;
    uint timestamp;
}

    mapping(uint => VehicleRegistration) public vehicleRegistrations;
    uint public registrationCount = 0;
    mapping(string => bool) public registeredVehicles;
    mapping(string => bool) public registeredVehiclesvin;
    mapping(uint => StolenRecord[]) public vehicleStolenHistory;

    mapping(uint => OwnershipTransferRequest) public transferRequests;
    uint public transferRequestCount = 0;

    mapping(uint => RecoveryRequest) public recoveryRequests;
    uint public recoveryRequestCount = 0;

    mapping(uint => uint256) public escrowedFunds;  // ADD THIS

    event VehicleRegistered(uint registerId, string vehicleNo, string vin, address ownerWallet);
    event VehicleApproved(uint registerId, string vehicleNo, string vin, address ownerWallet);
    event OwnershipTransferRequested(uint requestId, string vehicleNo, string vin, uint registrationId, address currentOwner, address newOwner);
    event OwnershipTransferApproved(uint requestId, string vehicleNo, address oldOwner, address newOwner);
    event OwnershipTransferred(uint registerId, address oldOwner, address newOwner);
    event VehicleReportedStolen(uint vehicleId, string vehicleNo, address reportedBy);
    event VehicleRecovered(uint vehicleId, string vehicleNo, address recoveredBy);
    event UserDeclined(uint userId, address wallet, string reason);
    event VehicleDeclined(uint registerId, string vehicleNo, string reason);
    event OwnershipTransferDeclined(uint requestId, string vehicleNo, address currentOwner, address newOwner, string reason);
    event RecoveryRequested(uint requestId, uint vehicleId, string vehicleNo, address requestedBy);
    event RecoveryApproved(uint requestId, uint vehicleId, string vehicleNo, address approvedBy);
    event RecoveryDeclined(uint requestId, uint vehicleId, string vehicleNo, string reason);
event TransferAcceptedAndPaid(uint requestId, address newOwner, uint256 amount);
event FundsTransferred(uint requestId, address to, uint256 amount);

    modifier onlyVehicleOwner(uint _vehicleId) {
        require(_vehicleId > 0 && _vehicleId <= registrationCount, "Invalid vehicle ID");
        require(vehicleRegistrations[_vehicleId].ownerWallet == msg.sender, "Only vehicle owner can perform this action");
        _;
    }

    function registerVehicle(
        address _ownerWallet,
        string memory _vehicleNo,
        string memory _vin,
        string memory _vehicleMake,
        string memory _vehicleModel,
        string memory _vehicleModelYear,
        string memory _vehicleRegistrationYear,
        string memory _documentHash,
        string memory _imageHash
    ) public {
        require(!registeredVehicles[_vehicleNo], "Vehicle already registered");
        require(registeredAddresses[_ownerWallet], "Owner must be a registered user");
        require(registeredAddresses[msg.sender], "Requester must be a registered user");
        require(getUserIdByAddress(msg.sender) != 0, "Requester must be a registered user");
        require(_isUserApproved(msg.sender), "User must be approved by government");

        
        address[] memory ownershipHistory = new address[](0);
        uint[] memory ownershipDates = new uint[](0);

        registrationCount++;
        vehicleRegistrations[registrationCount] = VehicleRegistration(
            registrationCount,
            _ownerWallet,
            _vehicleNo,
            _vin,
            _vehicleMake,
            _vehicleModel,
            _vehicleModelYear,
            _vehicleRegistrationYear,
            false,
            _documentHash,
            _imageHash,
            ownershipHistory, 
            ownershipDates,    
            false 
                     
        ); 
        registeredVehicles[_vehicleNo] = true;
        registeredVehiclesvin[_vin] = true;
        emit VehicleRegistered(registrationCount, _vehicleNo, _vin, _ownerWallet);
    }

    function approveVehicle(uint _registerId) public onlyGovernment {
        require(_registerId > 0 && _registerId <= registrationCount, "Invalid registration ID");
        vehicleRegistrations[_registerId].approved = true;
      
        
        vehicleRegistrations[_registerId].ownershipHistory.push(vehicleRegistrations[_registerId].ownerWallet);
        vehicleRegistrations[_registerId].ownershipDates.push(block.timestamp);

        emit VehicleApproved(_registerId, vehicleRegistrations[_registerId].vehicleNo, vehicleRegistrations[_registerId].vin, vehicleRegistrations[_registerId].ownerWallet);
    }

    function vehicleExists(string memory _vehicleNo) public view returns (bool) {
        return registeredVehicles[_vehicleNo];
    }
    
    function vinExist(string memory _vin) public view returns (bool) {
        return registeredVehiclesvin[_vin];
    }

    function requestOwnershipTransfer(string memory _vehicleNo, address _newOwnerWallet, uint256 _transferAmount) public {
        uint registerId = getVehicleId(_vehicleNo);
        require(registerId != 0, "Vehicle not found");
        require(vehicleRegistrations[registerId].approved, "Vehicle registration must be approved");
        require(msg.sender == vehicleRegistrations[registerId].ownerWallet, "Only the vehicle owner can request transfer");
        require(registeredAddresses[_newOwnerWallet], "New owner must be a registered user");
        require(!vehicleRegistrations[registerId].isStolen, "Cannot transfer stolen vehicle");
        
        uint newOwnerId = getUserIdByAddress(_newOwnerWallet);
        require(newOwnerId != 0, "New owner must be a registered user");
        require(_isUserApproved(_newOwnerWallet), "New owner must be approved by government");
        
        transferRequestCount++;
        transferRequests[transferRequestCount] = OwnershipTransferRequest(
            registerId,
            msg.sender,
            _newOwnerWallet,
            _transferAmount,    // ADD THIS
           false,            // ADD THIS
            false,
            false
        );
        
        emit OwnershipTransferRequested(transferRequestCount, _vehicleNo, vehicleRegistrations[registerId].vin, registerId, msg.sender, _newOwnerWallet);
    }
    function acceptTransferAndPay(uint _requestId) public payable {
    require(_requestId > 0 && _requestId <= transferRequestCount, "Invalid request ID");
    require(msg.sender == transferRequests[_requestId].newOwner, "Only new owner can accept");
    require(!transferRequests[_requestId].newOwnerAccepted, "Already accepted");
    require(!transferRequests[_requestId].completed, "Already completed");
    require(msg.value == transferRequests[_requestId].transferAmount, "Incorrect payment amount");
    
    transferRequests[_requestId].newOwnerAccepted = true;
    escrowedFunds[_requestId] = msg.value;
    
    emit TransferAcceptedAndPaid(_requestId, msg.sender, msg.value);
}
    function approveOwnershipTransfer(uint _requestId) public onlyGovernment {
        require(_requestId > 0 && _requestId <= transferRequestCount, "Invalid request ID");
        require(!transferRequests[_requestId].approved, "Transfer already approved");
        require(!transferRequests[_requestId].completed, "Transfer already completed");
        
        uint registerId = transferRequests[_requestId].registrationId;
        require(!vehicleRegistrations[registerId].isStolen, "Cannot approve transfer for stolen vehicle");
        require(transferRequests[_requestId].newOwnerAccepted, "New owner must accept first");
    
        transferRequests[_requestId].approved = true;

        address oldOwner = transferRequests[_requestId].currentOwner;
        address newOwner = transferRequests[_requestId].newOwner;

        emit OwnershipTransferApproved(_requestId, vehicleRegistrations[registerId].vehicleNo, oldOwner, newOwner);
        
        require(oldOwner == vehicleRegistrations[registerId].ownerWallet, "Current owner mismatch");
         uint256 amount = escrowedFunds[_requestId];
    if (amount > 0) {
        payable(oldOwner).transfer(amount);
        escrowedFunds[_requestId] = 0;
    }
        
        vehicleRegistrations[registerId].ownershipHistory.push(newOwner);
        vehicleRegistrations[registerId].ownershipDates.push(block.timestamp);
        
        vehicleRegistrations[registerId].ownerWallet = newOwner;
        transferRequests[_requestId].completed = true;
        
        emit OwnershipTransferred(registerId, oldOwner, newOwner);

    }

    function reportVehicleStolen(uint _vehicleId) public onlyVehicleOwner(_vehicleId) {
        require(vehicleRegistrations[_vehicleId].approved, "Vehicle must be approved");
        require(!vehicleRegistrations[_vehicleId].isStolen, "Vehicle already reported as stolen");
        
        vehicleRegistrations[_vehicleId].isStolen = true;
         vehicleStolenHistory[_vehicleId].push(StolenRecord({
        timestamp: block.timestamp,
        actionBy: msg.sender,
        isStolen: true,
        notes: "Reported stolen by owner"
    }));
        emit VehicleReportedStolen(_vehicleId, vehicleRegistrations[_vehicleId].vehicleNo, msg.sender);
    }

    function markVehicleRecovered(uint _vehicleId) public onlyGovernment {
        require(_vehicleId > 0 && _vehicleId <= registrationCount, "Invalid vehicle ID");
        require(vehicleRegistrations[_vehicleId].isStolen, "Vehicle is not reported as stolen");
        
        vehicleRegistrations[_vehicleId].isStolen = false;
          vehicleStolenHistory[_vehicleId].push(StolenRecord({
        timestamp: block.timestamp,
        actionBy: msg.sender,
        isStolen: false,
        notes: "Recovered by government"
    }));
        emit VehicleRecovered(_vehicleId, vehicleRegistrations[_vehicleId].vehicleNo, msg.sender);
    }

    function isVehicleStolen(uint _vehicleId) public view returns (bool) {
        require(_vehicleId > 0 && _vehicleId <= registrationCount, "Invalid vehicle ID");
        return vehicleRegistrations[_vehicleId].isStolen;
    }

    function getStolenVehicles() public view returns (uint[] memory) {
        uint[] memory stolenVehicleIds = new uint[](registrationCount);
        uint count = 0;
        
        for (uint i = 1; i <= registrationCount; i++) {
            if (vehicleRegistrations[i].isStolen && vehicleRegistrations[i].approved) {
                stolenVehicleIds[count] = i;
                count++;
            }
        }
        
        uint[] memory result = new uint[](count);
        for (uint i = 0; i < count; i++) {
            result[i] = stolenVehicleIds[i];
        }
        
        return result;
    }
    function getVehicleStolenHistory(uint _vehicleId) public view returns (
    uint[] memory timestamps,
    address[] memory actionBy,
    bool[] memory stolenStatus,
    string[] memory notes
) {
    require(_vehicleId > 0 && _vehicleId <= registrationCount, "Invalid vehicle ID");
    
    StolenRecord[] memory history = vehicleStolenHistory[_vehicleId];
    uint length = history.length;
    
    timestamps = new uint[](length);
    actionBy = new address[](length);
    stolenStatus = new bool[](length);
    notes = new string[](length);
    
    for (uint i = 0; i < length; i++) {
        timestamps[i] = history[i].timestamp;
        actionBy[i] = history[i].actionBy;
        stolenStatus[i] = history[i].isStolen;
        notes[i] = history[i].notes;
    }
    
    return (timestamps, actionBy, stolenStatus, notes);
}

    function getVehicleId(string memory _vehicleNo) public view returns (uint) {
        for (uint i = 1; i <= registrationCount; i++) {
            if (keccak256(abi.encodePacked(vehicleRegistrations[i].vehicleNo)) == keccak256(abi.encodePacked(_vehicleNo))) {
                return i;
            }
        }
        return 0;
    }

    function getVehicleByWallet(address _ownerWallet) public view returns (
        uint id, string memory vehicleNo, string memory vin, string memory vehicleMake,
        string memory vehicleModel, string memory vehicleModelYear, string memory vehicleRegistrationYear,
        bool approved, string memory documentHash, string memory imageHash, bool isStolen
    ) {
        for (uint i = 1; i <= registrationCount; i++) {
            if (vehicleRegistrations[i].ownerWallet == _ownerWallet) {
                VehicleRegistration memory reg = vehicleRegistrations[i];
                return (
                    reg.id, reg.vehicleNo, reg.vin, reg.vehicleMake,
                    reg.vehicleModel, reg.vehicleModelYear, reg.vehicleRegistrationYear,
                    reg.approved, reg.documentHash, reg.imageHash, reg.isStolen
                );
            }
        }
        revert("No vehicle found for this wallet address");
    }
    
    function getTransferRequest(uint _requestId) public view returns (
        uint registrationId,
        address currentOwner,
        address newOwner,
         uint256 transferAmount,        // ADD THIS
        bool newOwnerAccepted, 
        bool approved,
        bool completed
    ) {
        require(_requestId > 0 && _requestId <= transferRequestCount, "Invalid request ID");
        OwnershipTransferRequest memory req = transferRequests[_requestId];
        return (
            req.registrationId,
            req.currentOwner,
            req.newOwner,
            req.transferAmount,        // ADD THIS
            req.newOwnerAccepted,
            req.approved,
            req.completed
        );
    }
    
    function getVehicleOwnershipHistory(uint _vehicleId) public view returns (
        address[] memory owners,
        uint[] memory dates
    ) {
        require(_vehicleId > 0 && _vehicleId <= registrationCount, "Invalid vehicle ID");
        VehicleRegistration storage vehicle = vehicleRegistrations[_vehicleId];
        
        return (vehicle.ownershipHistory, vehicle.ownershipDates);
    }
    function declineUser(address _userAddress, string memory _reason) public onlyGovernment {
    uint userId = userIdByAddress[_userAddress];
    require(userId != 0, "User not found");
    require(!users[userId].approvedByGovt, "User already approved");

    delete users[userId];
    delete userIdByAddress[_userAddress];
    registeredAddresses[_userAddress] = false;
    
    emit UserDeclined(userId, _userAddress, _reason);
}

function declineVehicle(uint _registerId, string memory _reason) public onlyGovernment {
    require(_registerId > 0 && _registerId <= registrationCount, "Invalid registration ID");
    require(!vehicleRegistrations[_registerId].approved, "Vehicle already approved");
    
    VehicleRegistration storage vehicle = vehicleRegistrations[_registerId];
    
    registeredVehicles[vehicle.vehicleNo] = false;
    registeredVehiclesvin[vehicle.vin] = false;
    
    emit VehicleDeclined(_registerId, vehicle.vehicleNo, _reason);
    
    delete vehicleRegistrations[_registerId];
}

function declineOwnershipTransfer(uint _requestId, string memory _reason) public onlyGovernment {
    require(_requestId > 0 && _requestId <= transferRequestCount, "Invalid request ID");
    require(!transferRequests[_requestId].approved, "Transfer already approved");
    require(!transferRequests[_requestId].completed, "Transfer already completed");
    
    OwnershipTransferRequest storage request = transferRequests[_requestId];
    uint registerId = request.registrationId;
    
    emit OwnershipTransferDeclined(_requestId, vehicleRegistrations[registerId].vehicleNo, request.currentOwner, request.newOwner, _reason);
     uint256 amount = escrowedFunds[_requestId];
    if (amount > 0) {
        payable(transferRequests[_requestId].newOwner).transfer(amount);
        escrowedFunds[_requestId] = 0;
    }
    delete transferRequests[_requestId];
}
function requestVehicleRecovery(uint _vehicleId, string memory _recoveryDocumentHash) public onlyVehicleOwner(_vehicleId) {
    require(vehicleRegistrations[_vehicleId].approved, "Vehicle must be approved");
    require(vehicleRegistrations[_vehicleId].isStolen, "Vehicle is not reported as stolen");
    
    recoveryRequestCount++;
    recoveryRequests[recoveryRequestCount] = RecoveryRequest(
        _vehicleId,
        msg.sender,
        _recoveryDocumentHash,
        false,
        false,
        block.timestamp
    );
    
    emit RecoveryRequested(recoveryRequestCount, _vehicleId, vehicleRegistrations[_vehicleId].vehicleNo, msg.sender);
}
function approveRecoveryRequest(uint _requestId) public onlyGovernment {
    require(_requestId > 0 && _requestId <= recoveryRequestCount, "Invalid request ID");
    require(!recoveryRequests[_requestId].approved, "Recovery already approved");
    require(!recoveryRequests[_requestId].completed, "Recovery already completed");
    
    uint vehicleId = recoveryRequests[_requestId].vehicleId;
    require(vehicleRegistrations[vehicleId].isStolen, "Vehicle is not reported as stolen");
    
    recoveryRequests[_requestId].approved = true;
    recoveryRequests[_requestId].completed = true;
    
    vehicleRegistrations[vehicleId].isStolen = false;
    vehicleStolenHistory[vehicleId].push(StolenRecord({
        timestamp: block.timestamp,
        actionBy: msg.sender,
        isStolen: false,
        notes: "Recovered through user request"
    }));
    
    emit RecoveryApproved(_requestId, vehicleId, vehicleRegistrations[vehicleId].vehicleNo, msg.sender);
    emit VehicleRecovered(vehicleId, vehicleRegistrations[vehicleId].vehicleNo, msg.sender);
}
function declineRecoveryRequest(uint _requestId, string memory _reason) public onlyGovernment {
    require(_requestId > 0 && _requestId <= recoveryRequestCount, "Invalid request ID");
    require(!recoveryRequests[_requestId].approved, "Recovery already approved");
    require(!recoveryRequests[_requestId].completed, "Recovery already completed");
    
    uint vehicleId = recoveryRequests[_requestId].vehicleId;
    
    emit RecoveryDeclined(_requestId, vehicleId, vehicleRegistrations[vehicleId].vehicleNo, _reason);
    
    delete recoveryRequests[_requestId];
}
function getRecoveryRequest(uint _requestId) public view returns (
    uint vehicleId,
    address requestedBy,
    string memory recoveryDocumentHash,
    bool approved,
    bool completed,
    uint timestamp
) {
    require(_requestId > 0 && _requestId <= recoveryRequestCount, "Invalid request ID");
    RecoveryRequest memory req = recoveryRequests[_requestId];
    return (
        req.vehicleId,
        req.requestedBy,
        req.recoveryDocumentHash,
        req.approved,
        req.completed,
        req.timestamp
    );
}
}