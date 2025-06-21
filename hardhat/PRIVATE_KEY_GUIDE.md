# Private Key Guide for UnhackableWallet Deployment

This guide explains how to properly handle your private key when deploying the UnhackableWallet smart contract to the Monad network.

## What is a Private Key?

A private key is a secure, randomly generated string of characters that acts as a digital signature for blockchain transactions. It's similar to the password for your email account, but much more secure and impossible to recover if lost.

## Private Key Format Requirements

For deploying our smart contract, your private key must be:

- **Exactly 64 hexadecimal characters** (without 0x prefix) or 66 characters (with 0x prefix)
- Only contain valid hexadecimal characters: 0-9, a-f, A-F
- Not be shared with anyone else

## How to Get Your Private Key from MetaMask

1. Open your MetaMask extension
2. Click on the account icon (circle) in the top-right corner
3. Select "Account details"
4. Click "Show private key" (you'll need to enter your password)
5. Copy the entire key (it should start with "0x" followed by 64 characters)

![MetaMask Private Key Export](https://metamask.zendesk.com/hc/article_attachments/360059025231/Account_Details.png)

## Safety First!

⚠️ **WARNING**: Your private key gives COMPLETE control of all funds in that account. Never:

- Share your private key with anyone
- Store it in plain text on your computer
- Send it via email or messaging apps
- Commit it to git repositories
- Enter it on websites other than your wallet

## Storing Your Private Key Safely for Deployment

1. Create a `.env` file in the hardhat directory
2. Add your private key like this:
   ```
   PRIVATE_KEY=your_private_key_here
   ```
3. Add `.env` to your `.gitignore` file to avoid accidentally committing it
4. For extra security, delete the `.env` file after deployment

## Validating Your Private Key

We've included a tool to validate your private key format:

```powershell
npm run validate:key
```

This will check if your key is properly formatted without exposing it.

## Common Private Key Issues

| Issue | Solution |
|-------|----------|
| "Private key too short" | Make sure you're copying the entire key (64 characters without 0x) |
| Key doesn't work | Verify you're using the key from the account that has testnet tokens |
| "Invalid account" | Check that your key doesn't have extra spaces or line breaks |

## Creating a Development-Only Account

For development and testing, consider creating a separate MetaMask account that only contains testnet funds. This way, you can use that account's private key for development without risking your main funds.

## Hardware Wallets

For production deployments, consider using a hardware wallet like Ledger or Trezor, which can sign transactions without exposing your private key.

## Need Help?

If you're having issues with your private key, run our helper tool:

```powershell
npm run fix:key
```

This will guide you through fixing common private key issues.
