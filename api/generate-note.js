export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido.' });
  }

  try {
    const { produto, oferta, estilo } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ erro: 'A chave GEMINI_API_KEY não foi configurada na Vercel.' });
    }

    if (!produto || !oferta) {
      return res.status(400).json({ erro: 'Informe o produto e a oferta.' });
    }

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

    // Lista de modelos atualizados do Gemini (versões 2.5 e 2.0)
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let responseData = null;
    let lastError = '';

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const resApi = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: { 
              responseMimeType: "application/json" 
            }
          })
        });

        if (resApi.ok) {
          responseData = await resApi.json();
          break; // Conexão realizada com sucesso!
        } else {
          const errBody = await resApi.text();
          lastError = `[Model ${model}]: ${errBody}`;
        }
      } catch (err) {
        lastError = `[Model ${model}]: ${err.message}`;
      }
    }

    if (!responseData) {
      return res.status(500).json({ erro: `Falha ao conectar com o Gemini. Detalhes: ${lastError}` });
    }

    // Extrai o texto retornado
    let rawText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Sanitiza o texto removendo marcadores de código caso o Gemini devolva ```json
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    const jsonResult = JSON.parse(rawText);

    return res.status(200).json({
      sucesso: true,
      notas: jsonResult
    });

  } catch (erro) {
    console.error("Erro interno:", erro);
    return res.status(500).json({ erro: `Erro ao processar a geração no servidor: ${erro.message}` });
  }
}
