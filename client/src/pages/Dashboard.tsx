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

  // Fetch today's meals with optimized caching
  const { data: meals = [], isLoading: mealsLoading } = useQuery({
    queryKey: ["/api/meals"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  }) as { data: any[], isLoading: boolean };

  // Fetch daily nutrition with optimized caching
  const { data: dailyNutrition, isLoading: nutritionLoading } = useQuery({
    queryKey: ["/api/nutrition/daily"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
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

  // Schedule notification only once per day per user
  useEffect(() => {
    const today = new Date().toDateString();
    const lastScheduled = localStorage.getItem('notification-scheduled-date');
    const scheduledUser = localStorage.getItem('notification-scheduled-user');
    
    if (isAuthenticated && user?.id && 
        (lastScheduled !== today || scheduledUser !== user.id)) {
      scheduleNotificationMutation.mutate();
      localStorage.setItem('notification-scheduled-date', today);
      localStorage.setItem('notification-scheduled-user', user.id);
    }
  }, [isAuthenticated, user?.id]);

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

  // Loading skeleton for better UX
  if (mealsLoading || nutritionLoading) {
    return (
      <div className="p-4 space-y-6 pb-20">
        {/* Progress Summary Skeleton */}
        <Card className="bg-gray-900 dark:bg-gray-900 border-gray-700">
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="flex items-center justify-center mb-6">
                <div className="w-32 h-32 bg-gray-700 rounded-full"></div>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-700 rounded w-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Meals Skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-20">
      {/* Progresso Diário - Plano de Academia e Próxima Refeição */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Hoje no seu Plano</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Treino do Dia */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-800">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Treino de Hoje</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Push - Peito, Ombro e Tríceps</p>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Exercícios do dia</span>
                  <Button variant="ghost" size="sm" className="h-auto p-1 text-xs">
                    Ver detalhes
                  </Button>
                </div>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <div>• Supino reto - 4x8-12</div>
                  <div>• Desenvolvimento - 3x10-15</div>
                  <div>• Tríceps pulley - 3x12-15</div>
                  <div className="text-xs text-gray-500 mt-2">+3 exercícios</div>
                </div>
              </div>
            </div>

            {/* Próxima Refeição */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-800">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Próxima Refeição</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Almoço - 12:30</p>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Frango grelhado com batata doce</span>
                  <Button variant="ghost" size="sm" className="h-auto p-1 text-xs">
                    Ver receita
                  </Button>
                </div>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <div>🍗 150g peito de frango</div>
                  <div>🥔 200g batata doce assada</div>
                  <div>🥗 Salada verde mista</div>
                  <div className="text-xs text-gray-500 mt-2 font-medium">~520 kcal</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Progress Summary with Half Donut Chart */}
      <Card className="bg-gray-900 dark:bg-gray-900 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Progresso Diário</h2>
            <span className="text-sm text-gray-400">{todayFormatted}</span>
          </div>
          
          {/* Nutrition Progress - Green Circle */}
          <div className="flex flex-col lg:flex-row items-center gap-6">
            {/* Green Circle Chart */}
            <div className="relative flex justify-center items-center">
              <div className="relative">
                <svg width="140" height="140" className="transform -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="70"
                    cy="70"
                    r="60"
                    stroke="rgb(55, 65, 81)"
                    strokeWidth="6"
                    fill="none"
                    className="opacity-20"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="70"
                    cy="70"
                    r="60"
                    stroke="#22c55e"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 60}`}
                    strokeDashoffset={`${2 * Math.PI * 60 * (1 - Math.min(1, caloriesConsumed / caloriesGoal))}`}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold text-white">
                    {caloriesConsumed}
                  </div>
                  <div className="text-sm text-gray-300">kcal</div>
                  <div className="text-xs text-gray-400">
                    {caloriesRemaining} restantes
                  </div>
                </div>
              </div>
            </div>

            {/* Macros Summary - Horizontal Bars like the reference image */}
            <div className="flex-1 space-y-4 w-full">
              {/* Protein */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-blue-400 font-medium">Proteína</span>
                  <span className="text-white font-semibold">{proteinConsumed.toFixed(0)}g</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (proteinConsumed / proteinGoal) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Carbohydrates */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-yellow-400 font-medium">Carboidratos</span>
                  <span className="text-white font-semibold">{carbsConsumed.toFixed(0)}g</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (carbsConsumed / carbsGoal) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Fat */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-orange-400 font-medium">Gordura</span>
                  <span className="text-white font-semibold">{fatConsumed.toFixed(0)}g</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (fatConsumed / fatGoal) * 100)}%` }}
                  />
                </div>
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