
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Wifi, WifiOff, CheckCircle, AlertCircle } from "lucide-react";

interface SumUpSettingsProps {
  onBack: () => void;
}

const SumUpSettings = ({ onBack }: SumUpSettingsProps) => {
  const [isTestMode, setIsTestMode] = useState(true);
  const [readers, setReaders] = useState<any[]>([]);
  const [pairingCode, setPairingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  const fetchReaders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sumup-readers', {
        body: { isTestMode, action: 'list' }
      });

      if (error) throw error;

      if (data.success) {
        setReaders(data.readers || []);
        setStatus('Readers loaded successfully');
      } else {
        setStatus(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error('Failed to fetch readers:', err);
      setStatus('Failed to fetch readers');
    } finally {
      setLoading(false);
    }
  };

  const pairReader = async () => {
    if (!pairingCode.trim()) {
      setStatus('Please enter a pairing code');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sumup-readers', {
        body: { 
          isTestMode, 
          action: 'pair', 
          pairingCode: pairingCode.trim() 
        }
      });

      if (error) throw error;

      if (data.success) {
        setStatus('Reader paired successfully!');
        setPairingCode('');
        await fetchReaders(); // Refresh the list
      } else {
        setStatus(`Pairing failed: ${data.error}`);
      }
    } catch (err) {
      console.error('Failed to pair reader:', err);
      setStatus('Failed to pair reader');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReaders();
  }, [isTestMode]);

  return (
    <div className="h-screen bg-slate-100 text-slate-900 p-4 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-red-600">💳 SUMUP SETTINGS</h1>
          <Button onClick={onBack} variant="outline" className="text-slate-700 border-slate-400 bg-white hover:bg-slate-50">
            ← Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Environment Settings */}
          <Card className="bg-white border-slate-300 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-slate-900">
                <CreditCard className="w-6 h-6 text-blue-600" />
                Environment Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="testMode" className="text-slate-900 font-medium">Test Mode</Label>
                <Switch 
                  id="testMode"
                  checked={isTestMode}
                  onCheckedChange={setIsTestMode}
                />
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="text-sm font-medium text-slate-900 mb-1">
                  Current Mode: {isTestMode ? 'TEST' : 'LIVE'}
                </div>
                <div className="text-xs text-slate-600">
                  {isTestMode 
                    ? 'Using test credentials - no real money will be charged'
                    : 'Using live credentials - real payments will be processed'
                  }
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reader Pairing */}
          <Card className="bg-white border-slate-300 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-slate-900">
                <Wifi className="w-6 h-6 text-green-600" />
                Reader Pairing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pairingCode" className="text-slate-900 font-medium">Pairing Code</Label>
                <Input 
                  id="pairingCode"
                  value={pairingCode}
                  onChange={(e) => setPairingCode(e.target.value)}
                  placeholder="Enter 4-digit pairing code"
                  maxLength={4}
                  className="bg-white border-slate-300 text-slate-900"
                />
              </div>
              <Button 
                onClick={pairReader}
                disabled={loading || !pairingCode.trim()}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                {loading ? 'Pairing...' : 'Pair Reader'}
              </Button>
              <div className="text-xs text-slate-600">
                Hold down the pairing button on your SumUp Solo reader to get the pairing code
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Paired Readers List */}
        <Card className="mt-6 bg-white border-slate-300 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-900">
              <CreditCard className="w-6 h-6 text-blue-600" />
              Paired Readers
              <Button 
                onClick={fetchReaders}
                disabled={loading}
                size="sm"
                variant="outline"
                className="ml-auto text-slate-700 border-slate-400 bg-white hover:bg-slate-50"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {readers.length === 0 ? (
              <div className="text-center py-8">
                <WifiOff className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">No readers paired</p>
                <p className="text-sm text-slate-500">Pair a SumUp reader to start accepting payments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {readers.map((reader, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium text-slate-900">{reader.name || 'SumUp Reader'}</div>
                        <div className="text-sm text-slate-600">ID: {reader.card_reader_id}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        {reader.status || 'Active'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {reader.last_four ? `****${reader.last_four}` : 'Ready'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Messages */}
        {status && (
          <Card className="mt-6 bg-white border-slate-300 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <span className="text-slate-900">{status}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SumUpSettings;
