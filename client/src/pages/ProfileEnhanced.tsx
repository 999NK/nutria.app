import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { User, Settings, Bell, LogOut, Target, Scale, Activity, Edit3, Save, Calculator } from "lucide-react";
import { useEffect } from "react";

export default function ProfileEnhanced() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    weight: 0,
    height: 0,
    age: 0,
    goal: "",
    activityLevel: "",
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Não autorizado",
        description: "Você precisa estar logado. Redirecionando...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  useEffect(() => {
    if (user) {
      setEditedData({
        weight: (user as any).weight || 0,
        height: (user as any).height || 0,
        age: (user as any).age || 0,
        goal: (user as any).goal || "",
        activityLevel: (user as any).activityLevel || "",
      });
    }
  }, [user]);

  const calculateNutritionGoals = (data: typeof editedData) => {
    const weightKg = data.weight;
    const heightCm = data.height;
    const age = data.age;

    // BMR calculation using Mifflin-St Jeor equation (assuming male for simplification)
    const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;

    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    const tdee = bmr * (activityMultipliers[data.activityLevel as keyof typeof activityMultipliers] || 1.55);

    let dailyCalories = tdee;
    if (data.goal === "lose") {
      dailyCalories = tdee - 500; // 500 cal deficit for 0.5kg/week loss
    } else if (data.goal === "gain") {
      dailyCalories = tdee + 300; // 300 cal surplus for controlled gain
    }

    const proteinCalories = dailyCalories * 0.25; // 25% protein
    const fatCalories = dailyCalories * 0.25; // 25% fat
    const carbsCalories = dailyCalories * 0.5; // 50% carbs

    return {
      dailyCalories: Math.round(dailyCalories),
      dailyProtein: Math.round(proteinCalories / 4), // 4 cal/g
      dailyFat: Math.round(fatCalories / 9), // 9 cal/g
      dailyCarbs: Math.round(carbsCalories / 4), // 4 cal/g
    };
  };

  const updateGoalsMutation = useMutation({
    mutationFn: async (data: typeof editedData) => {
      const goals = calculateNutritionGoals(data);
      return await apiRequest("/api/user/goals", "PATCH", {
        ...data,
        ...goals,
      });
    },
    onSuccess: () => {
      toast({
        title: "Perfil atualizado!",
        description: "Suas metas nutricionais foram recalculadas automaticamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditing(false);
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
        title: "Erro",
        description: "Falha ao atualizar perfil. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const toggleNotificationsMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return await apiRequest("/api/user/goals", "PATCH", {
        notificationsEnabled: enabled,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
        title: "Erro",
        description: "Falha ao atualizar configurações.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!editedData.weight || !editedData.height || !editedData.age || !editedData.goal || !editedData.activityLevel) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    updateGoalsMutation.mutate(editedData);
  };

  const previewGoals = calculateNutritionGoals(editedData);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Meu Perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Dados Pessoais
              </TabsTrigger>
              <TabsTrigger value="goals" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Metas
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configurações
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Informações Básicas</h3>
                <Button
                  variant={isEditing ? "default" : "outline"}
                  onClick={() => {
                    if (isEditing) {
                      handleSave();
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  disabled={updateGoalsMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {updateGoalsMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : isEditing ? (
                    <>
                      <Save className="h-4 w-4" />
                      Salvar
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-4 w-4" />
                      Editar
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Email</Label>
                    <Input value={(user as any).email || ""} disabled className="bg-gray-50 dark:bg-gray-800" />
                  </div>

                  <div>
                    <Label>Peso (kg)</Label>
                    <Input
                      type="number"
                      value={isEditing ? editedData.weight : (user as any).weight || ""}
                      onChange={(e) => setEditedData(prev => ({ ...prev, weight: Number(e.target.value) }))}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50 dark:bg-gray-800" : ""}
                    />
                  </div>

                  <div>
                    <Label>Altura (cm)</Label>
                    <Input
                      type="number"
                      value={isEditing ? editedData.height : (user as any).height || ""}
                      onChange={(e) => setEditedData(prev => ({ ...prev, height: Number(e.target.value) }))}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50 dark:bg-gray-800" : ""}
                    />
                  </div>

                  <div>
                    <Label>Idade</Label>
                    <Input
                      type="number"
                      value={isEditing ? editedData.age : (user as any).age || ""}
                      onChange={(e) => setEditedData(prev => ({ ...prev, age: Number(e.target.value) }))}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50 dark:bg-gray-800" : ""}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Objetivo</Label>
                    <Select
                      value={isEditing ? editedData.goal : (user as any).goal || ""}
                      onValueChange={(value) => setEditedData(prev => ({ ...prev, goal: value }))}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className={!isEditing ? "bg-gray-50 dark:bg-gray-800" : ""}>
                        <SelectValue placeholder="Selecione seu objetivo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lose">🔥 Emagrecimento</SelectItem>
                        <SelectItem value="maintain">⚖️ Manutenção</SelectItem>
                        <SelectItem value="gain">💪 Ganho de massa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Nível de Atividade</Label>
                    <Select
                      value={isEditing ? editedData.activityLevel : (user as any).activityLevel || ""}
                      onValueChange={(value) => setEditedData(prev => ({ ...prev, activityLevel: value }))}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className={!isEditing ? "bg-gray-50 dark:bg-gray-800" : ""}>
                        <SelectValue placeholder="Selecione seu nível" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentary">😴 Sedentário</SelectItem>
                        <SelectItem value="light">🚶 Exercício leve</SelectItem>
                        <SelectItem value="moderate">🏃 Exercício moderado</SelectItem>
                        <SelectItem value="active">🏋️ Exercício intenso</SelectItem>
                        <SelectItem value="very_active">🔥 Muito ativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(user as any).weight && (user as any).height && (
                    <div>
                      <Label>IMC</Label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <div className="text-lg font-semibold">
                          {(((user as any).weight || 0) / Math.pow(((user as any).height || 0) / 100, 2)).toFixed(1)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {(() => {
                            const bmi = ((user as any).weight || 0) / Math.pow(((user as any).height || 0) / 100, 2);
                            if (bmi < 18.5) return "Abaixo do peso";
                            if (bmi < 25) return "Peso normal";
                            if (bmi < 30) return "Sobrepeso";
                            return "Obesidade";
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <Card className="bg-blue-50 dark:bg-blue-950">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Calculator className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold">Pré-visualização das Metas</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-lg">{previewGoals.dailyCalories}</div>
                        <div className="text-muted-foreground">Calorias/dia</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-lg">{previewGoals.dailyProtein}g</div>
                        <div className="text-muted-foreground">Proteína</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-lg">{previewGoals.dailyCarbs}g</div>
                        <div className="text-muted-foreground">Carboidratos</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-lg">{previewGoals.dailyFat}g</div>
                        <div className="text-muted-foreground">Gordura</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="goals" className="space-y-6">
              <h3 className="text-lg font-semibold">Metas Nutricionais Atuais</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{(user as any).dailyCalories}</div>
                    <div className="text-sm text-muted-foreground">Calorias/dia</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{(user as any).dailyProtein}g</div>
                    <div className="text-sm text-muted-foreground">Proteína</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{(user as any).dailyCarbs}g</div>
                    <div className="text-sm text-muted-foreground">Carboidratos</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{(user as any).dailyFat}g</div>
                    <div className="text-sm text-muted-foreground">Gordura</div>
                  </CardContent>
                </Card>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>
                  Suas metas são calculadas automaticamente baseadas no seu peso, altura, idade, objetivo e nível de atividade.
                  Para alterar as metas, edite seus dados pessoais na aba "Dados Pessoais".
                </p>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <h3 className="text-lg font-semibold">Configurações</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Notificações</Label>
                    <div className="text-sm text-muted-foreground">
                      Receber lembretes diários sobre alimentação
                    </div>
                  </div>
                  <Switch
                    checked={(user as any).notificationsEnabled || false}
                    onCheckedChange={toggleNotificationsMutation.mutate}
                    disabled={toggleNotificationsMutation.isPending}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-base">Informações da Conta</Label>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Membro desde: {new Date((user as any).createdAt || "").toLocaleDateString("pt-BR")}</div>
                    <div>Última atualização: {new Date((user as any).updatedAt || "").toLocaleDateString("pt-BR")}</div>
                  </div>
                </div>

                <Separator />

                <Button
                  variant="destructive"
                  onClick={() => window.location.href = "/api/logout"}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sair da Conta
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}