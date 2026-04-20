async function loginAdmin() {
    const usuario = document.getElementById('usuario').value;
    const senha = document.getElementById('senha').value;

    try {
        const resposta = await fetch('/api/admin-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                // Se tiver API KEY, adicione aqui:
                // 'x-api-key': 'SUA_API_SECRET'
            },
            body: JSON.stringify({
                usuario: usuario,
                senha: senha
            })
        });

        const data = await resposta.json();

        if (!resposta.ok) {
            alert(data.erro || 'Erro no login');
            return;
        }

        if (data.sucesso) {
            alert('Login realizado com sucesso!');
            window.location.href = '/admin.html';
        }

    } catch (erro) {
        console.error('Erro:', erro);
        alert('Erro de conexão');
    }
}   