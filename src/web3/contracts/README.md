# UnhackableWallet Smart Contract

This directory contains the smart contract for the UnhackableWallet application, providing the blockchain backend for scam reporting, DAO voting, and secure transfers.

## Contract Overview

`UnhackableWallet.sol` implements:

- 🔍 **Scam Reporting System**: Report suspicious addresses with evidence
- 🗳️ **DAO Voting**: Vote on reported scams through a decentralized governance system
- 💸 **Secure Transfers**: Transfer ETH with built-in scam protection
- 📊 **Scam Score**: Calculate risk scores for addresses based on reports

## Key Features

### Scam Reporting

Users can report suspicious addresses by calling `reportScam()` with:
- The suspicious address
- A reason/description
- Evidence (URL or IPFS hash)

Each report increases the address's scam score.

### DAO Voting

Community members can vote on scam reports to validate them:
- `voteOnReport()` allows voting for or against a report
- Votes are tracked and can be retrieved with `getVotes()`

### Scam Protection

Before sending funds:
- Check if an address is a confirmed scammer with `isScamAddress()`
- View the risk score of an address with `getScamScore()`
- Use `secureTransfer()` for protected transfers

## Development & Deployment

### Prerequisites

- Node.js and npm
- Hardhat or Truffle for deployment
- MetaMask or another Ethereum wallet
- Test ETH (for testnet deployment)

### Local Development

1. Install dependencies:
   ```
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox dotenv
   ```

2. Compile the contract:
   ```
   npx hardhat compile
   ```

3. Run tests:
   ```
   npx hardhat test
   ```

### Deployment

1. Create a `.env` file with:
   ```
   PRIVATE_KEY=your_private_key
   INFURA_KEY=your_infura_key
   ```

2. Deploy to testnet:
   ```
   npx hardhat run contracts/deploy.ts --network sepolia
   ```

3. Update the contract address in `src/web3/contract.ts`

## Integration

After deployment, update the `CONTRACT_ADDRESSES` in `src/web3/contract.ts` with your deployed contract address.

## Security Considerations

- This contract handles funds and sensitive data - audit before production use
- Owner has special privileges - consider implementing a multisig wallet
- Consider privacy implications of public scam reports

## License

MIT
