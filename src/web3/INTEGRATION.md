# Web3 Integration Guide for UnhackableWallet

This guide explains how to integrate the UnhackableWallet contract into your frontend React application.

## Prerequisites

- The contract has been compiled and deployed (see `/hardhat/README.md` for deployment instructions)
- The contract ABI and address are correctly configured

## Basic Web3 Integration

The integration has been set up in the following files:

- `src/web3/wallet.ts`: Handles wallet connections (MetaMask, etc.)
- `src/web3/contract.ts`: Provides contract interaction methods
- `src/web3/utils.ts`: Helper functions for Web3 integration
- `src/web3/abi/UnhackableWallet.json`: Contract ABI and bytecode

## Using the Contract in React Components

Here's how to use the contract in your React components:

```tsx
import { useState, useEffect } from 'react';
import contractService from '../web3/contract';
import walletConnector from '../web3/wallet';

function ScamReportingComponent() {
  const [address, setAddress] = useState('');
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState('');
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load reports on component mount
    loadReports();
  }, []);

  async function loadReports() {
    try {
      setIsLoading(true);
      const reports = await contractService.getScamReports();
      setReports(reports);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConnect() {
    await walletConnector.connectWallet();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!address || !reason) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setIsLoading(true);
      const tx = await contractService.reportScam(address, reason, evidence);
      await tx.wait();
      alert('Report submitted successfully!');
      
      // Reload reports
      await loadReports();
      
      // Reset form
      setAddress('');
      setReason('');
      setEvidence('');
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Error submitting report. See console for details.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <h2>Report Suspicious Address</h2>
      
      {!walletConnector.isConnected && (
        <button onClick={handleConnect}>Connect Wallet</button>
      )}
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Suspicious Address:
            <input 
              type="text" 
              value={address} 
              onChange={e => setAddress(e.target.value)} 
              placeholder="0x..." 
              required 
            />
          </label>
        </div>
        
        <div>
          <label>
            Reason:
            <textarea 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
              placeholder="Describe the suspicious activity..." 
              required 
            />
          </label>
        </div>
        
        <div>
          <label>
            Evidence (URL or IPFS hash):
            <input 
              type="text" 
              value={evidence} 
              onChange={e => setEvidence(e.target.value)} 
              placeholder="https://... or ipfs://..." 
            />
          </label>
        </div>
        
        <button type="submit" disabled={isLoading || !walletConnector.isConnected}>
          {isLoading ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
      
      <h3>Recent Reports</h3>
      {isLoading ? <p>Loading...</p> : (
        <ul>
          {reports.map(report => (
            <li key={report.id}>
              <strong>Address:</strong> {report.suspiciousAddress}<br />
              <strong>Reason:</strong> {report.description}<br />
              <strong>Reporter:</strong> {report.reporter}<br />
              <strong>Votes:</strong> {report.votesFor} for, {report.votesAgainst} against
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Additional Examples

### Secure Transfer

```tsx
async function handleTransfer() {
  if (!recipientAddress || !amount) return;
  
  try {
    setTransferring(true);
    
    // Check if address is reported as scam
    const isScam = await contractService.isScamAddress(recipientAddress);
    const scamScore = await contractService.getScamScore(recipientAddress);
    
    // Warn user if scam score is high
    if (scamScore > 50) {
      const confirm = window.confirm(
        `Warning: This address has a high scam likelihood score (${scamScore}/100). Proceed anyway?`
      );
      if (!confirm) {
        setTransferring(false);
        return;
      }
    }
    
    // Execute transfer
    const tx = await contractService.secureSendETH(recipientAddress, amount);
    await tx.wait();
    
    alert('Transfer successful!');
  } catch (error) {
    console.error('Transfer error:', error);
    alert('Transfer failed. See console for details.');
  } finally {
    setTransferring(false);
  }
}
```

### DAO Voting

```tsx
async function handleVote(proposalId: string, inSupport: boolean) {
  if (!walletConnector.isConnected) {
    alert('Please connect your wallet first');
    return;
  }
  
  try {
    setVoting(true);
    const tx = await contractService.voteOnScamReport(proposalId, inSupport);
    await tx.wait();
    
    alert('Vote submitted successfully!');
    // Refresh data...
  } catch (error) {
    console.error('Voting error:', error);
    alert('Vote failed. You might have already voted on this proposal.');
  } finally {
    setVoting(false);
  }
}
```

## Advanced Integration

For advanced use cases, consider:

1. Creating a custom hook for wallet connection and contract interactions
2. Setting up web3 context providers for global access
3. Using react-query for caching contract data
4. Implementing transaction tracking and notifications

## Network Handling

The contract is configured to work with multiple networks (Mainnet, Testnets). The application will use the appropriate contract address based on the connected network.

If the user is connected to a network where the contract isn't deployed, the application will show an appropriate error message.

## Error Handling

Always wrap contract interactions in try-catch blocks to handle:
- Wallet connection errors
- Smart contract errors
- Network errors
- Transaction rejections

## Best Practices

1. Always check for wallet connection before attempting transactions
2. Display loading states during transactions
3. Provide clear feedback after transactions complete
4. Handle error states gracefully
5. Implement transaction confirmation monitoring 
6. Consider gas estimations for better UX
