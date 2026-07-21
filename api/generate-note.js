export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido.' });
  }

  try {
    const { texto } = req.body;
    let apiKey = process.env.FAL_KEY;

    if (!apiKey) {
      return res.status(500).json({ erro: 'A chave FAL_KEY não foi configurada na Vercel.' });
    }

    if (!texto) {
      return res.status(400).json({ erro: 'Informe o texto para geração do áudio.' });
    }

    // Chamada para a API do ElevenLabs (v3 Multilíngue) hospedada no Fal.ai
    const response = await fetch('https://fal.run/fal-ai/elevenlabs/tts/eleven-v3', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey.trim()}`, // O Fal.ai exige o prefixo "Key "
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: texto,
        voice: "Charlie" // Charlie tem um tom muito bom e natural para vendas (PT-BR)
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ erro: `Erro no Fal.ai: ${errText}` });
    }

    const data = await response.json();

    // O Fal retorna um objeto que contém a URL do áudio pronto (data.audio.url)
    if (!data.audio || !data.audio.url) {
      return res.status(500).json({ erro: 'O Fal não retornou o link do áudio.' });
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
