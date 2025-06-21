import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, Shield, UserPlus, UserMinus, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { ethers } from 'ethers';
import socialRecoveryService from '@/web3/socialRecovery';
import addresses from '@/web3/addresses.json';

interface Guardian {
  address: string;
  status: 'active' | 'pending';
}

interface RecoveryRequest {
  id: number;
  proposedOwner: string;
  initiationTime: number;
  approvals: number;
  executed: boolean;
}

const GuardianManager: React.FC<{ walletAddress: string | null }> = ({ walletAddress }): JSX.Element => {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [newGuardian, setNewGuardian] = useState('');
  const [recoveryRequests, setRecoveryRequests] = useState<RecoveryRequest[]>([]);
  const [newOwnerAddress, setNewOwnerAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadGuardians = async () => {
    try {
      setLoading(true);
      const guardiansList = await socialRecoveryService.getGuardians();
      setGuardians(guardiansList.map(addr => ({ address: addr, status: 'active' })));
      setError(null);
    } catch (err) {
      console.error('Failed to load guardians:', err);
      setError('Failed to load guardians');
    } finally {
      setLoading(false);
    }
  };

  const loadRecoveryRequests = async () => {
    try {
      setLoading(true);
      const requests = await socialRecoveryService.getRecoveryRequests();
      setRecoveryRequests(requests);
      setError(null);
    } catch (err) {
      console.error('Failed to load recovery requests:', err);
      setError('Failed to load recovery requests');
    } finally {
      setLoading(false);
    }
  };  // Initialize service and load data when wallet is connected
  useEffect(() => {
    const initializeService = async () => {
      try {
        if (!walletAddress) {
          setError('Please connect your wallet first');
          setInitialized(false);
          return;
        }

        setError(null);
        setLoading(true);
        
        // Initialize service with contract address from addresses.json
        if (!socialRecoveryService.isInitialized) {
          await socialRecoveryService.initialize(addresses.socialRecoveryWallet);
        }
        
        setInitialized(true);
        
        // Load initial data
        await loadGuardians();
        await loadRecoveryRequests();
        
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to initialize social recovery service');
        setInitialized(false);
      } finally {
        setLoading(false);
      }
    };

    initializeService();
  }, [walletAddress]);

  const handleAddGuardian = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ethers.isAddress(newGuardian)) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Ethereum address",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      await socialRecoveryService.addGuardian(newGuardian);
      toast({
        title: "Guardian Added",
        description: "The guardian has been successfully added",
      });
      setNewGuardian('');
      await loadGuardians();
    } catch (err) {
      console.error('Failed to add guardian:', err);
      toast({
        title: "Error",
        description: "Failed to add guardian",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveGuardian = async (address: string) => {
    try {
      setLoading(true);
      await socialRecoveryService.removeGuardian(address);
      toast({
        title: "Guardian Removed",
        description: "The guardian has been successfully removed",
      });
      await loadGuardians();
    } catch (err) {
      console.error('Failed to remove guardian:', err);
      toast({
        title: "Error",
        description: "Failed to remove guardian",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ethers.isAddress(newOwnerAddress)) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Ethereum address",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      await socialRecoveryService.initiateRecovery(newOwnerAddress);
      toast({
        title: "Recovery Initiated",
        description: "The recovery process has been initiated",
      });
      setNewOwnerAddress('');
      await loadRecoveryRequests();
    } catch (err) {
      console.error('Failed to initiate recovery:', err);
      toast({
        title: "Error",
        description: "Failed to initiate recovery",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRecovery = async (requestId: number) => {
    try {
      setLoading(true);
      await socialRecoveryService.approveRecovery(requestId);
      toast({
        title: "Recovery Approved",
        description: "You have approved the recovery request",
      });
      await loadRecoveryRequests();
    } catch (err) {
      console.error('Failed to approve recovery:', err);
      toast({
        title: "Error",
        description: "Failed to approve recovery",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!initialized) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Social Recovery</CardTitle>
          <CardDescription>Wallet Security & Recovery Management</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Initializing social recovery...</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-6 w-6 mr-2" />
          Social Recovery
        </CardTitle>
        <CardDescription>Manage your wallet recovery guardians and requests</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Guardian Form */}
        <form onSubmit={handleAddGuardian} className="space-y-4">
          <div className="flex space-x-2">
            <Input 
              placeholder="Guardian address (0x...)"
              value={newGuardian}
              onChange={e => setNewGuardian(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !newGuardian}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Add Guardian
            </Button>
          </div>
        </form>

        {/* Guardians List */}
        <div className="space-y-4">
          <h3 className="font-medium">Current Guardians</h3>
          {guardians.length === 0 ? (
            <p className="text-sm text-muted-foreground">No guardians added yet</p>
          ) : (
            <div className="space-y-2">
              {guardians.map(guardian => (
                <div key={guardian.address} className="flex items-center justify-between p-2 rounded-lg border">
                  <span className="text-sm font-mono">{guardian.address}</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveGuardian(guardian.address)}
                    disabled={loading}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recovery Requests */}
        <div className="space-y-4">
          <h3 className="font-medium">Recovery Requests</h3>
          {recoveryRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active recovery requests</p>
          ) : (
            <div className="space-y-2">
              {recoveryRequests.map(request => (
                <div key={request.id} className="p-4 rounded-lg border space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm">New Owner: <span className="font-mono">{request.proposedOwner}</span></p>
                      <p className="text-sm text-muted-foreground">
                        <Clock className="inline h-4 w-4 mr-1" />
                        Initiated {new Date(request.initiationTime * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={request.executed ? "default" : "secondary"}>
                      {request.executed ? (
                        <><CheckCircle2 className="h-4 w-4 mr-1" /> Executed</>
                      ) : (
                        <>{request.approvals} Approvals</>
                      )}
                    </Badge>
                  </div>
                  {!request.executed && (
                    <Button
                      className="w-full"
                      onClick={() => handleApproveRecovery(request.id)}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve Recovery"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Initiate Recovery Form */}
        <form onSubmit={handleInitiateRecovery} className="space-y-4">
          <h3 className="font-medium">Initiate Recovery</h3>
          <div className="flex space-x-2">
            <Input 
              placeholder="New owner address (0x...)"
              value={newOwnerAddress}
              onChange={e => setNewOwnerAddress(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !newOwnerAddress}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Initiate"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default GuardianManager;
