interface USDANutrient {
  id: number;
  name: string;
  amount: number;
  unitName: string;
}

interface USDAFood {
  fdcId: number;
  description: string;
  brandOwner?: string;
  dataType: string;
  foodNutrients: USDANutrient[];
  foodCategory?: {
    description: string;
  };
}

interface USDASearchResult {
  foods: USDAFood[];
  totalHits: number;
  currentPage: number;
  totalPages: number;
}

export interface ProcessedFood {
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

class USDAFoodService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.nal.usda.gov/fdc/v1';

  constructor() {
    this.apiKey = process.env.USDA_API_KEY || '';
    if (!this.apiKey) {
      console.warn('USDA_API_KEY not provided. Food search will use fallback data.');
    }
  }

  async searchFoods(query: string, pageSize: number = 50): Promise<ProcessedFood[]> {
    if (!this.apiKey) {
      return this.getFallbackFoods(query);
    }

    try {
      const url = `${this.baseUrl}/foods/search?api_key=${this.apiKey}&query=${encodeURIComponent(query)}&pageSize=${pageSize}&dataType=Foundation,SR%20Legacy`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status}`);
      }

      const data: USDASearchResult = await response.json();
      return data.foods.map(food => this.processUSDAFood(food));
    } catch (error) {
      console.error('Error fetching from USDA API:', error);
      return this.getFallbackFoods(query);
    }
  }

  async getFoodDetails(fdcId: number): Promise<ProcessedFood | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const url = `${this.baseUrl}/food/${fdcId}?api_key=${this.apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status}`);
      }

      const food: USDAFood = await response.json();
      return this.processUSDAFood(food);
    } catch (error) {
      console.error('Error fetching food details from USDA API:', error);
      return null;
    }
  }

  private processUSDAFood(food: USDAFood): ProcessedFood {
    const nutrients = food.foodNutrients;
    
    // USDA nutrient IDs for key nutrients
    const energyKcal = this.findNutrient(nutrients, [1008]); // Energy (kcal)
    const protein = this.findNutrient(nutrients, [1003]); // Protein
    const totalFat = this.findNutrient(nutrients, [1004]); // Total fat
    const carbs = this.findNutrient(nutrients, [1005]); // Carbohydrates
    const fiber = this.findNutrient(nutrients, [1079]); // Fiber
    const sugars = this.findNutrient(nutrients, [2000]); // Total sugars
    const sodium = this.findNutrient(nutrients, [1093]); // Sodium

    return {
      usdaFdcId: food.fdcId,
      name: food.description,
      brand: food.brandOwner,
      category: food.foodCategory?.description,
      caloriesPer100g: energyKcal?.amount || 0,
      proteinPer100g: protein?.amount || 0,
      carbsPer100g: carbs?.amount || 0,
      fatPer100g: totalFat?.amount || 0,
      fiberPer100g: fiber?.amount || 0,
      sugarPer100g: sugars?.amount || 0,
      sodiumPer100g: (sodium?.amount || 0) / 1000, // Convert mg to g
    };
  }

  private findNutrient(nutrients: USDANutrient[], ids: number[]): USDANutrient | undefined {
    return nutrients.find(nutrient => ids.includes(nutrient.id));
  }

  private getFallbackFoods(query: string): ProcessedFood[] {
    // Common Brazilian foods for fallback
    const commonFoods: ProcessedFood[] = [
      {
        usdaFdcId: 0,
        name: "Arroz branco cozido",
        category: "Cereais",
        caloriesPer100g: 130,
        proteinPer100g: 2.7,
        carbsPer100g: 28,
        fatPer100g: 0.3,
        fiberPer100g: 0.4,
        sugarPer100g: 0.1,
        sodiumPer100g: 0.001
      },
      {
        usdaFdcId: 0,
        name: "Feijão preto cozido",
        category: "Leguminosas",
        caloriesPer100g: 132,
        proteinPer100g: 8.9,
        carbsPer100g: 23,
        fatPer100g: 0.5,
        fiberPer100g: 8.7,
        sugarPer100g: 0.3,
        sodiumPer100g: 0.002
      },
      {
        usdaFdcId: 0,
        name: "Peito de frango grelhado",
        category: "Carnes",
        caloriesPer100g: 165,
        proteinPer100g: 31,
        carbsPer100g: 0,
        fatPer100g: 3.6,
        fiberPer100g: 0,
        sugarPer100g: 0,
        sodiumPer100g: 0.074
      },
      {
        usdaFdcId: 0,
        name: "Banana",
        category: "Frutas",
        caloriesPer100g: 89,
        proteinPer100g: 1.1,
        carbsPer100g: 23,
        fatPer100g: 0.3,
        fiberPer100g: 2.6,
        sugarPer100g: 12,
        sodiumPer100g: 0.001
      },
      {
        usdaFdcId: 0,
        name: "Ovos",
        category: "Proteínas",
        caloriesPer100g: 155,
        proteinPer100g: 13,
        carbsPer100g: 1.1,
        fatPer100g: 11,
        fiberPer100g: 0,
        sugarPer100g: 1.1,
        sodiumPer100g: 0.124
      }
    ];

    return commonFoods.filter(food => 
      food.name.toLowerCase().includes(query.toLowerCase())
    );
  }
}

export const usdaFoodService = new USDAFoodService();