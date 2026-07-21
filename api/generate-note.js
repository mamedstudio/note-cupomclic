export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido.' });
  }

  try {
    const { produto, oferta, estilo } = req.body;
    let apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ erro: 'A chave GEMINI_API_KEY não foi configurada na Vercel.' });
    }

    apiKey = apiKey.trim();

    if (!produto || !oferta) {
      return res.status(400).json({ erro: 'Informe o produto e a oferta.' });
    }

    // 1. DESCOBERTA AUTOMÁTICA: Pergunta ao Google quais modelos esta chave pode usar
    const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const listRes = await fetch(listModelsUrl);
    
    if (!listRes.ok) {
      const listErr = await listRes.text();
      return res.status(500).json({
        erro: `Chave recusada pelo Google. Verifique se a chave na Vercel está correta. Detalhes: ${listErr}`
      });
    }

    const listData = await listRes.json();
    const availableModels = listData.models || [];

    // Filtra modelos que suportam geração de texto
    const validModels = availableModels.filter(m => 
      m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')
    );

    if (validModels.length === 0) {
      return res.status(500).json({ erro: 'Nenhum modelo de texto disponível para esta chave.' });
    }

    // Seleciona o melhor modelo disponível para a chave
    let chosenModel = validModels.find(m => m.name.includes('gemini-2.5-flash')) ||
                      validModels.find(m => m.name.includes('gemini-2.0-flash')) ||
                      validModels.find(m => m.name.includes('gemini-1.5-flash')) ||
                      validModels[0];

    const promptText = `Atue como o "Note CupomClic", o gerador de textos de vendas de alta conversão do ecossistema Tokto-CupomClic.
    
Produto: ${produto}
Oferta/Preço: ${oferta}
Tom de Voz/Estilo: ${estilo || 'Botini Agressivo (Vendas e Urgência)'}

Gere 3 textos incrivelmente persuasivos. Retorne ESTRITAMENTE um objeto JSON válido com as seguintes chaves e formatos exatos:
{
  "instagram": "Legenda para Instagram com emojis, oferta clara, gatilho de escassez e hashtags locais da cidade",
  "whatsapp": "Texto formatado para disparo de WhatsApp usando *negrito* nos destaques, direto e fácil de ler",
  "live": "Roteiro dinâmico de 30 segundos em 1ª pessoa para a Influencer falar ao vivo na Live Commerce com muita energia"
}`;

    // 2. Executa a geração usando o modelo descoberto dinamicamente
    const generateUrl = `https://generativelanguage.googleapis.com/v1beta/${chosenModel.name}:generateContent?key=${apiKey}`;

    const genRes = await fetch(generateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: { 
          responseMimeType: "application/json" 
        }
      })
    });

    if (!genRes.ok) {
      const genErr = await genRes.text();
      return res.status(500).json({ erro: `Erro ao gerar conteúdo (${chosenModel.name}): ${genErr}` });
    }

    const responseData = await genRes.json();
    let rawText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    const jsonResult = JSON.parse(rawText);

    return res.status(200).json({
      sucesso: true,
      modelo: chosenModel.name,
      notas: jsonResult
    });

  } catch (erro) {
    console.error("Erro interno:", erro);
    return res.status(500).json({ erro: `Erro no servidor: ${erro.message}` });
  }
}
