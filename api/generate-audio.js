export default async function handler(req, res) {
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

    const cleanKey = apiKey.trim().replace(/^Key\s+/i, '');

    // Chamada para ElevenLabs Multilingual v2 via Fal.ai (Português PT-BR Perfeito)
    const response = await fetch('https://fal.run/fal-ai/elevenlabs/tts/multilingual-v2', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${cleanKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: texto.trim(),
        voice: "Charlie" // Voz masculina/comercial muito natural em PT-BR
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ erro: `Erro no Fal.ai (ElevenLabs) [Código ${response.status}]: ${errText}` });
    }

    const data = await response.json();
    const audioUrl = data?.audio?.url || data?.audio_url || data?.url;

    if (!audioUrl) {
      return res.status(500).json({ erro: 'O Fal.ai não enviou a URL do áudio.' });
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
