import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ProgressRing";
import { EditMealModal } from "@/components/EditMealModal";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { getNutritionalDay } from "@/lib/nutritionalDay";
import { PersonalizedRecommendations } from "@/components/PersonalizedRecommendations";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentNutritionalDay, setCurrentNutritionalDay] = useState(getNutritionalDay());

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

  // Check for nutritional day changes and refresh data
  useEffect(() => {
    const checkNutritionalDay = () => {
      const newNutritionalDay = getNutritionalDay();
      if (newNutritionalDay !== currentNutritionalDay) {
        setCurrentNutritionalDay(newNutritionalDay);
        queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
        queryClient.invalidateQueries({ queryKey: ["/api/nutrition/daily"] });
        toast({
          title: "Novo dia nutricional",
          description: "Os dados foram atualizados para o novo dia (5h às 5h).",
        });
      }
    };

    const interval = setInterval(checkNutritionalDay, 60000);
    return () => clearInterval(interval);
  }, [currentNutritionalDay, queryClient, toast]);

  // Fetch today's meals
  const { data: meals = [] } = useQuery({
    queryKey: ["/api/meals"],
    retry: false,
  }) as { data: any[] };

  // Fetch daily nutrition
  const { data: dailyNutrition } = useQuery({
    queryKey: ["/api/nutrition/daily"],
    retry: false,
  });

  const todayFormatted = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });

  // Calculate nutrition totals
  const mealsArray = Array.isArray(meals) ? meals : [];
  const caloriesConsumed = mealsArray.reduce((total: number, meal: any) => {
    return total + (meal.totalCalories || 0);
  }, 0);

  const proteinConsumed = mealsArray.reduce((total: number, meal: any) => {
    return total + parseFloat(meal.totalProtein || '0');
  }, 0);

  const carbsConsumed = mealsArray.reduce((total: number, meal: any) => {
    return total + parseFloat(meal.totalCarbs || '0');
  }, 0);

  const fatConsumed = mealsArray.reduce((total: number, meal: any) => {
    return total + parseFloat(meal.totalFat || '0');
  }, 0);

  const caloriesGoal = (user as any)?.dailyCalories || 2000;
  const proteinGoal = (user as any)?.dailyProtein || 120;
  const carbsGoal = (user as any)?.dailyCarbs || 225;
  const fatGoal = (user as any)?.dailyFat || 67;

  const caloriesRemaining = Math.max(0, caloriesGoal - caloriesConsumed);
  const caloriesProgress = Math.min(100, (caloriesConsumed / caloriesGoal) * 100);

  // Prepare chart data
  const macroData = [
    {
      name: 'Proteína',
      consumido: proteinConsumed,
      meta: proteinGoal,
      percentage: Math.min(100, (proteinConsumed / proteinGoal) * 100),
      color: '#3B82F6',
      unit: 'g'
    },
    {
      name: 'Carboidratos',
      consumido: carbsConsumed,
      meta: carbsGoal,
      percentage: Math.min(100, (carbsConsumed / carbsGoal) * 100),
      color: '#EAB308',
      unit: 'g'
    },
    {
      name: 'Gordura',
      consumido: fatConsumed,
      meta: fatGoal,
      percentage: Math.min(100, (fatConsumed / fatGoal) * 100),
      color: '#F97316',
      unit: 'g'
    }
  ];

  const caloriesChartData = [
    { name: 'Consumido', value: caloriesConsumed, color: '#10B981' },
    { name: 'Restante', value: caloriesRemaining, color: '#E5E7EB' }
  ];

  // Schedule daily notification mutation
  const scheduleNotificationMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/notifications/schedule-daily", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to schedule notification");
      return response.json();
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
    },
  });

  // Schedule notification only once per session
  useEffect(() => {
    const hasScheduled = sessionStorage.getItem('notification-scheduled');
    if (isAuthenticated && (user as any)?.notificationsEnabled && !hasScheduled) {
      scheduleNotificationMutation.mutate();
      sessionStorage.setItem('notification-scheduled', 'true');
    }
  }, [isAuthenticated, (user as any)?.notificationsEnabled]);

  const getMealIcon = (mealName: string) => {
    const name = mealName.toLowerCase();
    if (name.includes('café') || name.includes('manhã')) return '☕';
    if (name.includes('almoço')) return '🍽️';
    if (name.includes('jantar') || name.includes('janta')) return '🍲';
    if (name.includes('lanche')) return '🍪';
    return '🍽️';
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="p-4 space-y-6 pb-20">
      {/* Daily Progress Summary with Half Donut Chart */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Progresso Diário</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">{todayFormatted}</span>
          </div>
          
          {/* Enhanced Nutrition Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calories Donut Chart */}
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-medium mb-4">Calorias</h3>
              <div className="relative w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={caloriesChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      startAngle={90}
                      endAngle={450}
                      dataKey="value"
                    >
                      {caloriesChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {caloriesConsumed}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">de {caloriesGoal}</p>
                  <p className="text-xs text-gray-500">kcal</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span>Consumido</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
                  <span>Restante</span>
                </div>
              </div>
            </div>

            {/* Macronutrients Bar Chart */}
            <div className="flex flex-col">
              <h3 className="text-lg font-medium mb-4">Macronutrientes</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={macroData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="name" 
                      className="text-xs"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                              <p className="font-semibold">{label}</p>
                              <p className="text-sm text-blue-600 dark:text-blue-400">
                                Consumido: {data.consumido.toFixed(1)}{data.unit}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Meta: {data.meta}{data.unit}
                              </p>
                              <p className="text-sm text-green-600 dark:text-green-400">
                                {data.percentage.toFixed(1)}% da meta
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="consumido" 
                      fill="#3B82F6"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="meta" 
                      fill="#E5E7EB" 
                      opacity={0.3}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Progress Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            {macroData.map((macro, index) => (
              <div 
                key={index} 
                className="text-center p-4 rounded-lg border"
                style={{ 
                  backgroundColor: `${macro.color}10`, 
                  borderColor: `${macro.color}30` 
                }}
              >
                <div className="flex justify-center mb-2">
                  <div 
                    className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"
                  >
                    <div 
                      className="h-full transition-all duration-500 rounded-full"
                      style={{ 
                        width: `${macro.percentage}%`,
                        backgroundColor: macro.color
                      }}
                    />
                  </div>
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {macro.name}
                </p>
                <p className="text-sm font-bold" style={{ color: macro.color }}>
                  {macro.consumido.toFixed(0)}{macro.unit}
                </p>
                <p className="text-xs text-gray-500">
                  de {macro.meta}{macro.unit}
                </p>
              </div>
            ))}
          </div>

          {/* Daily Summary */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400 mb-1">Calorias Restantes</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {caloriesRemaining}
                </p>
                <p className="text-xs text-gray-500">kcal</p>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400 mb-1">Progresso Diário</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {caloriesProgress.toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500">da meta</p>
              </div>
            </div>
        </CardContent>
      </Card>
              
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{caloriesConsumed}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">de {caloriesGoal} kcal</p>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    {Math.round(caloriesProgress)}% do objetivo
                  </p>
                </div>
              </div>
            </div>

            {/* Macros Summary */}
            <div className="flex-1 grid grid-cols-3 gap-4 w-full">
              {/* Protein */}
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="w-full bg-blue-200 dark:bg-blue-700 rounded-full h-2 mb-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, (proteinConsumed / proteinGoal) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Proteína</p>
                <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{proteinConsumed.toFixed(0)}g</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">de {proteinGoal}g</p>
              </div>

              {/* Carbs */}
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                <div className="w-full bg-yellow-200 dark:bg-yellow-700 rounded-full h-2 mb-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, (carbsConsumed / carbsGoal) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Carboidratos</p>
                <p className="text-sm font-bold text-yellow-700 dark:text-yellow-300">{carbsConsumed.toFixed(0)}g</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">de {carbsGoal}g</p>
              </div>

              {/* Fat */}
              <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
                <div className="w-full bg-orange-200 dark:bg-orange-700 rounded-full h-2 mb-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, (fatConsumed / fatGoal) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Gordura</p>
                <p className="text-sm font-bold text-orange-700 dark:text-orange-300">{fatConsumed.toFixed(0)}g</p>
                <p className="text-xs text-orange-600 dark:text-orange-400">de {fatGoal}g</p>
              </div>
            </div>
          </div>

          {/* Daily Summary */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Resumo do Dia</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Calorias restantes:</p>
                <p className="font-semibold text-green-600 dark:text-green-400">{caloriesRemaining} kcal</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Meta diária:</p>
                <p className="font-semibold text-gray-900 dark:text-white">{caloriesGoal} kcal</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Add Meal */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Adicionar Refeição</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="flex items-center p-3 h-auto"
              onClick={() => setLocation("/add-meal")}
            >
              <i className="fas fa-camera text-primary mr-3"></i>
              <div className="text-left">
                <p className="font-medium text-sm">IA Visual</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Foto do prato</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="flex items-center p-3 h-auto"
              onClick={() => setLocation("/add-meal")}
            >
              <i className="fas fa-microphone text-orange-500 mr-3"></i>
              <div className="text-left">
                <p className="font-medium text-sm">IA Texto</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Descrever refeição</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Today's Meals */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Refeições de Hoje</h3>
          {mealsArray.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <i className="fas fa-utensils text-gray-400 text-xl"></i>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">Nenhuma refeição registrada hoje</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                Adicione sua primeira refeição para começar a acompanhar sua nutrição
              </p>
              <Button onClick={() => setLocation("/add-meal")}>
                <i className="fas fa-plus mr-2"></i>
                Adicionar Refeição
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {mealsArray.map((meal: any) => (
                <div
                  key={meal.id}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedMeal(meal);
                    setIsEditModalOpen(true);
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getMealIcon(meal.mealType?.name || '')}</span>
                    <div>
                      <p className="font-medium text-sm">{meal.mealType?.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {meal.mealFoods?.length || 0} alimentos • {meal.totalCalories || 0} kcal
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <ProgressRing
                      progress={(meal.totalCalories || 0) / (caloriesGoal / 4) * 100}
                      size={40}
                      strokeWidth={3}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personalized Recommendations */}
      <PersonalizedRecommendations />

      {/* Edit Meal Modal */}
      {selectedMeal && (
        <EditMealModal
          meal={selectedMeal}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedMeal(null);
          }}
        />
      )}
    </div>
  );
}