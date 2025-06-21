import { useEffect, useState } from 'react';
import { switchToMonadNetwork } from '../web3/wallet';
import { isMonadNetwork, NETWORK_INFO } from '../web3/utils';

interface MonadSwitcherProps {
  chainId?: string | null;
  onNetworkSwitch?: (success: boolean) => void;
  className?: string;
}

/**
 * A React component that shows a button to switch to Monad network
 */
export default function MonadNetworkSwitcher({ 
  chainId, 
  onNetworkSwitch,
  className = ''
}: MonadSwitcherProps) {
  const [switching, setSwitching] = useState(false);
  const [isMonad, setIsMonad] = useState(false);
  
  useEffect(() => {
    setIsMonad(isMonadNetwork(chainId));
  }, [chainId]);
  
  const handleSwitchNetwork = async () => {
    if (isMonad) return;
    
    setSwitching(true);
    try {
      const success = await switchToMonadNetwork();
      if (onNetworkSwitch) {
        onNetworkSwitch(success);
      }
    } catch (error) {
      console.error('Failed to switch to Monad:', error);
      if (onNetworkSwitch) {
        onNetworkSwitch(false);
      }
    } finally {
      setSwitching(false);
    }
  };
  
  if (isMonad) {
    return (
      <div className={`flex items-center gap-2 text-green-600 ${className}`}>
        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
        Connected to Monad Testnet
      </div>
    );
  }
  
  return (
    <button
      onClick={handleSwitchNetwork}
      disabled={switching}
      className={`flex items-center gap-2 px-3 py-1 text-white bg-purple-600 rounded-md hover:bg-purple-700 ${switching ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {switching ? (
        <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"></span>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4V20M12 4L6 10M12 4L18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      Switch to Monad Testnet
    </button>
  );
}
