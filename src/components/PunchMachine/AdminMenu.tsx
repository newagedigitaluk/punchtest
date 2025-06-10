
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Settings, BarChart3, DollarSign, Wrench, Users, History } from "lucide-react";

interface AdminMenuProps {
  onExit: () => void;
}

const AdminMenu = ({ onExit }: AdminMenuProps) => {
  const [currentView, setCurrentView] = useState<'main' | 'settings' | 'stats' | 'payments' | 'maintenance'>('main');
  const [settings, setSettings] = useState({
    pricePerPunch: 1.00,
    difficulty: 'normal',
    soundEnabled: true,
    lightingEnabled: true,
    maintenanceMode: false,
    autoRestart: true,
    sessionTimeout: 60
  });

  const menuItems = [
    { id: 'settings', title: 'Machine Settings', icon: Settings, description: 'Configure pricing, difficulty, and system settings' },
    { id: 'stats', title: 'Statistics', icon: BarChart3, description: 'View usage statistics and performance data' },
    { id: 'payments', title: 'Payment Records', icon: DollarSign, description: 'View transaction history and revenue' },
    { id: 'maintenance', title: 'Maintenance', icon: Wrench, description: 'System diagnostics and maintenance tools' }
  ];

  if (currentView === 'main') {
    return (
      <div className="h-screen bg-gray-900 text-white p-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-yellow-400">🔧 ADMIN PANEL</h1>
            <Button onClick={onExit} variant="outline" className="text-white border-gray-600">
              Exit Admin
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menuItems.map((item) => (
              <Card key={item.id} className="bg-gray-800 border-gray-700 hover:bg-gray-750 cursor-pointer transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-3 text-white">
                    <item.icon className="w-6 h-6 text-yellow-400" />
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm mb-3">{item.description}</p>
                  <Button 
                    onClick={() => setCurrentView(item.id as any)}
                    className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-semibold"
                  >
                    Open {item.title}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-6 bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Users className="w-6 h-6 text-green-400" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-400">127</div>
                  <div className="text-sm text-gray-400">Today's Punches</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-400">£127</div>
                  <div className="text-sm text-gray-400">Today's Revenue</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">892</div>
                  <div className="text-sm text-gray-400">High Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">98.5%</div>
                  <div className="text-sm text-gray-400">Uptime</div>
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
      <div className="h-screen bg-gray-900 text-white p-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-yellow-400">⚙️ MACHINE SETTINGS</h1>
            <Button onClick={() => setCurrentView('main')} variant="outline" className="text-white border-gray-600">
              ← Back
            </Button>
          </div>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="price">Price Per Punch (£)</Label>
                <Input 
                  id="price"
                  type="number" 
                  step="0.10"
                  value={settings.pricePerPunch}
                  onChange={(e) => setSettings({...settings, pricePerPunch: parseFloat(e.target.value)})}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeout">Session Timeout (seconds)</Label>
                <Input 
                  id="timeout"
                  type="number" 
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <Separator className="bg-gray-600" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sound">Sound Effects</Label>
                  <Switch 
                    id="sound"
                    checked={settings.soundEnabled}
                    onCheckedChange={(checked) => setSettings({...settings, soundEnabled: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="lighting">LED Lighting</Label>
                  <Switch 
                    id="lighting"
                    checked={settings.lightingEnabled}
                    onCheckedChange={(checked) => setSettings({...settings, lightingEnabled: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="maintenance">Maintenance Mode</Label>
                  <Switch 
                    id="maintenance"
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="restart">Auto Restart</Label>
                  <Switch 
                    id="restart"
                    checked={settings.autoRestart}
                    onCheckedChange={(checked) => setSettings({...settings, autoRestart: checked})}
                  />
                </div>
              </div>

              <Button className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold">
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
      <div className="h-screen bg-gray-900 text-white p-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-yellow-400">📊 STATISTICS</h1>
            <Button onClick={() => setCurrentView('main')} variant="outline" className="text-white border-gray-600">
              ← Back
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Punches:</span>
                  <span className="text-white font-semibold">2,847</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Average Force:</span>
                  <span className="text-white font-semibold">654 PSI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Success Rate:</span>
                  <span className="text-green-400 font-semibold">94.2%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Revenue Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Revenue:</span>
                  <span className="text-green-400 font-semibold">£2,847</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">This Week:</span>
                  <span className="text-white font-semibold">£387</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Today:</span>
                  <span className="text-white font-semibold">£127</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Recent High Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { rank: 1, score: 892, time: '2 hours ago' },
                  { rank: 2, score: 876, time: '1 day ago' },
                  { rank: 3, score: 854, time: '3 days ago' },
                  { rank: 4, score: 831, time: '1 week ago' },
                  { rank: 5, score: 824, time: '1 week ago' }
                ].map((entry) => (
                  <div key={entry.rank} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                    <span className="text-yellow-400 font-semibold">#{entry.rank}</span>
                    <span className="text-white font-bold">{entry.score} PSI</span>
                    <span className="text-gray-400 text-sm">{entry.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white p-4 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-4">{currentView.toUpperCase()} - Coming Soon</h2>
        <Button onClick={() => setCurrentView('main')} className="bg-yellow-600 hover:bg-yellow-500 text-black">
          ← Back to Main Menu
        </Button>
      </div>
    </div>
  );
};

export default AdminMenu;
