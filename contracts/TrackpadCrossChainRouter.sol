// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
  TrackpadCrossChainRouter
  - Takes a 0.1% fee (FEE_BPS = 10)
  - Forwards tokens or native value to Bungee Gateway with provided calldata
  - Requires off-chain Bungee quote + tx builder to produce gateway + calldata
  - Uses SafeERC20 and ReentrancyGuard for safety
*/

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
}

contract TrackpadCrossChainRouter is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public owner;
    address public feeRecipient;
    uint256 public constant FEE_BPS = 10; // 0.1%

    // Simple allowlist mapping for gateways (set by owner). Prefer this over arbitrary targets.
    mapping(address => bool) public allowedGateway;

    event CrossChainSwapRequested(
        address indexed user,
        address indexed gateway,
        address tokenIn,
        uint256 amountIn,
        uint256 feeTaken,
        bool usedNativeValue
    );

    event GatewayAllowed(address gateway, bool allowed);
    event FeeRecipientUpdated(address newRecipient);
    event RescueERC20(address token, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address _feeRecipient) {
        owner = msg.sender;
        feeRecipient = _feeRecipient;
    }

    // Owner can allow Bungee gateway contracts per network (safer than arbitrary addresses)
    function setGatewayAllowed(address gateway, bool allowed) external onlyOwner {
        allowedGateway[gateway] = allowed;
        emit GatewayAllowed(gateway, allowed);
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
        emit FeeRecipientUpdated(_feeRecipient);
    }

    // Core function:
    // - _gateway: Bungee gateway/inbox address returned by Bungee tx builder
    // - _tokenIn: address(0) for native (ETH) or ERC20 token address
    // - _amountIn: amount of tokenIn (for native, also require msg.value == _amountIn)
    // - _bungeeCalldata: the calldata produced by Bungee's transaction builder (must be passed through)
    // Note: frontend must call Bungee API for quote and tx data and pass bungeeCalldata here.
    function executeBungeeSwap(
        address _gateway,
        address _tokenIn,
        uint256 _amountIn,
        bytes calldata _bungeeCalldata
    ) external payable nonReentrant {
        require(allowedGateway[_gateway], "Gateway not allowed");

        bool usedNative = (_tokenIn == address(0));

        // If native asset, require msg.value matches _amountIn (some Bungee flows require value)
        if (usedNative) {
            require(msg.value == _amountIn, "msg.value mismatch for native input");
        } else {
            // Pull ERC20 from user to this contract
            IERC20(_tokenIn).safeTransferFrom(msg.sender, address(this), _amountIn);
        }

        // 1) Fee calc (0.1%)
        uint256 fee = (_amountIn * FEE_BPS) / 10000;
        uint256 amountAfterFee = _amountIn - fee;

        // 2) Send fee to feeRecipient (native or ERC20)
        if (fee > 0) {
            if (usedNative) {
                (bool sentFee,) = feeRecipient.call{value: fee}("");
                require(sentFee, "Fee native transfer failed");
            } else {
                IERC20(_tokenIn).safeTransfer(feeRecipient, fee);
            }
        }

        // 3) Approve or prepare funds for Bungee Gateway
        if (usedNative) {
            // For native flow: forward the post-fee value as part of call below.
            // The call will include value: amountAfterFee
        } else {
            // Approve gateway to pull the post-fee amount (use safeApprove pattern)
            IERC20(_tokenIn).safeIncreaseAllowance(_gateway, amountAfterFee);
        }

        // 4) Call Bungee gateway with provided calldata
        //    NOTE: the calldata should have been produced by Bungee's txbuilder for this exact input and recipient.
        //    We forward amountAfterFee as msg.value only for native flows. For ERC20 flows, no native value forwarded.
        (bool success, bytes memory returnData) = _gateway.call{ value: usedNative ? amountAfterFee : 0 }(_bungeeCalldata);
        require(success, "Bungee gateway call failed");

        // 5) Emit event (we don't try to parse return data here; Bungee will perform routing)
        emit CrossChainSwapRequested(msg.sender, _gateway, _tokenIn, _amountIn, fee, usedNative);
    }

    // Rescue function for stuck ERC20 tokens (owner only)
    function rescueERC20(address token) external onlyOwner {
        uint256 bal = IERC20(token).balanceOf(address(this));
        if (bal > 0) {
            IERC20(token).safeTransfer(owner, bal);
            emit RescueERC20(token, bal);
        }
    }

    // Rescue native ETH (owner only)
    function rescueNative(uint256 amount) external onlyOwner {
        (bool ok,) = owner.call{ value: amount }("");
        require(ok, "Rescue native failed");
    }

    // Allow contract to receive native ETH
    receive() external payable {}
    fallback() external payable {}
}
