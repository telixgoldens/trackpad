// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Interfaces for interacting with ERC20 tokens and DEX Routers (Uniswap/PancakeSwap)
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IDEXRouter {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

contract TrackpadRouter {
    address public owner;
    address public feeRecipient;
    uint256 public constant FEE_BPS = 10; // 0.1% (Basis points: 10/10000)

    // Events to track activity on-chain
    event TrackpadSwap(address indexed user, address tokenIn, uint256 amountIn, uint256 feeTaken);
    event FeesUpdated(address newRecipient);

    constructor(address _feeRecipient) {
        owner = msg.sender;
        feeRecipient = _feeRecipient;
    }

    // The Core Swap Function
    function swapTokenForToken(
        address _router,      // The DEX Router (e.g., Uniswap Base Router)
        address _tokenIn,     // Token user is selling
        address _tokenOut,    // Token user is buying
        uint256 _amountIn,    // Amount selling
        uint256 _minAmountOut // Slippage protection
    ) external {
        // 1. Calculate Fee
        uint256 fee = (_amountIn * FEE_BPS) / 10000;
        uint256 amountAfterFee = _amountIn - fee;

        // 2. Transfer tokens from User to Contract
        // User must have called tokenIn.approve(address(this), _amountIn) beforehand
        require(IERC20(_tokenIn).transferFrom(msg.sender, address(this), _amountIn), "Transfer failed");

        // 3. Send Fee to Recipient
        require(IERC20(_tokenIn).transfer(feeRecipient, fee), "Fee transfer failed");

        // 4. Approve DEX Router to spend our tokens
        IERC20(_tokenIn).approve(_router, amountAfterFee);

        // 5. Construct Path and Swap
        address[] memory path = new address[](2);
        path[0] = _tokenIn;
        path[1] = _tokenOut;

        IDEXRouter(_router).swapExactTokensForTokens(
            amountAfterFee,
            _minAmountOut,
            path,
            msg.sender, // Send resulting tokens back to user
            block.timestamp + 300
        );

        emit TrackpadSwap(msg.sender, _tokenIn, _amountIn, fee);
    }

    // Rescue stuck tokens or ETH
    function withdrawStuckTokens(address _token) external {
        require(msg.sender == owner, "Only owner");
        uint256 bal = IERC20(_token).balanceOf(address(this));
        IERC20(_token).transfer(owner, bal);
    }
}