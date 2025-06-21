# UnhackableWallet Social Recovery Demo Flow

## Overview

UnhackableWallet implements a guardian-based social recovery system with these key features:

1. **Guardian Management**: Add/remove trusted guardians
2. **Threshold Recovery**: Requires multiple guardians (default: 2) to approve recovery
3. **Time-Delay Security**: 3-day delay between approval and execution
4. **Safety Checks**: Multiple validations to prevent unauthorized recovery

## Demo Steps

### 1. Initial Setup (Wallet Owner)

1. Connect your wallet (should be owner)
2. Navigate to the Social Recovery section in the UI
3. Note the empty guardian list and 0 recovery requests

### 2. Adding Guardians

1. Add your first guardian:
   ```
   Wallet Owner Action: Enter guardian address -> Click "Add Guardian"
   Result: Guardian appears in the list with "active" status
   ```

2. Add second guardian:
   ```
   Wallet Owner Action: Enter second guardian address -> Click "Add Guardian"
   Result: Second guardian appears in list
   ```

3. Demonstrate guardian management:
   - Show that only owner can add/remove guardians
   - Try adding an invalid address (should fail)
   - Try adding same guardian twice (should fail)

### 3. Recovery Process Demo

#### Step 1: Initiate Recovery (Guardian)

1. Switch to a guardian's wallet:
   ```
   Action: Connect with first guardian's wallet
   UI: Should show guardian status
   ```

2. Initiate recovery:
   ```
   Guardian Action: Enter new owner address -> Click "Initiate Recovery"
   Result: New recovery request appears with 1 approval
   ```

#### Step 2: Guardian Approvals

1. Switch to second guardian:
   ```
   Action: Connect second guardian's wallet
   UI: Should show existing recovery request
   ```

2. Approve recovery:
   ```
   Guardian Action: Click "Approve Recovery" on request
   Result: Approval count increases to 2
   ```

#### Step 3: Time Delay

1. Show the 3-day delay requirement:
   ```
   UI: Displays time remaining before recovery can be executed
   Note: For demo, you can mention this prevents immediate takeover
   ```

### 4. Security Features to Highlight

1. **Access Control**:
   - Only owner can manage guardians
   - Only guardians can initiate/approve recovery
   - Non-guardians can't participate

2. **Threshold Mechanism**:
   - Recovery requires minimum guardian approvals
   - Show the GUARDIAN_THRESHOLD value (default: 2)

3. **Time-Lock**:
   - 3-day delay between approval and execution
   - Owner can cancel during this period

4. **Smart Contract Security**:
   - Built on OpenZeppelin's secure base contracts
   - Uses ReentrancyGuard for transaction safety
   - Implements event logging for transparency

## Technical Implementation

The feature is implemented across:

1. Smart Contract (`SocialRecoveryWallet.sol`):
   - Manages guardians and recovery logic
   - Handles threshold validation
   - Implements time-delay security

2. Frontend (`GuardianManager.tsx`):
   - User interface for guardian management
   - Recovery request visualization
   - Status updates and notifications

3. Web3 Service (`socialRecovery.ts`):
   - Contract interaction layer
   - Event handling
   - State management

## Recovery States Flow

```
No Recovery
    ↓
Recovery Initiated (1st Guardian)
    ↓
Additional Approvals (Other Guardians)
    ↓
Threshold Met → 3-Day Delay Starts
    ↓
Delay Complete → Recovery Executable
```

## Emergency Features

1. **Cancel Recovery**:
   - Owner can cancel any recovery request
   - Prevents unauthorized recovery attempts

2. **Remove Compromised Guardian**:
   - Owner can remove compromised guardians
   - Maintains security of recovery system

## Testing

For judges who want to verify:

1. Use provided test accounts:
   ```
   Owner: 0x7D77a2CDa23C712B98cD0FcD5c38F22A11ACA556
   Guardian1: [Test Account 1]
   Guardian2: [Test Account 2]
   ```

2. Run test script:
   ```bash
   npx hardhat test test/SocialRecoveryWallet.ts
   ```

## Common Questions

1. **What happens if a guardian loses access?**
   - Owner can remove and replace the guardian
   - System remains secure with remaining guardians

2. **Can recovery be expedited in emergencies?**
   - No, 3-day delay is hardcoded for security
   - Prevents rushed or coerced recovery attempts

3. **What prevents guardian collusion?**
   - Time delay allows owner to detect and cancel
   - Multiple guardians required (threshold system)
   - Guardian removal capability
