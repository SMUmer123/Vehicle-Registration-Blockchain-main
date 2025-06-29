// var Migrations = artifacts.require("./Migrations.sol");
var Registration = artifacts.require("./contracts/Registration.sol");

module.exports = function (deployer) {
  deployer.deploy(Registration);
};
