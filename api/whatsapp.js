import fetch from 'node-fetch';

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
    if (req.headers['content-type'] !== 'application/json') {
        return res.status(400).json({ erro: 'Formato inválido' });
    }

    // ==========================================
    // EXTRAÇÃO DOS DADOS
    // ==========================================
    const { telefone, nome, data, hora, servico } = req.body;

    // ==========================================
    // VALIDAÇÃO DE PAYLOAD
    // ==========================================
    if (!telefone || !nome || !data || !hora || !servico) {
        return res.status(400).json({ erro: 'Dados incompletos' });
    }

    // valida telefone (10 ou 11 dígitos)
    const telefoneLimpo = telefone.replace(/\D/g, '');
    if (!/^\d{10,11}$/.test(telefoneLimpo)) {
        return res.status(400).json({ erro: 'Telefone inválido' });
    }

    // ==========================================
    // SANITIZAÇÃO BÁSICA
    // ==========================================
    const nomeSeguro = nome.replace(/<[^>]*>?/gm, '').substring(0, 50).trim();
    const servicoSeguro = servico.replace(/<[^>]*>?/gm, '').substring(0, 50).trim();

    // ==========================================
    // MENSAGEM
    // ==========================================
    const mensagem = `Olá, ${nomeSeguro}! Aqui é da Durro Barber ✂️💈\n\nSeu agendamento de *${servicoSeguro}* no dia *${data}* às *${hora}* foi confirmado pelo nosso site!\n\nTe esperamos!`;

    // ==========================================
    // VARIÁVEIS DE AMBIENTE
    // ==========================================
    const instanceId = process.env.ULTRAMSG_INSTANCE;
    const token = process.env.ULTRAMSG_TOKEN;

    if (!instanceId || !token) {
        console.error("Variáveis de ambiente não configuradas");
        return res.status(500).json({ erro: 'Configuração do servidor inválida' });
    }

    // ==========================================
    // URL DA API ULTRAMSG
    // ==========================================
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

        const dataResposta = await resposta.json();

        // ==========================================
        // VALIDAÇÃO DA RESPOSTA DA ULTRAMSG
        // ==========================================
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