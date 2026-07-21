export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido.' });
  }

  try {
    const { produto, oferta, estilo } = req.body;
    let apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ erro: 'A chave GROQ_API_KEY não foi configurada na Vercel.' });
    }

    apiKey = apiKey.trim();

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

    const resApi = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Você é um assistente de copywriting persuasivo que responde estritamente em formato JSON.' },
          { role: 'user', content: promptText }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!resApi.ok) {
      const errBody = await resApi.text();
      return res.status(500).json({ erro: `Erro na Groq API: ${errBody}` });
    }

    const responseData = await resApi.json();
    const rawText = responseData.choices[0].message.content;
    const jsonResult = JSON.parse(rawText);

    return res.status(200).json({
      sucesso: true,
      notas: jsonResult
    });

  } catch (erro) {
    console.error("Erro interno:", erro);
    return res.status(500).json({ erro: `Erro no servidor: ${erro.message}` });
  }
}
