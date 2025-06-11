
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

interface SettingsViewProps {
  onBack: () => void;
}

const SettingsView = ({ onBack }: SettingsViewProps) => {
  const [settings, setSettings] = useState({
    pricePerPunch: 1.00,
    difficulty: 'normal',
    soundEnabled: true,
    lightingEnabled: true,
    maintenanceMode: false,
    autoRestart: true,
    sessionTimeout: 60
  });

  return (
    <div className="h-screen bg-slate-100 text-slate-900 p-4 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-red-600">⚙️ MACHINE SETTINGS</h1>
          <Button onClick={onBack} variant="outline" className="text-slate-700 border-slate-400 bg-white hover:bg-slate-50">
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
};

export default SettingsView;
