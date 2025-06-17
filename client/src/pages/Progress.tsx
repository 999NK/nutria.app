import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

type PeriodType = 'daily' | 'weekly' | 'monthly';

export default function Progress() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [period, setPeriod] = useState<PeriodType>('daily');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Não autorizado",
        description: "Você precisa fazer login novamente...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Calculate date ranges based on period
  const getDateRange = () => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date = today;

    switch (period) {
      case 'daily':
        startDate = subDays(today, 6); // Last 7 days
        break;
      case 'weekly':
        startDate = subDays(startOfWeek(today), 21); // Last 4 weeks
        endDate = endOfWeek(today);
        break;
      case 'monthly':
        startDate = subDays(startOfMonth(today), 90); // Last 3 months
        endDate = endOfMonth(today);
        break;
      default:
        startDate = subDays(today, 6);
    }

    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    };
  };

  const { startDate, endDate } = getDateRange();

  // Fetch nutrition history
  const { data: nutritionHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["/api/nutrition/history", { startDate, endDate }],
    enabled: isAuthenticated,
  });

  // Export PDF mutation
  const exportPDFMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          startDate,
          endDate,
          type: period,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to export PDF");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nutria-relatorio-${period}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "PDF exportado!",
        description: "Seu relatório foi baixado com sucesso",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi desconectado. Fazendo login novamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro na exportação",
        description: "Não foi possível gerar o relatório PDF",
        variant: "destructive",
      });
    },
  });

  // Process data for charts
  const processChartData = () => {
    if (!nutritionHistory.length) return [];

    return nutritionHistory.map((day: any) => ({
      date: format(new Date(day.date), period === 'daily' ? 'dd/MM' : period === 'weekly' ? 'dd/MM' : 'MM/yyyy', { locale: ptBR }),
      calories: day.totalCalories || 0,
      protein: parseFloat(day.totalProtein || "0"),
      carbs: parseFloat(day.totalCarbs || "0"),
      fat: parseFloat(day.totalFat || "0"),
      goal: day.goalCalories || user?.dailyCalories || 2000,
    })).reverse();
  };

  const chartData = processChartData();

  // Calculate averages
  const calculateAverages = () => {
    if (!nutritionHistory.length) return { calories: 0, protein: 0, carbs: 0, fat: 0 };

    const totals = nutritionHistory.reduce((acc, day: any) => ({
      calories: acc.calories + (day.totalCalories || 0),
      protein: acc.protein + parseFloat(day.totalProtein || "0"),
      carbs: acc.carbs + parseFloat(day.totalCarbs || "0"),
      fat: acc.fat + parseFloat(day.totalFat || "0"),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const count = nutritionHistory.length;
    return {
      calories: Math.round(totals.calories / count),
      protein: Math.round(totals.protein / count),
      carbs: Math.round(totals.carbs / count),
      fat: Math.round(totals.fat / count),
    };
  };

  const averages = calculateAverages();

  // Calculate goal achievement days
  const calculateGoalDays = () => {
    if (!nutritionHistory.length) return 0;
    
    return nutritionHistory.filter((day: any) => {
      const dayCalories = day.totalCalories || 0;
      const goalCalories = day.goalCalories || user?.dailyCalories || 2000;
      return dayCalories >= goalCalories * 0.9 && dayCalories <= goalCalories * 1.1;
    }).length;
  };

  const goalDays = calculateGoalDays();

  // Macro distribution data for pie chart
  const macroData = [
    { name: 'Proteínas', value: averages.protein * 4, color: '#3B82F6' },
    { name: 'Carboidratos', value: averages.carbs * 4, color: '#FBB827' },
    { name: 'Gorduras', value: averages.fat * 9, color: '#FB923C' },
  ];

  const getPeriodLabel = () => {
    switch (period) {
      case 'daily': return 'Últimos 7 dias';
      case 'weekly': return 'Últimas 4 semanas';
      case 'monthly': return 'Últimos 3 meses';
      default: return 'Período';
    }
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Progresso</h2>
        <Button
          onClick={() => exportPDFMutation.mutate()}
          disabled={exportPDFMutation.isPending}
          size="sm"
          className="bg-primary text-white"
        >
          {exportPDFMutation.isPending ? (
            <i className="fas fa-spinner fa-spin mr-2"></i>
          ) : (
            <i className="fas fa-download mr-2"></i>
          )}
          Exportar PDF
        </Button>
      </div>

      {/* Time Period Selector */}
      <Tabs value={period} onValueChange={(value) => setPeriod(value as PeriodType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">Diário</TabsTrigger>
          <TabsTrigger value="weekly">Semanal</TabsTrigger>
          <TabsTrigger value="monthly">Mensal</TabsTrigger>
        </TabsList>

        {/* Progress Charts */}
        <div className="mt-6 space-y-6">
          {/* Calories Evolution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Calorias</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">{getPeriodLabel()}</p>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <i className="fas fa-spinner fa-spin text-3xl mb-2"></i>
                    <p className="text-sm">Carregando dados...</p>
                  </div>
                </div>
              ) : chartData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        className="text-gray-600 dark:text-gray-400"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        className="text-gray-600 dark:text-gray-400"
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'var(--background)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          color: 'var(--foreground)'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="calories" 
                        stroke="hsl(142, 71%, 45%)" 
                        strokeWidth={3}
                        dot={{ fill: "hsl(142, 71%, 45%)", strokeWidth: 2, r: 4 }}
                        name="Calorias"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="goal" 
                        stroke="hsl(240, 5%, 64.9%)" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Meta"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <i className="fas fa-chart-line text-3xl mb-2"></i>
                    <p className="text-sm">Sem dados para o período</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Macros Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Macros</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">Média do período</p>
            </CardHeader>
            <CardContent>
              {nutritionHistory.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={macroData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {macroData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [`${value.toFixed(0)} kcal`, '']}
                          contentStyle={{
                            backgroundColor: 'var(--background)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            color: 'var(--foreground)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                        <span className="text-sm">Proteínas</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{averages.protein}g</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {Math.round((averages.protein * 4 / (averages.protein * 4 + averages.carbs * 4 + averages.fat * 9)) * 100)}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-yellow-500 rounded mr-3"></div>
                        <span className="text-sm">Carboidratos</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{averages.carbs}g</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {Math.round((averages.carbs * 4 / (averages.protein * 4 + averages.carbs * 4 + averages.fat * 9)) * 100)}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-orange-500 rounded mr-3"></div>
                        <span className="text-sm">Gorduras</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{averages.fat}g</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {Math.round((averages.fat * 9 / (averages.protein * 4 + averages.carbs * 4 + averages.fat * 9)) * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-48 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <i className="fas fa-chart-pie text-3xl mb-2"></i>
                    <p className="text-sm">Sem dados para análise</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{goalDays}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Dias na meta</p>
                </div>
                <div className="text-center p-4 bg-primary/10 rounded-xl">
                  <p className="text-2xl font-bold text-primary">{averages.calories}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Kcal média</p>
                </div>
              </div>
              
              {nutritionHistory.length > 0 && (
                <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  <p>
                    Taxa de sucesso: {Math.round((goalDays / nutritionHistory.length) * 100)}% •{' '}
                    {nutritionHistory.length} dias registrados
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Macros Trend */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tendência de Macronutrientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        className="text-gray-600 dark:text-gray-400"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        className="text-gray-600 dark:text-gray-400"
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'var(--background)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          color: 'var(--foreground)'
                        }}
                      />
                      <Bar dataKey="protein" fill="#3B82F6" name="Proteína (g)" />
                      <Bar dataKey="carbs" fill="#FBB827" name="Carboidratos (g)" />
                      <Bar dataKey="fat" fill="#FB923C" name="Gordura (g)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </Tabs>
    </div>
  );
}
