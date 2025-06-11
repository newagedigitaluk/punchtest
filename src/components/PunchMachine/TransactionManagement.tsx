
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, RefreshCw, RotateCcw, AlertTriangle, CheckCircle, XCircle, BarChart3 } from "lucide-react";

interface TransactionManagementProps {
  onBack: () => void;
}

interface Transaction {
  id: string;
  client_transaction_id: string;
  sumup_transaction_id: string | null;
  amount: number;
  currency: string;
  status: string;
  merchant_code: string;
  payment_method: string | null;
  created_at: string;
  punch_force: number | null;
  refund_amount: number | null;
  refund_reason: string | null;
}

interface ReportStats {
  totalTransactions: number;
  paidWithPunch: number;
  paidNoPunch: number;
  unpaidWithPunch: number;
  refunded: number;
  discrepancies: number;
  totalRevenue: number;
}

const TransactionManagement = ({ onBack }: TransactionManagementProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [stats, setStats] = useState<ReportStats>({
    totalTransactions: 0,
    paidWithPunch: 0,
    paidNoPunch: 0,
    unpaidWithPunch: 0,
    refunded: 0,
    discrepancies: 0,
    totalRevenue: 0
  });

  const fetchTransactions = async () => {
    setLoading(true);
    console.log('Fetching transactions from database...');
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      setDebugInfo(`Error: ${error.message}`);
    } else {
      console.log('Raw transaction data:', data);
      
      // Debug info about punch_force values
      const punchForceValues = data?.map(t => ({
        id: t.client_transaction_id.slice(0, 8),
        punch_force: t.punch_force,
        status: t.status,
        created_at: t.created_at
      })) || [];
      
      console.log('Punch force values:', punchForceValues);
      
      const debugText = `Found ${data?.length || 0} transactions. Punch force values: ${JSON.stringify(punchForceValues, null, 2)}`;
      setDebugInfo(debugText);
      
      setTransactions(data || []);
      calculateStats(data || []);
    }
    setLoading(false);
  };

  const calculateStats = (transactions: Transaction[]) => {
    const stats = {
      totalTransactions: transactions.length,
      paidWithPunch: 0,
      paidNoPunch: 0,
      unpaidWithPunch: 0,
      refunded: 0,
      discrepancies: 0,
      totalRevenue: 0
    };

    transactions.forEach(tx => {
      const isPaid = tx.status === 'successful';
      const hasPunch = tx.punch_force !== null && tx.punch_force > 0;
      const isRefunded = tx.refund_amount && tx.refund_amount > 0;

      if (isPaid) {
        stats.totalRevenue += tx.amount - (tx.refund_amount || 0);
      }

      if (isRefunded) {
        stats.refunded++;
      } else if (isPaid && hasPunch) {
        stats.paidWithPunch++;
      } else if (isPaid && !hasPunch) {
        stats.paidNoPunch++;
        stats.discrepancies++;
      } else if (!isPaid && hasPunch) {
        stats.unpaidWithPunch++;
        stats.discrepancies++;
      }
    });

    setStats(stats);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const getStatusIndicator = (transaction: Transaction) => {
    const isPaid = transaction.status === 'successful';
    const hasPunch = transaction.punch_force !== null && transaction.punch_force > 0;
    const isRefunded = transaction.refund_amount && transaction.refund_amount > 0;

    if (isRefunded) {
      return <Badge className="bg-purple-100 text-purple-800">Refunded</Badge>;
    } else if (isPaid && hasPunch) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Complete</Badge>;
    } else if (isPaid && !hasPunch) {
      return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Paid - No Punch</Badge>;
    } else if (!isPaid && hasPunch) {
      return <Badge className="bg-orange-100 text-orange-800"><XCircle className="w-3 h-3 mr-1" />Unpaid - Has Punch</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800">Incomplete</Badge>;
    }
  };

  const getPaymentStatus = (status: string) => {
    const colors = {
      successful: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={colors[status as keyof typeof colors] || colors.pending}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const handleRefund = async () => {
    if (!selectedTransaction) return;

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sumup-refund', {
        body: {
          transactionId: selectedTransaction.id,
          amount: parseFloat(refundAmount),
          reason: refundReason
        }
      });

      if (error) throw error;

      if (data.success) {
        console.log('Refund processed successfully');
        await fetchTransactions(); // Refresh the list
        setRefundDialogOpen(false);
        setSelectedTransaction(null);
        setRefundAmount('');
        setRefundReason('');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Refund error:', error);
      alert('Failed to process refund: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const openRefundDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setRefundAmount(transaction.amount.toString());
    setRefundReason('');
    setRefundDialogOpen(true);
  };

  const canRefund = (transaction: Transaction) => {
    return transaction.status === 'successful' && 
           (transaction.refund_amount || 0) < transaction.amount;
  };

  return (
    <div className="h-screen bg-slate-100 text-slate-900 p-4 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-red-600">📊 TRANSACTION MANAGEMENT</h1>
          <div className="flex gap-2">
            <Button 
              onClick={fetchTransactions}
              disabled={loading}
              variant="outline" 
              className="text-slate-700 border-slate-400 bg-white hover:bg-slate-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={onBack} variant="outline" className="text-slate-700 border-slate-400 bg-white hover:bg-slate-50">
              ← Back
            </Button>
          </div>
        </div>

        {/* Debug Information */}
        {debugInfo && (
          <Alert className="mb-6 border-blue-300 bg-blue-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>🔍 Debug Info:</strong>
              <pre className="mt-2 text-xs overflow-auto max-h-32">{debugInfo}</pre>
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-slate-900">{stats.totalTransactions}</div>
              <div className="text-sm text-slate-600">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.paidWithPunch}</div>
              <div className="text-sm text-slate-600">Complete</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.paidNoPunch}</div>
              <div className="text-sm text-slate-600">Paid No Punch</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.unpaidWithPunch}</div>
              <div className="text-sm text-slate-600">Unpaid w/ Punch</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.refunded}</div>
              <div className="text-sm text-slate-600">Refunded</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.discrepancies}</div>
              <div className="text-sm text-slate-600">Discrepancies</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">£{stats.totalRevenue.toFixed(2)}</div>
              <div className="text-sm text-slate-600">Net Revenue</div>
            </CardContent>
          </Card>
        </div>

        {/* Discrepancies Alert */}
        {stats.discrepancies > 0 && (
          <Alert className="mb-6 border-yellow-300 bg-yellow-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>⚠️ {stats.discrepancies} discrepancies found:</strong> 
              {stats.paidNoPunch > 0 && ` ${stats.paidNoPunch} payments without punches`}
              {stats.unpaidWithPunch > 0 && ` ${stats.unpaidWithPunch} punches without payments`}
            </AlertDescription>
          </Alert>
        )}

        <Card className="bg-white border-slate-300 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-900">
              <CreditCard className="w-6 h-6 text-red-600" />
              Transaction Details & Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-slate-600">No transactions found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Punch Force</TableHead>
                    <TableHead>Overall Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {transaction.client_transaction_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        £{transaction.amount.toFixed(2)}
                        {transaction.refund_amount && transaction.refund_amount > 0 && (
                          <div className="text-sm text-red-600">
                            -£{transaction.refund_amount.toFixed(2)} refunded
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getPaymentStatus(transaction.status)}</TableCell>
                      <TableCell>
                        {transaction.punch_force ? (
                          <span className="text-green-600 font-semibold">{transaction.punch_force} kg</span>
                        ) : (
                          <span className="text-gray-400">
                            No punch (raw: {JSON.stringify(transaction.punch_force)})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusIndicator(transaction)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {canRefund(transaction) && (
                            <Button
                              onClick={() => openRefundDialog(transaction)}
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Refund
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Refund</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedTransaction && (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p><strong>Transaction:</strong> {selectedTransaction.client_transaction_id}</p>
                  <p><strong>Original Amount:</strong> £{selectedTransaction.amount.toFixed(2)}</p>
                  <p><strong>Already Refunded:</strong> £{(selectedTransaction.refund_amount || 0).toFixed(2)}</p>
                  <p><strong>Available to Refund:</strong> £{(selectedTransaction.amount - (selectedTransaction.refund_amount || 0)).toFixed(2)}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="refund-amount">Refund Amount (£)</Label>
                <Input
                  id="refund-amount"
                  type="number"
                  step="0.01"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="refund-reason">Reason for Refund</Label>
                <Textarea
                  id="refund-reason"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Enter reason for refund..."
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setRefundDialogOpen(false)}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleRefund}
                  disabled={processing || !refundAmount}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {processing ? 'Processing...' : 'Process Refund'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TransactionManagement;
