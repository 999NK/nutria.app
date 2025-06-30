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
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

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
  const caloriesExceeded = caloriesConsumed > caloriesGoal;

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

  const caloriesChartData = caloriesExceeded ? [
    { name: 'Meta', value: caloriesGoal, color: '#E5E7EB' },
    { name: 'Excesso', value: caloriesConsumed - caloriesGoal, color: '#EF4444' }
  ] : [
    { name: 'Consumido', value: caloriesConsumed, color: '#10B981' },
    { name: 'Restante', value: caloriesRemaining, color: '#E5E7EB' }
  ];

  // Schedule daily notification mutation
  const scheduleNotificationMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/schedule-daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to schedule notification');
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

  // Schedule notification if enabled and not already scheduled in this session
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
      {/* Enhanced Nutrition Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Calories Overview with Donut Chart */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <h3 className="text-lg font-semibold">Calorias de Hoje</h3>
                {caloriesExceeded && (
                  <span className="ml-2 text-xs bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 px-2 py-1 rounded flex items-center">
                    <i className="fas fa-exclamation-triangle mr-1"></i>
                    Meta excedida
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">{todayFormatted}</span>
            </div>
            
            <div className="flex items-center justify-center mb-4">
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
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {caloriesConsumed.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">de {caloriesGoal.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">kcal</p>
                  <div className="mt-2 text-center">
                    {caloriesExceeded ? (
                      <>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Excesso</p>
                        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                          +{(caloriesConsumed - caloriesGoal).toLocaleString('pt-BR')} kcal
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Restante</p>
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {caloriesRemaining.toLocaleString('pt-BR')} kcal
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-6 text-sm">
              {caloriesExceeded ? (
                <>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
                    <span className="text-gray-600 dark:text-gray-400">Meta</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-gray-600 dark:text-gray-400">Excesso</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-gray-600 dark:text-gray-400">Consumido</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
                    <span className="text-gray-600 dark:text-gray-400">Restante</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Macronutrients Bar Chart */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Macronutrientes</h3>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={macroData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="name" 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const isExceeded = data.consumido > data.meta;
                        return (
                          <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                            <p className="font-semibold">{label}</p>
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                              Consumido: {data.consumido.toLocaleString('pt-BR', {maximumFractionDigits: 1})}{data.unit}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Meta: {data.meta.toLocaleString('pt-BR')}{data.unit}
                            </p>
                            <p className={`text-sm ${isExceeded ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                              {isExceeded ? 'Excesso: ' : 'Progresso: '}
                              {isExceeded ? 
                                `+${(data.consumido - data.meta).toLocaleString('pt-BR', {maximumFractionDigits: 1})}${data.unit}` :
                                `${data.percentage.toFixed(1)}%`
                              }
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="consumido" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="meta" fill="#E5E7EB" opacity={0.3} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Progress Summary */}
            <div className="mt-4 space-y-2">
              {macroData.map((macro, index) => {
                const isExceeded = macro.consumido > macro.meta;
                return (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: macro.color }}
                      ></div>
                      <span className="text-gray-600 dark:text-gray-400">{macro.name}</span>
                      {isExceeded && (
                        <span className="ml-2 text-xs bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 px-2 py-1 rounded">
                          Excesso
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`font-semibold ${isExceeded ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                        {macro.consumido.toLocaleString('pt-BR', {maximumFractionDigits: 1})}{macro.unit}
                      </span>
                      <span className="text-gray-500 dark:text-gray-500 ml-1">
                        / {macro.meta.toLocaleString('pt-BR')}{macro.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

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

      <PersonalizedRecommendations />

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