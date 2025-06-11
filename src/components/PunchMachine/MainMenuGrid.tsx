
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, BarChart3, Wrench, CreditCard, Monitor } from "lucide-react";

interface MenuItem {
  id: string;
  title: string;
  icon: any;
  description: string;
}

interface MainMenuGridProps {
  onMenuClick: (menuId: string) => void;
}

const MainMenuGrid = ({ onMenuClick }: MainMenuGridProps) => {
  const menuItems: MenuItem[] = [
    { id: 'monitor', title: 'System Monitor', icon: Monitor, description: 'Check system health and connectivity status' },
    { id: 'transactions', title: 'Transaction Management', icon: CreditCard, description: 'View transactions, process refunds, and analyze payment vs punch data' },
    { id: 'settings', title: 'Machine Settings', icon: Settings, description: 'Configure pricing, difficulty, and system settings' },
    { id: 'sumup', title: 'SumUp Payment', icon: CreditCard, description: 'Configure SumUp payment system and card readers' },
    { id: 'stats', title: 'Statistics', icon: BarChart3, description: 'View usage statistics and performance data' },
    { id: 'maintenance', title: 'Maintenance', icon: Wrench, description: 'System diagnostics and maintenance tools' }
  ];

  return (
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
              onClick={() => onMenuClick(item.id)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Open {item.title}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MainMenuGrid;
