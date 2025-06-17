import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, X, Save, Database, Utensils, Scale } from "lucide-react";

interface FoodItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface USDAFood {
  usdaFdcId: number;
  name: string;
  brand?: string;
  category?: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  sugarPer100g: number;
  sodiumPer100g: number;
}

const UNIT_OPTIONS = [
  { value: "g", label: "Gramas (g)", factor: 1 },
  { value: "ml", label: "Mililitros (ml)", factor: 1 },
  { value: "cup", label: "Xícara", factor: 240 },
  { value: "tbsp", label: "Colher de sopa", factor: 15 },
  { value: "tsp", label: "Colher de chá", factor: 5 },
  { value: "unit", label: "Unidade", factor: 100 },
  { value: "slice", label: "Fatia", factor: 30 },
  { value: "piece", label: "Pedaço", factor: 50 },
];

export default function AddMealEnhanced() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedMealType, setSelectedMealType] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFoods, setSelectedFoods] = useState<FoodItem[]>([]);
  const [activeTab, setActiveTab] = useState("usda");

  // Fetch meal types
  const { data: mealTypes = [] } = useQuery({
    queryKey: ["/api/meal-types"],
    enabled: isAuthenticated,
  });

  // Search USDA foods
  const { data: usdaFoods = [], isLoading: isSearching } = useQuery({
    queryKey: ["/api/foods/search", searchQuery],
    enabled: searchQuery.length > 2,
  });

  // Fetch user's custom foods
  const { data: customFoods = [] } = useQuery({
    queryKey: ["/api/foods"],
    enabled: isAuthenticated,
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

  const addFoodToMeal = (food: USDAFood | any, quantity: number = 100, unit: string = "g") => {
    const unitOption = UNIT_OPTIONS.find(u => u.value === unit);
    const factor = unitOption ? unitOption.factor : 1;
    const actualGrams = unit === "g" ? quantity : quantity * factor;
    const multiplier = actualGrams / 100;

    const newFood: FoodItem = {
      id: food.usdaFdcId || food.id,
      name: food.name,
      quantity,
      unit,
      calories: Math.round((food.caloriesPer100g || 0) * multiplier),
      protein: Math.round((food.proteinPer100g || 0) * multiplier * 100) / 100,
      carbs: Math.round((food.carbsPer100g || 0) * multiplier * 100) / 100,
      fat: Math.round((food.fatPer100g || 0) * multiplier * 100) / 100,
    };

    setSelectedFoods(prev => [...prev, newFood]);
  };

  const removeFoodFromMeal = (index: number) => {
    setSelectedFoods(prev => prev.filter((_, i) => i !== index));
  };

  const updateFoodQuantity = (index: number, quantity: number, unit: string) => {
    setSelectedFoods(prev => prev.map((food, i) => {
      if (i === index) {
        const unitOption = UNIT_OPTIONS.find(u => u.value === unit);
        const factor = unitOption ? unitOption.factor : 1;
        const actualGrams = unit === "g" ? quantity : quantity * factor;
        const multiplier = actualGrams / 100;

        return {
          ...food,
          quantity,
          unit,
          calories: Math.round((food.calories / (food.quantity / 100)) * multiplier),
          protein: Math.round((food.protein / (food.quantity / 100)) * multiplier * 100) / 100,
          carbs: Math.round((food.carbs / (food.quantity / 100)) * multiplier * 100) / 100,
          fat: Math.round((food.fat / (food.quantity / 100)) * multiplier * 100) / 100,
        };
      }
      return food;
    }));
  };

  const createMealMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMealType) {
        throw new Error("Selecione um tipo de refeição");
      }
      if (selectedFoods.length === 0) {
        throw new Error("Adicione pelo menos um alimento");
      }

      // Create meal
      const meal = await apiRequest("/api/meals", "POST", {
        mealTypeId: parseInt(selectedMealType),
        date: new Date().toISOString().split('T')[0],
      });

      // Add foods to meal
      for (const food of selectedFoods) {
        await apiRequest(`/api/meals/${meal.id}/foods`, "POST", {
          foodId: food.id,
          quantity: food.quantity.toString(),
          unit: food.unit,
          calories: food.calories.toString(),
          protein: food.protein.toString(),
          carbs: food.carbs.toString(),
          fat: food.fat.toString(),
        });
      }

      return meal;
    },
    onSuccess: () => {
      toast({
        title: "Refeição adicionada!",
        description: "Sua refeição foi registrada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition/daily"] });
      setLocation("/");
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
        description: error instanceof Error ? error.message : "Falha ao criar refeição",
        variant: "destructive",
      });
    },
  });

  const totalNutrients = selectedFoods.reduce(
    (acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + food.protein,
      carbs: acc.carbs + food.carbs,
      fat: acc.fat + food.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Adicionar Refeição
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Meal Type Selection */}
          <div>
            <Label htmlFor="meal-type">Tipo de Refeição</Label>
            <Select value={selectedMealType} onValueChange={setSelectedMealType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de refeição" />
              </SelectTrigger>
              <SelectContent>
                {mealTypes.map((type: any) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Food Search */}
          <div>
            <Label htmlFor="food-search">Buscar Alimentos</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="food-search"
                placeholder="Ex: arroz, frango, banana..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Food Search Results */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="usda" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Base USDA
              </TabsTrigger>
              <TabsTrigger value="custom" className="flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Meus Alimentos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="usda" className="space-y-4">
              {searchQuery.length > 2 && (
                <ScrollArea className="h-64 border rounded-md p-4">
                  {isSearching ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                    </div>
                  ) : usdaFoods.length > 0 ? (
                    <div className="space-y-2">
                      {usdaFoods.map((food: USDAFood) => (
                        <Card key={food.usdaFdcId} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium">{food.name}</h4>
                              {food.brand && (
                                <p className="text-sm text-muted-foreground">{food.brand}</p>
                              )}
                              {food.category && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  {food.category}
                                </Badge>
                              )}
                              <div className="text-xs text-muted-foreground mt-1">
                                {food.caloriesPer100g} cal/100g
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => addFoodToMeal(food)}
                              className="ml-2"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground h-32 flex items-center justify-center">
                      Nenhum alimento encontrado
                    </div>
                  )}
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <ScrollArea className="h-64 border rounded-md p-4">
                {customFoods.length > 0 ? (
                  <div className="space-y-2">
                    {customFoods
                      .filter((food: any) => 
                        food.name.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((food: any) => (
                        <Card key={food.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium">{food.name}</h4>
                              {food.brand && (
                                <p className="text-sm text-muted-foreground">{food.brand}</p>
                              )}
                              <div className="text-xs text-muted-foreground mt-1">
                                {food.caloriesPer100g} cal/100g
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => addFoodToMeal(food)}
                              className="ml-2"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground h-32 flex items-center justify-center">
                    Nenhum alimento personalizado encontrado
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Selected Foods */}
          {selectedFoods.length > 0 && (
            <div>
              <Label>Alimentos Selecionados</Label>
              <div className="space-y-3 mt-2">
                {selectedFoods.map((food, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium">{food.name}</h4>
                        <div className="text-sm text-muted-foreground">
                          {food.calories} cal • {food.protein}g prot • {food.carbs}g carb • {food.fat}g gord
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={food.quantity}
                          onChange={(e) => updateFoodQuantity(index, Number(e.target.value), food.unit)}
                          className="w-20"
                          min="1"
                        />
                        <Select
                          value={food.unit}
                          onValueChange={(unit) => updateFoodQuantity(index, food.quantity, unit)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNIT_OPTIONS.map((unit) => (
                              <SelectItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFoodFromMeal(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Nutrition Summary */}
          {selectedFoods.length > 0 && (
            <Card className="bg-green-50 dark:bg-green-950">
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-2">Resumo Nutricional</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-lg">{totalNutrients.calories}</div>
                    <div className="text-muted-foreground">Calorias</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-lg">{totalNutrients.protein.toFixed(1)}g</div>
                    <div className="text-muted-foreground">Proteína</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-lg">{totalNutrients.carbs.toFixed(1)}g</div>
                    <div className="text-muted-foreground">Carboidratos</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-lg">{totalNutrients.fat.toFixed(1)}g</div>
                    <div className="text-muted-foreground">Gordura</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => createMealMutation.mutate()}
              disabled={!selectedMealType || selectedFoods.length === 0 || createMealMutation.isPending}
              className="flex-1"
            >
              {createMealMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Refeição
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}