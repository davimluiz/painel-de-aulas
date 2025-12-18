
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { content, path, isBase64 } = req.body;

  // Variáveis de Ambiente do Vercel (Não use VITE_ aqui para segurança total)
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const OWNER = process.env.GITHUB_OWNER;
  const REPO = process.env.GITHUB_REPO;

  if (!GITHUB_TOKEN || !OWNER || !REPO) {
    return res.status(500).json({ error: 'Configurações de ambiente ausentes no Vercel.' });
  }

  const apiUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;

  try {
    // 1. Tentar buscar o arquivo atual para obter o SHA (necessário para update)
    const getRes = await fetch(apiUrl, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    let sha = undefined;
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }

    // 2. Preparar o conteúdo em Base64
    // Se isBase64 for true, o conteúdo já vem pronto (para imagens/vídeos)
    // Se for false, convertemos a string/JSON para Base64
    const contentEncoded = isBase64 
      ? content 
      : Buffer.from(content, 'utf-8').toString('base64');

    // 3. Realizar o Commit (PUT)
    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: `Update via Painel Admin: ${new Date().toISOString()}`,
        content: contentEncoded,
        sha: sha // Se for nulo, o GitHub cria um arquivo novo
      })
    });

    const data = await putRes.json();

    if (!putRes.ok) {
      return res.status(putRes.status).json(data);
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Erro na API Sync:", error);
    return res.status(500).json({ error: 'Erro interno no servidor de sincronização.' });
  }
}
