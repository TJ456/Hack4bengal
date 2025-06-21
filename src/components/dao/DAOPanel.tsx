import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, CheckCircle, XCircle, AlertCircle, AlertTriangle, ThumbsUp, ThumbsDown } from 'lucide-react';
import contractService from '@/web3/contract';
import walletConnector from '@/web3/wallet';
import { voteOnProposal } from '@/web3/contract';
import { shortenAddress, formatEth } from '@/web3/utils';
import QuadraticVoteInput from '../QuadraticVoteInput';
import { useToast } from '@/hooks/use-toast';

interface ScamReport {
  id: number;
  reporter: string;
  suspiciousAddress: string;
  description: string;
  evidence: string;
  timestamp: Date;
  votesFor: string;  // Wei string from contract
  votesAgainst: string;  // Wei string from contract
  status: 'active' | 'approved' | 'rejected';
}

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center p-8 text-center bg-black/20 rounded-lg border border-white/10">
    <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
    <h3 className="text-xl font-semibold text-white mb-2">No Scam Reports Yet</h3>
    <p className="text-gray-400 mb-4">
      Help secure the community by being the first to report suspicious activity.
      Your report will be voted on by SHIELD token holders.
    </p>
    <Button 
      className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
      onClick={() => window.location.href = '#report'}
    >
      Submit First Report
    </Button>
  </div>
);

const DAOPanel = () => {
  const { toast } = useToast();
  
  // State management
  const [userVotes, setUserVotes] = useState<{[key: number]: 'approve' | 'reject' | null}>({});
  const [proposals, setProposals] = useState<ScamReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userShield, setUserShield] = useState<string>('0'); // Wei string
  const [isVoting, setIsVoting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load proposals and user data from the contract
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!walletConnector.address) return;

        // Get all scam reports from the contract
        const reports = await contractService.getScamReports();
        setProposals(reports);

        // Get user's SHIELD token balance
        const shieldBalance = await contractService.getShieldBalance(walletConnector.address);
        setUserShield(shieldBalance);
        
      } catch (err: any) {
        console.error("Error fetching DAO data:", err);
        setError(err.message || "Failed to load DAO data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Set up event listeners
    const handleAccountChange = () => fetchData();
    window.addEventListener('wallet_accountChanged', handleAccountChange);
    
    return () => {
      window.removeEventListener('wallet_accountChanged', handleAccountChange);
    };
  }, []);
  
  // Handle quadratic voting
  const handleVote = async (proposalId: number, tokens: string, isApprove: boolean) => {
    if (!walletConnector.address) {
      setError("Please connect your wallet to vote");
      return;
    }
    
    try {
      setIsVoting(true);
      setError(null);
      
      // Update local state for immediate UI feedback
      setUserVotes(prev => ({ ...prev, [proposalId]: isApprove ? 'approve' : 'reject' }));
      
      // Get token approval if needed
      const needsApproval = await contractService.needsShieldApproval(tokens);
      if (needsApproval) {
        await contractService.approveShield(tokens);
      }
      
      // Submit quadratic vote to the blockchain
      const tx = await contractService.castQuadraticVote(
        proposalId.toString(),
        isApprove,
        tokens
      );
      
      // Wait for transaction confirmation
      await tx.wait();
      
      // Refresh data
      const reports = await contractService.getScamReports();
      setProposals(reports);
      
      // Show success message
      toast({
        title: "🗳️ Vote Submitted",
        description: `Your vote has been recorded with ${Math.sqrt(Number(formatEth(tokens)))} voting power`,
      });
      
    } catch (err: any) {
      console.error("Voting error:", err);
      setError(err.message || "Failed to submit vote");
      // Revert the optimistic update
      setUserVotes(prev => ({ ...prev, [proposalId]: null }));
      
      toast({
        title: "❌ Vote Failed",
        description: err.message || "Failed to submit vote",
        variant: "destructive"
      });
    } finally {
      setIsVoting(false);
    }
  };

  // Get CSS class for status badge
  const getStatusColor = (status: ScamReport['status']) => {
    switch(status) {
      case 'approved':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'rejected':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      default:
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    }
  };

  // Get CSS class for category badge
  const getCategoryColor = (description: string) => {
    if (description.toLowerCase().includes('nft')) {
      return 'bg-purple-500/20 text-purple-400';
    }
    if (description.toLowerCase().includes('honeypot')) {
      return 'bg-yellow-500/20 text-yellow-400';
    }
    if (description.toLowerCase().includes('approval')) {
      return 'bg-red-500/20 text-red-400';
    }
    if (description.toLowerCase().includes('phish')) {
      return 'bg-orange-500/20 text-orange-400';
    }
    return 'bg-gray-500/20 text-gray-400';
  };

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        setIsLoading(true);
        // Use provider directly from walletConnector
        if (!walletConnector.provider) {
          toast({
            title: "Wallet Not Connected",
            description: "Please connect your wallet to view DAO proposals.",
            variant: "destructive"
          });
          return;
        }

        // Get existing proposals from the contract
        try {
          // For demo, generate some sample data until contract is fully integrated
          const sampleProposals: ScamReport[] = [
            {
              id: 1,
              reporter: "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
              suspiciousAddress: "0xa12066091c6F636505Bd64F2160EA1884142B38c",
              description: "Fake NFT Mint Site",
              evidence: "https://evidence.xyz/proof1",
              timestamp: new Date(),
              votesFor: "100000000000000000000",  // 100 tokens
              votesAgainst: "50000000000000000000", // 50 tokens
              status: 'active'
            }
          ];
          setProposals(sampleProposals);
        } catch (error) {
          console.error("Contract interaction failed:", error);
          setProposals([]);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch proposals:", error);
        setIsLoading(false);
        toast({
          title: "Error Loading Proposals",
          description: "Failed to load DAO proposals. Please try again.",
          variant: "destructive"
        });
      }
    };

    fetchProposals();
  }, [toast]);

  if (isLoading) {
    return (
      <Card className="bg-black/20 backdrop-blur-lg border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Quadratic Voting DAO</CardTitle>
          <CardDescription className="text-gray-400">
            Loading community proposals...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-t-2 border-cyan-500 rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show empty state if no proposals
  if (!proposals || proposals.length === 0) {
    return (
      <Card className="bg-black/20 backdrop-blur-lg border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Quadratic Voting DAO</CardTitle>
          <CardDescription className="text-gray-400">
            Vote on community-reported threats using your SHIELD tokens. 
            Your voting power scales with the square root of tokens used.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-black/20 backdrop-blur-lg border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Users className="h-5 w-5 text-cyan-400" />
            <span>Quadratic Voting DAO</span>
          </CardTitle>
          <CardDescription>
            Vote on community-reported threats using your SHIELD tokens.
            Your voting power scales with the square root of tokens used.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <div className="p-4 mb-4 bg-red-500/20 border border-red-500/30 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-400">{error}</p>
            </div>
          )}
          
          {loading && (
            <div className="text-center p-4">
              <p className="text-gray-400">Loading proposals...</p>
            </div>
          )}
          
          {!walletConnector.address && !loading && (
            <div className="text-center p-4 bg-blue-500/20 border border-blue-500/30 rounded-md">
              <p className="text-blue-400">Connect your wallet to view and vote on DAO proposals</p>
            </div>
          )}
          
          {proposals.length === 0 && !loading && walletConnector.address && (
            <Card className="bg-black/20 backdrop-blur-lg border-white/10">
              <CardContent className="p-6 text-center">
                <p className="text-gray-400">No scam reports found. Be the first to report a scam!</p>
              </CardContent>
            </Card>
          )}
          
          {proposals.map((proposal) => (
            <Card key={proposal.id} className="bg-black/20 backdrop-blur-lg border-white/10 mb-4">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-white">
                        Report #{proposal.id}: {shortenAddress(proposal.suspiciousAddress)}
                      </h3>
                      <Badge className={getStatusColor(proposal.status)}>
                        {proposal.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge className={getCategoryColor(proposal.description)}>
                        {proposal.description.split(' ')[0]}
                      </Badge>
                      <span className="text-sm text-gray-400">
                        Reported by {shortenAddress(proposal.reporter)}
                      </span>
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(proposal.timestamp).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <p className="mt-2 text-gray-300">
                  {proposal.description}
                </p>
                
                {proposal.evidence && (
                  <a 
                    href={proposal.evidence}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-cyan-400 hover:underline flex items-center mt-1"
                  >
                    View Evidence
                  </a>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <ThumbsUp className="h-4 w-4 text-green-500" />
                      <span className="text-white">{formatEth(proposal.votesFor)} Power</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ThumbsDown className="h-4 w-4 text-red-500" />
                      <span className="text-white">{formatEth(proposal.votesAgainst)} Power</span>
                    </div>
                  </div>
                </div>
                
                {proposal.status === 'active' && (
                  <QuadraticVoteInput
                    proposalId={proposal.id}
                    maxTokens={userShield}
                    onVote={handleVote}
                    isVoting={isVoting && userVotes[proposal.id] !== null}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default DAOPanel;
