
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StatisticsViewProps {
  onBack: () => void;
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

const StatisticsView = ({ onBack }: StatisticsViewProps) => {
  const [detailedStats, setDetailedStats] = useState<DetailedStats>({
    totalPunches: 0,
    averageForce: 0,
    successRate: 0,
    totalRevenue: 0,
    weekRevenue: 0,
    todayRevenue: 0,
    highScores: []
  });

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

  useEffect(() => {
    fetchDetailedStats();
  }, []);

  return (
    <div className="h-screen bg-slate-100 text-slate-900 p-4 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-red-600">📊 STATISTICS</h1>
          <Button onClick={onBack} variant="outline" className="text-slate-700 border-slate-400 bg-white hover:bg-slate-50">
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
};

export default StatisticsView;
