import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Key, UserPlus, Shield, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import contractService from '@/web3/contract';

interface Guardian {
  address: string;
  nickname: string;
  status: 'active' | 'pending' | 'removed';
  dateAdded: Date;
}

interface GuardianSettingsProps {
  walletAddress?: string;
}

const GuardianSettings: React.FC<GuardianSettingsProps> = ({ walletAddress }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [newGuardian, setNewGuardian] = useState({ address: '', nickname: '' });
  const [recoveryThreshold, setRecoveryThreshold] = useState(2);

  useEffect(() => {
    if (walletAddress) {
      loadGuardians();
    }
  }, [walletAddress]);

  const loadGuardians = async () => {
    try {
      setIsLoading(true);
      // In a real implementation, fetch from smart contract
      // const guardianList = await contractService.getGuardians(walletAddress);
      // For demo, using mock data
      const mockGuardians: Guardian[] = [
        {
          address: '0x123...abc',
          nickname: 'Hardware Wallet',
          status: 'active',
          dateAdded: new Date(2025, 5, 1)
        },
        {
          address: '0x456...def',
          nickname: 'Backup Device',
          status: 'active',
          dateAdded: new Date(2025, 5, 15)
        }
      ];
      setGuardians(mockGuardians);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load guardians',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addGuardian = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuardian.address || !newGuardian.nickname) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      // In real implementation:
      // await contractService.addGuardian(walletAddress, newGuardian.address);
      
      const newGuardianObj: Guardian = {
        address: newGuardian.address,
        nickname: newGuardian.nickname,
        status: 'pending',
        dateAdded: new Date()
      };

      setGuardians([...guardians, newGuardianObj]);
      setNewGuardian({ address: '', nickname: '' });

      toast({
        title: 'Guardian Added',
        description: 'New guardian successfully added to your wallet',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add guardian',
        variant: 'destructive'
      });
    }
  };

  const removeGuardian = async (address: string) => {
    try {
      // In real implementation:
      // await contractService.removeGuardian(walletAddress, address);
      
      setGuardians(guardians.filter(g => g.address !== address));
      
      toast({
        title: 'Guardian Removed',
        description: 'Guardian has been removed from your wallet',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove guardian',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'removed':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Setup Info Card */}
      <Card className="bg-black/20 backdrop-blur-lg border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-cyan-400" />
            Guardian Recovery Setup
          </CardTitle>
          <CardDescription className="text-gray-400">
            Add trusted guardians to help recover your wallet if you lose access.
            A minimum of {recoveryThreshold} guardians must approve the recovery process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={addGuardian} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Guardian Wallet Address"
                value={newGuardian.address}
                onChange={(e) => setNewGuardian(prev => ({ ...prev, address: e.target.value }))}
                className="bg-black/30 text-white border-white/10"
              />
              <Input
                placeholder="Nickname (e.g., Hardware Wallet)"
                value={newGuardian.nickname}
                onChange={(e) => setNewGuardian(prev => ({ ...prev, nickname: e.target.value }))}
                className="bg-black/30 text-white border-white/10"
              />
            </div>
            <Button 
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Guardian
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Active Guardians Card */}
      <Card className="bg-black/20 backdrop-blur-lg border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Key className="h-5 w-5 text-purple-400" />
            Active Guardians
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center text-gray-400">Loading guardians...</div>
          ) : guardians.length === 0 ? (
            <div className="text-center p-6">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-gray-400">No guardians added yet. Add guardians to enable social recovery.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {guardians.map((guardian, index) => (
                <div 
                  key={index}
                  className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">{guardian.nickname}</span>
                        <Badge className={getStatusColor(guardian.status)}>
                          {guardian.status.charAt(0).toUpperCase() + guardian.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-400">{guardian.address}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Added on {guardian.dateAdded.toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => removeGuardian(guardian.address)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recovery Settings Card */}
      <Card className="bg-black/20 backdrop-blur-lg border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-400" />
            Recovery Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <h4 className="text-white font-medium">Required Confirmations</h4>
                <p className="text-sm text-gray-400">Number of guardians needed for recovery</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setRecoveryThreshold(prev => Math.max(2, prev - 1))}
                  className="text-white border-white/10"
                  disabled={recoveryThreshold <= 2}
                >
                  -
                </Button>
                <span className="text-white w-8 text-center">{recoveryThreshold}</span>
                <Button
                  variant="outline"
                  onClick={() => setRecoveryThreshold(prev => Math.min(guardians.length, prev + 1))}
                  className="text-white border-white/10"
                  disabled={recoveryThreshold >= guardians.length}
                >
                  +
                </Button>
              </div>
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              onClick={() => {
                toast({
                  title: "Settings Saved",
                  description: `Recovery threshold set to ${recoveryThreshold} guardians`,
                });
              }}
            >
              Save Recovery Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GuardianSettings;
