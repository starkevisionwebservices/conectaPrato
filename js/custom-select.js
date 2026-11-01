// Componente de select customizado: substitui a aparência/menu do <select>
// nativo mantendo um <select> real oculto e sincronizado (valor + evento
// "change"), para que qualquer lógica existente (auth.js, filtros, forms)
// continue funcionando sem alterações.
//
// Uso: marcar o <select> original com o atributo `data-custom-select`.
// Um MutationObserver reprocessa a página a cada re-render (o app troca o
// innerHTML de #app a cada mudança de tela), então não é necessário chamar
// nada manualmente depois de montar HTML novo.

(function(){
  const CHEVRON_SVG =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';

  const CHECK_SVG =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

  function buildOptionEl(option, index){
    const li = document.createElement('li');
    li.className = 'select-option' + (option.selected ? ' selected' : '');
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', option.selected ? 'true' : 'false');
    li.dataset.index = String(index);

    const label = document.createElement('span');
    label.className = 'select-option-label';
    label.textContent = option.textContent;

    const check = document.createElement('span');
    check.className = 'select-option-check';
    check.innerHTML = CHECK_SVG;

    li.appendChild(label);
    li.appendChild(check);
    return li;
  }

  function enhanceSelect(select){
    if (select.dataset.csEnhanced) return;
    select.dataset.csEnhanced = '1';
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');

    const isMini = select.classList.contains('select-mini');

    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select' + (isMini ? ' is-mini' : '');

    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    if (select.disabled) trigger.disabled = true;

    const labelSpan = document.createElement('span');
    labelSpan.className = 'select-trigger-label';
    const selectedOption = select.options[select.selectedIndex];
    labelSpan.textContent = selectedOption ? selectedOption.textContent : '';

    const chevron = document.createElement('span');
    chevron.className = 'select-trigger-chevron';
    chevron.innerHTML = CHEVRON_SVG;

    trigger.appendChild(labelSpan);
    trigger.appendChild(chevron);

    const listEl = document.createElement('ul');
    listEl.className = 'select-options';
    listEl.setAttribute('role', 'listbox');
    listEl.tabIndex = -1;
    Array.from(select.options).forEach((opt, i) => listEl.appendChild(buildOptionEl(opt, i)));

    wrapper.appendChild(trigger);
    wrapper.appendChild(listEl);
  }

  function initCustomSelects(root){
    (root || document).querySelectorAll('select[data-custom-select]:not([data-cs-enhanced])').forEach(enhanceSelect);
  }

  // ── comportamento (delegado, uma única vez — sobrevive a re-renders) ──

  function closeDropdown(wrapper){
    wrapper.classList.remove('is-open');
    const trigger = wrapper.querySelector('.select-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    wrapper.querySelectorAll('.select-option.is-active').forEach(o => o.classList.remove('is-active'));
  }

  function closeAllDropdowns(except){
    document.querySelectorAll('.custom-select.is-open').forEach(w => { if (w !== except) closeDropdown(w); });
  }

  function openDropdown(wrapper){
    closeAllDropdowns(wrapper);
    wrapper.classList.add('is-open');
    const trigger = wrapper.querySelector('.select-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
    const options = wrapper.querySelectorAll('.select-option');
    const current = wrapper.querySelector('.select-option.selected') || options[0];
    if (current){
      current.classList.add('is-active');
      current.scrollIntoView({ block: 'nearest' });
    }
  }

  function moveActive(wrapper, delta){
    const options = Array.from(wrapper.querySelectorAll('.select-option'));
    if (!options.length) return;
    let idx = options.findIndex(o => o.classList.contains('is-active'));
    idx = idx === -1 ? 0 : (idx + delta + options.length) % options.length;
    options.forEach(o => o.classList.remove('is-active'));
    options[idx].classList.add('is-active');
    options[idx].scrollIntoView({ block: 'nearest' });
  }

  function chooseOption(wrapper, li){
    const select = wrapper.querySelector('select');
    const idx = Number(li.dataset.index);
    if (select.selectedIndex !== idx){
      select.selectedIndex = idx;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    wrapper.querySelectorAll('.select-option').forEach(o => {
      const isSel = o === li;
      o.classList.toggle('selected', isSel);
      o.setAttribute('aria-selected', isSel ? 'true' : 'false');
    });
    const labelSpan = wrapper.querySelector('.select-trigger-label');
    const optLabel = li.querySelector('.select-option-label');
    if (labelSpan && optLabel) labelSpan.textContent = optLabel.textContent;
    closeDropdown(wrapper);
    const trigger = wrapper.querySelector('.select-trigger');
    if (trigger) trigger.focus();
  }

  document.addEventListener('click', (e) => {
    const optionEl = e.target.closest('.select-option');
    if (optionEl){
      const wrapper = optionEl.closest('.custom-select');
      if (wrapper) chooseOption(wrapper, optionEl);
      return;
    }
    const trigger = e.target.closest('.select-trigger');
    if (trigger){
      if (trigger.disabled) return;
      const wrapper = trigger.closest('.custom-select');
      if (!wrapper) return;
      const wasOpen = wrapper.classList.contains('is-open');
      closeAllDropdowns();
      if (!wasOpen) openDropdown(wrapper);
      return;
    }
    closeAllDropdowns();
  });

  document.addEventListener('keydown', (e) => {
    const trigger = e.target.closest && e.target.closest('.select-trigger');
    if (!trigger) return;
    const wrapper = trigger.closest('.custom-select');
    if (!wrapper) return;
    const isOpen = wrapper.classList.contains('is-open');

    switch (e.key){
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) openDropdown(wrapper); else moveActive(wrapper, 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) openDropdown(wrapper); else moveActive(wrapper, -1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!isOpen){
          openDropdown(wrapper);
        } else {
          const active = wrapper.querySelector('.select-option.is-active');
          if (active) chooseOption(wrapper, active);
        }
        break;
      case 'Escape':
        if (isOpen){ e.preventDefault(); closeDropdown(wrapper); }
        break;
      case 'Tab':
        if (isOpen) closeDropdown(wrapper);
        break;
    }
  });

  // reprocessa a cada mudança no DOM (troca de tela via innerHTML)
  new MutationObserver(() => initCustomSelects(document)).observe(document.body, { childList: true, subtree: true });
  initCustomSelects(document);
})();
