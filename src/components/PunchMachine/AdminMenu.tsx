
import { Button } from "@/components/ui/button";
import { useState } from "react";
import SumUpSettings from "./SumUpSettings";
import SystemMonitor from "./SystemMonitor";
import TransactionManagement from "./TransactionManagement";
import QuickStats from "./QuickStats";
import MainMenuGrid from "./MainMenuGrid";
import SettingsView from "./SettingsView";
import StatisticsView from "./StatisticsView";

interface AdminMenuProps {
  onExit: () => void;
}

const AdminMenu = ({ onExit }: AdminMenuProps) => {
  const [currentView, setCurrentView] = useState<'main' | 'settings' | 'stats' | 'maintenance' | 'sumup' | 'monitor' | 'transactions'>('main');

  if (currentView === 'sumup') {
    return <SumUpSettings onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'monitor') {
    return <SystemMonitor onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'transactions') {
    return <TransactionManagement onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'settings') {
    return <SettingsView onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'stats') {
    return <StatisticsView onBack={() => setCurrentView('main')} />;
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

          <MainMenuGrid onMenuClick={(menuId) => setCurrentView(menuId as any)} />
          <QuickStats />
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
