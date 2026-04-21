export default async function handler(req, res) {
    try {
        // ==========================================
        // MÉTODO
        // ==========================================
        if (req.method !== 'POST') {
            return res.status(405).json({ erro: 'Método não permitido' });
        }

        // ==========================================
        // BODY SAFE
        // ==========================================
        let body = {};

        try {
            body = typeof req.body === 'string'
                ? JSON.parse(req.body || '{}')
                : req.body;
        } catch {
            return res.status(400).json({ erro: 'JSON inválido' });
        }

        const { usuario, senha } = body;

        // ==========================================
        // VALIDAÇÃO
        // ==========================================
        if (!usuario || !senha) {
            return res.status(400).json({ erro: 'Dados obrigatórios' });
        }

        // ==========================================
        // USUÁRIOS (VERSÃO FIXA PARA TESTE)
        // ==========================================
        const admins = {
            admin1: '123456',
            admin2: '654321',
            admin3: '999999'
        };

        // ==========================================
        // LOGIN
        // ==========================================
        if (admins[usuario] && admins[usuario] === senha) {
            return res.status(200).json({
                sucesso: true,
                mensagem: 'Login autorizado'
            });
        }

        return res.status(401).json({ erro: 'Credenciais inválidas' });

    } catch (erro) {
        console.error('ERRO ADMIN LOGIN:', erro);

        return res.status(500).json({
            erro: 'Erro interno do servidor'
        });
    }
}