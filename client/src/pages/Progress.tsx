import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Target, Activity, Clock, BarChart3, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { ProgressRing } from "@/components/ProgressRing";

export default function Progress() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeView, setActiveView] = useState("daily");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute for real-time updates
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const { data: user } = useQuery({
    queryKey: ['/api/auth/user']
  });

  const { data: hourlyData, isLoading: hourlyLoading } = useQuery({
    queryKey: ['/api/progress/hourly', selectedDate],
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const { data: weeklyData, isLoading: weeklyLoading } = useQuery({
    queryKey: ['/api/progress/weekly', selectedDate],
    refetchInterval: 30 * 60 * 1000, // Refetch every 30 minutes
  });

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['/api/progress/monthly', selectedDate],
    refetchInterval: 60 * 60 * 1000, // Refetch every hour
  });

  const { data: dailyNutrition } = useQuery({
    queryKey: ['/api/nutrition/daily', selectedDate],
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });

  const calculateDailyProgress = () => {
    if (!dailyNutrition || !user) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    return {
      calories: Math.round((dailyNutrition.calories / user.dailyCalories) * 100),
      protein: Math.round((dailyNutrition.protein / user.dailyProtein) * 100),
      carbs: Math.round((dailyNutrition.carbs / user.dailyCarbs) * 100),
      fat: Math.round((dailyNutrition.fat / user.dailyFat) * 100),
    };
  };

  const progress = calculateDailyProgress();

  const formatHourlyChart = () => {
    if (!hourlyData) return [];
    
    return hourlyData
      .filter((hour: any) => hour.calories > 0)
      .map((hour: any) => ({
        ...hour,
        time: `${hour.hour.toString().padStart(2, '0')}:00`,
        totalNutrients: hour.protein + hour.carbs + hour.fat
      }));
  };

  const macroDistribution = dailyNutrition ? [
    { name: 'Proteínas', value: dailyNutrition.protein, color: '#3b82f6' },
    { name: 'Carboidratos', value: dailyNutrition.carbs, color: '#f59e0b' },
    { name: 'Gorduras', value: dailyNutrition.fat, color: '#ef4444' }
  ] : [];

  const renderHourlyView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Progresso do Dia</h2>
          <p className="text-gray-600">Atualizado em tempo real • {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Zap className="w-3 h-3 mr-1" />
          Ao vivo
        </Badge>
      </div>

      {/* Real-time Progress Circles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <ProgressRing progress={progress.calories} size={80} color="#22c55e">
              <div className="text-center">
                <div className="text-lg font-bold">{progress.calories}%</div>
              </div>
            </ProgressRing>
            <h3 className="font-medium mt-2">Calorias</h3>
            <p className="text-sm text-gray-600">{dailyNutrition?.calories || 0} / {user?.dailyCalories || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <ProgressRing progress={progress.protein} size={80} color="#3b82f6">
              <div className="text-center">
                <div className="text-lg font-bold">{progress.protein}%</div>
              </div>
            </ProgressRing>
            <h3 className="font-medium mt-2">Proteínas</h3>
            <p className="text-sm text-gray-600">{dailyNutrition?.protein || 0}g / {user?.dailyProtein || 0}g</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <ProgressRing progress={progress.carbs} size={80} color="#f59e0b">
              <div className="text-center">
                <div className="text-lg font-bold">{progress.carbs}%</div>
              </div>
            </ProgressRing>
            <h3 className="font-medium mt-2">Carboidratos</h3>
            <p className="text-sm text-gray-600">{dailyNutrition?.carbs || 0}g / {user?.dailyCarbs || 0}g</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <ProgressRing progress={progress.fat} size={80} color="#ef4444">
              <div className="text-center">
                <div className="text-lg font-bold">{progress.fat}%</div>
              </div>
            </ProgressRing>
            <h3 className="font-medium mt-2">Gorduras</h3>
            <p className="text-sm text-gray-600">{dailyNutrition?.fat || 0}g / {user?.dailyFat || 0}g</p>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Chart */}
      {formatHourlyChart().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Consumo por Hora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={formatHourlyChart()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value} ${name === 'calories' ? 'kcal' : 'g'}`,
                    name === 'calories' ? 'Calorias' : 
                    name === 'protein' ? 'Proteínas' :
                    name === 'carbs' ? 'Carboidratos' : 'Gorduras'
                  ]}
                />
                <Area type="monotone" dataKey="calories" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                <Area type="monotone" dataKey="protein" stackId="2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="carbs" stackId="2" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                <Area type="monotone" dataKey="fat" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Macro Distribution */}
      {macroDistribution.some(item => item.value > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Macronutrientes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={macroDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {macroDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}g`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Refeições do Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {hourlyData?.filter((hour: any) => hour.meals.length > 0).map((hour: any) => (
                  <div key={hour.hour} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{hour.hour.toString().padStart(2, '0')}:00</div>
                      <div className="text-sm text-gray-600">
                        {hour.meals.map((meal: any) => meal.type).join(', ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{hour.calories} kcal</div>
                      <div className="text-sm text-gray-600">{hour.meals.length} refeição(ões)</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  const renderWeeklyView = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Progresso Semanal</h2>
        <p className="text-gray-600">Visão dos últimos 7 dias</p>
      </div>

      {weeklyData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Média Semanal - Calorias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(weeklyData.reduce((acc: number, day: any) => acc + day.calories, 0) / 7)} kcal
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total de Refeições</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {weeklyData.reduce((acc: number, day: any) => acc + day.mealCount, 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Dias Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {weeklyData.filter((day: any) => day.calories > 0).length}/7
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Evolução Semanal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dayName" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="calories" stroke="#22c55e" strokeWidth={3} />
                  <Line type="monotone" dataKey="protein" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="carbs" stroke="#f59e0b" strokeWidth={2} />
                  <Line type="monotone" dataKey="fat" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  const renderMonthlyView = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Progresso Mensal</h2>
        <p className="text-gray-600">Análise do mês por semanas</p>
      </div>

      {monthlyData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Média Mensal - Calorias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(monthlyData.reduce((acc: number, week: any) => acc + week.calories, 0) / monthlyData.length)} kcal/semana
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Mensal de Refeições</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {monthlyData.reduce((acc: number, week: any) => acc + week.mealCount, 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Progresso por Semanas</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData.map((week: any, index: number) => ({
                  ...week,
                  weekNumber: `Sem ${index + 1}`
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="weekNumber" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="calories" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard de Progresso</h1>
          <p className="text-gray-600 dark:text-gray-400">Acompanhamento nutricional em tempo real</p>
        </div>
        
        <div className="flex gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Diário
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Semanal
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Mensal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          {renderHourlyView()}
        </TabsContent>

        <TabsContent value="weekly">
          {renderWeeklyView()}
        </TabsContent>

        <TabsContent value="monthly">
          {renderMonthlyView()}
        </TabsContent>
      </Tabs>
    </div>
  );
}