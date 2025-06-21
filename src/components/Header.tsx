import React from 'react';
import { Shield, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WalletConnect from '@/components/WalletConnect';
import { useToast } from '@/hooks/use-toast';

interface HeaderProps {
  walletConnected: boolean;
  currentAddress: string;
  onWalletConnect: (address: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  walletConnected,
  currentAddress,
  onWalletConnect,
  activeTab,
  onTabChange
}) => {
  const { toast } = useToast();

  const navigationItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'analytics', label: 'Wallet Analysis' },
    { id: 'dao', label: 'DAO Voting' },
    { id: 'reports', label: 'Threat Report' },
  ];

  return (
    <header className="border-b border-white/10 bg-black/20 backdrop-blur-lg sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Shield className="h-8 w-8 text-cyan-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">The Unhackable Wallet</h1>
              <p className="text-sm text-gray-400">AI-Powered Web3 Guardian</p>
            </div>
          </div>

          {/* Center: Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right: Connect Wallet and Settings */}
          <div className="flex items-center space-x-4">
            <WalletConnect 
              onConnect={(address) => {
                onWalletConnect(address);
                toast({
                  title: "Wallet Connected",
                  description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
                });
              }}
              isConnected={walletConnected}
              address={currentAddress}
            />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onTabChange('settings')}
              className={`text-gray-400 hover:text-white hover:bg-white/5 ${
                activeTab === 'settings' ? 'text-cyan-400 bg-cyan-500/20' : ''
              }`}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-4 flex flex-wrap gap-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
