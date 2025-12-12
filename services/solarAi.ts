import { GoogleGenAI } from "@google/genai";
import { PanelRecommendation } from "../types";

// Inicialização Lazy do cliente Gemini
// Isso previne que a aplicação quebre no carregamento inicial se process.env não estiver pronto
let aiInstance: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
  if (!aiInstance) {
    // A chave deve vir de process.env.API_KEY conforme regras do ambiente
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("API Key não encontrada. As funcionalidades de IA podem falhar.");
    }
    aiInstance = new GoogleGenAI({ apiKey: apiKey || '' });
  }
  return aiInstance;
};

export interface GeoSolarData {
  hsp: number;
  address: string;
  lat: number;
  lng: number;
  shadeAnalysis: string;
  mapUri?: string;
}

export interface MarketSolarData {
  averagePanelPrice: number;
  averageKitPricePerKwp: number;
  analysis: string;
  sources: Array<{ title: string; uri: string }>;
}

const extractJson = (text: string): any => {
    try {
        // Tenta encontrar um bloco JSON válido mesmo se houver texto ao redor
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : text.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Falha ao fazer parse do JSON da IA:", e);
        return {};
    }
};

const extractJsonArray = (text: string): any[] => {
  try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : text.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonString);
  } catch (e) {
      console.error("Falha ao fazer parse do JSON Array da IA:", e);
      return [];
  }
};

export const fetchSolarDataByLocation = async (address: string): Promise<GeoSolarData> => {
  try {
    const ai = getAiClient();
    const modelId = 'gemini-2.5-flash';
    
    // Prompt projetado para extrair dados técnicos baseados na localização com referência ao CRESESB
    const prompt = `
      Eu preciso dimensionar um sistema solar fotovoltaico para o endereço: "${address}".
      
      Passo 1: Use o Google Maps para identificar a Latitude e Longitude exatas.
      Passo 2: Com base nessas coordenadas, consulte sua base de conhecimento meteorológico (referência: dados do CRESESB - Brasil ou NASA POWER) para encontrar a Irradiação Solar Global Horizontal Média Diária (HSP - Horas de Sol Pleno) anual.
      
      Requisitos:
      - Seja preciso com a média anual (use valores conservadores se houver variação).
      - Forneça uma breve análise de risco de sombreamento baseada no urbanismo da região detectada.
      
      Responda ESTRITAMENTE um JSON (sem blocos de código markdown) com o seguinte formato:
      {
        "hsp": number,
        "address": "endereço completo encontrado",
        "lat": number,
        "lng": number,
        "shade_analysis": "string curta (ex: 'Baixo risco, área aberta' ou 'Alto risco, muitos edifícios')"
      }
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    const text = response.text || "{}";
    const data = extractJson(text);

    let mapUri = "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      for (const chunk of groundingChunks) {
        if (chunk.web?.uri && chunk.web.uri.includes('google.com/maps')) {
            mapUri = chunk.web.uri;
            break;
        }
      }
    }
    
    if (!mapUri && data.lat && data.lng) {
      mapUri = `https://www.google.com/maps/search/?api=1&query=${data.lat},${data.lng}`;
    }

    return {
      hsp: Number(data.hsp) || 4.5,
      address: data.address || address,
      lat: data.lat || 0,
      lng: data.lng || 0,
      shadeAnalysis: data.shade_analysis || "Verificar localmente.",
      mapUri
    };

  } catch (error) {
    console.error("Erro ao consultar IA Solar:", error);
    throw new Error("Não foi possível obter dados solares para este local.");
  }
};

export const fetchMarketPrices = async (panelPower: number): Promise<MarketSolarData> => {
  try {
    const ai = getAiClient();
    const modelId = 'gemini-2.5-flash';
    
    // Prompt focado em busca de preços online de fabricantes específicos com cálculo preciso de kWp
    const prompt = `
      Atue como um orçamentista de energia solar. Realize uma busca ativa por preços reais de venda de "Kit Gerador Solar Fotovoltaico On-Grid" no Brasil, focando EXCLUSIVAMENTE na marca **Intelbras** e similares (WEG, Canadian).
      
      Passos:
      1. Pesquise em lojas online (ex: Loja Intelbras, Mercado Livre Oficial, Aldo Solar, Neosolar) o preço de Kits completos (Inversor + Painéis + Estrutura) na faixa de potência de 3 kWp a 6 kWp.
      2. Encontre o preço unitário de um painel solar de ~${panelPower}W.
      3. Calcule a média do preço do KIT (Hardware) por kWp. Fórmula: (Preço do Kit / Potência do Kit). Ex: Kit R$ 10.000 de 4kWp = R$ 2.500/kWp.
      
      Retorne ESTRITAMENTE um JSON com:
      {
        "average_panel_price": number (preço unitário do módulo em R$),
        "kit_price_per_kwp": number (preço médio do HARDWARE por kWp encontrado),
        "market_analysis": "Cite o modelo específico do kit Intelbras ou similar encontrado e o preço total dele (ex: 'Kit Intelbras 4.4kWp encontrado por R$ X')."
      }
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      },
    });

    const text = response.text || "{}";
    const data = extractJson(text);

    // Extrair fontes da pesquisa
    const sources: Array<{ title: string; uri: string }> = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (groundingChunks) {
      groundingChunks.forEach(chunk => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }

    // Filtra duplicatas e limita a 3 fontes
    const uniqueSources = sources
        .filter((v,i,a)=>a.findIndex(v2=>(v2.uri===v.uri))===i)
        .slice(0, 3);

    return {
      averagePanelPrice: Number(data.average_panel_price) || 0,
      averageKitPricePerKwp: Number(data.kit_price_per_kwp) || 0,
      analysis: data.market_analysis || "Análise de mercado concluída.",
      sources: uniqueSources
    };

  } catch (error) {
    console.error("Erro ao buscar preços:", error);
    throw new Error("Não foi possível buscar preços atualizados.");
  }
};

export const fetchRecommendedPanels = async (): Promise<PanelRecommendation[]> => {
  try {
    const ai = getAiClient();
    const modelId = 'gemini-2.5-flash';
    
    // Prompt para buscar modelos específicos
    const prompt = `
      Busque na web pelos modelos mais recentes (2024/2025) de painéis solares fotovoltaicos disponíveis no Brasil,
      com foco PRIORITÁRIO na marca **Intelbras** (linha On Grid) e marcas Tier 1 (Canadian Solar, Jinko, Trina).
      
      Filtre apenas módulos com potência acima de 500W.
      
      Retorne um JSON ARRAY contendo exatamente 3 recomendações distintas:
      1. Um módulo da Intelbras (Obrigatório).
      2. Um módulo de alta potência (>550W) de outra marca Tier 1.
      3. Um módulo Custo-Benefício de outra marca Tier 1.
      
      Formato do JSON Array:
      [
        {
          "brand": "Marca",
          "model": "Modelo Técnico (ex: EMS 550 MB)",
          "power": number (apenas o número em Watts, ex: 550),
          "width": number (largura em metros, ex: 1.13),
          "height": number (altura em metros, ex: 2.27),
          "technology": "ex: Monocristalino Half-Cell"
        }
      ]
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      },
    });

    const text = response.text || "[]";
    const data = extractJsonArray(text);
    
    return data;

  } catch (error) {
    console.error("Erro ao buscar painéis:", error);
    // Fallback silencioso para não quebrar a UI
    return [];
  }
};