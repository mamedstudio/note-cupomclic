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

    if (!produto || !oferta) {
      return res.status(400).json({ erro: 'Informe o produto e a oferta.' });
    }

    const promptText = `Atue como o "Note CupomClic", gerador de notas de vendas persuasivas do ecossistema Tokto-CupomClic.

Produto: ${produto}
Oferta/Preço: ${oferta}
Tom de Voz/Estilo: ${estilo || 'Botini Agressivo (Vendas e Urgência)'}

REGRAS DE OURO:
1. Idioma: Use ESTRITAMENTE Português do Brasil (PT-BR) natural. NUNCA utilize termos, gírias ou expressões em inglês (ex: use "água na boca" em vez de "mouth water").
2. No campo "live" (que será lido por um locutor de áudio):
   - Escreva os valores sempre por extenso ou de forma limpa para leitura (ex: "vinte reais" em vez de "R$ 20" ou "R$20,00").
   - Mantenha a concordância perfeita para locução humanizada de rádio/TV (ex: "uma pizza", "dois hambúrgueres").

Retorne ESTRITAMENTE um objeto JSON válido com as seguintes chaves:
{
  "instagram": "Legenda para Instagram com emojis, oferta e hashtags",
  "whatsapp": "Texto formatado para disparo de WhatsApp com *negrito*",
  "live": "Roteiro fluído e pronto para locução de rádio/live commerce, sem símbolos monetários como R$, apenas por extenso"
}`;

    const resApi = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Você é um assistente de copywriting em Português do Brasil que responde estritamente em formato JSON.' },
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
