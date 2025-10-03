import { GoogleGenAI, Type } from "@google/genai";
import { DailyReport, Product, Sale } from '../types';

// API Key is managed externally through environment variables
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY for Gemini is not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const callGemini = async (prompt: string, config?: any): Promise<string> => {
    if (!API_KEY) {
        return "A funcionalidade de IA está desativada. Configure a chave de API do Gemini para ativá-la.";
    }
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            ...config
        });
        return response.text;
    } catch (error) {
        console.error("Error fetching analysis from Gemini API:", error);
        return "Ocorreu um erro ao comunicar com a IA. Por favor, tente novamente mais tarde.";
    }
};

export const getSalesAnalysis = async (report: DailyReport): Promise<string> => {
  const prompt = `
    Você é um analista de negócios especialista em varejo de supermercados. Analise os seguintes dados de vendas diárias e forneça insights acionáveis.

    Dados do Relatório Diário:
    - Data: ${report.date}
    - Vendas Totais: R$ ${report.totalSales.toFixed(2)}
    - Caixa Inicial: R$ ${report.initialCash.toFixed(2)}
    - Total de Sangrias: R$ ${report.totalSangria.toFixed(2)}
    - Caixa Final: R$ ${report.finalCash.toFixed(2)}
    
    Detalhes das Vendas:
    ${report.sales.map(sale => `
      - Venda #${sale.id.substring(0, 5)}: Total R$ ${sale.total.toFixed(2)}, Itens: ${sale.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
    `).join('')}

    Por favor, forneça uma análise concisa em formato de tópicos (markdown), cobrindo:
    1.  **Resumo de Desempenho:** Um breve resumo do dia.
    2.  **Produtos em Destaque:** Quais produtos venderam mais ou parecem ser populares?
    3.  **Sugestões Estratégicas:** Com base nos dados, sugira uma ou duas ações que o proprietário do supermercado poderia tomar para aumentar as vendas ou otimizar as operações (ex: promoções, combos de produtos, ajuste de estoque).
    4.  **Observação Adicional:** Qualquer outra observação interessante.
  `;
  return callGemini(prompt);
};

export const getConversationalAnalysis = async (query: string, report: DailyReport): Promise<string> => {
    const prompt = `
      Você é um assistente de análise de dados para o proprietário de um supermercado. Sua tarefa é responder à pergunta do proprietário de forma direta e concisa, utilizando APENAS os dados fornecidos no objeto JSON do relatório diário. Não invente informações. Se os dados não forem suficientes para responder, informe isso claramente.

      Pergunta do Proprietário: "${query}"

      Dados do Relatório Diário (JSON):
      ${JSON.stringify(report, null, 2)}

      Sua Resposta:
    `;
    return callGemini(prompt);
};

export const getStockReplenishmentSuggestions = async (products: Product[], sales: Sale[]): Promise<string> => {
    const lowStockProducts = products.filter(p => p.stock < p.lowStockThreshold);
    if (lowStockProducts.length === 0) {
        return JSON.stringify([]);
    }

    const salesByProduct: { [productId: string]: number } = {};
    sales.forEach(sale => {
        sale.items.forEach(item => {
            salesByProduct[item.id] = (salesByProduct[item.id] || 0) + item.quantity;
        });
    });

    const lowStockData = lowStockProducts.map(p => ({
        id: p.id,
        name: p.name,
        currentStock: p.stock,
        lowStockThreshold: p.lowStockThreshold,
        salesToday: salesByProduct[p.id] || 0,
    }));

    const prompt = `
        Você é um especialista em gestão de estoque de supermercado. Analise a lista de produtos com baixo estoque fornecida em JSON.
        Com base nas vendas de hoje ("salesToday"), calcule uma sugestão de reposição ("suggestedQuantity") para cada produto.
        A sugestão deve ser suficiente para cobrir as vendas de aproximadamente 7 dias, com uma pequena margem de segurança.
        Se um produto está com baixo estoque mas não teve vendas hoje, sugira repor uma quantidade modesta (talvez o dobro do 'lowStockThreshold') como precaução.
        Forneça uma breve justificativa para sua sugestão em "suggestionText".

        Dados dos Produtos com Baixo Estoque:
        ${JSON.stringify(lowStockData, null, 2)}

        Responda APENAS com o JSON formatado de acordo com o schema.
    `;
    
    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          productId: { type: Type.STRING },
          productName: { type: Type.STRING },
          currentStock: { type: Type.INTEGER },
          salesToday: { type: Type.INTEGER },
          suggestedQuantity: { type: Type.INTEGER },
          suggestionText: { type: Type.STRING },
        },
        required: ["productId", "productName", "currentStock", "salesToday", "suggestedQuantity", "suggestionText"],
      },
    };

    return callGemini(prompt, { config: { responseMimeType: "application/json", responseSchema: schema } });
};

export const getPromotionSuggestions = async (query: string, products: Product[], sales: Sale[]): Promise<string> => {
    const productCatalog = products.map(p => ({ id: p.id, name: p.name, price: p.price, stock: p.stock }));
    const recentSalesSummary = sales.slice(-20).map(s => ({
        total: s.total,
        itemCount: s.items.length,
        items: s.items.map(i => i.name)
    }));

    const prompt = `
        Você é um consultor de marketing especialista em varejo para supermercados. Sua tarefa é criar sugestões de promoções criativas e lucrativas com base na solicitação do proprietário e nos dados do catálogo de produtos e vendas recentes.

        Solicitação do Proprietário: "${query}"

        Dados Disponíveis:
        - Catálogo de Produtos (JSON): ${JSON.stringify(productCatalog, null, 2)}
        - Resumo das Últimas 20 Vendas (JSON): ${JSON.stringify(recentSalesSummary, null, 2)}

        Instruções:
        1. Analise a solicitação do proprietário.
        2. Utilize os dados do catálogo e das vendas para embasar sua sugestão.
        3. Forneça uma resposta clara e bem estruturada em formato markdown.
        4. A sugestão deve incluir:
            - Um nome criativo para a promoção.
            - Os produtos envolvidos.
            - Uma sugestão de mecânica (ex: "compre X e leve Y", "desconto progressivo", "combo por preço fixo").
            - Uma sugestão de preço ou desconto.
            - Uma breve justificativa de por que essa promoção pode funcionar (ex: "para aumentar o giro de produtos com alto estoque", "para aumentar o ticket médio combinando produtos populares com outros de menor saída").

        Sua Resposta:
    `;

    return callGemini(prompt);
};

export const analyzeCustomerFeedback = async (feedbackText: string): Promise<string> => {
    const prompt = `
        Você é um analista de experiência do cliente para um supermercado. Sua tarefa é analisar o feedback de um cliente e fornecer uma análise estruturada.

        Feedback do Cliente: "${feedbackText}"

        Analise o texto e retorne um objeto JSON com a seguinte estrutura:
        - sentiment: O sentimento geral do feedback. Pode ser "Positivo", "Negativo" ou "Misto".
        - keyTopics: Um array de strings com os principais tópicos mencionados (ex: "Atendimento", "Qualidade do Produto", "Preço", "Limpeza").
        - suggestion: Uma sugestão de ação curta e direta para o gerente do supermercado com base no feedback.

        Responda APENAS com o JSON formatado.
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            sentiment: { type: Type.STRING, enum: ["Positivo", "Negativo", "Misto"] },
            keyTopics: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            },
            suggestion: { type: Type.STRING }
        },
        required: ["sentiment", "keyTopics", "suggestion"]
    };

    return callGemini(prompt, { config: { responseMimeType: "application/json", responseSchema: schema } });
};

export const getDemandForecast = async (products: Product[], sales: Sale[]): Promise<string> => {
    const topSellingProducts = sales.flatMap(s => s.items).reduce((acc, item) => {
        acc[item.id] = (acc[item.id] || 0) + item.quantity;
        return acc;
    }, {} as { [key: string]: number });

    const productData = products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        currentStock: p.stock,
        salesToday: topSellingProducts[p.id] || 0
    }));

    const prompt = `
        Você é um analista de dados preditivo especialista em varejo. Analise os dados de vendas e o catálogo de produtos de um supermercado.
        Sua tarefa é prever a demanda para os 5 produtos com maior potencial de venda para o próximo dia útil.
        Baseie sua previsão nas vendas de hoje ("salesToday"), mas também considere o preço e o tipo de produto (ex: itens essenciais como leite e pão tendem a ter vendas mais consistentes).

        Dados para Análise:
        ${JSON.stringify(productData, null, 2)}

        Forneça uma resposta APENAS em formato JSON, seguindo o schema.
        Para "predictedDemand", forneça uma faixa de vendas (ex: "15-20 unidades").
        Para "reasoning", forneça uma justificativa muito curta e direta para a previsão.
    `;

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                productName: { type: Type.STRING },
                predictedDemand: { type: Type.STRING },
                reasoning: { type: Type.STRING }
            },
            required: ["productName", "predictedDemand", "reasoning"]
        }
    };

    return callGemini(prompt, { config: { responseMimeType: "application/json", responseSchema: schema } });
};

export const getSalesSpikeAlerts = async (sales: Sale[]): Promise<string> => {
    if (sales.length < 10) {
        return JSON.stringify([]); // Not enough data for meaningful analysis
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentSales = sales.filter(s => new Date(s.timestamp) > oneHourAgo);
    if (recentSales.length === 0) {
        return JSON.stringify([]);
    }

    const salesByProductTotal = sales.flatMap(s => s.items).reduce((acc, item) => {
        acc[item.name] = (acc[item.name] || 0) + item.quantity;
        return acc;
    }, {} as { [key: string]: number });

    const salesByProductRecent = recentSales.flatMap(s => s.items).reduce((acc, item) => {
        acc[item.name] = (acc[item.name] || 0) + item.quantity;
        return acc;
    }, {} as { [key: string]: number });

    const analysisData = {
        totalDaySalesSummary: salesByProductTotal,
        lastHourSalesSummary: salesByProductRecent,
    };

    const prompt = `
        Você é um monitor de vendas de varejo de IA. Analise os dados de vendas fornecidos.
        "totalDaySalesSummary" contém a contagem total de vendas para cada produto hoje.
        "lastHourSalesSummary" contém a contagem de vendas para cada produto apenas na última hora.
        
        Sua tarefa é identificar quaisquer produtos que estejam vendendo a uma taxa anormalmente alta na última hora em comparação com seu padrão geral de vendas do dia.
        Se um item vendeu, por exemplo, 5 unidades o dia todo, mas 4 dessas vendas ocorreram na última hora, isso é um pico de vendas.
        Se um item vendeu 100 unidades ao longo do dia e 10 na última hora, isso é provavelmente um ritmo normal.
        
        Analise os dados:
        ${JSON.stringify(analysisData, null, 2)}
        
        Responda APENAS com um array JSON de objetos, onde cada objeto representa um pico de vendas.
        Se nenhum pico for detectado, retorne um array vazio [].
    `;

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                productName: { type: Type.STRING },
                observation: { type: Type.STRING, description: "Uma breve observação sobre o pico de vendas. Ex: 'A maioria das vendas de hoje ocorreu na última hora.'" }
            },
            required: ["productName", "observation"]
        }
    };

    return callGemini(prompt, { config: { responseMimeType: "application/json", responseSchema: schema } });
};