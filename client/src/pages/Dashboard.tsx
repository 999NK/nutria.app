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