import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Activity, AlertTriangle, CheckCircle, Zap, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import contractService from '@/web3/contract';
import walletConnector from '@/web3/wallet';
import { shortenAddress } from '@/web3/utils';
import { ethers } from 'ethers';

interface ThreatMonitorProps {
  threatLevel: 'safe' | 'warning' | 'danger';
}

interface ScanResult {
  id: number;
  contract: string;
  name: string; 
  status: 'safe' | 'warning' | 'danger';
  timestamp: string;
  riskScore: number;
}

interface NetworkInfo {
  name: string;
  chainId: number;
  ensSupported: boolean;
}

// Network-specific configurations
const NETWORK_CONFIGS: { [key: number]: NetworkInfo } = {
  1: { name: 'Ethereum Mainnet', chainId: 1, ensSupported: true },
  5: { name: 'Goerli', chainId: 5, ensSupported: true },
  11155111: { name: 'Sepolia', chainId: 11155111, ensSupported: true },
  // Monad networks
  10143: { name: 'Monad Local', chainId: 10143, ensSupported: false },
  131914: { name: 'Monad Testnet', chainId: 131914, ensSupported: false },
  1024: { name: 'Monad Mainnet', chainId: 1024, ensSupported: false }
};

// Known contract addresses and names
const CONTRACT_ADDRESSES = {
  UNISWAP_TOKEN: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  TETHER_USD: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  WRAPPED_BTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  UNISWAP_ROUTER: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  DAI_STABLECOIN: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
} as const;

// Status icon map for consistent UI
const STATUS_ICONS = {
  safe: (className: string) => <CheckCircle className={className} />,
  warning: (className: string) => <AlertTriangle className={className} />,
  danger: (className: string) => <Shield className={className} />
} as const;

// Status color map for consistent styling
const STATUS_COLORS = {
  safe: 'text-green-400 bg-green-500/20',
  warning: 'text-yellow-400 bg-yellow-500/20',
  danger: 'text-red-400 bg-red-500/20'
} as const;

/**
 * Resolves an Ethereum address or ENS name based on network support
 */
const resolveAddress = async (input: string | null | undefined, provider: ethers.Provider): Promise<string> => {
  if (!input) throw new Error('Input address or ENS name is required');
  const inputStr = input.toString();
  try {
    // Get network information
    const network = await provider.getNetwork();
    const networkId = Number(network.chainId);
    const networkConfig: NetworkInfo = NETWORK_CONFIGS[networkId] || {
      name: network.name || 'Unknown Network',
      chainId: networkId,
      ensSupported: false
    };

    // Return immediately if it's a valid address
    if (ethers.isAddress(input)) {
      return input;
    }
    const lowerInput = inputStr.toLowerCase();
    // Check if it's an ENS name
    const isENSName = lowerInput.endsWith('.eth');

    // Special handling for Monad networks
    if ([10143, 131914, 1024].includes(networkId)) {
      if (isENSName) {
        throw new Error(`ENS names are not supported on ${networkConfig.name}. Please use the address directly.`);
      }
      // Additional validation for Monad addresses could go here
    }

    // Handle ENS resolution for supported networks
    if (networkConfig.ensSupported && isENSName) {
      try {
        const resolved = await provider.resolveName(input);
        if (resolved) {
          return resolved;
        }
        throw new Error(`Could not resolve ENS name: ${input}`);
      } catch (ensError) {
        if ((ensError as any)?.code === 'UNSUPPORTED_OPERATION') {
          throw new Error(`This network does not support ENS. Please use the address directly.`);
        }
        throw new Error(`Failed to resolve ENS name (${input}). ${(ensError as Error).message}`);
      }
    }

    // Handle invalid input
    if (isENSName && !networkConfig.ensSupported) {
      throw new Error(
        `ENS names are not supported on ${networkConfig.name}. ` +
        'Please use the Ethereum address directly.'
      );
    }

    throw new Error(
      'Invalid input. Please provide a valid Ethereum address' +
      (networkConfig.ensSupported ? ' or ENS name.' : '.')
    );

  } catch (error: any) {
    // Handle network-specific errors
    if (error.code === 'UNSUPPORTED_OPERATION') {
      throw new Error(
        `The current network (${await provider.getNetwork().then(n => n.name || 'Unknown')}) ` +
        'does not support ENS resolution. Please use the address directly.'
      );
    }
    throw error;
  }
};

const ThreatMonitor: React.FC<ThreatMonitorProps> = ({ threatLevel }) => {
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);

  // Memoize known contracts mapping
  const knownContracts = useMemo(() => ({
    [CONTRACT_ADDRESSES.UNISWAP_TOKEN]: 'Uniswap Token',
    [CONTRACT_ADDRESSES.TETHER_USD]: 'Tether USD',
    [CONTRACT_ADDRESSES.WRAPPED_BTC]: 'Wrapped BTC',
    [CONTRACT_ADDRESSES.UNISWAP_ROUTER]: 'Uniswap Router',
    [CONTRACT_ADDRESSES.DAI_STABLECOIN]: 'DAI Stablecoin'
  }), []);

  // Network-aware helpers
  const isMonadNetwork = useMemo(() => {
    return networkInfo ? [10143, 131914, 1024].includes(networkInfo.chainId) : false;
  }, [networkInfo?.chainId]);

  // Get contract name with network context
  const getContractName = async (address: string): Promise<string> => {
    try {
      if (!ethers.isAddress(address)) {
        throw new Error('Invalid address format');
      }

      // Use memoized network info
      if (isMonadNetwork) {
        try {
          const isScam = await contractService.isScamAddress(address);
          if (isScam) return "Reported Scam Contract";
          return "Monad Contract";
        } catch (err) {
          console.error("Error checking Monad scam status:", err);
          return "Unknown Monad Contract";
        }
      }

      // Ethereum network handling using memoized contracts
      return knownContracts[address.toLowerCase()] || "Unknown Contract";
    } catch (err) {
      console.error("Error in getContractName:", err);
      return "Unknown Contract";
    }
  };

  // Get risk score with network awareness
  const getRiskScore = async (address: string): Promise<number> => {
    try {
      if (!ethers.isAddress(address)) {
        throw new Error('Invalid address format');
      }

      const contractScore = await contractService.getScamScore(address);
      if (contractScore > 0) return contractScore;

      if (isMonadNetwork) {
        if (address.toLowerCase().startsWith('0xdead')) return 85;
        return Math.floor(Math.random() * 30) + 10;
      }

      if (address.includes('DEAD') || address.includes('0000')) {
        return Math.floor(Math.random() * 20) + 60;
      }

      return knownContracts[address.toLowerCase()] 
        ? Math.floor(Math.random() * 10) + 1 
        : Math.floor(Math.random() * 30) + 15;
    } catch (err) {
      console.error("Error getting risk score:", err);
      return 50;
    }
  };

  // Load initial data
  useEffect(() => {
    const loadInitialScans = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // In a production app, you would fetch real security scan results
        // from your backend or a blockchain security API
        
        // For now, we'll use a mix of real data and simulation:
        // 1. Get recent reports from our contract
        const reports = await contractService.getScamReports();
        const initialScans: ScanResult[] = [];
        
        // 2. Convert max 3 reports to scan results
        const reportsToUse = reports.slice(0, 3);
        for (let i = 0; i < reportsToUse.length; i++) {
          const report = reportsToUse[i];
          const score = await contractService.getScamScore(report.suspiciousAddress);
          
          initialScans.push({
            id: report.id,
            contract: report.suspiciousAddress,
            name: report.description || await getContractName(report.suspiciousAddress),
            status: score > 70 ? 'danger' : score > 30 ? 'warning' : 'safe',
            timestamp: new Date(report.timestamp).toLocaleString(),
            riskScore: score
          });
        }
        
        // 3. Add some known safe contracts to complete the list
        const safeContracts = [
          '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // UNI token
          '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
          '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'  // WBTC
        ];
        
        for (let j = 0; initialScans.length < 3 && j < safeContracts.length; j++) {
          const contractAddress = safeContracts[j];
          const name = await getContractName(contractAddress);
          const score = await getRiskScore(contractAddress);
          
          initialScans.push({
            id: Date.now() + j,
            contract: contractAddress,
            name,
            status: 'safe',
            timestamp: `${Math.floor(Math.random() * 10) + 1} min ago`,
            riskScore: score
          });
        }
        
        setRecentScans(initialScans);
      } catch (err: any) {
        console.error("Error loading threat monitor data:", err);
        setError(err.message || "Failed to load security data");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (walletConnector.address && walletConnector.provider) {
      loadInitialScans();
    } else {
      // Not connected, use simulation only
      setIsLoading(false);
    }
  }, [walletConnector.address]);
  
  // Simulate real-time scanning activity
  useEffect(() => {
    if (!walletConnector.address) return;
    
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance of new scan
        const scanContract = async () => {
          try {
            setIsScanning(true);
          
            // Generate a random address or use a known one occasionally
            const useKnownContract = Math.random() > 0.8;
            let contractAddress = '';
            
            if (useKnownContract) {
              const knownAddresses = Object.keys(CONTRACT_ADDRESSES);
              contractAddress = knownAddresses[Math.floor(Math.random() * knownAddresses.length)];
            } else {
              contractAddress = `0x${Math.random().toString(16).substring(2, 42)}`;
            }
            
            // Get contract details
            const name = await getContractName(contractAddress);
            const riskScore = await getRiskScore(contractAddress);
            const status = riskScore > 70 ? 'danger' : riskScore > 30 ? 'warning' : 'safe';
            
            const newScan: ScanResult = {
              id: Date.now(),
              contract: contractAddress,
              name,
              status,
              timestamp: 'Just now',
              riskScore
            };

            setRecentScans(prev => [newScan, ...prev.slice(0, 4)]);
            
            setTimeout(() => setIsScanning(false), 2000);
          } catch (err) {
            console.error("Error in scan simulation:", err);
            setIsScanning(false);
          }
        };
        
        scanContract();
      }
    }, 12000); // Slightly longer interval for more realism

    return () => clearInterval(interval);
  }, [walletConnector.address]);

  // Generate a valid Ethereum address
  const generateValidAddress = (prefix: string = '0x'): string => {
    const chars = '0123456789abcdef';
    const length = 40; // 20 bytes = 40 hex chars
    let result = prefix;
    for (let i = prefix.length; i < 42; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  };

  // Add new scan when threat level changes to danger
  useEffect(() => {
    if (threatLevel === 'danger') {
      const scanDangerContract = async () => {
        try {
          // Generate a valid malicious-looking address
          const dangerAddress = generateValidAddress('0xdead');
          
          // Get risk score (will be high due to our heuristics)
          const riskScore = await getRiskScore(dangerAddress);
          
          const dangerScan: ScanResult = {
            id: Date.now(),
            contract: dangerAddress,
            name: 'Suspicious Contract',
            status: 'danger',
            timestamp: 'Just now',
            riskScore
          };

          setRecentScans(prev => [dangerScan, ...prev.slice(0, 4)]);
          setIsScanning(true);
          
          setTimeout(() => setIsScanning(false), 2000);
        } catch (err) {
          console.error("Error processing danger scan:", err);
        }
      };
      
      scanDangerContract();
    }
  }, [threatLevel]);

  // Initialize monitor and load network info
  useEffect(() => {
    const initializeMonitor = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!walletConnector.provider) {
          setError('Wallet not connected');
          return;
        }

        // Get network information
        const network = await walletConnector.provider.getNetwork();
        const networkConfig = NETWORK_CONFIGS[Number(network.chainId)] || {
          name: 'Unknown Network',
          chainId: Number(network.chainId),
          ensSupported: false
        };
        setNetworkInfo(networkConfig);

        // Constants for different networks
        const addresses = {
          monad: {
            token: '0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b',
            vitalik: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
            uniswap: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'
          },
          ethereum: {
            token: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // UNI
            vitalik: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
            uniswap: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
          }
        };

        const isMonadNetwork = [10143, 131914, 1024].includes(networkConfig.chainId);
        
        // Initialize addresses and names based on network
        let vitalikAddress = addresses.monad.vitalik; // Default fallback
        let vitalikName = isMonadNetwork ? 'Vitalik Address' : 'vitalik.eth';
        let tokenAddress = isMonadNetwork ? addresses.monad.token : addresses.ethereum.token;
        let tokenName = isMonadNetwork ? 'Monad Token' : 'Uniswap Token';

        // Only attempt ENS resolution on supported networks
        if (networkConfig.ensSupported) {
          try {
            const resolved = await walletConnector.provider.resolveName('vitalik.eth');
            if (resolved) {
              vitalikAddress = resolved;
              vitalikName = 'vitalik.eth';
            }
          } catch (e) {
            console.warn('ENS resolution failed, using fallback address:', e);
            // Keep the fallback address and name
          }
        }

        // Get risk scores
        const tokenRisk = await getRiskScore(tokenAddress);
        const vitalikRisk = await getRiskScore(vitalikAddress);

        // Create sample scans with proper network awareness
        const sampleScans: ScanResult[] = [
          {
            id: 1,
            contract: tokenAddress,
            name: tokenName,
            status: tokenRisk > 70 ? 'danger' : tokenRisk > 30 ? 'warning' : 'safe',
            timestamp: new Date().toISOString(),
            riskScore: tokenRisk
          },
          {
            id: 2,
            contract: vitalikAddress,
            name: vitalikName,
            status: vitalikRisk > 70 ? 'danger' : vitalikRisk > 30 ? 'warning' : 'safe',
            timestamp: new Date().toISOString(),
            riskScore: vitalikRisk
          }
        ];

        setRecentScans(sampleScans);
        setIsLoading(false);
      } catch (error: any) {
        console.error('Monitor initialization failed:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    initializeMonitor();
    const interval = setInterval(initializeMonitor, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);
  // Capitalize first letter of status
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Enhanced scanning detection
  const startScanningAnimation = async (address: string) => {
    setIsScanning(true);
    
    // In a real implementation, this would be an actual scan
    // You could integrate with a third-party security API here
    
    setTimeout(() => setIsScanning(false), 2000);
    return true;
  };

  return (
    <Card className="bg-black/20 backdrop-blur-lg border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-cyan-400" />
            <CardTitle className="text-white">Real-Time Threat Monitor</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant="outline" 
              className={networkInfo?.ensSupported ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}
            >
              {networkInfo?.name || 'Unknown Network'}
            </Badge>
            {isScanning ? (
              <Badge className="bg-cyan-500/20 text-cyan-400">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Scanning
              </Badge>
            ) : (
              <Badge className="bg-green-500/20 text-green-400">
                <Activity className="h-3 w-3 mr-1" />
                AI Active
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error ? (
          <div className="p-4 rounded-md bg-red-500/20 border border-red-500/30">
            <p className="text-red-400 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {error}
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {recentScans.map((scan) => (
              <div 
                key={scan.id}
                className="p-4 rounded-md bg-white/5 border border-white/10 flex items-center justify-between"
              >                <div className="flex items-center space-x-4">
                  {STATUS_ICONS[scan.status as keyof typeof STATUS_ICONS]("h-5 w-5 text-green-400")}
                  <div>
                    <p className="text-white font-medium">{scan.name}</p>
                    <p className="text-sm text-gray-400">{shortenAddress(scan.contract)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={STATUS_COLORS[scan.status as keyof typeof STATUS_COLORS]}>
                    {formatStatus(scan.status)}
                  </Badge>
                  <Badge variant="outline" className="text-cyan-400">
                    <Zap className="h-3 w-3 mr-1" />
                    {scan.riskScore}% Risk
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ThreatMonitor;
