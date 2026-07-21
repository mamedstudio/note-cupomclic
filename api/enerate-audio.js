export default async function handler(req, res) {
  // Garante que a resposta seja sempre interpretada como JSON
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch(e){}
    }

    const texto = body?.texto || body?.text || body?.prompt;
    let apiKey = process.env.FAL_KEY;

    if (!apiKey) {
      return res.status(500).json({ erro: 'A variável FAL_KEY não está configurada na Vercel.' });
    }

    if (!texto || typeof texto !== 'string' || !texto.trim()) {
      return res.status(400).json({ erro: 'Informe o texto para geração do áudio.' });
    }

    // Limpa a chave para evitar duplicar o prefixo "Key "
    const cleanKey = apiKey.trim().replace(/^Key\s+/i, '');

    // Requisição para a API Kokoro TTS do Fal.ai
    const response = await fetch('https://fal.run/fal-ai/kokoro', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${cleanKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: texto.trim()
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ erro: `Erro no Fal.ai (Código ${response.status}): ${errText}` });
    }

    const data = await response.json();
    const audioUrl = data?.audio?.url || data?.audio_url || data?.url;

    if (!audioUrl) {
      return res.status(500).json({ erro: 'O Fal.ai respondeu, mas não enviou a URL do áudio.' });
    }

    return res.status(200).json({
      sucesso: true,
      audioUrl: audioUrl
    });

  } catch (erro) {
    console.error("Erro interno:", erro);
    return res.status(500).json({ erro: `Erro interno no servidor: ${erro.message}` });
  }
}
