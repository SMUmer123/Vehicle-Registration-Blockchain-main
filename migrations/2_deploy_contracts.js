var Registration = artifacts.require("./Registration.sol");
// name of the smart contract is ToDoList
module.exports = function (deployer) {
  deployer.deploy(Registration);
};

// this file is mainly used for changing the state or the schema of the blockchain just like we do for a databse
// Migrations help in acheiving this: basically changing the state whenever we add a smart contract
// Use truffle migrate to run the migrations: It will use ether to run the migrations or deploy the migrate
