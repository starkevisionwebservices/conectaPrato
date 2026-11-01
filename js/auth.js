const SESSION_KEY = 'cpf_session';

const ROLE_LABELS = {
  doador: 'Estabelecimento Doador',
  receptora: 'Unidade Receptora',
  gestao: 'Gestão Pública',
  operador: 'Operador Logístico',
};

function login(nome, role){
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ nome, role }));
  window.location.href = `pages/${role}.html`;
}

function getSession(){
  const raw = sessionStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

function guard(expectedRole){
  const session = getSession();
  if (!session || session.role !== expectedRole) {
    window.location.href = '../index.html';
    return null;
  }
  return session;
}

function logout(){
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = '../index.html';
}

// notifCount > 0 exibe um sino com badge (itens pendentes/novidades daquele
// perfil — entregas a caminho, cadastros pendentes, retiradas do dia, etc.);
// omitido ou 0, o sino não é exibido. bellScreen é a tela para onde o sino leva
// (chave usada pelo `setScreen` de cada página); bellLabel é o aria-label.
function renderAccountBar(session, notifCount, bellScreen, bellLabel){
  const el = document.getElementById('account-bar');
  if (!el) return;
  const showBell = notifCount > 0;
  el.innerHTML = `
    <div class="account-bar">
      <div class="account-info">
        <div class="account-name">${session.nome}</div>
        <div class="account-role">${ROLE_LABELS[session.role] || session.role}</div>
      </div>
      ${showBell ? `
        <button type="button" class="account-bell" data-act="setScreen" data-arg="${bellScreen || 'dashboard'}" aria-label="${bellLabel || 'Notificações'}">
          ${icon('bell', '#4A4F55', 20)}
          <span class="account-bell-badge">${notifCount}</span>
        </button>` : ''}
      <button type="button" class="btn-logout" id="btn-logout">Sair</button>
    </div>`;
  document.getElementById('btn-logout').addEventListener('click', logout);
}
