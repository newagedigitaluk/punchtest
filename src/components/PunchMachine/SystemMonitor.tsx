
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Clock, Wifi, WifiOff, RefreshCw } from "lucide-react";

interface SystemMonitorProps {
  onBack: () => void;
}

interface SystemStatus {
  webhook: 'online' | 'offline' | 'checking';
  database: 'online' | 'offline' | 'checking';
  paymentSystem: 'online' | 'offline' | 'checking';
  punchMachine: 'online' | 'offline' | 'checking';
  lastChecked: Date;
}

const SystemMonitor = ({ onBack }: SystemMonitorProps) => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    webhook: 'checking',
    database: 'checking',
    paymentSystem: 'checking',
    punchMachine: 'checking',
    lastChecked: new Date()
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkSystemStatus = async () => {
    setIsRefreshing(true);
    
    // Simulate checking various systems
    const checks = {
      webhook: checkWebhookStatus(),
      database: checkDatabaseStatus(),
      paymentSystem: checkPaymentSystemStatus(),
      punchMachine: checkPunchMachineStatus()
    };

    const results = await Promise.allSettled([
      checks.webhook,
      checks.database,
      checks.paymentSystem,
      checks.punchMachine
    ]);

    setSystemStatus({
      webhook: results[0].status === 'fulfilled' ? results[0].value : 'offline',
      database: results[1].status === 'fulfilled' ? results[1].value : 'offline',
      paymentSystem: results[2].status === 'fulfilled' ? results[2].value : 'offline',
      punchMachine: results[3].status === 'fulfilled' ? results[3].value : 'offline',
      lastChecked: new Date()
    });

    setIsRefreshing(false);
  };

  const checkWebhookStatus = async (): Promise<'online' | 'offline'> => {
    try {
      // Check Supabase edge functions health
      const response = await fetch('https://fpazipkhxsxcghwdnvqq.supabase.co/functions/v1/sumup-webhook', {
        method: 'OPTIONS',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwYXppcGtoeHN4Y2dod2RudnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NTQ5MDcsImV4cCI6MjA2NTEzMDkwN30.7aORFpQa_r3h8gezJeGmYpCr9pRixX6t73oEBNqCfHo'
        }
      });
      return response.ok ? 'online' : 'offline';
    } catch {
      return 'offline';
    }
  };

  const checkDatabaseStatus = async (): Promise<'online' | 'offline'> => {
    try {
      // Check database connectivity by doing a simple query
      const response = await fetch('https://fpazipkhxsxcghwdnvqq.supabase.co/rest/v1/transactions?select=count', {
        method: 'HEAD',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwYXppcGtoeHN4Y2dod2RudnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NTQ5MDcsImV4cCI6MjA2NTEzMDkwN30.7aORFpQa_r3h8gezJeGmYpCr9pRixX6t73oEBNqCfHo'
        }
      });
      return response.ok ? 'online' : 'offline';
    } catch {
      return 'offline';
    }
  };

  const checkPaymentSystemStatus = async (): Promise<'online' | 'offline'> => {
    try {
      // Check if we can fetch SumUp readers (tests API connectivity)
      const response = await fetch('https://fpazipkhxsxcghwdnvqq.supabase.co/functions/v1/sumup-readers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwYXppcGtoeHN4Y2dod2RudnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NTQ5MDcsImV4cCI6MjA2NTEzMDkwN30.7aORFpQa_r3h8gezJeGmYpCr9pRixX6t73oEBNqCfHo'
        },
        body: JSON.stringify({ isTestMode: false, action: 'list' })
      });
      const data = await response.json();
      return data.success ? 'online' : 'offline';
    } catch {
      return 'offline';
    }
  };

  const checkPunchMachineStatus = async (): Promise<'online' | 'offline'> => {
    try {
      // Check if punch machine Pi is responding
      const response = await fetch('https://cunning-burro-similarly.ngrok-free.app/health', { 
        method: 'HEAD',
        mode: 'no-cors'
      });
      return 'online';
    } catch {
      return 'offline';
    }
  };

  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: 'online' | 'offline' | 'checking') => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'offline':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'checking':
        return <Clock className="w-5 h-5 text-yellow-600 animate-spin" />;
    }
  };

  const getStatusBadge = (status: 'online' | 'offline' | 'checking') => {
    const variants = {
      online: 'bg-green-100 text-green-800 border-green-300',
      offline: 'bg-red-100 text-red-800 border-red-300',
      checking: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    };

    return (
      <Badge className={variants[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const systemChecks = [
    {
      name: 'Webhook Endpoint',
      status: systemStatus.webhook,
      description: 'SumUp payment webhook receiver',
      icon: <Wifi className="w-6 h-6" />
    },
    {
      name: 'Database',
      status: systemStatus.database,
      description: 'Supabase database connectivity',
      icon: <Wifi className="w-6 h-6" />
    },
    {
      name: 'Payment System',
      status: systemStatus.paymentSystem,
      description: 'SumUp API and card readers',
      icon: <Wifi className="w-6 h-6" />
    },
    {
      name: 'Punch Machine',
      status: systemStatus.punchMachine,
      description: 'Raspberry Pi hardware interface',
      icon: systemStatus.punchMachine === 'offline' ? <WifiOff className="w-6 h-6" /> : <Wifi className="w-6 h-6" />
    }
  ];

  const overallStatus = Object.values(systemStatus).slice(0, -1).every(status => status === 'online') ? 'online' : 
                       Object.values(systemStatus).slice(0, -1).some(status => status === 'checking') ? 'checking' : 'offline';

  return (
    <div className="h-screen bg-slate-100 text-slate-900 p-4 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-red-600">🔍 SYSTEM MONITOR</h1>
          <div className="flex gap-2">
            <Button 
              onClick={checkSystemStatus}
              disabled={isRefreshing}
              variant="outline" 
              className="text-slate-700 border-slate-400 bg-white hover:bg-slate-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={onBack} variant="outline" className="text-slate-700 border-slate-400 bg-white hover:bg-slate-50">
              ← Back
            </Button>
          </div>
        </div>

        <Card className="mb-6 bg-white border-slate-300 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-slate-900">
              <span className="flex items-center gap-3">
                {getStatusIcon(overallStatus)}
                System Overview
              </span>
              {getStatusBadge(overallStatus)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-600">
              Last checked: {systemStatus.lastChecked.toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {systemChecks.map((check) => (
            <Card key={check.name} className="bg-white border-slate-300 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-slate-900">
                  <span className="flex items-center gap-3">
                    {check.icon}
                    {check.name}
                  </span>
                  {getStatusBadge(check.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm mb-3">{check.description}</p>
                <div className="flex items-center gap-2 text-sm">
                  {getStatusIcon(check.status)}
                  <span className={
                    check.status === 'online' ? 'text-green-600' :
                    check.status === 'offline' ? 'text-red-600' : 'text-yellow-600'
                  }>
                    {check.status === 'online' && 'Connected and responding'}
                    {check.status === 'offline' && 'Not responding or unreachable'}
                    {check.status === 'checking' && 'Checking connectivity...'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6 bg-white border-slate-300 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">System Health Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>• If the Punch Machine shows offline, check that the Raspberry Pi is powered on and connected to the internet</p>
            <p>• If the Webhook Endpoint is offline, payment processing will not work</p>
            <p>• If the Payment System is offline, check your SumUp account and API keys</p>
            <p>• The system automatically checks status every 30 seconds</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemMonitor;
