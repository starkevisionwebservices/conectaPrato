// Componente de toast reutilizável — pilha no canto superior direito,
// variantes de sucesso/erro. Uso: showToast('success'|'error', titulo, texto).
(function(){
  const STACK_ID = 'toast-stack';

  function ensureStack(){
    let el = document.getElementById(STACK_ID);
    if (!el) {
      el = document.createElement('div');
      el.id = STACK_ID;
      el.className = 'toast-stack';
      document.body.appendChild(el);
    }
    return el;
  }

  window.showToast = function(type, title, text, duration){
    const variant = type === 'error' ? 'error' : 'success';
    const iconName = variant === 'error' ? 'circle-x' : 'check-circle';
    const iconColor = variant === 'error' ? '#B23434' : '#1E6B4E';

    const stack = ensureStack();
    const el = document.createElement('div');
    el.className = `toast toast--${variant}`;
    el.setAttribute('role', 'status');
    el.innerHTML = `
      <button type="button" class="toast-close" aria-label="Fechar">×</button>
      <span class="toast-icon">${icon(iconName, iconColor, 26)}</span>
      <div>
        <div class="toast-title"></div>
        <div class="toast-text"></div>
      </div>`;
    el.querySelector('.toast-title').textContent = title || '';
    el.querySelector('.toast-text').textContent = text || '';
    stack.appendChild(el);

    let removed = false;
    function remove(){
      if (removed) return;
      removed = true;
      clearTimeout(timer);
      el.style.animation = 'toastOut .2s ease forwards';
      setTimeout(() => el.remove(), 200);
    }
    const timer = setTimeout(remove, duration || 3500);
    el.querySelector('.toast-close').addEventListener('click', remove);
  };
})();
