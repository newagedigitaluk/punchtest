import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { Settings, BarChart3, Wrench, Users, CreditCard, Monitor } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SumUpSettings from "./SumUpSettings";
import SystemMonitor from "./SystemMonitor";
import TransactionManagement from "./TransactionManagement";

interface AdminMenuProps {
  onExit: () => void;
}

interface QuickStats {
  todayPunches: number;
  todayRevenue: number;
  highScore: number;
  totalTransactions: number;
}

interface DetailedStats {
  totalPunches: number;
  averageForce: number;
  successRate: number;
  totalRevenue: number;
  weekRevenue: number;
  todayRevenue: number;
  highScores: Array<{
    rank: number;
    score: number;
    time: string;
  }>;
}

const AdminMenu = ({ onExit }: AdminMenuProps) => {
  const [currentView, setCurrentView] = useState<'main' | 'settings' | 'stats' | 'maintenance' | 'sumup' | 'monitor' | 'transactions'>('main');
  const [quickStats, setQuickStats] = useState<QuickStats>({
    todayPunches: 0,
    todayRevenue: 0,
    highScore: 0,
    totalTransactions: 0
  });
  const [detailedStats, setDetailedStats] = useState<DetailedStats>({
    totalPunches: 0,
    averageForce: 0,
    successRate: 0,
    totalRevenue: 0,
    weekRevenue: 0,
    todayRevenue: 0,
    highScores: []
  });
  const [settings, setSettings] = useState({
    pricePerPunch: 1.00,
    difficulty: 'normal',
    soundEnabled: true,
    lightingEnabled: true,
    maintenanceMode: false,
    autoRestart: true,
    sessionTimeout: 60
  });

  const fetchQuickStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's transactions
    const { data: todayTransactions } = await supabase
      .from('transactions')
      .select('*')
      .gte('created_at', `${today}T00:00:00Z`)
      .lt('created_at', `${today}T23:59:59Z`);

    // Get all transactions for totals
    const { data: allTransactions } = await supabase
      .from('transactions')
      .select('*');

    const todaySuccessful = todayTransactions?.filter(t => t.status === 'successful') || [];
    const todayPunches = todayTransactions?.filter(t => t.punch_force && t.punch_force > 0) || [];
    const todayRevenue = todaySuccessful.reduce((sum, t) => sum + (t.amount - (t.refund_amount || 0)), 0);
    
    const allPunches = allTransactions?.filter(t => t.punch_force && t.punch_force > 0) || [];
    const highScore = allPunches.length > 0 ? Math.max(...allPunches.map(t => t.punch_force || 0)) : 0;

    setQuickStats({
      todayPunches: todayPunches.length,
      todayRevenue: todayRevenue,
      highScore: highScore,
      totalTransactions: allTransactions?.length || 0
    });
  };

  const fetchDetailedStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    // Get all transactions
    const { data: allTransactions } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    // Get this week's transactions
    const { data: weekTransactions } = await supabase
      .from('transactions')
      .select('*')
      .gte('created_at', weekAgo.toISOString())
      .eq('status', 'successful');

    // Get today's transactions
    const { data: todayTransactions } = await supabase
      .from('transactions')
      .select('*')
      .gte('created_at', `${today}T00:00:00Z`)
      .lt('created_at', `${today}T23:59:59Z`)
      .eq('status', 'successful');

    const allPunches = allTransactions?.filter(t => t.punch_force && t.punch_force > 0) || [];
    const successfulTransactions = allTransactions?.filter(t => t.status === 'successful') || [];
    
    const totalRevenue = successfulTransactions.reduce((sum, t) => sum + (t.amount - (t.refund_amount || 0)), 0);
    const weekRevenue = weekTransactions?.reduce((sum, t) => sum + (t.amount - (t.refund_amount || 0)), 0) || 0;
    const todayRevenue = todayTransactions?.reduce((sum, t) => sum + (t.amount - (t.refund_amount || 0)), 0) || 0;
    
    const averageForce = allPunches.length > 0 
      ? Math.round(allPunches.reduce((sum, t) => sum + (t.punch_force || 0), 0) / allPunches.length)
      : 0;
    
    const successRate = allTransactions && allTransactions.length > 0
      ? Math.round((allPunches.length / allTransactions.length) * 100 * 10) / 10
      : 0;

    // Get top 5 punch scores with timestamps
    const topPunches = allPunches
      .sort((a, b) => (b.punch_force || 0) - (a.punch_force || 0))
      .slice(0, 5)
      .map((t, index) => ({
        rank: index + 1,
        score: t.punch_force || 0,
        time: getTimeAgo(t.created_at)
      }));

    setDetailedStats({
      totalPunches: allPunches.length,
      averageForce: averageForce,
      successRate: successRate,
      totalRevenue: totalRevenue,
      weekRevenue: weekRevenue,
      todayRevenue: todayRevenue,
      highScores: topPunches
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Less than 1 hour ago';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  };

  useEffect(() => {
    if (currentView === 'main') {
      fetchQuickStats();
    } else if (currentView === 'stats') {
      fetchDetailedStats();
    }
  }, [currentView]);

  const menuItems = [
    { id: 'monitor', title: 'System Monitor', icon: Monitor, description: 'Check system health and connectivity status' },
    { id: 'transactions', title: 'Transaction Management', icon: CreditCard, description: 'View transactions, process refunds, and analyze payment vs punch data' },
    { id: 'settings', title: 'Machine Settings', icon: Settings, description: 'Configure pricing, difficulty, and system settings' },
    { id: 'sumup', title: 'SumUp Payment', icon: CreditCard, description: 'Configure SumUp payment system and card readers' },
    { id: 'stats', title: 'Statistics', icon: BarChart3, description: 'View usage statistics and performance data' },
    { id: 'maintenance', title: 'Maintenance', icon: Wrench, description: 'System diagnostics and maintenance tools' }
  ];

  if (currentView === 'sumup') {
    return <SumUpSettings onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'monitor') {
    return <SystemMonitor onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'transactions') {
    return <TransactionManagement onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'main') {
    return (
      <div className="h-screen bg-slate-100 text-slate-900 p-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-red-600">🔧 ADMIN PANEL</h1>
            <Button onClick={onExit} variant="outline" className="text-slate-700 border-slate-400 bg-white hover:bg-slate-50">
              Exit Admin
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menuItems.map((item) => (
              <Card key={item.id} className="bg-white border-slate-300 hover:bg-slate-50 cursor-pointer transition-colors shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-3 text-slate-900">
                    <item.icon className="w-6 h-6 text-red-600" />
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 text-sm mb-3">{item.description}</p>
                  <Button 
                    onClick={() => setCurrentView(item.id as any)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
                  >
                    Open {item.title}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-6 bg-white border-slate-300 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-slate-900">
                <Users className="w-6 h-6 text-green-600" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{quickStats.todayPunches}</div>
                  <div className="text-sm text-slate-600">Today's Punches</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">£{quickStats.todayRevenue.toFixed(2)}</div>
                  <div className="text-sm text-slate-600">Today's Revenue</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{quickStats.highScore}</div>
                  <div className="text-sm text-slate-600">High Score (kg)</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{quickStats.totalTransactions}</div>
                  <div className="text-sm text-slate-600">Total Transactions</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentView === 'settings') {
    return (
      <div className="h-screen bg-slate-100 text-slate-900 p-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-red-600">⚙️ MACHINE SETTINGS</h1>
            <Button onClick={() => setCurrentView('main')} variant="outline" className="text-slate-700 border-slate-400 bg-white hover:bg-slate-50">
              ← Back
            </Button>
          </div>

          <Card className="bg-white border-slate-300 shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-slate-900 font-medium">Price Per Punch (£)</Label>
                <Input 
                  id="price"
                  type="number" 
                  step="0.10"
                  value={settings.pricePerPunch}
                  onChange={(e) => setSettings({...settings, pricePerPunch: parseFloat(e.target.value)})}
                  className="bg-white border-slate-300 text-slate-900"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeout" className="text-slate-900 font-medium">Session Timeout (seconds)</Label>
                <Input 
                  id="timeout"
                  type="number" 
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                  className="bg-white border-slate-300 text-slate-900"
                />
              </div>

              <Separator className="bg-slate-300" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sound" className="text-slate-900 font-medium">Sound Effects</Label>
                  <Switch 
                    id="sound"
                    checked={settings.soundEnabled}
                    onCheckedChange={(checked) => setSettings({...settings, soundEnabled: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="lighting" className="text-slate-900 font-medium">LED Lighting</Label>
                  <Switch 
                    id="lighting"
                    checked={settings.lightingEnabled}
                    onCheckedChange={(checked) => setSettings({...settings, lightingEnabled: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="maintenance" className="text-slate-900 font-medium">Maintenance Mode</Label>
                  <Switch 
                    id="maintenance"
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="restart" className="text-slate-900 font-medium">Auto Restart</Label>
                  <Switch 
                    id="restart"
                    checked={settings.autoRestart}
                    onCheckedChange={(checked) => setSettings({...settings, autoRestart: checked})}
                  />
                </div>
              </div>

              <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold">
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentView === 'stats') {
    return (
      <div className="h-screen bg-slate-100 text-slate-900 p-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-red-600">📊 STATISTICS</h1>
            <Button onClick={() => setCurrentView('main')} variant="outline" className="text-slate-700 border-slate-400 bg-white hover:bg-slate-50">
              ← Back
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="bg-white border-slate-300 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Punches:</span>
                  <span className="text-slate-900 font-semibold">{detailedStats.totalPunches.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Average Force:</span>
                  <span className="text-slate-900 font-semibold">{detailedStats.averageForce} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Success Rate:</span>
                  <span className="text-green-600 font-semibold">{detailedStats.successRate}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-300 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Revenue Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Revenue:</span>
                  <span className="text-green-600 font-semibold">£{detailedStats.totalRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">This Week:</span>
                  <span className="text-slate-900 font-semibold">£{detailedStats.weekRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Today:</span>
                  <span className="text-slate-900 font-semibold">£{detailedStats.todayRevenue.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white border-slate-300 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-900">Recent High Scores</CardTitle>
            </CardHeader>
            <CardContent>
              {detailedStats.highScores.length > 0 ? (
                <div className="space-y-2">
                  {detailedStats.highScores.map((entry) => (
                    <div key={entry.rank} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-200">
                      <span className="text-red-600 font-semibold">#{entry.rank}</span>
                      <span className="text-slate-900 font-bold">{entry.score} kg</span>
                      <span className="text-slate-600 text-sm">{entry.time}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-600 py-4">No punch data available yet</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-100 text-slate-900 p-4 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-4 text-slate-900">{currentView.toUpperCase()} - Coming Soon</h2>
        <Button onClick={() => setCurrentView('main')} className="bg-red-600 hover:bg-red-700 text-white">
          ← Back to Main Menu
        </Button>
      </div>
    </div>
  );
};

export default AdminMenu;

</edits_to_apply>
