window.abrirAdmin = async function() {
    const usuario = prompt("Usuário:");
    const senha = prompt("Senha:");

    if (!usuario || !senha) return;

    try {
        const res = await fetch('/api/admin-login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-api-key': 'durrobarber_2026_super_key' // 🔥 FALTAVA AQUI
            },
            body: JSON.stringify({ usuario, senha })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.erro || "Erro ao autenticar");
            return;
        }

        // login ok
        document.getElementById('booking-area').classList.add('hidden');
        document.getElementById('admin-area').classList.remove('hidden');

        document.getElementById('adminDataSelect').value =
            document.getElementById('dataSelect').value;

        window.renderizarListaAdmin();

    } catch (err) {
        console.error(err);
        alert("Erro de conexão");
    }
};