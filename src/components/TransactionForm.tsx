import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { AlertCircle } from 'lucide-react';
import walletConnector from '../web3/wallet';
import { isValidAddress, formatEth } from '../web3/utils';
import { sendTransaction } from '../web3/contract';

interface TransactionFormProps {
  onTransactionComplete: (txHash: string) => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onTransactionComplete }) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletConnector.address || !isValidAddress(recipient) || !amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid recipient address and amount");
      return;
    }

    try {
      setIsSending(true);
      setError(null);

      const hash = await sendTransaction(recipient, amount);
      onTransactionComplete(hash);

      // Clear form
      setRecipient('');
      setAmount('');
    } catch (err: any) {
      console.error("Transaction error:", err);
      if (err.code === 4001 || err.message?.includes('user rejected')) {
        setError('Transaction cancelled');
      } else {
        setError(err.message);
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Transaction</CardTitle>
        <CardDescription>
          Send ETH to another address
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center space-x-2 text-red-500 text-sm mb-4">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={isSending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (ETH)</Label>
            <Input
              id="amount"
              type="number"
              step="0.000000000000000001"
              min="0"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isSending}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSending || !recipient || !amount}
          >
            {isSending ? "Sending..." : "Send Transaction"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TransactionForm;
