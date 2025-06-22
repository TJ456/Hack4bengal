import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ThreatReportProps {
  walletAddress?: string;
  onReportSubmit?: (report: ThreatReport) => void;
}

interface ThreatReport {
  address: string;
  type: string;
  description: string;
  evidence: string;
  timestamp: Date;
}

const ThreatReport: React.FC<ThreatReportProps> = ({ walletAddress, onReportSubmit }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    address: '',
    type: 'scam',
    description: '',
    evidence: ''
  });

  const [recentReports] = useState<ThreatReport[]>([
    {
      address: '0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b',
      type: 'Token Drainer',
      description: 'Malicious smart contract draining user wallets',
      evidence: 'https://etherscan.io/address/0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b',
      timestamp: new Date()
    },
    {
      address: '0x9c4d1e9a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7',
      type: 'Phishing',
      description: 'Fake airdrop website stealing private keys',
      evidence: 'https://fake-airdrop.scam',
      timestamp: new Date(Date.now() - 86400000)
    }
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form
      if (!formData.address || !formData.description) {
        throw new Error('Please fill in all required fields');
      }

      // Create report object
      const report: ThreatReport = {
        ...formData,
        timestamp: new Date()
      };

      // Submit to blockchain/backend
      // await contractService.submitThreatReport(report);

      // Call parent callback if provided
      if (onReportSubmit) {
        onReportSubmit(report);
      }

      toast({
        title: "Report Submitted",
        description: "Thank you for helping secure the community!",
      });

      // Reset form
      setFormData({
        address: '',
        type: 'scam',
        description: '',
        evidence: ''
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit report",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getThreatBadgeColor = (type: string) => {
    switch (type) {
      case 'Token Drainer':
        return 'bg-red-500/20 text-red-400';
      case 'Phishing':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'Rug Pull':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Submit Report Card */}
      <Card className="bg-black/20 backdrop-blur-lg border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            Submit Threat Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                placeholder="Suspicious Contract/Wallet Address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="bg-black/30 text-white border-white/10"
                required
              />
            </div>
            <div>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full bg-black/30 text-white border border-white/10 rounded-md px-3 py-2"
                required
              >
                <option value="scam">Scam Token</option>
                <option value="phishing">Phishing Contract</option>
                <option value="rugpull">Rug Pull</option>
                <option value="drainer">Token Drainer</option>
                <option value="malware">Malware</option>
              </select>
            </div>
            <div>
              <textarea
                placeholder="Describe the suspicious behavior..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-black/30 text-white border border-white/10 rounded-md px-3 py-2 min-h-[100px]"
                required
              />
            </div>
            <div>
              <Input
                placeholder="Evidence URL (Optional)"
                value={formData.evidence}
                onChange={(e) => setFormData(prev => ({ ...prev, evidence: e.target.value }))}
                className="bg-black/30 text-white border-white/10"
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-yellow-500 to-red-500 hover:from-yellow-600 hover:to-red-600"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Reports Card */}
      <Card className="bg-black/20 backdrop-blur-lg border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            Recent Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentReports.map((report, index) => (
              <div
                key={index}
                className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white font-medium">{report.type}</span>
                      <Badge className={getThreatBadgeColor(report.type)}>
                        High Risk
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{report.description}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">{report.address.slice(0, 6)}...{report.address.slice(-4)}</span>
                      {report.evidence && (
                        <a
                          href={report.evidence}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                        >
                          <LinkIcon className="h-3 w-3" />
                          Evidence
                        </a>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(report.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThreatReport;
