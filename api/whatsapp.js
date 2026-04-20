import fetch from 'node-fetch';

// ==========================================
// RATE LIMIT EM MEMÓRIA
// ==========================================
const rateLimit = new Map();

function checkRateLimit(key, limit = 5, windowMs = 60000) {
    const now = Date.now();

    if (!rateLimit.has(key)) {
        rateLimit.set(key, []);
    }

    const timestamps = rateLimit.get(key).filter(ts => now - ts < windowMs);

    if (timestamps.length >= limit) {
        return false;
    }

    timestamps.push(now);
    rateLimit.set(key, timestamps);

    return true;
}

export default async function handler(req, res) {
    // ==========================================
    // VALIDAÇÃO DE MÉTODO
    // ==========================================
    if (req.method !== 'POST') {
        return res.status(405).json({ erro: 'Método não permitido' });
    }

    // ==========================================
    // VALIDAÇÃO DE CONTENT-TYPE
    // ==========================================
    if (!req.headers['content-type']?.includes('application/json')) {
        return res.status(400).json({ erro: 'Formato inválido' });
    }

    // ==========================================
    // 🔐 API KEY
    // ==========================================
    const apiKey = req.headers['x-api-key'];

    if (apiKey !== process.env.API_SECRET) {
        return res.status(401).json({ erro: "Não autorizado" });
    }

    // ==========================================
    // 🌐 IP (CORRIGIDO)
    // ==========================================
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const ip = rawIp.split(',')[0].trim();

    if (!ip) {
        return res.status(500).json({ erro: "IP não identificado" });
    }

    // ==========================================
    // 🚫 RATE LIMIT POR IP
    // ==========================================
    if (!checkRateLimit(ip, 5, 60000)) {
        return res.status(429).json({ erro: "Muitas requisições. Tente novamente em 1 minuto." });
    }

    // ==========================================
    // BODY
    // ==========================================
    if (!req.body) {
        return res.status(400).json({ erro: 'Body ausente' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const { telefone, nome, data, hora, servico } = body;

    // ==========================================
    // VALIDAÇÃO
    // ==========================================
    if (!telefone || !nome || !data || !hora || !servico) {
        return res.status(400).json({ erro: 'Dados incompletos' });
    }

    const telefoneLimpo = telefone.replace(/\D/g, '');
    if (!/^\d{10,11}$/.test(telefoneLimpo)) {
        return res.status(400).json({ erro: 'Telefone inválido' });
    }

    // ==========================================
    // 🚫 RATE LIMIT TELEFONE
    // ==========================================
    if (!checkRateLimit(`tel:${telefoneLimpo}`, 3, 60000)) {
        return res.status(429).json({ erro: "Muitas tentativas para este número." });
    }

    // ==========================================
    // ⏱️ DELAY
    // ==========================================
    if (!checkRateLimit(`delay:${telefoneLimpo}`, 1, 10000)) {
        return res.status(429).json({ erro: "Aguarde alguns segundos antes de tentar novamente." });
    }

    // ==========================================
    // SANITIZAÇÃO
    // ==========================================
    const nomeSeguro = nome.replace(/<[^>]*>?/gm, '').substring(0, 50).trim();
    const servicoSeguro = servico.replace(/<[^>]*>?/gm, '').substring(0, 50).trim();

    const mensagem = `Olá, ${nomeSeguro}! Aqui é da Durro Barber ✂️💈\n\nSeu agendamento de *${servicoSeguro}* no dia *${data}* às *${hora}* foi confirmado pelo nosso site!\n\nTe esperamos!`;

    // ==========================================
    // ENV
    // ==========================================
    const instanceId = process.env.ULTRAMSG_INSTANCE;
    const token = process.env.ULTRAMSG_TOKEN;

    if (!instanceId || !token) {
        console.error("Variáveis de ambiente não configuradas");
        return res.status(500).json({ erro: 'Configuração do servidor inválida' });
    }

    const urlApiWhatsApp = `https://api.ultramsg.com/${instanceId}/messages/chat`;

    try {
        const resposta = await fetch(urlApiWhatsApp, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: token,
                to: telefoneLimpo.startsWith('55') ? `+${telefoneLimpo}` : `+55${telefoneLimpo}`,
                body: mensagem
            })
        });

        let dataResposta = {};
        try {
            dataResposta = await resposta.json();
        } catch {
            dataResposta = { erro: 'Resposta inválida da UltraMsg' };
        }

        if (!resposta.ok || dataResposta.sent !== "true") {
            console.error("Erro na UltraMsg:", dataResposta);
            return res.status(500).json({
                erro: 'Falha ao enviar mensagem',
                detalhe: dataResposta
            });
        }

        console.log(`[SUCESSO] WhatsApp enviado com sucesso`);

        return res.status(200).json({
            sucesso: true,
            mensagem: 'WhatsApp disparado com sucesso'
        });

    } catch (erro) {
        console.error("Erro ao enviar o WhatsApp:", erro);
        return res.status(500).json({ erro: 'Falha no servidor' });
    }
}