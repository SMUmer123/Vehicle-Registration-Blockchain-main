// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract UserManagement {
    address public government = 0x8De289A68cd9f1DdB6edA5684cF9aac6C6311F60;

    struct User {
        uint id;
        string email;
        string name;
        string cnic;
        bytes32 passwordHash;
        address wallet;
        bool approvedByGovt;
      
    }

    mapping(address => bool) public registeredAddresses;
    mapping(uint => User) public users;
    mapping(address => uint) public userIdByAddress;
    uint public userCount = 0;

    event UserRegistered(uint userId, string email, address wallet);
    event UserApproved(uint userId, address wallet);
    

    modifier onlyGovernment() {
        require(msg.sender == government, "Only government can perform this action");
        _;
    }

    function registerUser(
        string memory _email,
        string memory _name,
        string memory _cnic,
        string memory _password
    ) public {
        require(!registeredAddresses[msg.sender], "Address already registered!");

        userCount++;
        users[userCount] = User(
            userCount,
            _email,
            _name,
            _cnic,
            keccak256(abi.encodePacked(_password)),
            msg.sender,
            false
        );

        registeredAddresses[msg.sender] = true;
        userIdByAddress[msg.sender] = userCount;

        emit UserRegistered(userCount, _email, msg.sender);
    }

    function approveUser(address _userAddress) public onlyGovernment {
        uint userId = userIdByAddress[_userAddress];
        require(userId != 0, "User not found");

        users[userId].approvedByGovt = true;
        emit UserApproved(userId, _userAddress);
    }

    function verifyLogin(string memory _email, string memory _password) public view returns (bool) {
        uint userId = getUserId(_email);
        if (userId == 0) return false;

        return users[userId].passwordHash == keccak256(abi.encodePacked(_password)) &&
               users[userId].approvedByGovt;
    }

    function isRegistered(address _userAddress) public view returns (bool) {
        return registeredAddresses[_userAddress];
    }

    function getUserWallet(string memory _email) public view returns (address) {
        uint userId = getUserId(_email);
        require(userId != 0, "User not found");
        return users[userId].wallet;
    }

    function getUserId(string memory _email) public view returns (uint) {
        for (uint i = 1; i <= userCount; i++) {
            if (keccak256(abi.encodePacked(users[i].email)) == keccak256(abi.encodePacked(_email))) {
                return i;
            }
        }
        return 0;
    }

    function getUserIdByAddress(address _wallet) public view returns (uint) {
        return userIdByAddress[_wallet];
    }

    // Internal helper function for other contracts to check user approval
    function _isUserApproved(address _userAddress) internal view returns (bool) {
        uint userId = userIdByAddress[_userAddress];
        if (userId == 0) return false;
        return users[userId].approvedByGovt;
    }
}