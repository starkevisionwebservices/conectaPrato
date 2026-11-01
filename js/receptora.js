(function(){
  const session = guard('receptora');
  if (!session) return;

  const OFERTAS_RECEPTORA = [
    { titulo:'Legumes e verduras excedentes', origem:'Restaurante Sabor do Mar', distancia:'2,4 km', quantidade:'32 kg', prazo:'20:00', ...meta('reservada') },
    { titulo:'Iogurtes próximos do vencimento', origem:'Supermercado Bom Preço', distancia:'3,1 km', quantidade:'40 un', prazo:'22:00', ...meta('pendente') },
    { titulo:'Grãos e cereais a granel', origem:'Mercadinho São José', distancia:'1,8 km', quantidade:'25 kg', prazo:'amanhã 10:00', ...meta('aberta') },
  ];

  // OFERTAS_RECEPTORA (roteiro fixo) + qualquer oferta publicada ao vivo pelo Doador
  function todasOfertasReceptora(){
    const novas = getOfertasNovas()
      .filter(n => !OFERTAS_RECEPTORA.some(o => o.titulo === n.titulo))
      .map(n => ({ titulo:n.titulo, origem:n.doador, distancia:'a definir', quantidade:n.quantidade, prazo:n.janela || 'a combinar', ...meta('aberta') }));
    return [...OFERTAS_RECEPTORA, ...novas];
  }

  const PRIORIDADE_META = {
    Alta:  { bg:'#FBE1E1', color:'#B23434' },
    Média: { bg:'#FDECD8', color:'#B9660F' },
    Baixa: { bg:'#EAECED', color:'#7C838B' },
  };
  const PRIORIDADE_ORDEM = { Alta:0, Média:1, Baixa:2 };

  // Alta > Média > Baixa; empates mantêm a ordem original de criação (sort é estável)
  function ordenarPorPrioridade(lista){
    return lista.slice().sort((a, b) => PRIORIDADE_ORDEM[a.prioridade] - PRIORIDADE_ORDEM[b.prioridade]);
  }

  const DEMANDA_KEY = 'cpf_demanda_bom-jardim';
  const DEMANDAS_INICIAIS = [
    { tipo:'Hortifruti (legumes e verduras)', quantidade:'80 kg', prioridade:'Alta' },
    { tipo:'Proteína animal', quantidade:'30 kg', prioridade:'Alta' },
    { tipo:'Grãos e cereais', quantidade:'50 kg', prioridade:'Média' },
    { tipo:'Laticínios', quantidade:'20 un', prioridade:'Média' },
    { tipo:'Padaria e confeitaria', quantidade:'15 kg', prioridade:'Baixa' },
  ];

  function genId(){
    return 'd-' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  }

  // separa "80 kg" em { qtd:"80", unidade:"kg" } para pré-preencher o formulário de edição
  function parseQuantidade(q){
    const partes = String(q).trim().split(' ');
    const unidade = partes.pop();
    return { qtd: partes.join(' '), unidade };
  }

  function escapeAttr(str){
    return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function getDemandas(){
    let lista = null;
    try {
      const raw = localStorage.getItem(DEMANDA_KEY);
      if (raw) lista = JSON.parse(raw);
    } catch (e) { /* dado corrompido — recomeça do zero */ }
    let precisaSalvar = !lista;
    if (!lista) lista = DEMANDAS_INICIAIS.map(d => ({ ...d }));
    // garante id em todo item, inclusive nos 5 iniciais que ainda não tinham
    lista.forEach(d => { if (!d.id) { d.id = genId(); precisaSalvar = true; } });
    if (precisaSalvar) saveDemandas(lista);
    return lista;
  }

  function saveDemandas(lista){
    localStorage.setItem(DEMANDA_KEY, JSON.stringify(lista));
  }

  const HISTORICO_RECEPTORA = [
    { data:'18/07', doador:'Restaurante Sabor do Mar', quantidade:'12 kg', aproveitamento:'100%', ...meta('entregue') },
    { data:'17/07', doador:'Padaria Trigo Dourado', quantidade:'18 kg', aproveitamento:'92%', ...meta('entregue') },
    { data:'15/07', doador:'Hortifruti Vale Verde', quantidade:'25 kg', aproveitamento:'80%', ...meta('coletada') },
    { data:'12/07', doador:'Supermercado Bom Preço', quantidade:'8 kg', aproveitamento:'0%', ...meta('recusada') },
  ];

  // lote fixo exibido na tela "Confirmar recebimento" — usa o mesmo título de
  // OFERTAS_RECEPTORA para que a confirmação reflita no estado compartilhado
  const OFERTA_CONFIRMACAO = { lote:'L-2044', titulo:'Legumes e verduras excedentes', doador:'Restaurante Sabor do Mar' };

  const state = { screen:'dashboard', condicao:'boa', aceite:'total', sidebarOpen:false, modalDemandaOpen:false, modalDemandaEditId:null, loadingDemanda:false };

  const ACTIONS = {
    setScreen: (screen) => { state.screen = screen; state.sidebarOpen = false; state.modalDemandaOpen = false; state.modalDemandaEditId = null; render(); },
    setCondicao: (c) => { state.condicao = c; render(); },
    setAceite: (a) => { state.aceite = a; render(); },
    toggleSidebar: () => { state.sidebarOpen = !state.sidebarOpen; render(); },
    closeSidebar: () => { state.sidebarOpen = false; render(); },
    noop: () => {},
    abrirModalDemanda: () => { state.modalDemandaOpen = true; state.modalDemandaEditId = null; render(); },
    abrirModalEdicaoDemanda: (id) => { state.modalDemandaOpen = true; state.modalDemandaEditId = id; render(); },
    fecharModalDemanda: () => { state.modalDemandaOpen = false; state.modalDemandaEditId = null; render(); },
    salvarDemanda: () => {
      if (state.loadingDemanda) return;
      const tipoEl = document.getElementById('demanda-tipo');
      const qtdEl = document.getElementById('demanda-qtd');
      const unidadeEl = document.getElementById('demanda-unidade');
      const prioridadeEl = document.getElementById('demanda-prioridade');
      const tipo = tipoEl.value.trim();
      const qtd = qtdEl.value.trim();
      if (!tipo || !qtd) return;
      const dados = { tipo, quantidade: `${qtd} ${unidadeEl.value}`, prioridade: prioridadeEl.value };
      const isEdit = !!state.modalDemandaEditId;
      const editId = state.modalDemandaEditId;
      state.loadingDemanda = true;
      render();
      setTimeout(() => {
        const lista = getDemandas();
        if (isEdit) {
          const idx = lista.findIndex(d => d.id === editId);
          if (idx !== -1) lista[idx] = { ...lista[idx], ...dados };
        } else {
          lista.push({ id: genId(), ...dados });
        }
        saveDemandas(lista);
        state.modalDemandaOpen = false;
        state.modalDemandaEditId = null;
        state.loadingDemanda = false;
        render();
        showToast('success', isEdit ? 'Item atualizado' : 'Item adicionado', `O item "${dados.tipo}" foi ${isEdit ? 'atualizado na' : 'adicionado à'} demanda prevista.`);
      }, 700);
    },
    removerDemanda: () => {
      if (!state.modalDemandaEditId) return;
      if (!confirm('Remover este item da demanda prevista?')) return;
      const item = getDemandas().find(d => d.id === state.modalDemandaEditId);
      const lista = getDemandas().filter(d => d.id !== state.modalDemandaEditId);
      saveDemandas(lista);
      state.modalDemandaOpen = false;
      state.modalDemandaEditId = null;
      render();
      showToast('success', 'Item removido', `O item "${item ? item.tipo : ''}" foi removido da demanda prevista.`);
    },
    confirmarRecebimento: () => {
      const anterior = getOfertaStatus(OFERTA_CONFIRMACAO.titulo) || {};
      setOfertaStatus(OFERTA_CONFIRMACAO.titulo, { ...anterior, status:'entregue' });
      render();
      showToast('success', 'Recebimento confirmado!', `A entrega de ${OFERTA_CONFIRMACAO.titulo} foi registrada com sucesso.`);
    },
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    ACTIONS[el.dataset.act]?.(el.dataset.arg);
  });

  // habilita/desabilita "Adicionar"/"Salvar" ao digitar, sem re-renderizar (perderia o foco do campo)
  document.addEventListener('input', (e) => {
    if (!e.target.closest('#modal-demanda-form')) return;
    const btn = document.getElementById('btn-salvar-demanda');
    if (!btn) return;
    const tipo = document.getElementById('demanda-tipo').value.trim();
    const qtd = document.getElementById('demanda-qtd').value.trim();
    btn.disabled = !(tipo && qtd);
  });

  // reflete, ao vivo, confirmações da Gestão e novas ofertas do Doador (mesma aba ou outra)
  window.addEventListener('storage', (e) => {
    if (e.key === OFERTAS_STATUS_KEY || e.key === OFERTAS_NOVAS_KEY) render();
  });

  const DELIVERY_STEPS = [
    { key:'confirmado', label:'Confirmado' },
    { key:'a_caminho', label:'A caminho' },
    { key:'entregue', label:'Entregue' },
  ];
  const ENTREGA_STEP_ATUAL = 1; // toda entrega confirmada pela gestão está, por enquanto, "a caminho"

  function etaLabel(previsao){
    const [h, m] = previsao.split(':').map(Number);
    const eta = new Date();
    eta.setHours(h, m, 0, 0);
    const diffMin = Math.round((eta - Date.now()) / 60000);
    return diffMin < 0
      ? 'Chegada prevista para breve'
      : `Chega em aproximadamente ${diffMin} min · previsão ${previsao}`;
  }

  function deliveryCard(o, status){
    return `
      <div class="card delivery-card">
        <div class="delivery-header">${o.titulo} · ${o.origem} · ${o.quantidade}</div>
        <div class="delivery-stepper">
          ${DELIVERY_STEPS.map((s, i) => `
            ${i > 0 ? `<div class="delivery-step-line${i <= ENTREGA_STEP_ATUAL ? ' is-done' : ''}"></div>` : ''}
            <div class="delivery-step${i < ENTREGA_STEP_ATUAL ? ' is-done' : ''}${i === ENTREGA_STEP_ATUAL ? ' is-current' : ''}">
              <div class="delivery-step-dot">${i < ENTREGA_STEP_ATUAL ? '✓' : ''}</div>
              <div class="delivery-step-label">${s.label}</div>
            </div>`).join('')}
        </div>
        <div class="delivery-footer">
          <div class="delivery-transport">${icon(status.transporte === 'estado' ? 'truck' : 'heart-handshake', '#4A4F55', 16)}<span>Transporte: ${TRANSPORTE_LABEL[status.transporte]}</span></div>
          <div class="delivery-eta">${etaLabel(status.previsao)}</div>
        </div>
      </div>`;
  }

  // ofertas confirmadas pela gestão que ainda não foram marcadas como entregues
  // (no estado atual do protótipo, toda oferta "confirmada" está a caminho)
  function entregasACaminho(){
    return todasOfertasReceptora()
      .map(o => ({ oferta:o, status:getOfertaStatus(o.titulo) }))
      .filter(({status}) => status && status.status === 'confirmada');
  }

  function receptoraDashboard(){
    const entregas = entregasACaminho();
    return `
      <div class="content-wide">
        <div>
          <div style="font-size:22px; font-weight:800; color:#0F4C3A;">Entregas a caminho</div>
          <div style="font-size:13.5px; color:#7C838B; font-weight:600;">Acompanhe as doações confirmadas para sua unidade</div>
        </div>
        ${entregas.length === 0
          ? `<div class="card empty-state">
              ${icon('inbox', '#BFC5CA', 34)}
              <div class="empty-state-text">Nenhuma entrega a caminho no momento</div>
            </div>`
          : `<div class="list-stack">
              ${entregas.map(({oferta, status}) => deliveryCard(oferta, status)).join('')}
            </div>`}
      </div>`;
  }

  function receptoraConfirmacao(){
    const condicoes = [['boa','Boa'],['regular','Regular'],['ruim','Ruim']];
    const aceites = [['total','Total'],['parcial','Parcial'],['recusa','Recusa']];
    return `
      <div class="content-form">
        <div style="font-size:22px; font-weight:800; color:#0F4C3A;">Confirmação de recebimento</div>
        <div style="background:#F6F7F5; border-radius:12px; padding:14px 16px; font-size:13.5px; font-weight:700; color:#4A4F55;">Lote ${OFERTA_CONFIRMACAO.lote} · ${OFERTA_CONFIRMACAO.titulo} · ${OFERTA_CONFIRMACAO.doador}</div>
        <div style="display:flex; gap:16px;">
          <div style="flex:1; display:flex; flex-direction:column; gap:6px;">
            <label style="font-size:12.5px; font-weight:700; color:#4A4F55;">Horário de chegada</label>
            <input type="text" placeholder="15:55" style="border:1px solid #DADFE1; border-radius:10px; padding:11px; font-size:14px;">
          </div>
          <div style="flex:1; display:flex; flex-direction:column; gap:6px;">
            <label style="font-size:12.5px; font-weight:700; color:#4A4F55;">Quantidade recebida</label>
            <input type="text" placeholder="32 kg" style="border:1px solid #DADFE1; border-radius:10px; padding:11px; font-size:14px;">
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          <label style="font-size:12.5px; font-weight:700; color:#4A4F55;">Condição aparente</label>
          <div style="display:flex; gap:8px;">
            ${condicoes.map(([key,label]) => `<button data-act="setCondicao" data-arg="${key}" style="flex:1; border-radius:10px; padding:9px; font-size:13px; font-weight:700; border:1px solid #DADFE1; cursor:pointer; ${state.condicao===key?'background:#0F4C3A; color:#fff; border-color:#0F4C3A;':'background:#fff; color:#4A4F55;'}">${label}</button>`).join('')}
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          <label style="font-size:12.5px; font-weight:700; color:#4A4F55;">Aceite</label>
          <div style="display:flex; gap:8px;">
            ${aceites.map(([key,label]) => `<button data-act="setAceite" data-arg="${key}" style="flex:1; border-radius:10px; padding:9px; font-size:13px; font-weight:700; border:1px solid #DADFE1; cursor:pointer; ${state.aceite===key?'background:#F2994A; color:#fff; border-color:#F2994A;':'background:#fff; color:#4A4F55;'}">${label}</button>`).join('')}
          </div>
        </div>
        ${state.aceite !== 'total' ? `
        <div style="display:flex; flex-direction:column; gap:6px;">
          <label style="font-size:12.5px; font-weight:700; color:#4A4F55;">Justificativa da divergência</label>
          <textarea rows="3" placeholder="Descreva o motivo da recusa parcial ou total" style="border:1px solid #DADFE1; border-radius:10px; padding:11px; font-size:14px; font-family:inherit; resize:none;"></textarea>
        </div>` : ''}
        <button data-act="confirmarRecebimento" style="background:#0F4C3A; color:#fff; border:none; border-radius:12px; padding:14px; font-size:14.5px; font-weight:800; align-self:flex-start; padding-left:28px; padding-right:28px; cursor:pointer;">Confirmar recebimento</button>
      </div>`;
  }

  function modalAdicionarDemanda(){
    if (!state.modalDemandaOpen) return '';
    const editando = !!state.modalDemandaEditId;
    const item = editando ? getDemandas().find(d => d.id === state.modalDemandaEditId) : null;
    const { qtd: qtdValor, unidade: unidadeValor } = item ? parseQuantidade(item.quantidade) : { qtd:'', unidade:'kg' };
    return `
      <div class="modal-overlay" data-act="fecharModalDemanda">
        <div class="modal-card" data-act="noop" style="max-width:440px;">
          <div class="modal-header">
            <div class="modal-title">${editando ? 'Editar tipo de alimento' : 'Adicionar tipo de alimento'}</div>
            <button class="modal-close" data-act="fecharModalDemanda" aria-label="Fechar">×</button>
          </div>
          <div id="modal-demanda-form" style="display:flex; flex-direction:column; gap:14px;">
            <div style="display:flex; flex-direction:column; gap:6px;">
              <label style="font-size:12.5px; font-weight:700; color:#4A4F55;">Tipo de alimento</label>
              <input id="demanda-tipo" type="text" placeholder="Ex.: Frutas" value="${item ? escapeAttr(item.tipo) : ''}" style="border:1px solid #DADFE1; border-radius:10px; padding:11px; font-size:14px;">
            </div>
            <div style="display:flex; gap:10px;">
              <div style="flex:1.3; display:flex; flex-direction:column; gap:6px;">
                <label style="font-size:12.5px; font-weight:700; color:#4A4F55;">Quantidade média/semana</label>
                <input id="demanda-qtd" type="number" min="0" placeholder="Ex.: 40" value="${escapeAttr(qtdValor)}" style="border:1px solid #DADFE1; border-radius:10px; padding:11px; font-size:14px;">
              </div>
              <div style="flex:1; display:flex; flex-direction:column; gap:6px;">
                <label style="font-size:12.5px; font-weight:700; color:#4A4F55;">Unidade</label>
                <select id="demanda-unidade" data-custom-select>
                  <option value="kg" ${unidadeValor==='kg'?'selected':''}>kg</option>
                  <option value="un" ${unidadeValor==='un'?'selected':''}>un</option>
                </select>
              </div>
            </div>
            <div style="display:flex; flex-direction:column; gap:6px;">
              <label style="font-size:12.5px; font-weight:700; color:#4A4F55;">Prioridade</label>
              <select id="demanda-prioridade" data-custom-select>
                <option value="Alta" ${item?.prioridade==='Alta'?'selected':''}>Alta</option>
                <option value="Média" ${item?.prioridade==='Média'?'selected':''}>Média</option>
                <option value="Baixa" ${item?.prioridade==='Baixa'?'selected':''}>Baixa</option>
              </select>
            </div>
          </div>
          <div class="modal-actions" style="${editando ? 'justify-content:space-between;' : ''}">
            ${editando ? `<button class="btn btn-outline-danger" data-act="removerDemanda" ${state.loadingDemanda?'disabled':''}>Remover</button>` : ''}
            <div style="display:flex; gap:10px;">
              <button class="btn btn-secondary" data-act="fecharModalDemanda" ${state.loadingDemanda?'disabled':''}>Cancelar</button>
              <button id="btn-salvar-demanda" class="btn btn-primary" ${state.loadingDemanda ? 'disabled' : (editando ? '' : 'disabled')} data-act="salvarDemanda" style="display:flex; align-items:center; gap:7px;">${state.loadingDemanda ? '<span class="verify-spinner"></span>Salvando...' : (editando ? 'Salvar' : 'Adicionar')}</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  function receptoraDemanda(){
    const demandas = ordenarPorPrioridade(getDemandas());
    return `
      <div class="content-wide">
        <div>
          <div style="font-size:22px; font-weight:800; color:#0F4C3A;">Demanda prevista</div>
          <div style="font-size:13.5px; color:#7C838B; font-weight:600;">Ajude o sistema a compatibilizar melhor as ofertas com o que sua unidade precisa</div>
        </div>
        <div class="table-scroll">
          <div class="table-wrap" style="min-width:560px;">
            <div class="table-head-row" style="grid-template-columns:2fr 1fr 1fr 1fr;">
              <span>Tipo de alimento</span><span>Qtd. média/semana</span><span>Prioridade</span><span></span>
            </div>
            ${demandas.map(d => {
              const cores = PRIORIDADE_META[d.prioridade] || PRIORIDADE_META.Baixa;
              return `
              <div class="table-body-row" style="grid-template-columns:2fr 1fr 1fr 1fr;">
                <span style="font-weight:700;">${d.tipo}</span>
                <span style="color:#4A4F55; font-weight:600;">${d.quantidade}</span>
                <span style="background:${cores.bg}; color:${cores.color}; font-size:10.5px; font-weight:800; padding:3px 9px; border-radius:20px; width:fit-content;">${d.prioridade}</span>
                <a data-act="abrirModalEdicaoDemanda" data-arg="${d.id}" style="font-size:12px; font-weight:700; cursor:pointer;">editar</a>
              </div>`;
            }).join('')}
          </div>
        </div>
        <button data-act="abrirModalDemanda" class="btn btn-primary" style="padding:12px 20px; font-size:13.5px; align-self:flex-start;">+ Adicionar tipo de alimento</button>
      </div>`;
  }

  function receptoraHistorico(){
    return `
      <div class="content-wide">
        <div style="font-size:22px; font-weight:800; color:#0F4C3A;">Histórico de recebimentos</div>
        <div class="table-scroll">
          <div class="table-wrap" style="min-width:640px;">
            <div class="table-head-row" style="grid-template-columns:1fr 1.6fr 1fr 1fr 1fr;">
              <span>Data</span><span>Doador</span><span>Quantidade</span><span>Aproveitamento</span><span>Status</span>
            </div>
            ${HISTORICO_RECEPTORA.map(h => `
              <div class="table-body-row" style="grid-template-columns:1fr 1.6fr 1fr 1fr 1fr;">
                <span style="color:#7C838B; font-weight:600;">${h.data}</span>
                <span style="font-weight:700;">${h.doador}</span>
                <span style="color:#4A4F55; font-weight:600;">${h.quantidade}</span>
                <span style="font-weight:700;">${h.aproveitamento}</span>
                <span style="background:${h.statusBg}; color:${h.statusColor}; font-size:10.5px; font-weight:800; padding:3px 9px; border-radius:20px; width:fit-content;">${h.statusLabel}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>`;
  }

  function render(){
    const navDefs = [
      ['dashboard','Entregas a caminho','inbox'],
      ['confirmacao','Confirmar recebimento','package-check'],
      ['demanda','Demanda prevista','clipboard-list'],
      ['historico','Histórico','history'],
    ];
    const content = state.screen === 'dashboard' ? receptoraDashboard()
      : state.screen === 'confirmacao' ? receptoraConfirmacao()
      : state.screen === 'demanda' ? receptoraDemanda()
      : receptoraHistorico();
    document.getElementById('app').innerHTML = `
      <div class="app-shell">
        <button class="sidebar-toggle" data-act="toggleSidebar">
          <span class="sidebar-toggle-icon"><span></span><span></span><span></span></span>
          Menu
        </button>
        <div class="sidebar-backdrop${state.sidebarOpen?' is-open':''}" data-act="closeSidebar"></div>
        <div class="app-sidebar${state.sidebarOpen?' is-open':''}" style="background:#0F4C3A;">
          <div class="app-sidebar-label" style="color:#BFE0CE;">COZINHA COMUNITÁRIA BOM JARDIM</div>
          ${navDefs.map(([key,label,iconName]) => navBtn(state.screen===key, false, iconName, label, key)).join('')}
        </div>
        <div class="app-content">${content}</div>
      </div>
      ${modalAdicionarDemanda()}`;
    document.body.style.overflow = state.sidebarOpen || state.modalDemandaOpen ? 'hidden' : '';
    initImageSlots(render);
    renderAccountBar(session, entregasACaminho().length, 'dashboard', 'Entregas a caminho');
  }

  render();
})();
