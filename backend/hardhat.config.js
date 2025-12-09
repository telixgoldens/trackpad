require("@nomicfoundation/hardhat-toolbox");

/** @type {import('hardhat/config').HardhatUserConfig} */
module.exports = {
  solidity: "0.8.20",
  networks: {
    // We will deploy to a local test network first
    localhost: {
      url: "http://127.0.0.1:8545"
    },
  }
};