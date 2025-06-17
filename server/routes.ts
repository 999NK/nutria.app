import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertFoodSchema, insertMealTypeSchema, insertMealSchema, insertMealFoodSchema, insertRecipeSchema, insertRecipeIngredientSchema } from "@shared/schema";
import { aiService } from "./services/aiService";
import { pdfService } from "./services/pdfService";
import { notificationService } from "./services/notificationService";
import { usdaFoodService } from "./services/usdaFoodService";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize default meal types
  const initializeMealTypes = async () => {
    const defaultMealTypes = [
      { name: "Café da Manhã", icon: "coffee", isDefault: true },
      { name: "Almoço", icon: "utensils", isDefault: true },
      { name: "Jantar", icon: "bowl-food", isDefault: true },
      { name: "Lanche", icon: "cookie-bite", isDefault: true },
    ];

    for (const mealType of defaultMealTypes) {
      try {
        await storage.createMealType(mealType);
      } catch (error) {
        // Meal type might already exist
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
      const goalsSchema = z.object({
        dailyCalories: z.number().min(1200).max(5000),
        dailyProtein: z.number().min(50).max(300),
        dailyCarbs: z.number().min(100).max(600),
        dailyFat: z.number().min(20).max(200),
      });

      const goals = goalsSchema.parse(req.body);
      const user = await storage.updateUserGoals(userId, goals);
      res.json(user);
    } catch (error) {
      console.error("Error updating goals:", error);
      res.status(400).json({ message: "Invalid goal values" });
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

  // USDA Food Search routes
  app.get('/api/foods/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      
      const foods = await usdaFoodService.searchFoods(query);
      res.json(foods);
    } catch (error) {
      console.error("Error searching foods:", error);
      res.status(500).json({ message: "Failed to search foods" });
    }
  });

  app.get('/api/foods/usda/:fdcId', async (req, res) => {
    try {
      const fdcId = parseInt(req.params.fdcId);
      if (isNaN(fdcId)) {
        return res.status(400).json({ message: "Invalid FDC ID" });
      }
      
      const food = await usdaFoodService.getFoodDetails(fdcId);
      if (!food) {
        return res.status(404).json({ message: "Food not found" });
      }
      
      res.json(food);
    } catch (error) {
      console.error("Error fetching food details:", error);
      res.status(500).json({ message: "Failed to fetch food details" });
    }
  });

  app.post('/api/foods/from-usda', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { usdaFdcId } = req.body;
      
      // Get food data from USDA
      const usdaFood = await usdaFoodService.getFoodDetails(usdaFdcId);
      if (!usdaFood) {
        return res.status(404).json({ message: "USDA food not found" });
      }
      
      // Save to local database
      const foodData = insertFoodSchema.parse({
        ...usdaFood,
        userId,
        isCustom: false
      });
      
      const food = await storage.createFood(foodData);
      res.json(food);
    } catch (error) {
      console.error("Error importing USDA food:", error);
      res.status(400).json({ message: "Failed to import food from USDA" });
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
