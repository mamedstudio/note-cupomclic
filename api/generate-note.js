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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ erro: `Erro no Gemini: ${errText}` });
    }

    const data = await response.json();
    const jsonResult = JSON.parse(data.candidates[0].content.parts[0].text);

    return res.status(200).json({
      sucesso: true,
      notas: jsonResult
    });

  } catch (erro) {
    console.error("Erro interno:", erro);
    return res.status(500).json({ erro: 'Erro ao processar a geração no servidor.' });
  }
}
