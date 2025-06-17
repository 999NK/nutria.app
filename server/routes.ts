import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertFoodSchema, insertMealTypeSchema, insertMealSchema, insertMealFoodSchema, insertRecipeSchema, insertRecipeIngredientSchema } from "@shared/schema";
import { aiService } from "./services/aiService";
import { pdfService } from "./services/pdfService";
import { notificationService } from "./services/notificationService";
import { z } from "zod";

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
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const { usdaFoodService } = await import("./services/usdaFoodService");
      const foods = await usdaFoodService.searchFoods(query as string);
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
      const mealFoodData = insertMealFoodSchema.parse({ ...req.body, mealId: parseInt(mealId) });
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
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const nutrition = await storage.getDailyNutrition(userId, date);
      res.json(nutrition);
    } catch (error) {
      console.error("Error fetching daily nutrition:", error);
      res.status(500).json({ message: "Failed to fetch daily nutrition" });
    }
  });

  app.get('/api/nutrition/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      const history = await storage.getNutritionHistory(userId, startDate, endDate);
      res.json(history);
    } catch (error) {
      console.error("Error fetching nutrition history:", error);
      res.status(500).json({ message: "Failed to fetch nutrition history" });
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

  const httpServer = createServer(app);
  return httpServer;
}
