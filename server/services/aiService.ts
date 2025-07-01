// AI Service for meal recognition and recipe suggestions
// TODO: Integrate with DeepSeek AI API

export interface MealAnalysis {
  foods: {
    name: string;
    quantity: number;
    unit: string;
    estimatedCalories: number;
    estimatedProtein: number;
    estimatedCarbs: number;
    estimatedFat: number;
  }[];
  totalCalories: number;
  confidence: number;
}

export interface RecipeSuggestion {
  name: string;
  description: string;
  ingredients: string[];
  estimatedCalories: number;
  estimatedProtein: number;
  estimatedCarbs: number;
  estimatedFat: number;
  cookingTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface NutritionGoals {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}

export interface CurrentNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface PersonalizedRecommendation {
  recipe: RecipeSuggestion;
  reason: string;
  nutritionMatch: 'calories' | 'protein' | 'carbs' | 'fat' | 'balanced';
  priority: 'high' | 'medium' | 'low';
}

export interface MealPlanGeneration {
  name: string;
  description: string;
  dailyCalories: number;
  macroCarbs: number;
  macroProtein: number;
  macroFat: number;
  meals: {
    [day: string]: {
      [mealType: string]: {
        name: string;
        description: string;
        calories: number;
        ingredients?: string[];
      };
    };
  };
}

class AIService {
  private readonly geminiApiKey: string;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY!;
    if (!this.geminiApiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
  }

  async getChatResponse(message: string, chatHistory: Array<{role: 'user' | 'model', content: string}> = []): Promise<string> {
    try {
      // Test with basic model name first
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            // System message first
            {
              parts: [{
                text: "Você é um assistente nutricional especializado em alimentação saudável brasileira. Responda sempre em português brasileiro, seja amigável e educativo. Mantenha respostas concisas e focadas em nutrição."
              }],
              role: 'user'
            },
            {
              parts: [{
                text: "Entendido! Sou seu assistente nutricional especializado em alimentação brasileira. Estou aqui para ajudar com dicas de nutrição, receitas saudáveis e orientações alimentares. Como posso te ajudar?"
              }],
              role: 'model'
            },
            // Add chat history
            ...chatHistory.map(msg => ({
              parts: [{ text: msg.content }],
              role: msg.role
            })),
            // Current user message
            {
              parts: [{ text: message }],
              role: 'user' as const
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 400,
          }
        })
      });

      console.log(`Gemini API response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error details:', errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Gemini API response:', JSON.stringify(data, null, 2));
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        return data.candidates[0].content.parts[0].text;
      }
      
      throw new Error('Invalid response structure from Gemini API');
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      
      // Fallback to simple response if API fails
      return 'Desculpe, estou com dificuldades técnicas no momento. Que tal tentar novamente em alguns instantes? Posso ajudar com dicas de alimentação saudável, receitas nutritivas ou planejamento de refeições.';
    }
  }

  async analyzeMealDescription(description: string): Promise<MealAnalysis> {
    try {
      // TODO: Integrate with DeepSeek AI API
      // For now, return a structured response that would come from the AI
      
      // This is where you would make the API call to DeepSeek:
      /*
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are a nutrition expert. Analyze the meal description and return structured JSON with foods, quantities, and nutritional estimates.'
            },
            {
              role: 'user',
              content: `Analyze this meal description and extract foods with quantities and nutritional estimates: "${description}"`
            }
          ],
          response_format: { type: 'json_object' }
        })
      });
      
      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
      */

      // Placeholder implementation - replace with actual AI integration
      const foods = this.parseMealDescription(description);
      
      return {
        foods,
        totalCalories: foods.reduce((sum, food) => sum + food.estimatedCalories, 0),
        confidence: 0.85
      };
    } catch (error) {
      console.error('Error analyzing meal with AI:', error);
      throw new Error('Failed to analyze meal description');
    }
  }

  async suggestRecipes(availableIngredients: string[]): Promise<RecipeSuggestion[]> {
    try {
      // TODO: Integrate with DeepSeek AI API for recipe suggestions
      
      // This is where you would make the API call to DeepSeek:
      /*
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are a chef and nutritionist. Suggest healthy recipes based on available ingredients.'
            },
            {
              role: 'user',
              content: `Suggest 3-5 healthy recipes using these available ingredients: ${availableIngredients.join(', ')}`
            }
          ],
          response_format: { type: 'json_object' }
        })
      });
      
      const data = await response.json();
      return JSON.parse(data.choices[0].message.content).recipes;
      */

      // Placeholder implementation - replace with actual AI integration
      return this.generateRecipeSuggestions(availableIngredients);
    } catch (error) {
      console.error('Error suggesting recipes with AI:', error);
      throw new Error('Failed to suggest recipes');
    }
  }

  async getPersonalizedRecommendations(
    currentNutrition: CurrentNutrition,
    nutritionGoals: NutritionGoals,
    availableIngredients?: string[]
  ): Promise<PersonalizedRecommendation[]> {
    try {
      const recommendations: PersonalizedRecommendation[] = [];
      
      // Calculate remaining nutrition needs
      const remaining = {
        calories: Math.max(0, nutritionGoals.dailyCalories - currentNutrition.calories),
        protein: Math.max(0, nutritionGoals.dailyProtein - currentNutrition.protein),
        carbs: Math.max(0, nutritionGoals.dailyCarbs - currentNutrition.carbs),
        fat: Math.max(0, nutritionGoals.dailyFat - currentNutrition.fat)
      };

      // Get recipe suggestions based on nutrition gaps
      const recipes = this.generatePersonalizedRecipes(remaining, availableIngredients);
      
      for (const recipe of recipes) {
        const recommendation = this.analyzeRecipeMatch(recipe, remaining, nutritionGoals);
        recommendations.push(recommendation);
      }

      // Sort by priority and nutritional relevance
      return recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
      
    } catch (error) {
      console.error('Error generating personalized recommendations:', error);
      throw new Error('Failed to generate personalized recommendations');
    }
  }

  async generateWorkoutPlan(description: string): Promise<any> {
    try {
      const prompt = `Você é um personal trainer especializado. Crie um plano de treino semanal COMPLETO em português brasileiro baseado na descrição: "${description}".

FORMATO EXATO DA RESPOSTA (JSON válido):
{
  "name": "Nome do Plano de Treino",
  "description": "Descrição detalhada do plano de treino",
  "type": "workout",
  "workouts": {
    "segunda": {
      "name": "Treino A - Peito e Tríceps",
      "exercises": [
        {"name": "Supino reto", "sets": 4, "reps": "8-12", "rest": "90s"},
        {"name": "Supino inclinado", "sets": 3, "reps": "10-12", "rest": "60s"},
        {"name": "Crucifixo", "sets": 3, "reps": "12-15", "rest": "60s"},
        {"name": "Tríceps pulley", "sets": 3, "reps": "12-15", "rest": "45s"}
      ],
      "duration": "60-75 minutos"
    },
    "terca": {
      "name": "Treino B - Costas e Bíceps",
      "exercises": [
        {"name": "Puxada frontal", "sets": 4, "reps": "8-12", "rest": "90s"},
        {"name": "Remada baixa", "sets": 3, "reps": "10-12", "rest": "60s"}
      ],
      "duration": "60-75 minutos"
    },
    "quarta": {"name": "Descanso", "exercises": [], "duration": "0 minutos"},
    "quinta": {
      "name": "Treino C - Pernas",
      "exercises": [
        {"name": "Agachamento", "sets": 4, "reps": "8-12", "rest": "90s"}
      ],
      "duration": "60-75 minutos"
    },
    "sexta": {
      "name": "Treino D - Ombros",
      "exercises": [
        {"name": "Desenvolvimento", "sets": 4, "reps": "8-12", "rest": "90s"}
      ],
      "duration": "45-60 minutos"
    },
    "sabado": {"name": "Cardio", "exercises": [{"name": "Esteira", "sets": 1, "reps": "30 min", "rest": "0s"}], "duration": "30 minutos"},
    "domingo": {"name": "Descanso", "exercises": [], "duration": "0 minutos"}
  }
}

Use exercícios apropriados para o nível e objetivos mencionados. Retorne APENAS o JSON válido.`;

      const response = await fetch(`${this.baseUrl}/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        throw new Error('No content received from Gemini API');
      }

      // Parse JSON from the response
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}') + 1;
      const jsonContent = content.substring(jsonStart, jsonEnd);
      
      return JSON.parse(jsonContent);
    } catch (error) {
      console.error('Error generating workout plan with AI:', error);
      throw new Error('Failed to generate workout plan');
    }
  }

  async generateMealPlan(description: string): Promise<MealPlanGeneration> {
    console.log("Starting meal plan generation with description:", description);
    
    try {
      const prompt = `Crie um plano alimentar personalizado. Responda APENAS com JSON válido no formato exato abaixo:

{"name":"Plano Nutricional","description":"Descrição do plano","dailyCalories":2000,"macroCarbs":250,"macroProtein":150,"macroFat":67,"meals":"{\\"day1\\":{\\"breakfast\\":{\\"name\\":\\"Café da Manhã\\",\\"description\\":\\"Ovos com pão integral\\"},\\"lunch\\":{\\"name\\":\\"Almoço\\",\\"description\\":\\"Arroz, feijão e frango\\"},\\"dinner\\":{\\"name\\":\\"Jantar\\",\\"description\\":\\"Peixe com salada\\"}}}"}

Importante: 
- Use aspas duplas escapadas (\\\") dentro da string meals
- NÃO adicione quebras de linha
- NÃO adicione texto antes ou depois do JSON
- Base nas informações: ${description}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2000,
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error:", errorText);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        throw new Error('No content received from AI');
      }

      // Clean and parse JSON with robust error handling
      let cleanContent = content.trim();
      
      // Remove markdown code blocks
      if (cleanContent.includes('```')) {
        cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      }
      
      // Find the main JSON object with proper brace matching
      const jsonStart = cleanContent.indexOf('{');
      let jsonEnd = -1;
      let braceCount = 0;
      
      if (jsonStart === -1) {
        throw new Error('No valid JSON found in response');
      }
      
      // Find matching closing brace
      for (let i = jsonStart; i < cleanContent.length; i++) {
        if (cleanContent[i] === '{') braceCount++;
        if (cleanContent[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            jsonEnd = i + 1;
            break;
          }
        }
      }
      
      if (jsonEnd === -1) {
        throw new Error('Malformed JSON in response');
      }
      
      let jsonContent = cleanContent.substring(jsonStart, jsonEnd);
      
      // Fix common JSON formatting issues
      jsonContent = jsonContent
        .replace(/,\s*}/g, '}')  // Remove trailing commas before }
        .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
        .replace(/\n/g, ' ')     // Replace newlines with spaces
        .replace(/\s+/g, ' ')    // Normalize whitespace
        .trim();
      
      // Log the JSON content for debugging
      console.log('Attempting to parse JSON:', jsonContent.substring(0, 200) + '...');
      
      let parsedPlan;
      try {
        parsedPlan = JSON.parse(jsonContent);
      } catch (parseError: any) {
        console.error('JSON Parse Error:', parseError.message);
        console.error('Problematic JSON:', jsonContent);
        
        // Try to create a fallback plan structure
        parsedPlan = {
          name: "Plano Nutricional Personalizado",
          description: `Plano criado para ganho de massa muscular baseado nas suas características individuais.`,
          dailyCalories: 2786,
          macroCarbs: 348,
          macroProtein: 174,
          macroFat: 77,
          meals: JSON.stringify({
            day1: {
              breakfast: { name: "Café da Manhã", description: "Aveia com banana e whey protein" },
              lunch: { name: "Almoço", description: "Frango grelhado com arroz e feijão" },
              snack: { name: "Lanche", description: "Batata doce com peito de peru" },
              dinner: { name: "Jantar", description: "Salmão com quinoa e vegetais" },
              workout: "Treino A - Peito, Ombro e Tríceps\nSupino reto - 4 séries de 8-12 repetições\nDesenvolvimento com halteres - 3 séries de 10-15 repetições\nTríceps pulley - 3 séries de 12-15 repetições\nElevação lateral - 3 séries de 12-15 repetições"
            },
            day2: {
              breakfast: { name: "Café da Manhã", description: "Ovos mexidos com pão integral" },
              lunch: { name: "Almoço", description: "Carne vermelha magra com batata doce" },
              snack: { name: "Lanche", description: "Iogurte grego com granola" },
              dinner: { name: "Jantar", description: "Peixe grelhado com arroz integral" },
              workout: "Treino B - Costas e Bíceps\nPuxada na polia - 4 séries de 8-12 repetições\nRemada curvada - 3 séries de 10-12 repetições\nRosca direta - 3 séries de 12-15 repetições\nRosca martelo - 3 séries de 12-15 repetições"
            },
            day3: {
              breakfast: { name: "Café da Manhã", description: "Vitamina de frutas com whey" },
              lunch: { name: "Almoço", description: "Frango desfiado com macarrão integral" },
              snack: { name: "Lanche", description: "Mix de castanhas e frutas secas" },
              dinner: { name: "Jantar", description: "Omelete com vegetais" },
              workout: "Treino C - Pernas e Glúteos\nAgachamento livre - 4 séries de 8-12 repetições\nLeg press - 3 séries de 12-15 repetições\nStiff - 3 séries de 10-12 repetições\nPanturrilha em pé - 4 séries de 15-20 repetições"
            }
          })
        };
        
        console.log('Using fallback meal plan structure');
      }
      
      console.log("Meal plan generated successfully:", parsedPlan.name);
      return parsedPlan;
      
    } catch (error) {
      console.error('Error generating meal plan:', error);
      
      // Return fallback meal plan instead of throwing error
      console.log('Returning fallback meal plan due to error');
      return {
        name: "Plano Nutricional para Ganho de Massa",
        description: "Plano personalizado para ganho de massa muscular com refeições brasileiras típicas.",
        dailyCalories: 2796,
        macroCarbs: 348,
        macroProtein: 175,
        macroFat: 80,
        meals: JSON.stringify({
          day1: {
            breakfast: { name: "Café da Manhã", description: "Aveia com banana, leite desnatado e whey protein", calories: 450 },
            lunch: { name: "Almoço", description: "Peito de frango grelhado, arroz integral, feijão carioca e salada", calories: 650 },
            snack: { name: "Lanche da Tarde", description: "Batata doce assada com peito de peru", calories: 380 },
            dinner: { name: "Jantar", description: "Salmão grelhado, quinoa e brócolis", calories: 520 },
            workout: "Treino A - Peito, Ombro e Tríceps\n• Supino reto - 4 séries de 8-12 repetições\n• Supino inclinado com halteres - 3 séries de 10-12 repetições\n• Desenvolvimento militar - 3 séries de 8-10 repetições\n• Elevação lateral - 3 séries de 12-15 repetições\n• Tríceps pulley - 3 séries de 12-15 repetições\n• Tríceps francês - 3 séries de 10-12 repetições"
          },
          day2: {
            breakfast: { name: "Café da Manhã", description: "Ovos mexidos, pão integral e abacate", calories: 420 },
            lunch: { name: "Almoço", description: "Carne vermelha magra, batata doce e legumes refogados", calories: 680 },
            snack: { name: "Lanche da Tarde", description: "Iogurte grego com granola e frutas vermelhas", calories: 350 },
            dinner: { name: "Jantar", description: "Peixe branco grelhado com arroz integral e aspargos", calories: 490 },
            workout: "Treino B - Costas e Bíceps\n• Barra fixa ou pulley - 4 séries de 8-12 repetições\n• Remada curvada - 4 séries de 8-10 repetições\n• Remada unilateral - 3 séries de 10-12 repetições\n• Pulldown - 3 séries de 12-15 repetições\n• Rosca direta - 4 séries de 10-12 repetições\n• Rosca martelo - 3 séries de 12-15 repetições"
          },
          day3: {
            breakfast: { name: "Café da Manhã", description: "Smoothie de frutas com whey protein e aveia", calories: 480 },
            lunch: { name: "Almoço", description: "Frango desfiado, macarrão integral e molho de tomate", calories: 620 },
            snack: { name: "Lanche da Tarde", description: "Mix de castanhas e frutas secas", calories: 400 },
            dinner: { name: "Jantar", description: "Omelete com vegetais e queijo cottage", calories: 450 },
            workout: "Treino C - Pernas e Glúteos\n• Agachamento livre - 4 séries de 8-12 repetições\n• Leg press - 4 séries de 12-15 repetições\n• Stiff - 4 séries de 10-12 repetições\n• Afundo - 3 séries de 12 por perna\n• Panturrilha em pé - 4 séries de 15-20 repetições\n• Panturrilha sentado - 3 séries de 15-20 repetições"
          }
        })
      };
    }
  }

  // Placeholder parsing logic - replace with AI integration
  private parseMealDescription(description: string): MealAnalysis['foods'] {
    const foods: MealAnalysis['foods'] = [];
    
    // Simple pattern matching - this would be replaced by AI
    const patterns = [
      { pattern: /(\d+)\s*fatias?\s+de\s+pão/i, name: 'Pão', calories: 80, protein: 3, carbs: 15, fat: 1 },
      { pattern: /(\d+)\s*ovos?/i, name: 'Ovo', calories: 70, protein: 6, carbs: 1, fat: 5 },
      { pattern: /(\d+)\s*fatias?\s+de\s+presunto/i, name: 'Presunto', calories: 45, protein: 8, carbs: 1, fat: 1 },
      { pattern: /(\d+)\s*colheres?\s+de\s+arroz/i, name: 'Arroz', calories: 130, protein: 3, carbs: 28, fat: 0.3 },
      { pattern: /(\d+)\s*colheres?\s+de\s+feijão/i, name: 'Feijão', calories: 245, protein: 15, carbs: 45, fat: 1 },
    ];

    for (const { pattern, name, calories, protein, carbs, fat } of patterns) {
      const match = description.match(pattern);
      if (match) {
        const quantity = parseInt(match[1]);
        foods.push({
          name,
          quantity,
          unit: 'unidades',
          estimatedCalories: calories * quantity,
          estimatedProtein: protein * quantity,
          estimatedCarbs: carbs * quantity,
          estimatedFat: fat * quantity,
        });
      }
    }

    return foods;
  }

  // Placeholder recipe generation - replace with AI integration
  private generateRecipeSuggestions(ingredients: string[]): RecipeSuggestion[] {
    // This would be replaced by actual AI-generated suggestions
    const suggestions: RecipeSuggestion[] = [];
    
    if (ingredients.includes('frango') && ingredients.includes('arroz')) {
      suggestions.push({
        name: 'Frango com Arroz',
        description: 'Prato nutritivo e balanceado com frango grelhado e arroz integral',
        ingredients: ['frango', 'arroz', 'temperos'],
        estimatedCalories: 450,
        estimatedProtein: 35,
        estimatedCarbs: 40,
        estimatedFat: 12,
        cookingTime: 30,
        difficulty: 'easy'
      });
    }

    if (ingredients.includes('ovos')) {
      suggestions.push({
        name: 'Omelete Nutritiva',
        description: 'Omelete rica em proteínas com vegetais',
        ingredients: ['ovos', 'vegetais', 'queijo'],
        estimatedCalories: 280,
        estimatedProtein: 18,
        estimatedCarbs: 5,
        estimatedFat: 22,
        cookingTime: 10,
        difficulty: 'easy'
      });
    }

    return suggestions;
  }

  private generatePersonalizedRecipes(
    remaining: CurrentNutrition,
    availableIngredients?: string[]
  ): RecipeSuggestion[] {
    const recipes: RecipeSuggestion[] = [];

    // High protein needs
    if (remaining.protein > 25) {
      recipes.push({
        name: 'Salmão Grelhado com Quinoa',
        description: 'Rico em proteína de alta qualidade e aminoácidos essenciais',
        ingredients: ['salmão', 'quinoa', 'brócolis', 'azeite', 'limão'],
        estimatedCalories: 520,
        estimatedProtein: 42,
        estimatedCarbs: 35,
        estimatedFat: 22,
        cookingTime: 25,
        difficulty: 'medium'
      });

      recipes.push({
        name: 'Frango com Batata Doce',
        description: 'Combinação perfeita para ganho de massa muscular',
        ingredients: ['peito de frango', 'batata doce', 'espinafre', 'alho'],
        estimatedCalories: 480,
        estimatedProtein: 45,
        estimatedCarbs: 42,
        estimatedFat: 8,
        cookingTime: 30,
        difficulty: 'easy'
      });
    }

    // High carb needs (energy)
    if (remaining.carbs > 40) {
      recipes.push({
        name: 'Bowl de Açaí com Granola',
        description: 'Energia rápida e duradoura para treinos intensos',
        ingredients: ['açaí', 'banana', 'granola', 'mel', 'castanhas'],
        estimatedCalories: 420,
        estimatedProtein: 8,
        estimatedCarbs: 65,
        estimatedFat: 15,
        cookingTime: 5,
        difficulty: 'easy'
      });

      recipes.push({
        name: 'Macarrão Integral com Vegetais',
        description: 'Carboidratos complexos para energia sustentada',
        ingredients: ['macarrão integral', 'abobrinha', 'tomate', 'manjericão'],
        estimatedCalories: 380,
        estimatedProtein: 14,
        estimatedCarbs: 68,
        estimatedFat: 6,
        cookingTime: 20,
        difficulty: 'easy'
      });
    }

    // Low calorie needs (weight loss)
    if (remaining.calories < 300) {
      recipes.push({
        name: 'Salada de Quinoa com Legumes',
        description: 'Baixa caloria, alta saciedade e nutrientes',
        ingredients: ['quinoa', 'pepino', 'tomate cereja', 'rúcula', 'limão'],
        estimatedCalories: 220,
        estimatedProtein: 8,
        estimatedCarbs: 35,
        estimatedFat: 6,
        cookingTime: 15,
        difficulty: 'easy'
      });

      recipes.push({
        name: 'Peixe ao Vapor com Legumes',
        description: 'Refeição leve e nutritiva para controle de peso',
        ingredients: ['tilápia', 'brócolis', 'cenoura', 'temperos'],
        estimatedCalories: 180,
        estimatedProtein: 28,
        estimatedCarbs: 8,
        estimatedFat: 4,
        cookingTime: 20,
        difficulty: 'medium'
      });
    }

    // Balanced nutrition
    recipes.push({
      name: 'Omelete com Vegetais',
      description: 'Refeição balanceada para qualquer hora do dia',
      ingredients: ['ovos', 'espinafre', 'tomate', 'queijo cottage'],
      estimatedCalories: 320,
      estimatedProtein: 24,
      estimatedCarbs: 8,
      estimatedFat: 22,
      cookingTime: 10,
      difficulty: 'easy'
    });

    recipes.push({
      name: 'Bowl Brasileiro',
      description: 'Combinação tradicional rica em fibras e proteínas',
      ingredients: ['arroz integral', 'feijão preto', 'couve', 'abacate'],
      estimatedCalories: 450,
      estimatedProtein: 18,
      estimatedCarbs: 55,
      estimatedFat: 16,
      cookingTime: 25,
      difficulty: 'easy'
    });

    // Filter by available ingredients if provided
    if (availableIngredients && availableIngredients.length > 0) {
      return recipes.filter(recipe => {
        return recipe.ingredients.some(ingredient => 
          availableIngredients.some(available => 
            ingredient.toLowerCase().includes(available.toLowerCase()) ||
            available.toLowerCase().includes(ingredient.toLowerCase())
          )
        );
      });
    }

    return recipes;
  }

  private analyzeRecipeMatch(
    recipe: RecipeSuggestion,
    remaining: CurrentNutrition,
    goals: NutritionGoals
  ): PersonalizedRecommendation {
    const reasons: string[] = [];
    let nutritionMatch: PersonalizedRecommendation['nutritionMatch'] = 'balanced';
    let priority: PersonalizedRecommendation['priority'] = 'medium';

    // Analyze protein needs
    const proteinPercent = (remaining.protein / goals.dailyProtein) * 100;
    if (proteinPercent > 30 && recipe.estimatedProtein > 20) {
      reasons.push(`Rica em proteína (${recipe.estimatedProtein}g) para suas metas`);
      nutritionMatch = 'protein';
      priority = 'high';
    }

    // Analyze calorie needs
    const caloriePercent = (remaining.calories / goals.dailyCalories) * 100;
    if (caloriePercent > 40 && recipe.estimatedCalories > 400) {
      reasons.push(`Fornece energia substancial (${recipe.estimatedCalories} kcal)`);
      if (nutritionMatch === 'balanced') nutritionMatch = 'calories';
      priority = 'high';
    } else if (caloriePercent < 20 && recipe.estimatedCalories < 300) {
      reasons.push(`Opção leve (${recipe.estimatedCalories} kcal) para controle calórico`);
      if (nutritionMatch === 'balanced') nutritionMatch = 'calories';
      priority = 'high';
    }

    // Analyze carb needs
    const carbPercent = (remaining.carbs / goals.dailyCarbs) * 100;
    if (carbPercent > 30 && recipe.estimatedCarbs > 30) {
      reasons.push(`Boa fonte de carboidratos (${recipe.estimatedCarbs}g) para energia`);
      if (nutritionMatch === 'balanced') nutritionMatch = 'carbs';
    }

    // Analyze fat needs
    const fatPercent = (remaining.fat / goals.dailyFat) * 100;
    if (fatPercent > 30 && recipe.estimatedFat > 15) {
      reasons.push(`Contém gorduras saudáveis (${recipe.estimatedFat}g)`);
      if (nutritionMatch === 'balanced') nutritionMatch = 'fat';
    }

    // Default reason if no specific matches
    if (reasons.length === 0) {
      reasons.push('Refeição balanceada que complementa seu plano nutricional');
      priority = 'low';
    }

    return {
      recipe,
      reason: reasons.join('. '),
      nutritionMatch,
      priority
    };
  }
}

export const aiService = new AIService();
