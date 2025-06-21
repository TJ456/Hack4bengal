# Civic Auth Integration Guide

This document outlines how Civic identity verification has been integrated into our wallet application. The integration includes both frontend components, smart contracts, and backend AI integration.

## Features Implemented

### 1. Face Behind the Wallet
- Users can create wallets through Civic embedded wallet
- Auto-linking with Civic.me profiles shows:
  - Name
  - Avatar 
  - Civic verification level
  - Activity stats

### 2. Gate the Chain
- Smart contract level Civic Pass enforcement using `CivicGatedWallet.sol`
- Restricts:
  - High-value transactions (above a configurable threshold)
  - Sensitive account operations
  - Access to DAO/DOI voting

### 3. AI + Civic Parallel Check
- Dual defensive layer implementation
- Runs both checks before any transaction:
  - Civic identity check ✅
  - ML scam detection 🚫
- Provides combined security recommendation

### 4. Scam DNA Tracker
- Trust Index calculation based on:
  - Civic verification status (+50)
  - Transaction history
  - DOI reports and resolutions

### 5. Civic-Verified DOI System
- Only Civic-verified users can vote on DOI reports
- Vote weighting factors:
  - Reputation score
  - Past vote accuracy
  - Verification duration

### 6. Civic SBT (Soulbound Token) Reputation
- When user completes Civic verification, an SBT is minted
- Metadata includes:
  - Civic Pass issue date
  - Transaction security history
  - DOI participation metrics

### 7. Cross-dApp Verification
- Implements interoperability between dApps using Civic verification
- Trust once, use everywhere verification system

## Integration Components

### Frontend
- `src/components/civic/CivicAuth.tsx` - Primary Civic authentication UI
- `src/web3/civic/auth.ts` - Civic authentication functions
- `src/web3/civic/dualVerification.ts` - Integration with ML model

### Smart Contracts
- `hardhat/contracts/civic/CivicVerifier.sol` - Base verification contract
- `hardhat/contracts/civic/CivicGatedWallet.sol` - High-value transaction gating
- `hardhat/contracts/civic/MockCivicPass.sol` - Mock for testing

### Deployment Scripts
- `hardhat/scripts/deploy-civic.js` - Deploys Civic-integrated contracts

## How to Use

### Setting Up
1. Install dependencies: `npm install`
2. Configure Civic credentials in your .env file
3. Deploy contracts: `npx hardhat run scripts/deploy-civic.js --network yournetwork`

### Using Civic Authentication
1. Import the CivicAuth component where needed:
```jsx
import CivicAuth from '../components/civic/CivicAuth';

// In your component
<CivicAuth address={userWalletAddress} onVerified={handleVerified} />
```

2. Run dual verification before transactions:
```typescript
import { dualVerification } from '../web3/civic/dualVerification';

// Before a transaction
const securityCheck = await dualVerification(userAddress, transactionData);
if (!securityCheck.combinedSafe) {
  // Show warning to user
  alert(securityCheck.recommendation);
}
```

## Security Considerations
- The Civic Pass address should be carefully managed and updated when needed
- The verification threshold for high-value transactions should be set appropriately
- ML model should be regularly trained with new scam patterns

## Future Improvements
- Implement cross-chain Civic verification
- Add more sophisticated reputation algorithms
- Expand SBT metadata with more verification metrics

## References
- [Civic Documentation](https://docs.civic.com)
- [Civic Pass API](https://docs.civic.com/civic-pass)
- [Civic.me Profiles](https://civic.me)
