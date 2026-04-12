import fetch from 'node-fetch';
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

    const { telefone, nome, data, hora, servico } = req.body;

    const mensagem = `Olá, ${nome}! Aqui é da Durro Barber ✂️💈\n\nSeu agendamento de *${servico}* no dia *${data}* às *${hora}* foi confirmado pelo nosso site!\n\nTe esperamos!`;

    // ==========================================
    // SUAS CHAVES DA ULTRAMSG
    // ==========================================
    const instanceId = process.env.ULTRAMSG_TOKEN; // Substitua pelo seu ID
    const token = process.env.ULTRAMSG_INSTANCE; // Substitua pelo seu Token

    // A URL oficial da UltraMsg que dispara mensagens
    const urlApiWhatsApp = `https://api.ultramsg.com/${instanceId}/messages/chat`;

    try {
        const resposta = await fetch(urlApiWhatsApp, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: token,
                to: telefone.startsWith('55') ? `+${telefone}` : `+55${telefone}`, // O +55 garante que vai para o Brasil
                body: mensagem
            })
        });
        
        console.log(`[SUCESSO] Mensagem enviada para o cliente!`);
        return res.status(200).json({ sucesso: true, mensagem: 'WhatsApp disparado!' });

    } catch (erro) {
        console.error("Erro ao enviar o WhatsApp:", erro);
        return res.status(500).json({ erro: 'Falha no servidor' });
    }
}