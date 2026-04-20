export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ erro: 'Método não permitido' });
    }

    const { usuario, senha } = req.body || {};

    if (!usuario || !senha) {
        return res.status(400).json({ erro: 'Dados incompletos' });
    }

    const admins = process.env.ADMIN_USERS;

    if (!admins) {
        return res.status(500).json({ erro: 'Admins não configurados' });
    }

    // transforma string em array
    const lista = admins.split(',');

    // valida login
    const valido = lista.some(item => {
        const [user, pass] = item.split(':');
        return user === usuario && pass === senha;
    });

    if (!valido) {
        return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    return res.status(200).json({
        sucesso: true,
        mensagem: 'Login autorizado'
    });
}