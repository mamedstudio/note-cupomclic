export default async function handler(req, res) {
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
      return res.status(500).json({ erro: 'A chave FAL_KEY não foi configurada na Vercel.' });
    }

    if (!texto || typeof texto !== 'string' || !texto.trim()) {
      return res.status(400).json({ erro: 'Informe o texto para geração do áudio.' });
    }

    const response = await fetch('https://fal.run/fal-ai/kokoro', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: texto.trim()
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ erro: `Erro no Fal.ai: ${errText}` });
    }

    const data = await response.json();

    if (!data.audio || !data.audio.url) {
      return res.status(500).json({ erro: 'O Fal.ai não retornou o link do áudio.' });
    }

    return res.status(200).json({
      sucesso: true,
      audioUrl: data.audio.url
    });

  } catch (erro) {
    console.error("Erro na geração de áudio:", erro);
    return res.status(500).json({ erro: `Erro no servidor: ${erro.message}` });
  }
}
