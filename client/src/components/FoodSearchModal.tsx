import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Search, Globe, User, Plus } from "lucide-react";

interface Food {
  id?: number;
  usdaFdcId?: number;
  name: string;
  brand?: string;
  category?: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  sugarPer100g?: number;
  sodiumPer100g?: number;
  isCustom?: boolean;
}

interface FoodSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFood: (food: Food, quantity: number, unit: string) => void;
}

const UNIT_OPTIONS = [
  { value: "g", label: "Gramas (g)" },
  { value: "ml", label: "Mililitros (ml)" },
  { value: "colher_sopa", label: "Colher de sopa" },
  { value: "colher_cha", label: "Colher de chá" },
  { value: "xicara", label: "Xícara" },
  { value: "copo", label: "Copo (200ml)" },
  { value: "unidade", label: "Unidade" },
  { value: "fatia", label: "Fatia" },
  { value: "porcao", label: "Porção" },
];

export function FoodSearchModal({ isOpen, onClose, onSelectFood }: FoodSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState("g");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search user's foods
  const { data: userFoods = [], isLoading: isLoadingUserFoods } = useQuery({
    queryKey: ["/api/foods", debouncedQuery],
    enabled: debouncedQuery.length > 2,
  });

  // Search USDA foods
  const { data: usdaFoods = [], isLoading: isLoadingUsdaFoods } = useQuery({
    queryKey: ["/api/foods/search", debouncedQuery],
    enabled: debouncedQuery.length > 2,
  });

  const addUsdaFoodMutation = useMutation({
    mutationFn: async (usdaFood: Food) => {
      return await apiRequest("POST", "/api/foods/from-usda", { usdaFood });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/foods"] });
    },
  });

  const handleSelectFood = (food: Food) => {
    setSelectedFood(food);
  };

  const handleAddFood = () => {
    if (!selectedFood) return;

    // Calculate nutrition values based on quantity and unit
    let quantityInGrams = quantity;
    
    // Convert units to grams (approximations for Brazilian cooking)
    switch (unit) {
      case "ml":
        quantityInGrams = quantity; // 1ml ≈ 1g for most liquids
        break;
      case "colher_sopa":
        quantityInGrams = quantity * 15; // 1 tablespoon ≈ 15g
        break;
      case "colher_cha":
        quantityInGrams = quantity * 5; // 1 teaspoon ≈ 5g
        break;
      case "xicara":
        quantityInGrams = quantity * 240; // 1 cup ≈ 240g
        break;
      case "copo":
        quantityInGrams = quantity * 200; // 1 glass ≈ 200g
        break;
      case "unidade":
        quantityInGrams = quantity * 100; // Assume 1 unit ≈ 100g
        break;
      case "fatia":
        quantityInGrams = quantity * 30; // 1 slice ≈ 30g
        break;
      case "porcao":
        quantityInGrams = quantity * 150; // 1 portion ≈ 150g
        break;
    }

    const multiplier = quantityInGrams / 100;

    const foodWithNutrition = {
      ...selectedFood,
      calories: Math.round(selectedFood.caloriesPer100g * multiplier),
      protein: Math.round(selectedFood.proteinPer100g * multiplier),
      carbs: Math.round(selectedFood.carbsPer100g * multiplier),
      fat: Math.round(selectedFood.fatPer100g * multiplier),
    };

    onSelectFood(foodWithNutrition, quantity, unit);
    setSelectedFood(null);
    setSearchQuery("");
    setQuantity(100);
    setUnit("g");
    onClose();
  };

  const handleAddUsdaFood = async (usdaFood: Food) => {
    try {
      await addUsdaFoodMutation.mutateAsync(usdaFood);
      setSelectedFood(usdaFood);
      toast({
        title: "Alimento adicionado",
        description: "O alimento foi adicionado à sua lista pessoal.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o alimento.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Buscar Alimentos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Busque por alimentos (ex: arroz, frango, banana)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Food Selection */}
          {!selectedFood ? (
            <Tabs defaultValue="my-foods" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="my-foods" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Meus Alimentos
                </TabsTrigger>
                <TabsTrigger value="usda-foods" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Base Mundial (USDA)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="my-foods" className="max-h-60 overflow-y-auto">
                {isLoadingUserFoods ? (
                  <div className="text-center py-4">Buscando...</div>
                ) : userFoods.length > 0 ? (
                  <div className="space-y-2">
                    {userFoods.map((food: Food) => (
                      <Card
                        key={food.id}
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => handleSelectFood(food)}
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{food.name}</h4>
                              {food.brand && (
                                <p className="text-sm text-muted-foreground">{food.brand}</p>
                              )}
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline">
                                  {food.caloriesPer100g} kcal/100g
                                </Badge>
                                {food.isCustom && (
                                  <Badge variant="secondary">Personalizado</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : searchQuery.length > 2 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Nenhum alimento encontrado em sua lista
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Digite pelo menos 3 caracteres para buscar
                  </div>
                )}
              </TabsContent>

              <TabsContent value="usda-foods" className="max-h-60 overflow-y-auto">
                {isLoadingUsdaFoods ? (
                  <div className="text-center py-4">Buscando na base mundial...</div>
                ) : usdaFoods.length > 0 ? (
                  <div className="space-y-2">
                    {usdaFoods.map((food: Food, index: number) => (
                      <Card key={`${food.usdaFdcId}-${index}`} className="hover:bg-accent transition-colors">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium">{food.name}</h4>
                              {food.brand && (
                                <p className="text-sm text-muted-foreground">{food.brand}</p>
                              )}
                              {food.category && (
                                <p className="text-xs text-muted-foreground">{food.category}</p>
                              )}
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline">
                                  {food.caloriesPer100g} kcal/100g
                                </Badge>
                                <Badge variant="secondary">USDA</Badge>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddUsdaFood(food)}
                                disabled={addUsdaFoodMutation.isPending}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSelectFood(food)}
                              >
                                Usar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : searchQuery.length > 2 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Nenhum alimento encontrado na base USDA
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Digite pelo menos 3 caracteres para buscar
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            /* Quantity Selection */
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Alimento Selecionado:</h3>
                  <h4 className="text-lg font-semibold">{selectedFood.name}</h4>
                  {selectedFood.brand && (
                    <p className="text-sm text-muted-foreground">{selectedFood.brand}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Quantidade</label>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      min="0.1"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Unidade</label>
                    <Select value={unit} onValueChange={setUnit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setSelectedFood(null)}>
                    Voltar
                  </Button>
                  <Button onClick={handleAddFood}>
                    Adicionar à Refeição
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}