
# UnhackableWallet

A secure wallet application with DAO-based scam protection and reporting system. Built on Monad for high performance and security.

## Features

- **Secure Wallet Management**: Send and receive crypto assets with enhanced security
- **DAO-based Scam Protection**: Community-driven scam identification and prevention
- **Threat Monitoring**: Real-time detection of suspicious activities
- **Security Scoring**: Risk assessment for addresses and transactions
- **AI Learning**: Continuously improving security through machine learning

## Getting Started

Follow these steps:

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd Wallet1

# Step 3: Install the necessary dependencies
npm i

# Step 4: Start the development server
npm run dev
```

## Smart Contract Deployment

The UnhackableWallet smart contract can be deployed to various networks:

### Monad Testnet (Recommended)

For best performance and lower gas fees, deploy to Monad testnet using our automated workflow:

```powershell
cd hardhat
npm install
npm run monad:workflow
```

This interactive script will guide you through the entire deployment process.

#### Having Issues with Deployment?

- **Private key problems?** Run `npm run validate:key` to check your key format
- **Need detailed instructions?** See [MONAD_STEP_BY_STEP.md](./hardhat/MONAD_STEP_BY_STEP.md)
- **New to crypto wallets?** Read our [Private Key Guide](./hardhat/PRIVATE_KEY_GUIDE.md)

For manual deployment, see [MONAD_DEPLOYMENT.md](./hardhat/MONAD_DEPLOYMENT.md).
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS


