// Package contracts contains generated Go bindings for Ethereum smart contracts
package contracts

// NOTE: In a real implementation, you would use abigen to generate Go bindings
// from your Solidity smart contracts. This file is a placeholder.

// ScamReportingABI represents the ABI of the scam reporting contract
const ScamReportingABI = `[
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "scammerAddress",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "evidence",
                "type": "string"
            }
        ],
        "name": "reportScam",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "scammerAddress",
                "type": "address"
            }
        ],
        "name": "getReportCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256" 
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]`
