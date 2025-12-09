// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// This contract pretends to be Bungee/Socket.
// It accepts payments and returns "success" so your UI works.
contract MockGateway {
    event PaymentReceived(address sender, uint256 amount, bytes data);

    // Accept ETH/Native currency
    receive() external payable {
        emit PaymentReceived(msg.sender, msg.value, "");
    }

    // Accept "executeBungeeSwap" calls with data
    fallback() external payable {
        emit PaymentReceived(msg.sender, msg.value, msg.data);
    }
}