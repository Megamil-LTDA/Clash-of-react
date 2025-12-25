import { GoogleGenAI } from "@google/genai";
import { GameState, UnitType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using the fast model for real-time feel
const MODEL_ID = "gemini-3-flash-preview";

export const getGameCommentary = async (
  gameState: GameState,
  lastEvent: string
): Promise<{ text: string; mood: string }> => {
  if (!process.env.API_KEY) {
    return { text: "API Key não configurada.", mood: "neutral" };
  }

  const prompt = `
    Você é um comentarista de e-sports brasileiro EXTREMAMENTE ENÉRGICO e engraçado narrando uma partida estilo Clash Royale.
    
    Situação atual:
    - Evento recente: ${lastEvent}
    - Torre do Jogador HP: ${gameState.playerTowerHp}
    - Torre do Inimigo HP: ${gameState.enemyTowerHp}
    - Unidades em campo: ${gameState.entities.length}
    - Vencedor (se houver): ${gameState.winner || 'Nenhum'}

    Responda com um JSON contendo:
    1. "text": Um comentário curto (máx 2 frases) reagindo ao evento. Use gírias de gamer BR (ex: "tankou tudo", "deu ruim", "amassou").
    2. "mood": "excited", "tense", "sad" ou "victory".

    Exemplo de resposta JSON:
    { "text": "OLHA O GIGANTE CHEGANDO! O cara não tem defesa, vai cair a torre!", "mood": "excited" }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Sem resposta da IA");

    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Erro ao gerar comentário:", error);
    return { text: "Que partida intensa!", mood: "neutral" };
  }
};

export const getStrategyAdvice = async (elixir: number, enemyUnits: string[]): Promise<string> => {
   if (!process.env.API_KEY) {
    return "Jogue com sabedoria!";
  }

  const prompt = `
    Sou um assistente tático. 
    Meu elixir: ${Math.floor(elixir)}.
    Unidades inimigas visíveis: ${enemyUnits.length > 0 ? enemyUnits.join(', ') : 'Nenhuma'}.
    
    Dê uma dica estratégica SUPER CURTA (máx 10 palavras) em Português do Brasil sobre o que fazer agora.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
    });
    return response.text || "Espere o elixir carregar...";
  } catch (e) {
    return "Defenda suas torres!";
  }
}
