import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function MyFoods() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("recipes");
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [recipeName, setRecipeName] = useState("");
  const [recipeDescription, setRecipeDescription] = useState("");
  const [availableIngredients, setAvailableIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState("");

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

  // Fetch recipes
  const { data: recipes = [], isLoading: recipesLoading } = useQuery({
    queryKey: ["/api/recipes"],
    enabled: isAuthenticated,
  });

  // Fetch custom foods (ingredients)
  const { data: customFoods = [] } = useQuery({
    queryKey: ["/api/foods", { custom: true }],
    enabled: isAuthenticated,
  });

  // Create recipe mutation
  const createRecipeMutation = useMutation({
    mutationFn: async (recipeData: any) => {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(recipeData),
      });
      if (!response.ok) throw new Error("Failed to create recipe");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      setShowAddRecipe(false);
      setRecipeName("");
      setRecipeDescription("");
      toast({
        title: "Receita criada!",
        description: "Sua receita foi salva com sucesso",
      });
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
      toast({
        title: "Erro ao criar receita",
        description: "Não foi possível salvar a receita",
        variant: "destructive",
      });
    },
  });

  // Delete recipe mutation
  const deleteRecipeMutation = useMutation({
    mutationFn: async (recipeId: number) => {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete recipe");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: "Receita excluída",
        description: "A receita foi removida com sucesso",
      });
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
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a receita",
        variant: "destructive",
      });
    },
  });

  // Get recipe suggestions mutation
  const getRecipeSuggestionsMutation = useMutation({
    mutationFn: async (ingredients: string[]) => {
      const response = await fetch("/api/ai/suggest-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ availableIngredients: ingredients }),
      });
      if (!response.ok) throw new Error("Failed to get recipe suggestions");
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
      toast({
        title: "Erro nas sugestões",
        description: "Não foi possível obter sugestões de receitas",
        variant: "destructive",
      });
    },
  });

  const handleCreateRecipe = () => {
    if (!recipeName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para a receita",
        variant: "destructive",
      });
      return;
    }

    createRecipeMutation.mutate({
      name: recipeName,
      description: recipeDescription,
      servings: 1,
    });
  };

  const addIngredient = () => {
    if (newIngredient.trim() && !availableIngredients.includes(newIngredient.trim())) {
      setAvailableIngredients(prev => [...prev, newIngredient.trim()]);
      setNewIngredient("");
    }
  };

  const removeIngredient = (ingredient: string) => {
    setAvailableIngredients(prev => prev.filter(ing => ing !== ingredient));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Fácil';
      case 'medium': return 'Médio';
      case 'hard': return 'Difícil';
      default: return difficulty;
    }
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Meus Alimentos</h2>
        <Dialog open={showAddRecipe} onOpenChange={setShowAddRecipe}>
          <DialogTrigger asChild>
            <Button size="sm">
              <i className="fas fa-plus mr-2"></i>
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Receita</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="recipe-name">Nome da Receita</Label>
                <Input
                  id="recipe-name"
                  placeholder="Ex: Omelete de Queijo"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="recipe-description">Descrição</Label>
                <Textarea
                  id="recipe-description"
                  placeholder="Descreva sua receita..."
                  value={recipeDescription}
                  onChange={(e) => setRecipeDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddRecipe(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateRecipe}
                  disabled={createRecipeMutation.isPending}
                  className="flex-1"
                >
                  {createRecipeMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recipes">Receitas</TabsTrigger>
          <TabsTrigger value="ingredients">Ingredientes</TabsTrigger>
        </TabsList>

        <TabsContent value="recipes" className="space-y-4 mt-6">
          {recipesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="animate-pulse">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                        </div>
                        <div className="flex space-x-2">
                          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((j) => (
                          <div key={j} className="text-center">
                            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-1"></div>
                            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recipes.length > 0 ? (
            <div className="space-y-4">
              {recipes.map((recipe: any) => (
                <Card key={recipe.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{recipe.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {recipe.description || `${recipe.ingredients?.length || 0} ingredientes`}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="ghost">
                          <i className="fas fa-edit text-sm text-primary"></i>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => deleteRecipeMutation.mutate(recipe.id)}
                          disabled={deleteRecipeMutation.isPending}
                        >
                          <i className="fas fa-trash text-sm text-red-500"></i>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-center text-sm mb-4">
                      <div>
                        <p className="font-semibold text-primary">{recipe.totalCalories || 0}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">kcal</p>
                      </div>
                      <div>
                        <p className="font-semibold text-blue-500">{parseFloat(recipe.totalProtein || "0").toFixed(0)}g</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">prot</p>
                      </div>
                      <div>
                        <p className="font-semibold text-yellow-500">{parseFloat(recipe.totalCarbs || "0").toFixed(0)}g</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">carb</p>
                      </div>
                      <div>
                        <p className="font-semibold text-orange-500">{parseFloat(recipe.totalFat || "0").toFixed(0)}g</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">gord</p>
                      </div>
                    </div>

                    <Button className="w-full" size="sm">
                      Adicionar à Refeição
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <i className="fas fa-utensils text-3xl text-gray-400 mb-4"></i>
                <h3 className="font-semibold mb-2">Nenhuma receita encontrada</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Crie sua primeira receita clicando no botão Adicionar
                </p>
                <Button onClick={() => setShowAddRecipe(true)}>
                  <i className="fas fa-plus mr-2"></i>
                  Criar Receita
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Suggested Recipes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Receitas Sugeridas</span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => getRecipeSuggestionsMutation.mutate(availableIngredients)}
                  disabled={availableIngredients.length === 0 || getRecipeSuggestionsMutation.isPending}
                >
                  {getRecipeSuggestionsMutation.isPending ? (
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                  ) : (
                    <i className="fas fa-wand-magic-sparkles mr-2"></i>
                  )}
                  Buscar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availableIngredients.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Adicione ingredientes na aba "Ingredientes" para receber sugestões de receitas
                </p>
              ) : getRecipeSuggestionsMutation.data ? (
                <div className="space-y-3">
                  {getRecipeSuggestionsMutation.data.map((suggestion: any, index: number) => (
                    <div key={index} className="p-3 border border-gray-200 dark:border-gray-600 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{suggestion.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{suggestion.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getDifficultyColor(suggestion.difficulty)}>
                              {getDifficultyText(suggestion.difficulty)}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {suggestion.cookingTime} min
                            </span>
                          </div>
                        </div>
                        <Button size="sm">
                          Ver Receita
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Clique em "Buscar" para obter sugestões baseadas nos seus ingredientes
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ingredients" className="space-y-4 mt-6">
          {/* Add Ingredient */}
          <Card>
            <CardHeader>
              <CardTitle>Ingredientes Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Ex: frango, arroz, brócolis..."
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
                />
                <Button onClick={addIngredient} disabled={!newIngredient.trim()}>
                  <i className="fas fa-plus"></i>
                </Button>
              </div>

              {availableIngredients.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableIngredients.map((ingredient, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {ingredient}
                      <button
                        onClick={() => removeIngredient(ingredient)}
                        className="ml-1 text-xs hover:text-red-500"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Adicione ingredientes que você tem disponível para receber sugestões de receitas
                </p>
              )}
            </CardContent>
          </Card>

          {/* Custom Foods */}
          <Card>
            <CardHeader>
              <CardTitle>Alimentos Personalizados</CardTitle>
            </CardHeader>
            <CardContent>
              {customFoods.length > 0 ? (
                <div className="space-y-2">
                  {customFoods.map((food: any) => (
                    <div key={food.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div>
                        <p className="font-medium">{food.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {food.caloriesPer100g} kcal/100g
                        </p>
                      </div>
                      <Button size="sm" variant="ghost">
                        <i className="fas fa-edit text-primary"></i>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Você ainda não criou alimentos personalizados
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
