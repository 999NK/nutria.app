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
      const prompt = `Você é um personal trainer especializado. Crie um plano de treino em português brasileiro baseado na descrição: "${description}".

IMPORTANTE: Use sistema de fichas (A, B, C, D) ao invés de dias da semana.

FORMATO EXATO DA RESPOSTA (JSON válido):
{
  "name": "Nome do Plano de Treino",
  "description": "Descrição detalhada do plano de treino",
  "type": "workout",
  "workouts": {
    "A": {
      "name": "Treino A - Peito, Ombro e Tríceps",
      "exercises": [
        {"name": "Supino reto", "sets": 4, "reps": "8-12", "rest": "90s"},
        {"name": "Supino inclinado", "sets": 3, "reps": "10-12", "rest": "60s"},
        {"name": "Desenvolvimento", "sets": 3, "reps": "8-10", "rest": "90s"},
        {"name": "Tríceps pulley", "sets": 3, "reps": "12-15", "rest": "45s"}
      ],
      "duration": "60-75 minutos"
    },
    "B": {
      "name": "Treino B - Costas e Bíceps",
      "exercises": [
        {"name": "Puxada frontal", "sets": 4, "reps": "8-12", "rest": "90s"},
        {"name": "Remada curvada", "sets": 3, "reps": "8-10", "rest": "90s"},
        {"name": "Rosca direta", "sets": 3, "reps": "10-12", "rest": "60s"}
      ],
      "duration": "60-75 minutos"
    },
    "C": {
      "name": "Treino C - Pernas e Glúteos",
      "exercises": [
        {"name": "Agachamento", "sets": 4, "reps": "8-12", "rest": "2min"},
        {"name": "Leg press", "sets": 3, "reps": "12-15", "rest": "90s"},
        {"name": "Stiff", "sets": 3, "reps": "10-12", "rest": "90s"}
      ],
      "duration": "75-90 minutos"
    }
  }
}

Para iniciantes use ABC, para intermediários/avançados pode usar ABCD. Retorne APENAS o JSON válido.`;

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
      
      // Return structured fallback workout plan
      return {
        name: "Plano de Treino ABC",
        description: "Treino dividido em 3 dias focando em diferentes grupos musculares para desenvolvimento muscular completo",
        type: "workout",
        workoutType: "ABC",
        workouts: {
          A: {
            name: "Treino A - Peito, Ombro e Tríceps",
            exercises: [
              { name: "Supino reto", sets: 4, reps: "8-12", rest: "90s", technique: "Controle na descida, explosivo na subida" },
              { name: "Supino inclinado com halteres", sets: 3, reps: "10-12", rest: "60s", technique: "Amplitude completa do movimento" },
              { name: "Desenvolvimento militar", sets: 3, reps: "8-10", rest: "90s", technique: "Core contraído, movimento controlado" },
              { name: "Elevação lateral", sets: 3, reps: "12-15", rest: "45s", technique: "Ligeira flexão do cotovelo" },
              { name: "Tríceps pulley", sets: 3, reps: "12-15", rest: "45s", technique: "Cotovelos fixos ao corpo" },
              { name: "Tríceps francês", sets: 3, reps: "10-12", rest: "60s", technique: "Apenas antebraço em movimento" }
            ],
            duration: "60-75 minutos"
          },
          B: {
            name: "Treino B - Costas e Bíceps",
            exercises: [
              { name: "Barra fixa (ou pulley)", sets: 4, reps: "8-12", rest: "90s", technique: "Peito para fora, escápulas retraídas" },
              { name: "Remada curvada", sets: 4, reps: "8-10", rest: "90s", technique: "Tronco inclinado 45°, squeeze no final" },
              { name: "Remada unilateral", sets: 3, reps: "10-12", rest: "60s", technique: "Apoio firme, cotovelo próximo ao corpo" },
              { name: "Pulldown", sets: 3, reps: "12-15", rest: "60s", technique: "Puxar até o peito, controle na volta" },
              { name: "Rosca direta", sets: 4, reps: "10-12", rest: "60s", technique: "Cotovelos fixos, movimento completo" },
              { name: "Rosca martelo", sets: 3, reps: "12-15", rest: "45s", technique: "Pegada neutra, alternado ou simultâneo" }
            ],
            duration: "60-75 minutos"
          },
          C: {
            name: "Treino C - Pernas e Glúteos",
            exercises: [
              { name: "Agachamento livre", sets: 4, reps: "8-12", rest: "2-3min", technique: "Descer até coxa paralela, peso nos calcanhares" },
              { name: "Leg press", sets: 4, reps: "12-15", rest: "90s", technique: "Amplitude completa, não travar joelhos" },
              { name: "Stiff", sets: 4, reps: "10-12", rest: "90s", technique: "Quadril para trás, pernas semi-flexionadas" },
              { name: "Afundo", sets: 3, reps: "12 cada perna", rest: "60s", technique: "Joelho da frente não ultrapassa a ponta do pé" },
              { name: "Panturrilha em pé", sets: 4, reps: "15-20", rest: "45s", technique: "Amplitude máxima, pausa no topo" },
              { name: "Panturrilha sentado", sets: 3, reps: "15-20", rest: "45s", technique: "Contração sustentada no topo" }
            ],
            duration: "75-90 minutos"
          }
        }
      };
    }
  }

  async generateMealPlan(description: string): Promise<MealPlanGeneration> {
    console.log("Starting meal plan generation with description:", description);
    
    try {
      // Extract user goals from description
      const caloriesMatch = description.match(/Meta calórica diária: (\d+)/);
      const proteinMatch = description.match(/Meta de proteína: (\d+)/);
      const carbsMatch = description.match(/Meta de carboidratos: (\d+)/);
      const fatMatch = description.match(/Meta de gordura: (\d+)/);
      
      const targetCalories = caloriesMatch ? parseInt(caloriesMatch[1]) : 2000;
      const targetProtein = proteinMatch ? parseInt(proteinMatch[1]) : 120;
      const targetCarbs = carbsMatch ? parseInt(carbsMatch[1]) : 250;
      const targetFat = fatMatch ? parseInt(fatMatch[1]) : 67;

      const prompt = `Crie um plano alimentar personalizado que RESPEITE EXATAMENTE as metas nutricionais do usuário. Responda APENAS com JSON válido no formato exato abaixo:

{"name":"Plano Nutricional Personalizado","description":"Plano baseado nas suas metas nutricionais","dailyCalories":${targetCalories},"macroCarbs":${targetCarbs},"macroProtein":${targetProtein},"macroFat":${targetFat},"meals":"{\\"segunda\\":{\\"breakfast\\":{\\"name\\":\\"Café da Manhã\\",\\"description\\":\\"2 ovos mexidos + 2 fatias de pão integral + 1 banana\\",\\"time\\":\\"07:00\\",\\"calories\\":${Math.round(targetCalories * 0.25)},\\"protein\\":${Math.round(targetProtein * 0.25)},\\"carbs\\":${Math.round(targetCarbs * 0.25)},\\"fat\\":${Math.round(targetFat * 0.25)},\\"ingredients\\":[\\"ovos\\",\\"pão integral\\",\\"banana\\"]},\\"lunch\\":{\\"name\\":\\"Almoço\\",\\"description\\":\\"150g arroz + 100g feijão + 120g peito de frango + salada verde\\",\\"time\\":\\"12:00\\",\\"calories\\":${Math.round(targetCalories * 0.35)},\\"protein\\":${Math.round(targetProtein * 0.35)},\\"carbs\\":${Math.round(targetCarbs * 0.35)},\\"fat\\":${Math.round(targetFat * 0.35)},\\"ingredients\\":[\\"arroz\\",\\"feijão\\",\\"frango\\",\\"alface\\",\\"tomate\\"]},\\"lanche\\":{\\"name\\":\\"Lanche\\",\\"description\\":\\"1 iogurte grego + granola\\",\\"time\\":\\"15:00\\",\\"calories\\":${Math.round(targetCalories * 0.15)},\\"protein\\":${Math.round(targetProtein * 0.15)},\\"carbs\\":${Math.round(targetCarbs * 0.15)},\\"fat\\":${Math.round(targetFat * 0.15)},\\"ingredients\\":[\\"iogurte grego\\",\\"granola\\"]},\\"dinner\\":{\\"name\\":\\"Jantar\\",\\"description\\":\\"120g salmão grelhado + batata doce + brócolis\\",\\"time\\":\\"19:00\\",\\"calories\\":${Math.round(targetCalories * 0.25)},\\"protein\\":${Math.round(targetProtein * 0.25)},\\"carbs\\":${Math.round(targetCarbs * 0.25)},\\"fat\\":${Math.round(targetFat * 0.25)},\\"ingredients\\":[\\"salmão\\",\\"batata doce\\",\\"brócolis\\"]}}}"}

REGRAS OBRIGATÓRIAS:
- Os valores dailyCalories, macroCarbs, macroProtein, macroFat DEVEM ser EXATAMENTE ${targetCalories}, ${targetCarbs}, ${targetProtein}, ${targetFat}
- Distribua as calorias entre as refeições (25% café, 35% almoço, 15% lanche, 25% jantar)
- Crie o plano para os 7 dias da semana (segunda, terça, quarta, quinta, sexta, sabado, domingo)
- Cada refeição deve ter: name, description, time, calories, protein, carbs, fat, ingredients
- SEMPRE inclua o campo "time" com horários: café (07:00), almoço (12:00), lanche (15:00), jantar (19:00)
- Use "lanche" ao invés de "snack" nas chaves das refeições
- Use alimentos brasileiros típicos
- Use aspas duplas escapadas (\\\") dentro da string meals
- NÃO adicione quebras de linha no JSON
- NÃO adicione texto antes ou depois do JSON

Base nas informações do usuário: ${description}`;

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
        
        // Create fallback plan structure using user's specific targets
        parsedPlan = {
          name: "Plano Nutricional Personalizado",
          description: `Plano baseado nas suas metas: ${targetCalories} kcal, ${targetProtein}g proteína diárias.`,
          dailyCalories: targetCalories,
          macroCarbs: targetCarbs,
          macroProtein: targetProtein,
          macroFat: targetFat,
          meals: JSON.stringify({
            segunda: {
              breakfast: { 
                name: "Café da Manhã", 
                description: "2 ovos mexidos + 2 fatias de pão integral + 1 banana",
                calories: Math.round(targetCalories * 0.25),
                protein: Math.round(targetProtein * 0.25),
                carbs: Math.round(targetCarbs * 0.25),
                fat: Math.round(targetFat * 0.25),
                ingredients: ["ovos", "pão integral", "banana"]
              },
              lunch: { 
                name: "Almoço", 
                description: "150g arroz + 100g feijão + 120g peito de frango + salada verde",
                calories: Math.round(targetCalories * 0.35),
                protein: Math.round(targetProtein * 0.35),
                carbs: Math.round(targetCarbs * 0.35),
                fat: Math.round(targetFat * 0.35),
                ingredients: ["arroz", "feijão", "frango", "alface", "tomate"]
              },
              snack: { 
                name: "Lanche", 
                description: "1 iogurte grego + granola",
                calories: Math.round(targetCalories * 0.15),
                protein: Math.round(targetProtein * 0.15),
                carbs: Math.round(targetCarbs * 0.15),
                fat: Math.round(targetFat * 0.15),
                ingredients: ["iogurte grego", "granola"]
              },
              dinner: { 
                name: "Jantar", 
                description: "120g salmão grelhado + batata doce + brócolis",
                calories: Math.round(targetCalories * 0.25),
                protein: Math.round(targetProtein * 0.25),
                carbs: Math.round(targetCarbs * 0.25),
                fat: Math.round(targetFat * 0.25),
                ingredients: ["salmão", "batata doce", "brócolis"]
              }
            },
            terca: {
              breakfast: { 
                name: "Café da Manhã", 
                description: "Aveia com whey protein + banana + mel",
                time: "07:00",
                calories: Math.round(targetCalories * 0.25),
                protein: Math.round(targetProtein * 0.25),
                carbs: Math.round(targetCarbs * 0.25),
                fat: Math.round(targetFat * 0.25),
                ingredients: ["aveia", "whey protein", "banana", "mel"]
              },
              lunch: { 
                name: "Almoço", 
                description: "Macarrão integral + molho de tomate + carne moída magra",
                time: "12:00",
                calories: Math.round(targetCalories * 0.35),
                protein: Math.round(targetProtein * 0.35),
                carbs: Math.round(targetCarbs * 0.35),
                fat: Math.round(targetFat * 0.35),
                ingredients: ["macarrão integral", "carne moída", "molho de tomate"]
              },
              lanche: { 
                name: "Lanche", 
                description: "Vitamina de frutas com leite",
                time: "15:00",
                calories: Math.round(targetCalories * 0.15),
                protein: Math.round(targetProtein * 0.15),
                carbs: Math.round(targetCarbs * 0.15),
                fat: Math.round(targetFat * 0.15),
                ingredients: ["leite", "morango", "manga"]
              },
              dinner: { 
                name: "Jantar", 
                description: "Tilápia grelhada + quinoa + legumes refogados",
                time: "19:00",
                calories: Math.round(targetCalories * 0.25),
                protein: Math.round(targetProtein * 0.25),
                carbs: Math.round(targetCarbs * 0.25),
                fat: Math.round(targetFat * 0.25),
                ingredients: ["tilápia", "quinoa", "abobrinha", "cenoura"]
              }
            },
            // Adicionar os outros dias da semana seguindo o mesmo padrão...
            quarta: {
              breakfast: { 
                name: "Café da Manhã", 
                description: "Tapioca com queijo e presunto + suco natural",
                calories: Math.round(targetCalories * 0.25),
                protein: Math.round(targetProtein * 0.25),
                carbs: Math.round(targetCarbs * 0.25),
                fat: Math.round(targetFat * 0.25),
                ingredients: ["tapioca", "queijo", "presunto", "laranja"]
              },
              lunch: { 
                name: "Almoço", 
                description: "Arroz integral + lentilha + bife grelhado + salada",
                calories: Math.round(targetCalories * 0.35),
                protein: Math.round(targetProtein * 0.35),
                carbs: Math.round(targetCarbs * 0.35),
                fat: Math.round(targetFat * 0.35),
                ingredients: ["arroz integral", "lentilha", "bife", "rúcula"]
              },
              snack: { 
                name: "Lanche", 
                description: "Castanhas + frutas secas",
                calories: Math.round(targetCalories * 0.15),
                protein: Math.round(targetProtein * 0.15),
                carbs: Math.round(targetCarbs * 0.15),
                fat: Math.round(targetFat * 0.15),
                ingredients: ["castanha-do-pará", "amêndoas", "damasco"]
              },
              dinner: { 
                name: "Jantar", 
                description: "Omelete de claras + batata doce + espinafre",
                calories: Math.round(targetCalories * 0.25),
                protein: Math.round(targetProtein * 0.25),
                carbs: Math.round(targetCarbs * 0.25),
                fat: Math.round(targetFat * 0.25),
                ingredients: ["claras", "batata doce", "espinafre"]
              }
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
            breakfast: { name: "Café da Manhã", description: "Aveia com banana, leite desnatado e whey protein", time: "07:00", calories: 450 },
            lunch: { name: "Almoço", description: "Peito de frango grelhado, arroz integral, feijão carioca e salada", time: "12:00", calories: 650 },
            lanche: { name: "Lanche", description: "Batata doce assada com peito de peru", time: "15:00", calories: 380 },
            dinner: { name: "Jantar", description: "Salmão grelhado, quinoa e brócolis", time: "19:00", calories: 520 },
            workout: "Treino A - Peito, Ombro e Tríceps\n• Supino reto - 4 séries de 8-12 repetições\n• Supino inclinado com halteres - 3 séries de 10-12 repetições\n• Desenvolvimento militar - 3 séries de 8-10 repetições\n• Elevação lateral - 3 séries de 12-15 repetições\n• Tríceps pulley - 3 séries de 12-15 repetições\n• Tríceps francês - 3 séries de 10-12 repetições"
          },
          day2: {
            breakfast: { name: "Café da Manhã", description: "Ovos mexidos, pão integral e abacate", time: "07:00", calories: 420 },
            lunch: { name: "Almoço", description: "Carne vermelha magra, batata doce e legumes refogados", time: "12:00", calories: 680 },
            lanche: { name: "Lanche", description: "Iogurte grego com granola e frutas vermelhas", time: "15:00", calories: 350 },
            dinner: { name: "Jantar", description: "Peixe branco grelhado com arroz integral e aspargos", time: "19:00", calories: 490 },
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
