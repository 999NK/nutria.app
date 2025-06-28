import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bot, Edit3, Plus, Trash2, Calendar, Clock, Utensils } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const mealPlanSchema = z.object({
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
});

type MealPlanFormData = z.infer<typeof mealPlanSchema>;

export default function MyPlan() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);

  const form = useForm<MealPlanFormData>({
    resolver: zodResolver(mealPlanSchema),
    defaultValues: {
      description: "",
    },
  });

  // Buscar plano ativo do usuário
  const { data: activePlan, isLoading } = useQuery({
    queryKey: ["/api/my-meal-plan"],
    queryFn: () => fetch("/api/my-meal-plan").then(res => res.json()),
  });

  // Buscar histórico de planos
  const { data: planHistory } = useQuery({
    queryKey: ["/api/my-meal-plans/history"],
    queryFn: () => fetch("/api/my-meal-plans/history").then(res => res.json()),
  });

  const createPlanMutation = useMutation({
    mutationFn: async (data: MealPlanFormData) => {
      return apiRequest("/api/generate-meal-plan", "POST", { description: data.description });
    },
    onSuccess: () => {
      toast({
        title: "Plano criado!",
        description: "Seu plano alimentar foi gerado pela IA.",
      });
      form.reset();
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/my-meal-plan"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-meal-plans/history"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao gerar plano. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, description }: { id: number; description: string }) => {
      return apiRequest(`/api/meal-plans/${id}/update`, "PATCH", { description });
    },
    onSuccess: () => {
      toast({
        title: "Plano atualizado!",
        description: "Seu plano alimentar foi modificado pela IA.",
      });
      setEditingPlan(null);
      queryClient.invalidateQueries({ queryKey: ["/api/my-meal-plan"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar plano. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/meal-plans/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Plano removido",
        description: "Seu plano alimentar foi excluído.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/my-meal-plan"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-meal-plans/history"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao excluir plano. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MealPlanFormData) => {
    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, description: data.description });
    } else {
      createPlanMutation.mutate(data);
    }
  };

  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    form.setValue("description", `Modifique este plano: ${plan.description}`);
    setIsDialogOpen(true);
  };

  const handleNewPlan = () => {
    setEditingPlan(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const renderMealPlan = (plan: any) => {
    if (!plan.meals) return null;

    const meals = typeof plan.meals === 'string' ? JSON.parse(plan.meals) : plan.meals;
    
    return (
      <div className="space-y-4">
        {Object.entries(meals).map(([day, dayMeals]: [string, any]) => (
          <Card key={day}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg capitalize">{day}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(dayMeals).map(([mealType, meal]: [string, any]) => (
                <div key={mealType} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Utensils className="w-4 h-4 mt-1 text-gray-500" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium capitalize">
                        {mealType === 'breakfast' && 'Café da Manhã'}
                        {mealType === 'lunch' && 'Almoço'}
                        {mealType === 'dinner' && 'Jantar'}
                        {mealType === 'snack1' && 'Lanche da Manhã'}
                        {mealType === 'snack2' && 'Lanche da Tarde'}
                      </h4>
                      <Badge variant="secondary">{meal.calories || 0} kcal</Badge>
                    </div>
                    <h5 className="font-semibold">{meal.name}</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {meal.description}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl mb-20 md:mb-0">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 md:p-4 max-w-4xl mb-20 lg:mb-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meu Plano Alimentar</h1>
        <p className="text-gray-600 dark:text-gray-400">Gerencie seu plano nutricional personalizado</p>
      </div>

      <Tabs defaultValue="current" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current">
            <Calendar className="w-4 h-4 mr-2" />
            Plano Atual
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="w-4 h-4 mr-2" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {!activePlan ? (
            <Card>
              <CardContent className="text-center py-12">
                <Bot className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum plano ativo</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Crie seu primeiro plano alimentar personalizado com ajuda da IA
                </p>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleNewPlan}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Plano com IA
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingPlan ? "Editar Plano Alimentar" : "Criar Plano Alimentar"}
                      </DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descreva suas necessidades</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Ex: Sou vegetariano, quero perder peso, tenho diabetes, preciso ganhar massa muscular, etc."
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                          >
                            {createPlanMutation.isPending || updatePlanMutation.isPending ? (
                              "Gerando..."
                            ) : editingPlan ? (
                              "Atualizar Plano"
                            ) : (
                              "Gerar Plano"
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{activePlan.name}</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Criado em {activePlan.createdAt ? format(new Date(activePlan.createdAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Data não disponível'}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(activePlan)}>
                            <Edit3 className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Editar Plano Alimentar</DialogTitle>
                          </DialogHeader>
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                              <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>O que você gostaria de modificar?</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Ex: Adicionar mais proteínas, trocar jantar por algo mais leve, incluir opções veganas..."
                                        className="min-h-[100px]"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="flex justify-end space-x-2">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                  Cancelar
                                </Button>
                                <Button 
                                  type="submit" 
                                  disabled={updatePlanMutation.isPending}
                                >
                                  {updatePlanMutation.isPending ? "Atualizando..." : "Atualizar Plano"}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deletePlanMutation.mutate(activePlan.id)}
                        disabled={deletePlanMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {activePlan.description && (
                    <Alert className="mb-6">
                      <Bot className="w-4 h-4" />
                      <AlertDescription>{activePlan.description}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-lg font-semibold">{activePlan.dailyCalories || 0}</div>
                      <div className="text-xs text-gray-600">Calorias/dia</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-lg font-semibold">{activePlan.macroCarbs || 0}%</div>
                      <div className="text-xs text-gray-600">Carboidratos</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-lg font-semibold">{activePlan.macroProtein || 0}%</div>
                      <div className="text-xs text-gray-600">Proteínas</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-lg font-semibold">{activePlan.macroFat || 0}%</div>
                      <div className="text-xs text-gray-600">Gorduras</div>
                    </div>
                  </div>

                  {renderMealPlan(activePlan)}
                </CardContent>
              </Card>

              <div className="text-center">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleNewPlan}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Novo Plano
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Criar Novo Plano Alimentar</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descreva suas necessidades</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Ex: Sou vegetariano, quero perder peso, tenho diabetes, preciso ganhar massa muscular, etc."
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createPlanMutation.isPending}
                          >
                            {createPlanMutation.isPending ? "Gerando..." : "Gerar Plano"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {!planHistory || planHistory.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum histórico</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Seus planos anteriores aparecerão aqui
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {planHistory.map((plan: any) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Criado em {plan.createdAt ? format(new Date(plan.createdAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Data não disponível'}
                        </p>
                      </div>
                      <Badge variant="outline">Histórico</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {plan.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {plan.description}
                      </p>
                    )}
                    {renderMealPlan(plan)}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}