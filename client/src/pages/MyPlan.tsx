import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Calendar, Target, Trash2, Plus, Check, X, Dumbbell, Utensils, Download, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface MealPlan {
  id: number;
  name: string;
  description: string;
  meals?: any;
  workouts?: any;
  dailyCalories: number;
  macroCarbs: number;
  macroProtein: number;
  macroFat: number;
  isActive: boolean;
  createdAt: string;
}

export default function MyPlan() {
  const [activeTab, setActiveTab] = useState("current");
  const [selectedPlanType, setSelectedPlanType] = useState<'diet' | 'workout'>('diet');
  const [userDescription, setUserDescription] = useState("");
  const [progressData, setProgressData] = useState({
    dietCompleted: false,
    workoutCompleted: false
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch active plan
  const { data: activePlan } = useQuery<MealPlan | null>({
    queryKey: ['/api/user-plans/active'],
    retry: false,
  });

  // Fetch plan history
  const { data: planHistory = [] } = useQuery<MealPlan[]>({
    queryKey: ['/api/user-plans/history'],
    retry: false,
  });

  // Generate AI plan mutation
  const generatePlanMutation = useMutation({
    mutationFn: async (data: { description: string; type: 'diet' | 'workout' }) => {
      console.log("Frontend: Starting plan generation", data);
      const endpoint = data.type === 'diet' ? '/api/generate-meal-plan' : '/api/generate-workout-plan';
      console.log("Frontend: Calling endpoint", endpoint);
      console.log("Frontend: Request data", { description: data.description });
      
      const result = await apiRequest(endpoint, 'POST', { description: data.description });
      console.log("Frontend: API request successful", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("Frontend: Plan generation success", data);
      toast({
        title: "Plano gerado com sucesso!",
        description: "Seu novo plano foi criado pela IA e está pronto para uso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user-plans'] });
      setUserDescription("");
    },
    onError: (error) => {
      console.error("Frontend: Plan generation error", error);
      toast({
        title: "Erro ao gerar plano",
        description: "Não foi possível gerar o plano. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      return await apiRequest(`/api/user-plans/${planId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Plano excluído",
        description: "O plano foi removido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user-plans'] });
    },
  });

  // Activate plan mutation
  const activatePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      return await apiRequest(`/api/user-plans/${planId}/activate`, 'PATCH');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-plans'] });
      toast({
        title: "Plano ativado!",
        description: "Este plano agora é seu plano ativo.",
      });
    },
  });

  const handleGeneratePlan = () => {
    if (!userDescription.trim()) {
      toast({
        title: "Descrição necessária",
        description: "Por favor, descreva um pouco sobre você para gerar o plano.",
        variant: "destructive",
      });
      return;
    }

    generatePlanMutation.mutate({
      description: userDescription,
      type: selectedPlanType
    });
  };

  const handleProgressUpdate = (type: 'diet' | 'workout', completed: boolean) => {
    setProgressData(prev => ({
      ...prev,
      [type === 'diet' ? 'dietCompleted' : 'workoutCompleted']: completed
    }));

    toast({
      title: "Progresso atualizado!",
      description: `${type === 'diet' ? 'Dieta' : 'Treino'} marcado como ${completed ? 'concluído' : 'não concluído'}.`,
    });
  };

  const getWeekProgress = () => {
    const completed = (progressData.dietCompleted ? 1 : 0) + (progressData.workoutCompleted ? 1 : 0);
    const total = activePlan ? 2 : 1; // Assume both diet and workout for active plan
    return Math.round((completed / total) * 100);
  };

  const isPlanDiet = (plan: MealPlan) => {
    return plan.dailyCalories && plan.dailyCalories > 0;
  };

  const getMealTypeName = (mealType: string) => {
    const mealTypeNames: Record<string, string> = {
      breakfast: "Café da Manhã",
      lunch: "Almoço",
      dinner: "Jantar",
      snack1: "Lanche da Manhã",
      snack2: "Lanche da Tarde",
      snack: "Lanche",
      ceia: "Ceia"
    };
    return mealTypeNames[mealType] || mealType;
  };

  const handleExportPlan = (plan: MealPlan) => {
    const planText = `
=== ${plan.name} ===
Descrição: ${plan.description}
Criado em: ${new Date(plan.createdAt).toLocaleDateString('pt-BR')}

${isPlanDiet(plan) ? `
INFORMAÇÕES NUTRICIONAIS:
- Calorias diárias: ${plan.dailyCalories} kcal
- Proteínas: ${plan.macroProtein}%
- Carboidratos: ${plan.macroCarbs}%
- Gorduras: ${plan.macroFat}%

PLANO ALIMENTAR SEMANAL:
${plan.meals ? Object.entries(plan.meals).map(([day, dayMeals]: [string, any]) => 
  `\n${day.toUpperCase()}:\n${Object.entries(dayMeals).map(([mealType, meal]: [string, any]) => 
    `  ${getMealTypeName(mealType)}: ${meal.name} (${meal.calories} kcal)`
  ).join('\n')}`
).join('\n') : 'Plano detalhado não disponível'}
` : `
PLANO DE TREINO SEMANAL:
${(plan as any).workouts ? Object.entries((plan as any).workouts).map(([day, workout]: [string, any]) => 
  `\n${day.toUpperCase()}:\n  ${workout.name}\n${workout.exercises ? workout.exercises.map((ex: any) => 
    `    - ${ex.name} ${ex.sets ? `(${ex.sets}x${ex.reps})` : ''}`
  ).join('\n') : '  Descanso'}`
).join('\n') : 'Plano detalhado não disponível'}
`}
    `.trim();

    const blob = new Blob([planText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${plan.name.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Plano exportado!",
      description: "O arquivo foi baixado com sucesso.",
    });
  };

  const handleSwitchPlanType = async (plan: MealPlan) => {
    const newType = isPlanDiet(plan) ? 'workout' : 'diet';
    const description = `Baseado no plano anterior "${plan.name}", adapte para ${newType === 'diet' ? 'nutrição' : 'treino'}`;
    
    generatePlanMutation.mutate({
      description,
      type: newType
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="current" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Plano Atual
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Criar Manual
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-6">
            {activePlan ? (
              <div className="space-y-6">
                {/* Active Plan Card */}
                <Card className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-3 text-xl">
                          <div className={`p-2 rounded-lg ${isPlanDiet(activePlan) ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                            {isPlanDiet(activePlan) ? 
                              <Utensils className="w-6 h-6 text-green-600 dark:text-green-400" /> : 
                              <Dumbbell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            }
                          </div>
                          <div>
                            <h3 className="font-bold">{activePlan.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-normal mt-1">
                              {activePlan.description}
                            </p>
                          </div>
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                          <Check className="w-3 h-3 mr-1" />
                          Ativo
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleExportPlan(activePlan)}
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Exportar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSwitchPlanType(activePlan)}
                          className="flex items-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Alterar Tipo
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Progresso da Semana</span>
                          <span className="text-sm text-gray-600">{getWeekProgress()}%</span>
                        </div>
                        <Progress value={getWeekProgress()} className="w-full" />
                      </div>

                      <Separator />

                      {/* Plan Details */}
                      {activePlan.meals && isPlanDiet(activePlan) && (
                        <div className="space-y-4">
                          <h4 className="font-medium">Plano Alimentar Detalhado</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                              <p className="text-sm font-medium text-green-700 dark:text-green-300">Calorias Diárias</p>
                              <p className="text-lg font-bold text-green-800 dark:text-green-200">{activePlan.dailyCalories} kcal</p>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Proteínas</p>
                              <p className="text-lg font-bold text-blue-800 dark:text-blue-200">{activePlan.macroProtein}%</p>
                            </div>
                            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                              <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Carboidratos</p>
                              <p className="text-lg font-bold text-orange-800 dark:text-orange-200">{activePlan.macroCarbs}%</p>
                            </div>
                          </div>

                          {/* Weekly Meal Plan */}
                          <div className="space-y-3">
                            <h5 className="font-medium">Refeições da Semana</h5>
                            <div className="space-y-2">
                              {Object.entries(activePlan.meals).map(([day, dayMeals]: [string, any]) => (
                                <div key={day} className="border rounded-lg p-3">
                                  <h6 className="font-medium capitalize mb-2">{day}</h6>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                    {Object.entries(dayMeals).map(([mealType, meal]: [string, any]) => (
                                      <div key={mealType} className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                        <p className="font-medium">{getMealTypeName(mealType)}</p>
                                        <p className="text-gray-600 dark:text-gray-400">{meal.name}</p>
                                        <p className="text-xs text-gray-500">{meal.calories} kcal</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Workout Plan Details */}
                      {(activePlan as any).workouts && !isPlanDiet(activePlan) && (
                        <div className="space-y-4">
                          <h4 className="font-medium">Plano de Treino Detalhado</h4>
                          <div className="space-y-3">
                            {Object.entries((activePlan as any).workouts).map(([day, workout]: [string, any]) => (
                              <div key={day} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h6 className="font-medium capitalize">{day}</h6>
                                  {workout.duration && (
                                    <Badge variant="secondary">{workout.duration}</Badge>
                                  )}
                                </div>
                                <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  {workout.name}
                                </h6>
                                {workout.exercises && workout.exercises.length > 0 ? (
                                  <div className="space-y-2">
                                    {workout.exercises.map((exercise: any, index: number) => (
                                      <div key={index} className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium">{exercise.name}</span>
                                          <div className="text-sm text-gray-600 dark:text-gray-400">
                                            {exercise.sets && exercise.reps && (
                                              <span>{exercise.sets} x {exercise.reps}</span>
                                            )}
                                            {exercise.rest && (
                                              <span className="ml-2">• {exercise.rest}</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-500 dark:text-gray-400 text-sm">Dia de descanso</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Separator />

                      {/* Daily Progress Tracking */}
                      <div className="space-y-3">
                        <h4 className="font-medium">Progresso de Hoje</h4>
                        
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Utensils className="w-5 h-5 text-green-600" />
                            <span>Dieta seguida hoje</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={progressData.dietCompleted ? "default" : "outline"}
                              onClick={() => handleProgressUpdate('diet', true)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={!progressData.dietCompleted ? "default" : "outline"}
                              onClick={() => handleProgressUpdate('diet', false)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Dumbbell className="w-5 h-5 text-blue-600" />
                            <span>Treino realizado hoje</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={progressData.workoutCompleted ? "default" : "outline"}
                              onClick={() => handleProgressUpdate('workout', true)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={!progressData.workoutCompleted ? "default" : "outline"}
                              onClick={() => handleProgressUpdate('workout', false)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <Target className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Nenhum plano ativo</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Crie seu primeiro plano alimentar personalizado com ajuda da IA
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Create New Plan Section */}
            <Card>
              <CardHeader>
                <CardTitle>Criar Novo Plano com IA</CardTitle>
                <CardDescription>
                  Conte um pouco sobre você e deixe nossa IA criar um plano personalizado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={selectedPlanType === 'diet' ? 'default' : 'outline'}
                    onClick={() => setSelectedPlanType('diet')}
                    className="flex items-center gap-2"
                  >
                    <Utensils className="w-4 h-4" />
                    Nutricionista IA
                  </Button>
                  <Button
                    variant={selectedPlanType === 'workout' ? 'default' : 'outline'}
                    onClick={() => setSelectedPlanType('workout')}
                    className="flex items-center gap-2"
                  >
                    <Dumbbell className="w-4 h-4" />
                    Personal Trainer IA
                  </Button>
                </div>

                <Textarea
                  placeholder={
                    selectedPlanType === 'diet'
                      ? "Ex: Tenho 25 anos, peso 70kg, quero ganhar massa muscular, não tenho restrições alimentares, gosto de comida brasileira tradicional..."
                      : "Ex: Tenho 25 anos, iniciante na academia, quero ganhar massa muscular, tenho disponibilidade de 4x por semana, prefiro treinos de 1 hora..."
                  }
                  value={userDescription}
                  onChange={(e) => setUserDescription(e.target.value)}
                  rows={4}
                />

                <Button
                  onClick={handleGeneratePlan}
                  disabled={generatePlanMutation.isPending}
                  className="w-full"
                >
                  {generatePlanMutation.isPending ? "Gerando..." : `Criar Plano com ${selectedPlanType === 'diet' ? 'Nutricionista' : 'Personal Trainer'} IA`}
                </Button>
              </CardContent>
            </Card>

            {/* Custom Plan Button */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  variant="outline"
                  onClick={() => toast({
                    title: "Em desenvolvimento",
                    description: "Criação de planos personalizados manuais será implementada em breve.",
                  })}
                  className="w-full flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Criar Plano Personalizado Manualmente
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {planHistory.length > 0 ? (
              <div className="space-y-4">
                {planHistory.map((plan: MealPlan) => (
                  <Card key={plan.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {isPlanDiet(plan) ? <Utensils className="w-5 h-5" /> : <Dumbbell className="w-5 h-5" />}
                            {plan.name}
                          </CardTitle>
                          <CardDescription>{plan.description}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => activatePlanMutation.mutate(plan.id)}
                            disabled={plan.isActive}
                          >
                            {plan.isActive ? 'Ativo' : 'Ativar'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deletePlanMutation.mutate(plan.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Criado em {new Date(plan.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum plano no histórico</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Quando você criar planos, eles aparecerão aqui
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}