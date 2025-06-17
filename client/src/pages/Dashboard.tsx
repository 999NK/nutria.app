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

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  // Get today's date
  const today = format(new Date(), "yyyy-MM-dd");
  const todayFormatted = format(new Date(), "d MMM", { locale: ptBR });

  // Fetch today's meals
  const { data: meals = [], isLoading: mealsLoading } = useQuery({
    queryKey: ["/api/meals", { date: today }],
    enabled: isAuthenticated,
  });

  // Fetch daily nutrition
  const { data: dailyNutrition } = useQuery({
    queryKey: ["/api/nutrition/daily", { date: today }],
    enabled: isAuthenticated,
  });

  // Calculate progress from actual meals
  const caloriesConsumed = meals.reduce((sum: number, meal: any) => {
    return sum + (meal.mealFoods?.reduce((mealSum: number, mf: any) => 
      mealSum + parseFloat(mf.calories || "0"), 0) || 0);
  }, 0);
  
  const proteinConsumed = meals.reduce((sum: number, meal: any) => {
    return sum + (meal.mealFoods?.reduce((mealSum: number, mf: any) => 
      mealSum + parseFloat(mf.protein || "0"), 0) || 0);
  }, 0);
  
  const carbsConsumed = meals.reduce((sum: number, meal: any) => {
    return sum + (meal.mealFoods?.reduce((mealSum: number, mf: any) => 
      mealSum + parseFloat(mf.carbs || "0"), 0) || 0);
  }, 0);
  
  const fatConsumed = meals.reduce((sum: number, meal: any) => {
    return sum + (meal.mealFoods?.reduce((mealSum: number, mf: any) => 
      mealSum + parseFloat(mf.fat || "0"), 0) || 0);
  }, 0);

  const caloriesGoal = user?.dailyCalories || 2000;
  const proteinGoal = user?.dailyProtein || 120;
  const carbsGoal = user?.dailyCarbs || 225;
  const fatGoal = user?.dailyFat || 67;

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

  // Schedule notification on component mount
  useEffect(() => {
    if (isAuthenticated && user?.notificationsEnabled) {
      scheduleNotificationMutation.mutate();
    }
  }, [isAuthenticated, user?.notificationsEnabled]);

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
      {/* Daily Progress Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Progresso Diário</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">{todayFormatted}</span>
          </div>
          
          {/* Calories Progress Ring */}
          <div className="flex items-center justify-center mb-6">
            <ProgressRing 
              progress={caloriesProgress}
              size={128}
              strokeWidth={3}
            >
              <div className="text-center">
                <span className="text-2xl font-bold">{caloriesConsumed}</span>
                <div className="text-xs text-gray-500 dark:text-gray-400">kcal</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {caloriesRemaining} restantes
                </div>
              </div>
            </ProgressRing>
          </div>

          {/* Macros Progress */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(100, (proteinConsumed / proteinGoal) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Proteína</p>
              <p className="text-sm font-semibold">{proteinConsumed.toFixed(0)}g</p>
            </div>
            <div className="text-center">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(100, (carbsConsumed / carbsGoal) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Carboidratos</p>
              <p className="text-sm font-semibold">{carbsConsumed.toFixed(0)}g</p>
            </div>
            <div className="text-center">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(100, (fatConsumed / fatGoal) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Gordura</p>
              <p className="text-sm font-semibold">{fatConsumed.toFixed(0)}g</p>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Refeições de Hoje</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation("/add-meal")}
            >
              Ver todas
            </Button>
          </div>
          
          {mealsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : meals.length > 0 ? (
            <div className="space-y-3">
              {meals.slice(0, 3).map((meal: any) => {
                // Calculate meal calories from mealFoods
                const mealCalories = meal.mealFoods?.reduce((sum: number, mf: any) => 
                  sum + parseFloat(mf.calories || "0"), 0) || 0;
                
                return (
                  <div 
                    key={meal.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => {
                      setSelectedMeal(meal);
                      setIsEditModalOpen(true);
                    }}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-lg">{getMealIcon(meal.mealType?.name || '')}</span>
                      </div>
                      <div>
                        <p className="font-medium">{meal.mealType?.name || 'Refeição'}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {meal.mealFoods?.length || 0} itens • {format(new Date(meal.createdAt), "HH:mm")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{Math.round(mealCalories)} kcal</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {caloriesGoal > 0 ? Math.round((mealCalories / caloriesGoal) * 100) : 0}% da meta
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <i className="fas fa-utensils text-3xl mb-3 opacity-50"></i>
              <p className="text-sm">Nenhuma refeição registrada hoje</p>
            </div>
          )}

          {/* Add Meal Button */}
          <Button
            variant="outline"
            className="w-full mt-4 border-dashed border-2 hover:border-primary hover:text-primary"
            onClick={() => setLocation("/add-meal")}
          >
            <i className="fas fa-plus mr-2"></i>
            Adicionar Refeição
          </Button>
        </CardContent>
      </Card>

      {/* Edit Meal Modal */}
      <EditMealModal
        meal={selectedMeal}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedMeal(null);
        }}
      />
    </div>
  );
}
