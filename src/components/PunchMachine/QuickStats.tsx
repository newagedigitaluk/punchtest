
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface QuickStats {
  todayPunches: number;
  todayRevenue: number;
  highScore: number;
  totalTransactions: number;
}

const QuickStats = () => {
  const [quickStats, setQuickStats] = useState<QuickStats>({
    todayPunches: 0,
    todayRevenue: 0,
    highScore: 0,
    totalTransactions: 0
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

  useEffect(() => {
    fetchQuickStats();
  }, []);

  return (
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
  );
};

export default QuickStats;
