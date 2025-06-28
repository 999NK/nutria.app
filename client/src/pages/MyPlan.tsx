import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Calendar, Target, Trash2, Plus, Check, X, Dumbbell, Utensils } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface UserPlan {
  id: number;
  name: string;
  description: string;
  type: 'diet' | 'workout' | 'combined';
  content: any;
  dailyCalories?: number;
  macroCarbs?: number;
  macroProtein?: number;
  macroFat?: number;
  isActive: boolean;
  isCustom: boolean;
  createdAt: string;
}

interface DailyProgress {
  id: number;
  planId: number;
  date: string;
  dietCompleted: boolean;
  workoutCompleted: boolean;
  notes?: string;
}

export default function MyPlan() {
  const [activeTab, setActiveTab] = useState("current");
  const [selectedPlanType, setSelectedPlanType] = useState<'diet' | 'workout'>('diet');
  const [userDescription, setUserDescription] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [customPlanData, setCustomPlanData] = useState({
    name: "",
    description: "",
    type: 'diet' as 'diet' | 'workout',
    content: {}
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch active plan
  const { data: activePlan } = useQuery({
    queryKey: ['/api/user-plans/active'],
    retry: false,
  });

  // Fetch plan history
  const { data: planHistory = [] } = useQuery({
    queryKey: ['/api/user-plans/history'],
    retry: false,
  });

  // Fetch today's progress
  const today = new Date().toISOString().split('T')[0];
  const { data: todayProgress } = useQuery({
    queryKey: ['/api/daily-progress', today],
    retry: false,
  });

  // Generate AI plan mutation
  const generatePlanMutation = useMutation({
    mutationFn: async (data: { description: string; type: 'diet' | 'workout' }) => {
      const endpoint = data.type === 'diet' ? '/api/generate-meal-plan' : '/api/generate-workout-plan';
      return await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ description: data.description })
      });
    },
    onSuccess: () => {
      toast({
        title: "Plano gerado com sucesso!",
        description: "Seu novo plano foi criado pela IA e está pronto para uso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user-plans'] });
      setUserDescription("");
    },
    onError: () => {
      toast({
        title: "Erro ao gerar plano",
        description: "Não foi possível gerar o plano. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Create custom plan mutation
  const createCustomPlanMutation = useMutation({
    mutationFn: async (planData: any) => {
      return await apiRequest('/api/user-plans/custom', {
        method: 'POST',
        body: JSON.stringify(planData)
      });
    },
    onSuccess: () => {
      toast({
        title: "Plano personalizado criado!",
        description: "Seu plano personalizado foi salvo com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user-plans'] });
      setShowCreateForm(false);
      setCustomPlanData({ name: "", description: "", type: 'diet', content: {} });
    },
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      return await apiRequest(`/api/user-plans/${planId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Plano excluído",
        description: "O plano foi removido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user-plans'] });
    },
  });

  // Update daily progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (data: { planId: number; date: string; type: 'diet' | 'workout'; completed: boolean }) => {
      return await apiRequest('/api/daily-progress', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/daily-progress'] });
      toast({
        title: "Progresso atualizado!",
        description: "Seu progresso foi salvo com sucesso.",
      });
    },
  });

  // Activate plan mutation
  const activatePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      return await apiRequest(`/api/user-plans/${planId}/activate`, {
        method: 'PATCH'
      });
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
    if (!activePlan) return;

    updateProgressMutation.mutate({
      planId: activePlan.id,
      date: today,
      type,
      completed
    });
  };

  const getWeekProgress = () => {
    if (!todayProgress) return 0;
    
    const totalTasks = activePlan?.type === 'combined' ? 14 : 7; // 7 days * 2 tasks or 1 task
    const completedTasks = todayProgress.filter((p: DailyProgress) => 
      p.dietCompleted || p.workoutCompleted
    ).length;
    
    return Math.round((completedTasks / totalTasks) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="current" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Plano Atual
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
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {activePlan.type === 'diet' ? <Utensils className="w-5 h-5" /> : <Dumbbell className="w-5 h-5" />}
                          {activePlan.name}
                        </CardTitle>
                        <CardDescription>{activePlan.description}</CardDescription>
                      </div>
                      <Badge variant="default">Ativo</Badge>
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

                      {/* Daily Progress Tracking */}
                      <div className="space-y-3">
                        <h4 className="font-medium">Progresso de Hoje</h4>
                        
                        {(activePlan.type === 'diet' || activePlan.type === 'combined') && (
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Utensils className="w-5 h-5 text-green-600" />
                              <span>Dieta seguida hoje</span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={todayProgress?.dietCompleted ? "default" : "outline"}
                                onClick={() => handleProgressUpdate('diet', true)}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={!todayProgress?.dietCompleted ? "default" : "outline"}
                                onClick={() => handleProgressUpdate('diet', false)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {(activePlan.type === 'workout' || activePlan.type === 'combined') && (
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Dumbbell className="w-5 h-5 text-blue-600" />
                              <span>Treino realizado hoje</span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={todayProgress?.workoutCompleted ? "default" : "outline"}
                                onClick={() => handleProgressUpdate('workout', true)}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={!todayProgress?.workoutCompleted ? "default" : "outline"}
                                onClick={() => handleProgressUpdate('workout', false)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
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
                  onClick={() => setShowCreateForm(true)}
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
                {planHistory.map((plan: UserPlan) => (
                  <Card key={plan.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {plan.type === 'diet' ? <Utensils className="w-5 h-5" /> : <Dumbbell className="w-5 h-5" />}
                            {plan.name}
                          </CardTitle>
                          <CardDescription>{plan.description}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {plan.isCustom && <Badge variant="secondary">Personalizado</Badge>}
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