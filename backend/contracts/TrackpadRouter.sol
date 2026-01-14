// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; 

contract TrackpadCrossChainRouter is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public owner;
    address public feeRecipient;
    uint256 public constant FEE_BPS = 10; 

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

    function setGatewayAllowed(address gateway, bool allowed) external onlyOwner {
        allowedGateway[gateway] = allowed;
        emit GatewayAllowed(gateway, allowed);
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
        emit FeeRecipientUpdated(_feeRecipient);
    }

    function executeBungeeSwap(
        address _gateway,
        address _tokenIn,
        uint256 _amountIn,
        bytes calldata _bungeeCalldata
    ) external payable nonReentrant {
        require(allowedGateway[_gateway], "Gateway not allowed");

        bool usedNative = (_tokenIn == address(0));

        if (usedNative) {
            require(msg.value == _amountIn, "msg.value mismatch for native input");
        } else {
            IERC20(_tokenIn).safeTransferFrom(msg.sender, address(this), _amountIn);
        }

        uint256 fee = (_amountIn * FEE_BPS) / 10000;
        uint256 amountAfterFee = _amountIn - fee;

        if (fee > 0) {
            if (usedNative) {
                (bool sentFee,) = feeRecipient.call{value: fee}("");
                require(sentFee, "Fee native transfer failed");
            } else {
                IERC20(_tokenIn).safeTransfer(feeRecipient, fee);
            }
        }

        if (usedNative) {
            
        } else {
            IERC20(_tokenIn).forceApprove(_gateway, amountAfterFee); 
        }

        (bool success, ) = _gateway.call{ value: usedNative ? amountAfterFee : 0 }(_bungeeCalldata);
        require(success, "Bungee gateway call failed");

        emit CrossChainSwapRequested(msg.sender, _gateway, _tokenIn, _amountIn, fee, usedNative);
    }

    function rescueERC20(address token) external onlyOwner {
        uint256 bal = IERC20(token).balanceOf(address(this));
        if (bal > 0) {
            IERC20(token).safeTransfer(owner, bal);
            emit RescueERC20(token, bal);
        }
    }

    function rescueNative(uint256 amount) external onlyOwner {
        (bool ok,) = owner.call{ value: amount }("");
        require(ok, "Rescue native failed");
    }

    receive() external payable {}
    fallback() external payable {}
}