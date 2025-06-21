// DEX Router addresses for major DEXes
export const DEX_ROUTER_ADDRESSES = {
    UNISWAP_V2: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    UNISWAP_V3: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    SUSHISWAP: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F'
} as const;

// Function selectors for common DEX operations
export const DEX_FUNCTION_SELECTORS = {
    // Uniswap V2 / SushiSwap
    SWAP_EXACT_TOKENS_FOR_TOKENS: '0x38ed1739',
    SWAP_EXACT_ETH_FOR_TOKENS: '0x7ff36ab5',
    SWAP_EXACT_TOKENS_FOR_ETH: '0x18cbafe5',
    SWAP_ETH_FOR_EXACT_TOKENS: '0xfb3bdb41',
    SWAP_TOKENS_FOR_EXACT_ETH: '0x4a25d94a',
    SWAP_TOKENS_FOR_EXACT_TOKENS: '0x8803dbee',

    // Uniswap V3
    EXACT_INPUT: '0xc04b8d59',
    EXACT_OUTPUT: '0xf28c0498',
    EXACT_INPUT_SINGLE: '0x414bf389',
    EXACT_OUTPUT_SINGLE: '0xdb3e2198'
} as const;

// Standard DEX interfaces with function definitions
export const DEX_INTERFACES = {
    UNISWAP_V2: [
        'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external returns (uint256[] memory amounts)',
        'function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) external payable returns (uint256[] memory amounts)',
        'function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external returns (uint256[] memory amounts)',
        'function swapETHForExactTokens(uint256 amountOut, address[] path, address to, uint256 deadline) external payable returns (uint256[] memory amounts)',
        'function swapTokensForExactETH(uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) external returns (uint256[] memory amounts)',
        'function swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) external returns (uint256[] memory amounts)'
    ],
    UNISWAP_V3: [
        'function exactInput(tuple(bytes path, address recipient, uint256 amountIn, uint256 amountOutMinimum)) external payable returns (uint256 amountOut)',
        'function exactOutput(tuple(bytes path, address recipient, uint256 amountOut, uint256 amountInMaximum)) external payable returns (uint256 amountIn)',
        'function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
        'function exactOutputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountIn)'
    ]
} as const;