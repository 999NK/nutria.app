import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertFoodSchema, insertMealTypeSchema, insertMealSchema, insertMealFoodSchema, insertRecipeSchema, insertRecipeIngredientSchema, meals, mealTypes } from "@shared/schema";
import { aiService } from "./services/aiService";
import { pdfService } from "./services/pdfService";
import { notificationService } from "./services/notificationService";
import { db } from "./db";
import { eq, and, sql, gte, lt } from "drizzle-orm";
import { z } from "zod";

// Utility functions for nutritional day calculation (5AM to 5AM)
function getNutritionalDay(date: Date): string {
  const nutritionalDate = new Date(date);
  
  // If it's before 5 AM, it belongs to the previous day
  if (date.getHours() < 5) {
    nutritionalDate.setDate(nutritionalDate.getDate() - 1);
  }
  
  return nutritionalDate.toISOString().split('T')[0];
}

function getNutritionalDayRange(dateString: string): { start: Date, end: Date } {
  const baseDate = new Date(dateString + 'T00:00:00Z');
  
  // Start at 5 AM of the given date
  const start = new Date(baseDate);
  start.setUTCHours(5, 0, 0, 0);
  
  // End at 5 AM of the next date  
  const end = new Date(baseDate);
  end.setUTCDate(end.getUTCDate() + 1);
  end.setUTCHours(5, 0, 0, 0);
  
  return { start, end };
}

function generateNutritionResponse(message: string): string {
  const lowerMessage = message.toLowerCase().trim();
  
  // Greetings and casual conversation
  if (lowerMessage.includes('oi') || lowerMessage.includes('olá') || lowerMessage.includes('boa tarde') || 
      lowerMessage.includes('bom dia') || lowerMessage.includes('boa noite') || lowerMessage.includes('e aí') ||
      lowerMessage === 'oi' || lowerMessage === 'olá' || lowerMessage === 'hello' || lowerMessage === 'hi') {
    return `Olá! Como vai? Sou seu assistente nutricional e estou aqui para ajudar com suas dúvidas sobre alimentação saudável. No que posso te auxiliar hoje? Posso sugerir receitas, explicar sobre nutrientes, dar dicas de substituições ou qualquer outra questão nutricional!`;
  }
  
  // Protein-related questions
  if (lowerMessage.includes('proteína') || lowerMessage.includes('protein')) {
    return `Excelente pergunta sobre proteína! As melhores fontes incluem: frango, peixe, ovos, feijões, lentilhas, quinoa e iogurte grego. Distribua o consumo ao longo do dia (20-30g por refeição) para melhor absorção. Qual é seu objetivo com a proteína?`;
  }
  
  // Sugar substitution
  if (lowerMessage.includes('açúcar') || lowerMessage.includes('substituir') || lowerMessage.includes('doce')) {
    return `Ótima iniciativa reduzir o açúcar! Alternativas naturais: banana amassada, tâmaras, mel, xilitol, stevia. Use frutas secas em receitas e experimente chocolate 70%+ cacau. Reduza gradualmente para adaptar o paladar.`;
  }
  
  // Water intake
  if (lowerMessage.includes('água') || lowerMessage.includes('hidrat')) {
    return `A hidratação é fundamental! Recomendação: 35ml por kg de peso corporal (pessoa de 70kg = 2,5L/dia). Beba um copo ao acordar, mantenha garrafa sempre à vista. Sinais de boa hidratação: urina amarelo claro e energia estável.`;
  }
  
  // Healthy snacks
  if (lowerMessage.includes('lanche') || lowerMessage.includes('snack') || lowerMessage.includes('beliscar')) {
    return `Lanches saudáveis essenciais! Opções: mix de oleaginosas, maçã com pasta de amendoim, vegetais com húmus, iogurte grego com frutas. Para levar: barrinhas caseiras de aveia, ovos cozidos. Timing ideal: a cada 3-4 horas.`;
  }
  
  // Weight loss
  if (lowerMessage.includes('emagrec') || lowerMessage.includes('peso') || lowerMessage.includes('dieta')) {
    return `Perda de peso saudável: déficit calórico moderado (300-500 kcal), alimentos integrais, hidratação, exercícios. Prato ideal: 50% vegetais, 25% proteína, 25% carboidratos complexos. Evite dietas extremas. Ritmo saudável: 0,5-1kg/semana.`;
  }
  
  // General nutrition
  if (lowerMessage.includes('alimentação') || lowerMessage.includes('nutrição') || lowerMessage.includes('saudável')) {
    return `Alimentação equilibrada: variedade de cores no prato, 5-6 refeições menores, alimentos minimamente processados, água como bebida principal. Estrutura: café da manhã com proteína + carboidrato + fruta. Cozinhe mais em casa e leia rótulos.`;
  }
  
  // Default response
  return `Sou especializado em orientações nutricionais. Posso ajudar com planejamento alimentar, informações nutricionais, dicas práticas e sugestões de receitas. Poderia ser mais específico? Ex: "Como aumentar proteína?", "Substitutos para doces", "Lanches para trabalho". Para orientações médicas, consulte um profissional.`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize default meal types
  const initializeMealTypes = async () => {
    const defaultMealTypes = [
      { name: "Café da Manhã", icon: "coffee", isDefault: true },
      { name: "Almoço", icon: "utensils", isDefault: true },
      { name: "Lanche", icon: "cookie-bite", isDefault: true },
      { name: "Jantar", icon: "bowl-food", isDefault: true },
      { name: "Ceia", icon: "moon", isDefault: true },
    ];

    // Check if meal types already exist
    const existingMealTypes = await storage.getMealTypes();
    if (existingMealTypes.length === 0) {
      for (const mealType of defaultMealTypes) {
        try {
          await storage.createMealType(mealType);
        } catch (error) {
          console.error("Error creating meal type:", error);
        }
      }
    }
  };
  
  await initializeMealTypes();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User routes
  app.patch('/api/user/goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updateSchema = z.object({
        weight: z.number().min(30).max(300).optional(),
        height: z.number().min(100).max(250).optional(),
        age: z.number().min(13).max(120).optional(),
        goal: z.enum(["lose", "gain", "maintain"]).optional(),
        activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]).optional(),
        dailyCalories: z.number().min(1200).max(5000),
        dailyProtein: z.number().min(50).max(300),
        dailyCarbs: z.number().min(100).max(600),
        dailyFat: z.number().min(20).max(200),
        isProfileComplete: z.boolean().optional(),
      });

      const updateData = updateSchema.parse(req.body);
      const user = await storage.updateUserGoals(userId, updateData);
      res.json(user);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(400).json({ message: "Invalid profile data" });
    }
  });

  // Food routes
  app.get('/api/foods', async (req, res) => {
    try {
      const search = req.query.search as string;
      const userId = req.isAuthenticated() ? (req.user as any).claims.sub : undefined;
      const foods = await storage.getFoods(userId, search);
      res.json(foods);
    } catch (error) {
      console.error("Error fetching foods:", error);
      res.status(500).json({ message: "Failed to fetch foods" });
    }
  });

  // USDA food search
  app.get('/api/foods/search', async (req, res) => {
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string' || query.trim().length < 3) {
        return res.status(400).json({ message: "Search query must be at least 3 characters" });
      }
      
      const { usdaFoodService } = await import("./services/usdaFoodService");
      const foods = await usdaFoodService.searchFoods(query.trim());
      res.json(foods);
    } catch (error) {
      console.error("Error searching USDA foods:", error);
      res.status(500).json({ message: "Failed to search foods" });
    }
  });

  // Add USDA food to user's foods
  app.post('/api/foods/from-usda', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { usdaFood } = req.body;
      
      const foodData = {
        name: usdaFood.name,
        brand: usdaFood.brand,
        category: usdaFood.category,
        usdaFdcId: usdaFood.usdaFdcId,
        caloriesPer100g: usdaFood.caloriesPer100g,
        proteinPer100g: usdaFood.proteinPer100g,
        carbsPer100g: usdaFood.carbsPer100g,
        fatPer100g: usdaFood.fatPer100g,
        fiberPer100g: usdaFood.fiberPer100g,
        sugarPer100g: usdaFood.sugarPer100g,
        sodiumPer100g: usdaFood.sodiumPer100g,
        userId,
        isCustom: false,
      };
      
      const food = await storage.createFood(foodData);
      res.json(food);
    } catch (error) {
      console.error("Error adding USDA food:", error);
      res.status(400).json({ message: "Failed to add food" });
    }
  });

  app.post('/api/foods', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const foodData = insertFoodSchema.parse({ ...req.body, userId });
      const food = await storage.createFood(foodData);
      res.json(food);
    } catch (error) {
      console.error("Error creating food:", error);
      res.status(400).json({ message: "Invalid food data" });
    }
  });

  // Meal Type routes
  app.get('/api/meal-types', async (req, res) => {
    try {
      const userId = req.isAuthenticated() ? (req.user as any).claims.sub : undefined;
      const mealTypes = await storage.getMealTypes(userId);
      res.json(mealTypes);
    } catch (error) {
      console.error("Error fetching meal types:", error);
      res.status(500).json({ message: "Failed to fetch meal types" });
    }
  });

  app.post('/api/meal-types', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const mealTypeData = insertMealTypeSchema.parse({ ...req.body, userId });
      const mealType = await storage.createMealType(mealTypeData);
      res.json(mealType);
    } catch (error) {
      console.error("Error creating meal type:", error);
      res.status(400).json({ message: "Invalid meal type data" });
    }
  });

  // Meal routes
  app.get('/api/meals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const date = req.query.date as string;
      const meals = await storage.getMeals(userId, date);
      res.json(meals);
    } catch (error) {
      console.error("Error fetching meals:", error);
      res.status(500).json({ message: "Failed to fetch meals" });
    }
  });

  app.post('/api/meals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const mealData = insertMealSchema.parse({ ...req.body, userId });
      const meal = await storage.createMeal(mealData);
      res.json(meal);
    } catch (error) {
      console.error("Error creating meal:", error);
      res.status(400).json({ message: "Invalid meal data" });
    }
  });

  app.post('/api/meals/:mealId/foods', isAuthenticated, async (req: any, res) => {
    try {
      const { mealId } = req.params;
      const userId = req.user.claims.sub;
      let foodId = req.body.foodId;

      // If foodId is from AI analysis or USDA (large number), create a proper food record first
      if (!foodId || foodId > 2147483647 || typeof foodId === 'string') {
        const foodData = {
          userId,
          name: req.body.name || 'Alimento Personalizado',
          brand: req.body.brand || null,
          category: req.body.category || 'Personalizado',
          caloriesPer100g: (parseFloat(req.body.caloriesPer100g) || (parseFloat(req.body.calories) / parseFloat(req.body.quantity)) * 100).toString(),
          proteinPer100g: (parseFloat(req.body.proteinPer100g) || (parseFloat(req.body.protein) / parseFloat(req.body.quantity)) * 100).toString(),
          carbsPer100g: (parseFloat(req.body.carbsPer100g) || (parseFloat(req.body.carbs) / parseFloat(req.body.quantity)) * 100).toString(),
          fatPer100g: (parseFloat(req.body.fatPer100g) || (parseFloat(req.body.fat) / parseFloat(req.body.quantity)) * 100).toString(),
          fiberPer100g: (parseFloat(req.body.fiberPer100g) || 0).toString(),
          sugarPer100g: (parseFloat(req.body.sugarPer100g) || 0).toString(),
          sodiumPer100g: (parseFloat(req.body.sodiumPer100g) || 0).toString(),
          usdaFdcId: req.body.usdaFdcId || null,
        };

        const newFood = await storage.createFood(foodData);
        foodId = newFood.id;
      }
      
      // Create meal food record
      const mealFoodData = {
        mealId: parseInt(mealId),
        foodId: parseInt(foodId),
        quantity: req.body.quantity.toString(),
        unit: req.body.unit,
        calories: req.body.calories.toString(),
        protein: req.body.protein.toString(),
        carbs: req.body.carbs.toString(),
        fat: req.body.fat.toString(),
      };
      
      const mealFood = await storage.addFoodToMeal(mealFoodData);
      res.json(mealFood);
    } catch (error) {
      console.error("Error adding food to meal:", error);
      res.status(400).json({ message: "Invalid meal food data" });
    }
  });

  app.delete('/api/meals/:mealId/foods/:foodId', isAuthenticated, async (req: any, res) => {
    try {
      const { mealId, foodId } = req.params;
      await storage.removeFoodFromMeal(parseInt(mealId), parseInt(foodId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing food from meal:", error);
      res.status(500).json({ message: "Failed to remove food from meal" });
    }
  });

  app.delete('/api/meals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMeal(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting meal:", error);
      res.status(500).json({ message: "Failed to delete meal" });
    }
  });

  // Recipe routes
  app.get('/api/recipes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const recipes = await storage.getRecipes(userId);
      res.json(recipes);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      res.status(500).json({ message: "Failed to fetch recipes" });
    }
  });

  app.post('/api/recipes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const recipeData = insertRecipeSchema.parse({ ...req.body, userId });
      const recipe = await storage.createRecipe(recipeData);
      res.json(recipe);
    } catch (error) {
      console.error("Error creating recipe:", error);
      res.status(400).json({ message: "Invalid recipe data" });
    }
  });

  app.post('/api/recipes/:recipeId/ingredients', isAuthenticated, async (req: any, res) => {
    try {
      const { recipeId } = req.params;
      const ingredientData = insertRecipeIngredientSchema.parse({ ...req.body, recipeId: parseInt(recipeId) });
      const ingredient = await storage.addIngredientToRecipe(ingredientData);
      res.json(ingredient);
    } catch (error) {
      console.error("Error adding ingredient to recipe:", error);
      res.status(400).json({ message: "Invalid ingredient data" });
    }
  });

  app.delete('/api/recipes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteRecipe(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting recipe:", error);
      res.status(500).json({ message: "Failed to delete recipe" });
    }
  });

  // Daily Nutrition routes
  app.get('/api/nutrition/daily', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestedDate = (req.query.date as string) || new Date().toISOString().split('T')[0];
      
      // Get the nutritional day range (5AM to 5AM)
      const { start, end } = getNutritionalDayRange(requestedDate);
      
      // Get all meals within the nutritional day range
      const dayMeals = await db
        .select({
          id: meals.id,
          totalCalories: meals.totalCalories,
          totalProtein: meals.totalProtein,
          totalCarbs: meals.totalCarbs,
          totalFat: meals.totalFat,
          createdAt: meals.createdAt
        })
        .from(meals)
        .where(
          and(
            eq(meals.userId, userId),
            gte(meals.createdAt, start),
            lt(meals.createdAt, end)
          )
        );
      
      // Calculate total nutrition from all meals in the nutritional day
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      
      for (const meal of dayMeals) {
        totalCalories += parseFloat(meal.totalCalories?.toString() || "0");
        totalProtein += parseFloat(meal.totalProtein?.toString() || "0");
        totalCarbs += parseFloat(meal.totalCarbs?.toString() || "0");
        totalFat += parseFloat(meal.totalFat?.toString() || "0");
      }
      
      const nutrition = {
        date: requestedDate,
        calories: Math.round(totalCalories),
        protein: Math.round(totalProtein),
        carbs: Math.round(totalCarbs),
        fat: Math.round(totalFat),
      };
      
      // Save to daily nutrition table for historical tracking
      try {
        await storage.upsertDailyNutrition({
          userId,
          date: requestedDate,
          totalCalories: nutrition.calories,
          totalProtein: nutrition.protein.toString(),
          totalCarbs: nutrition.carbs.toString(),
          totalFat: nutrition.fat.toString(),
        });
      } catch (upsertError) {
        console.error("Error saving daily nutrition:", upsertError);
      }
      
      res.json(nutrition);
    } catch (error) {
      console.error("Error calculating daily nutrition:", error);
      res.status(500).json({ message: "Failed to calculate daily nutrition" });
    }
  });

  app.get('/api/nutrition/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const period = (req.query.period as string) || 'week';
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      
      let startDate: string;
      let endDate: string;
      
      const baseDate = new Date(date);
      
      switch (period) {
        case 'day':
          startDate = date;
          endDate = date;
          break;
        case 'week':
          const weekStart = new Date(baseDate);
          weekStart.setDate(baseDate.getDate() - baseDate.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          startDate = weekStart.toISOString().split('T')[0];
          endDate = weekEnd.toISOString().split('T')[0];
          break;
        case 'month':
          const monthStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
          const monthEnd = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
          startDate = monthStart.toISOString().split('T')[0];
          endDate = monthEnd.toISOString().split('T')[0];
          break;
        default:
          startDate = date;
          endDate = date;
      }

      const history = await storage.getNutritionHistory(userId, startDate, endDate);
      res.json({ period, startDate, endDate, data: history });
    } catch (error) {
      console.error("Error fetching nutrition history:", error);
      res.status(500).json({ message: "Failed to fetch nutrition history" });
    }
  });

  // Real-time progress tracking endpoints
  app.get('/api/progress/hourly', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      
      // Get the nutritional day range (5AM to 5AM)
      const { start, end } = getNutritionalDayRange(date);
      
      // Get meals within the nutritional day range
      const dayMeals = await db
        .select({
          id: meals.id,
          mealTypeId: meals.mealTypeId,
          totalCalories: meals.totalCalories,
          totalProtein: meals.totalProtein,
          totalCarbs: meals.totalCarbs,
          totalFat: meals.totalFat,
          createdAt: meals.createdAt,
          mealType: {
            name: mealTypes.name,
            icon: mealTypes.icon
          }
        })
        .from(meals)
        .leftJoin(mealTypes, eq(meals.mealTypeId, mealTypes.id))
        .where(
          and(
            eq(meals.userId, userId),
            gte(meals.createdAt, start),
            lt(meals.createdAt, end)
          )
        )
        .orderBy(meals.createdAt);

      // Group by hour (adjusted for nutritional day)
      const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        meals: [] as any[]
      }));

      dayMeals.forEach(meal => {
        if (meal.createdAt) {
          const mealDate = new Date(meal.createdAt);
          const hour = mealDate.getHours();
          hourlyData[hour].calories += parseFloat(meal.totalCalories?.toString() || "0");
          hourlyData[hour].protein += parseFloat(meal.totalProtein?.toString() || "0");
          hourlyData[hour].carbs += parseFloat(meal.totalCarbs?.toString() || "0");
          hourlyData[hour].fat += parseFloat(meal.totalFat?.toString() || "0");
          hourlyData[hour].meals.push({
            id: meal.id,
            type: meal.mealType?.name,
            icon: meal.mealType?.icon,
            calories: meal.totalCalories
          });
        }
      });

      res.json(hourlyData);
    } catch (error) {
      console.error("Error fetching hourly progress:", error);
      res.status(500).json({ message: "Failed to fetch hourly progress" });
    }
  });

  app.get('/api/progress/weekly', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      
      const baseDate = new Date(date);
      const weekStart = new Date(baseDate);
      weekStart.setDate(baseDate.getDate() - baseDate.getDay());
      
      const weeklyData = [];
      
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(weekStart);
        currentDate.setDate(weekStart.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Get nutritional day range (5AM to 5AM)
        const { start, end } = getNutritionalDayRange(dateStr);
        
        const dayMeals = await db
          .select({
            totalCalories: sql<number>`COALESCE(SUM(${meals.totalCalories}), 0)`,
            totalProtein: sql<number>`COALESCE(SUM(CAST(${meals.totalProtein} AS NUMERIC)), 0)`,
            totalCarbs: sql<number>`COALESCE(SUM(CAST(${meals.totalCarbs} AS NUMERIC)), 0)`,
            totalFat: sql<number>`COALESCE(SUM(CAST(${meals.totalFat} AS NUMERIC)), 0)`,
            mealCount: sql<number>`COUNT(${meals.id})`
          })
          .from(meals)
          .where(
            and(
              eq(meals.userId, userId),
              gte(meals.createdAt, start),
              lt(meals.createdAt, end)
            )
          );

        weeklyData.push({
          date: dateStr,
          dayName: currentDate.toLocaleDateString('pt-BR', { weekday: 'short' }),
          calories: dayMeals[0].totalCalories,
          protein: Math.round(dayMeals[0].totalProtein),
          carbs: Math.round(dayMeals[0].totalCarbs),
          fat: Math.round(dayMeals[0].totalFat),
          mealCount: dayMeals[0].mealCount
        });
      }

      res.json(weeklyData);
    } catch (error) {
      console.error("Error fetching weekly progress:", error);
      res.status(500).json({ message: "Failed to fetch weekly progress" });
    }
  });

  app.get('/api/progress/monthly', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      
      const baseDate = new Date(date);
      const monthStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
      const monthEnd = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
      
      const monthlyData = [];
      
      // Group by weeks within the month
      let currentWeekStart = new Date(monthStart);
      currentWeekStart.setDate(monthStart.getDate() - monthStart.getDay());
      
      while (currentWeekStart <= monthEnd) {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(currentWeekStart.getDate() + 6);
        
        const weekStartStr = currentWeekStart.toISOString().split('T')[0];
        const weekEndStr = weekEnd.toISOString().split('T')[0];
        
        const weekMeals = await db
          .select({
            totalCalories: sql<number>`COALESCE(SUM(${meals.totalCalories}), 0)`,
            totalProtein: sql<number>`COALESCE(SUM(CAST(${meals.totalProtein} AS NUMERIC)), 0)`,
            totalCarbs: sql<number>`COALESCE(SUM(CAST(${meals.totalCarbs} AS NUMERIC)), 0)`,
            totalFat: sql<number>`COALESCE(SUM(CAST(${meals.totalFat} AS NUMERIC)), 0)`,
            mealCount: sql<number>`COUNT(${meals.id})`
          })
          .from(meals)
          .where(
            and(
              eq(meals.userId, userId),
              sql`${meals.date} >= ${weekStartStr}`,
              sql`${meals.date} <= ${weekEndStr}`
            )
          );

        monthlyData.push({
          weekStart: weekStartStr,
          weekEnd: weekEndStr,
          calories: weekMeals[0].totalCalories,
          protein: Math.round(weekMeals[0].totalProtein),
          carbs: Math.round(weekMeals[0].totalCarbs),
          fat: Math.round(weekMeals[0].totalFat),
          mealCount: weekMeals[0].mealCount
        });
        
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      }

      res.json(monthlyData);
    } catch (error) {
      console.error("Error fetching monthly progress:", error);
      res.status(500).json({ message: "Failed to fetch monthly progress" });
    }
  });

  // AI routes
  app.post('/api/ai/analyze-meal', isAuthenticated, async (req: any, res) => {
    try {
      const { description } = req.body;
      if (!description) {
        return res.status(400).json({ message: "Description is required" });
      }

      const analysis = await aiService.analyzeMealDescription(description);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing meal:", error);
      res.status(500).json({ message: "Failed to analyze meal description" });
    }
  });

  app.post('/api/ai/suggest-recipes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { availableIngredients } = req.body;
      
      const suggestions = await aiService.suggestRecipes(availableIngredients);
      res.json(suggestions);
    } catch (error) {
      console.error("Error suggesting recipes:", error);
      res.status(500).json({ message: "Failed to suggest recipes" });
    }
  });

  // Personalized recipe recommendations based on nutrition goals
  app.post('/api/ai/personalized-recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { availableIngredients } = req.body;
      
      // Get user's nutrition goals
      const user = await storage.getUser(userId);
      if (!user || !user.isProfileComplete) {
        return res.status(400).json({ message: "Complete your profile to get personalized recommendations" });
      }

      // Get current daily nutrition
      const today = getNutritionalDay(new Date());
      const currentNutrition = await storage.getDailyNutrition(userId, today);
      
      const nutritionGoals = {
        dailyCalories: user.dailyCalories || 2000,
        dailyProtein: user.dailyProtein || 150,
        dailyCarbs: user.dailyCarbs || 250,
        dailyFat: user.dailyFat || 67
      };

      const currentValues = {
        calories: currentNutrition?.totalCalories || 0,
        protein: parseFloat(currentNutrition?.totalProtein || '0'),
        carbs: parseFloat(currentNutrition?.totalCarbs || '0'),
        fat: parseFloat(currentNutrition?.totalFat || '0')
      };

      const recommendations = await aiService.getPersonalizedRecommendations(
        currentValues,
        nutritionGoals,
        availableIngredients
      );
      
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating personalized recommendations:", error);
      res.status(500).json({ message: "Failed to generate personalized recommendations" });
    }
  });

  // AI Chat endpoint
  app.post('/api/ai/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { message } = req.body;
      
      // Simple AI response logic for nutrition questions
      const response = generateNutritionResponse(message);
      
      res.json({ response });
    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // PDF Export routes
  app.post('/api/export/pdf', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate, type } = req.body;
      
      const user = await storage.getUser(userId);
      const nutritionHistory = await storage.getNutritionHistory(userId, startDate, endDate);
      
      const pdfBuffer = await pdfService.generateNutritionReport({
        user: user!,
        nutritionHistory,
        startDate,
        endDate,
        type,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="nutrition-report-${startDate}-${endDate}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF report" });
    }
  });

  // Notification routes
  app.post('/api/notifications/schedule-daily', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await notificationService.scheduleDailyNotification(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error scheduling notification:", error);
      res.status(500).json({ message: "Failed to schedule notification" });
    }
  });

  // PDF Report generation endpoint
  app.get('/api/reports/nutrition-pdf', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { period = 'daily', date = new Date().toISOString().split('T')[0] } = req.query;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let nutritionHistory: any[] = [];
      let startDate: string;
      let endDate: string;

      switch (period) {
        case 'daily':
          startDate = endDate = date;
          const dailyNutrition = await storage.getDailyNutrition(userId, date);
          if (dailyNutrition) {
            nutritionHistory = [dailyNutrition];
          }
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          startDate = weekStart.toISOString().split('T')[0];
          endDate = weekEnd.toISOString().split('T')[0];
          nutritionHistory = await storage.getNutritionHistory(userId, startDate, endDate);
          break;
        case 'monthly':
          const monthStart = new Date(date);
          monthStart.setDate(1);
          const monthEnd = new Date(monthStart);
          monthEnd.setMonth(monthEnd.getMonth() + 1);
          monthEnd.setDate(0);
          startDate = monthStart.toISOString().split('T')[0];
          endDate = monthEnd.toISOString().split('T')[0];
          nutritionHistory = await storage.getNutritionHistory(userId, startDate, endDate);
          break;
        default:
          return res.status(400).json({ message: "Invalid period" });
      }

      const reportData = {
        user,
        nutritionHistory,
        startDate,
        endDate,
        type: period as 'daily' | 'weekly' | 'monthly'
      };

      const pdfBuffer = await pdfService.generateNutritionReport(reportData);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="relatorio-nutricional-${period}-${date}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF report:", error);
      res.status(500).json({ message: "Failed to generate PDF report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
