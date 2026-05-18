// Mock de dados central
let donations = [
    { id: 1, nome: "Marlan Ramos", valor: 120, metodo: "Pix", causa: "Crianças", status: "Confirmado", data: "10/03/2025", email: "marlan@teste.com" },
    { id: 2, nome: "Joao Pedro", valor: 50, metodo: "Cartão", causa: "Animais", status: "Pendente", data: "12/03/2025", email: "joao@teste.com" },
];
let campanhas = [
    { id: 1, titulo: "Ajude Crianças", meta: 10000, arrecadado: 5200 },
    { id: 2, titulo: "Proteja os Animais", meta: 8000, arrecadado: 3400 },
];

// Salvar no localStorage para persistência
function saveData() {S
    localStorage.setItem("donations", JSON.stringify(donations));
    localStorage.setItem("campanhas", JSON.stringify(campanhas));
}
function loadData() {
    let d = localStorage.getItem("donations");
    let c = localStorage.getItem("campanhas");
    if (d) donations = JSON.parse(d);
    if (c) campanhas = JSON.parse(c);
}
loadData();

// Helper: atualizar tabela admin, etc (será chamado nas páginas específicas)
document.addEventListener("DOMContentLoaded", () => {
    // Lógicas específicas por página (baseado no caminho)
    const path = window.location.pathname;
    if (path.includes("quero-doar")) initDoarPage();
    if (path.includes("admin")) initAdminPage();
    if (path.includes("area-doador")) initDoadorPage();
    if (path.includes("preciso-doacao")) initSolicitacaoPage();
    if (path.includes("contato")) initContatoPage();
});

function initDoarPage() {
    const lista = document.getElementById("campanhas-lista");
    if (lista) {
        lista.innerHTML = campanhas.map(c => `<div class='card'><h3>${c.titulo}</h3><p>Meta: R$ ${c.meta} | Arrecadado: R$ ${c.arrecadado}</p></div>`).join('');
    }
    const form = document.getElementById("donation-form");
    form?.addEventListener("submit", (e) => {
        e.preventDefault();
        const novaDoacao = {
            id: Date.now(),
            nome: document.getElementById("nome-doador").value,
            valor: parseFloat(document.getElementById("valor").value),
            metodo: document.getElementById("metodo").value,
            causa: document.getElementById("causa").value,
            status: "Pendente",
            data: new Date().toLocaleDateString(),
            email: document.getElementById("email-doador").value
        };
        donations.push(novaDoacao);
        saveData();
        document.getElementById("donation-feedback").innerText = "✅ Doação registrada! Aguardando confirmação.";
        form.reset();
    });
}

function initAdminPage() {
    let chart;
    function renderAdminDonations() {
        const tbody = document.getElementById("admin-donations-body");
        if (!tbody) return;
        tbody.innerHTML = donations.map(d => `
            <tr>
                <td>${d.id}</td><td>${d.nome}</td><td>R$ ${d.valor}</td>
                <td><select class="status-select" data-id="${d.id}"><option ${d.status==="Confirmado"?"selected":""}>Confirmado</option><option ${d.status==="Pendente"?"selected":""}>Pendente</option></select></td>
                <td><button class="del-donation" data-id="${d.id}">❌</button></td>
            </tr>
        `).join('');
        document.querySelectorAll(".status-select").forEach(sel => {
            sel.addEventListener("change", (e) => {
                let doac = donations.find(d => d.id == sel.dataset.id);
                if (doac) doac.status = sel.value;
                saveData(); renderAdminDonations(); updateDashboard();
            });
        });
        document.querySelectorAll(".del-donation").forEach(btn => {
            btn.addEventListener("click", () => {
                donations = donations.filter(d => d.id != btn.dataset.id);
                saveData(); renderAdminDonations(); updateDashboard();
            });
        });
    }
    function updateDashboard() {
        let totalMes = donations.filter(d => d.status==="Confirmado").reduce((acc,cur)=> acc+cur.valor,0);
        document.getElementById("total-mes") && (document.getElementById("total-mes").innerText = `R$ ${totalMes}`);
        document.getElementById("novos-doadores") && (document.getElementById("novos-doadores").innerText = donations.length);
        if (chart) chart.destroy();
        const ctx = document.getElementById('grafico-arrecadacao')?.getContext('2d');
        if(ctx) chart = new Chart(ctx, { type: 'bar', data: { labels: campanhas.map(c=>c.titulo), datasets: [{ label: 'Arrecadado (R$)', data: campanhas.map(c=>c.arrecadado), backgroundColor: '#e67e22' }] } });
    }
    function renderCampanhasAdmin() {
        const div = document.getElementById("campanhas-list-admin");
        if(div) div.innerHTML = campanhas.map(c => `<div><strong>${c.titulo}</strong> - Meta: R$ ${c.meta} / Arrec: R$ ${c.arrecadado} <button class="edit-campanha" data-id="${c.id}">Editar</button></div>`).join('');
    }
    document.getElementById("criar-campanha-btn")?.addEventListener("click",()=>{
        let titulo = document.getElementById("nova-campanha-titulo").value;
        let meta = parseFloat(document.getElementById("nova-campanha-meta").value);
        if(titulo && meta) { campanhas.push({ id: Date.now(), titulo, meta, arrecadado:0 }); saveData(); renderCampanhasAdmin(); updateDashboard(); }
    });
    document.getElementById("adicionar-centro-btn")?.addEventListener("click",()=>{
        let novo = prompt("Novo centro de distribuição:");
        if(novo) {
            let ul = document.getElementById("centros-lista");
            let li = document.createElement("li");
            li.innerText = `📍 ${novo}`;
            ul?.appendChild(li);
        }
    });
    // abas
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click",()=>{
            document.querySelectorAll(".tab-content").forEach(t=>t.classList.add("hidden-section"));
            document.getElementById(`${btn.dataset.tab}-tab`).classList.remove("hidden-section");
            document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active-tab"));
            btn.classList.add("active-tab");
        });
    });
    renderAdminDonations(); updateDashboard(); renderCampanhasAdmin();
}

function initDoadorPage() { /* similar login e historico */ 
    document.getElementById("login-btn")?.addEventListener("click",()=>{
        let email = document.getElementById("login-email").value;
        let userDonations = donations.filter(d => d.email === email);
        let tbody = document.getElementById("historico-body");
        if(tbody){
            tbody.innerHTML = userDonations.map(d => `<tr><td>${d.data}</td><td>${d.causa}</td><td>R$ ${d.valor}</td><td>${d.status}</td><td><button>Baixar</button></td></tr>`).join('');
            document.getElementById("login-area").style.display = "none";
            document.getElementById("dashboard-doador").style.display = "block";
        }
    });
    document.getElementById("logout-btn")?.addEventListener("click",()=>{
        document.getElementById("login-area").style.display = "block";
        document.getElementById("dashboard-doador").style.display = "none";
    });
}

function initSolicitacaoPage() {
    document.getElementById("solicitacao-form")?.addEventListener("submit",(e)=>{
        e.preventDefault();
        document.getElementById("solic-message").innerHTML = "📢 Solicitação enviada! Entraremos em contato em breve.";
    });
}
function initContatoPage() {
    document.getElementById("contact-form")?.addEventListener("submit",(e)=>{
        e.preventDefault(); alert("Mensagem enviada! Obrigado.");
    });
}