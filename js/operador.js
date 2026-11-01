(function(){
  const session = guard('operador');
  if (!session) return;

  // mesmas ofertas/candidatas usadas em gestao.js (COMPATIBILIZACOES) — a
  // ligação entre páginas é feita pelo título via shared-state.js, então os
  // títulos abaixo precisam bater com os de lá.
  const OFERTAS_OPERADOR = [
    { titulo:'Legumes e verduras excedentes', origem:'Restaurante Sabor do Mar', destino:'Cozinha Comunitária Bom Jardim', quantidade:'32 kg', janela:'16:30–17:30' },
    { titulo:'Iogurtes próximos do vencimento', origem:'Supermercado Bom Preço', destino:'Banco Municipal de Alimentos', quantidade:'40 un', janela:'18:00–19:00' },
    { titulo:'Grãos e cereais a granel', origem:'Mercadinho São José', destino:'Restaurante Popular Centro', quantidade:'25 kg', janela:'14:00–15:00' },
    { titulo:'Marmitas prontas não vendidas', origem:'Padaria Trigo Dourado', destino:'Cozinha Comunitária Vila União', quantidade:'45 un', janela:'19:30–20:30' },
  ];

  // OFERTAS_OPERADOR (roteiro fixo) + qualquer oferta publicada ao vivo pelo
  // Doador e já confirmada pela Gestão — o destino vem da unidade que a
  // Gestão efetivamente escolheu (js/shared-state.js)
  function todasOfertasOperador(){
    const novas = getOfertasNovas()
      .filter(n => !OFERTAS_OPERADOR.some(o => o.titulo === n.titulo))
      .map(n => {
        const status = getOfertaStatus(n.titulo);
        return {
          titulo: n.titulo, origem: n.doador,
          destino: (status && status.unidade) || 'Unidade a definir',
          quantidade: n.quantidade, janela: n.janela || 'a combinar',
        };
      });
    return [...OFERTAS_OPERADOR, ...novas];
  }

  const state = { screen:'disponiveis' };

  const ACTIONS = {
    setScreen: (screen) => { state.screen = screen; render(); },
    aceitarEntrega: (titulo) => {
      const anterior = getOfertaStatus(titulo) || {};
      setOfertaStatus(titulo, { ...anterior, retiradaAssumida:true });
      state.screen = 'pendentes';
      render();
      showToast('success', 'Entrega aceita', `Você aceitou a entrega "${titulo}". Ela está em "Minhas retiradas".`);
    },
    confirmarRetirada: (titulo) => {
      const anterior = getOfertaStatus(titulo) || {};
      setOfertaStatus(titulo, { ...anterior, retiradaRealizada:true });
      render();
      showToast('success', 'Retirada confirmada', `A oferta "${titulo}" foi coletada e segue para a unidade receptora.`);
    },
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    ACTIONS[el.dataset.act]?.(el.dataset.arg);
  });

  // reflete, ao vivo, confirmações de transporte (Gestão) e novas ofertas (Doador)
  window.addEventListener('storage', (e) => {
    if (e.key === OFERTAS_STATUS_KEY || e.key === OFERTAS_NOVAS_KEY) render();
  });

  // liberadas pela gestão (qualquer tipo de transporte), ainda sem operador
  // que tenha aceitado — aparecem aqui até alguém assumir a coleta
  function entregasDisponiveis(){
    return todasOfertasOperador()
      .map(o => ({ oferta:o, status:getOfertaStatus(o.titulo) }))
      .filter(({status}) => status && status.status === 'confirmada' && !status.retiradaAssumida && !status.retiradaRealizada);
  }

  // aceitas por este operador — ainda não coletadas
  function retiradasPendentes(){
    return todasOfertasOperador()
      .map(o => ({ oferta:o, status:getOfertaStatus(o.titulo) }))
      .filter(({status}) => status && status.status === 'confirmada' && status.retiradaAssumida && !status.retiradaRealizada);
  }

  // já coletadas — seguem a caminho da unidade receptora, de qualquer tipo de transporte
  function retiradasConcluidas(){
    return todasOfertasOperador()
      .map(o => ({ oferta:o, status:getOfertaStatus(o.titulo) }))
      .filter(({status}) => status && status.status === 'confirmada' && status.retiradaRealizada);
  }

  function retiradaInfoRows(o, status){
    return `
      <div style="display:flex; align-items:center; gap:8px; font-size:12.5px; color:#4A4F55; font-weight:600;">${icon('store', '#7C838B', 16)}<span>${o.origem}</span></div>
      <div style="display:flex; align-items:center; gap:8px; font-size:12.5px; color:#4A4F55; font-weight:600;">${icon('warehouse', '#7C838B', 16)}<span>${o.destino}</span></div>
      <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap; font-size:12px; color:#7C838B; font-weight:600;">
        <span style="display:flex; align-items:center; gap:6px;">${icon('clock', '#7C838B', 14)}Janela ${o.janela}${status.previsao ? ` · previsão ${status.previsao}` : ''}</span>
        <span style="display:flex; align-items:center; gap:6px;">${icon('package', '#7C838B', 14)}${o.quantidade}</span>
      </div>`;
  }

  function cardDisponivel(o, status){
    const iconName = status.transporte === 'estado' ? 'truck' : 'heart-handshake';
    return `
      <div class="card card--hoverable" style="display:flex; flex-direction:column; gap:10px;">
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:10px;">
          <div style="font-size:15px; font-weight:800; color:#182A22;">${o.titulo}</div>
          <span class="status-pill" style="background:#F3F8F5; color:#1E6B4E; white-space:nowrap;">${icon(iconName, '#1E6B4E', 14)}<span>${TRANSPORTE_LABEL[status.transporte]}</span></span>
        </div>
        ${retiradaInfoRows(o, status)}
        <button data-act="aceitarEntrega" data-arg="${o.titulo}" class="btn btn-primary" style="align-self:flex-start;">Aceitar entrega</button>
      </div>`;
  }

  function cardPendente(o, status){
    return `
      <div class="card" style="display:flex; flex-direction:column; gap:10px;">
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:10px;">
          <div style="font-size:15px; font-weight:800; color:#182A22;">${o.titulo}</div>
          <span class="transport-tag">Transporte: ${TRANSPORTE_LABEL[status.transporte]}</span>
        </div>
        ${retiradaInfoRows(o, status)}
        <button data-act="confirmarRetirada" data-arg="${o.titulo}" class="btn btn-solid-green" style="align-self:flex-start;">✓ Confirmar retirada realizada</button>
      </div>`;
  }

  function cardConcluida(o, status){
    return `
      <div class="card" style="display:flex; flex-direction:column; gap:10px;">
        <div style="font-size:15px; font-weight:800; color:#182A22;">${o.titulo}</div>
        ${retiradaInfoRows(o, status)}
        <span class="status-pill" style="background:#DCEEE4; color:#1E6B4E; align-self:flex-start;">${icon('check-circle', '#1E6B4E', 14)}<span>Retirada concluída — a caminho da unidade receptora</span></span>
      </div>`;
  }

  function operadorDisponiveis(wide){
    const disponiveis = entregasDisponiveis();
    return `
      <div class="${wide ? 'content-wide' : ''}" style="display:flex; flex-direction:column; gap:14px;">
        <div>
          <div style="font-size:${wide?22:19}px; font-weight:800; color:#0F4C3A;">Entregas disponíveis</div>
          <div style="font-size:${wide?13.5:12.5}px; color:#7C838B; font-weight:600;">Retiradas liberadas pela gestão, aguardando um operador para aceitar</div>
        </div>
        ${disponiveis.length === 0
          ? `<div class="card empty-state">
              ${icon('inbox', '#BFC5CA', 34)}
              <div class="empty-state-text">Nenhuma entrega disponível no momento</div>
            </div>`
          : `<div class="list-stack">${disponiveis.map(({oferta,status}) => cardDisponivel(oferta,status)).join('')}</div>`}
      </div>`;
  }

  function operadorPendentes(wide){
    const pendentes = retiradasPendentes();
    return `
      <div class="${wide ? 'content-wide' : ''}" style="display:flex; flex-direction:column; gap:14px;">
        <div>
          <div style="font-size:${wide?22:19}px; font-weight:800; color:#0F4C3A;">Minhas retiradas</div>
          <div style="font-size:${wide?13.5:12.5}px; color:#7C838B; font-weight:600;">Retiradas confirmadas para você coletar e entregar</div>
        </div>
        ${pendentes.length === 0
          ? `<div class="card empty-state">
              ${icon('truck', '#BFC5CA', 34)}
              <div class="empty-state-text">Nenhuma retirada pendente no momento</div>
            </div>`
          : `<div class="list-stack">${pendentes.map(({oferta,status}) => cardPendente(oferta,status)).join('')}</div>`}
      </div>`;
  }

  function operadorConcluidas(wide){
    const concluidas = retiradasConcluidas();
    return `
      <div class="${wide ? 'content-wide' : ''}" style="display:flex; flex-direction:column; gap:14px;">
        <div>
          <div style="font-size:${wide?22:19}px; font-weight:800; color:#0F4C3A;">Concluídas</div>
          <div style="font-size:${wide?13.5:12.5}px; color:#7C838B; font-weight:600;">Retiradas já coletadas, a caminho da unidade receptora</div>
        </div>
        ${concluidas.length === 0
          ? `<div class="card empty-state">
              ${icon('check-circle', '#BFC5CA', 34)}
              <div class="empty-state-text">Nenhuma retirada concluída ainda hoje</div>
            </div>`
          : `<div class="list-stack">${concluidas.map(({oferta,status}) => cardConcluida(oferta,status)).join('')}</div>`}
      </div>`;
  }

  const SCREENS = { disponiveis:operadorDisponiveis, pendentes:operadorPendentes, concluidas:operadorConcluidas };

  function render(){
    const navDefs = [
      ['disponiveis','Disponíveis','inbox'],
      ['pendentes','Minhas retiradas','truck'],
      ['concluidas','Concluídas','check-circle'],
    ];
    const contentDesktop = SCREENS[state.screen](true);
    const contentMobile = SCREENS[state.screen](false);
    document.getElementById('app').innerHTML = `
      <div class="app-shell operador-desktop">
        <div class="app-sidebar" style="background:#0F4C3A;">
          <div class="app-sidebar-label" style="color:#BFE0CE;">OPERADOR LOGÍSTICO</div>
          ${navDefs.map(([key,label,iconName]) => navBtn(state.screen===key, false, iconName, label, key)).join('')}
        </div>
        <div class="app-content">${contentDesktop}</div>
      </div>
      <div class="card-shell operador-mobile">
        <div class="card-shell-inner">
          <div class="app-card">
            <div class="app-card-body">${contentMobile}</div>
            <div class="app-card-tabbar">
              ${navDefs.map(([key,label,iconName]) => `
                <button data-act="setScreen" data-arg="${key}" style="flex:1; display:flex; flex-direction:column; align-items:center; gap:2px; background:none; border:none; padding:8px 2px; cursor:pointer;">
                  ${icon(iconName, state.screen===key?'#F2994A':'#9AA0A6', 18)}
                  <span style="font-size:10px; font-weight:700; color:${state.screen===key?'#F2994A':'#9AA0A6'};">${label}</span>
                </button>`).join('')}
            </div>
          </div>
        </div>
      </div>`;
    renderAccountBar(session, entregasDisponiveis().length + retiradasPendentes().length, 'disponiveis', 'Entregas para você');
  }

  render();
})();
