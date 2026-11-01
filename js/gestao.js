(function(){
  const session = guard('gestao');
  if (!session) return;

  const KPI_SECTIONS = [
    { title:'Integração com o mercado', cols:3, items:[
      { label:'Estabelecimentos ativos', value:'342', delta:'+18 no mês', deltaColor:'#1E6B4E', icon:'store', tone:'neutral' },
      { label:'Unidades receptoras', value:'58', delta:'+3 no mês', deltaColor:'#1E6B4E', icon:'building-2', tone:'neutral' },
      { label:'Ofertas no mês', value:'1.204', delta:'+9% vs. jun', deltaColor:'#1E6B4E', icon:'package', tone:'neutral' },
    ]},
    { title:'Eficiência operacional', cols:2, items:[
      { label:'Tempo médio oferta→recebimento', value:'3h40', delta:'-20min vs. jun', deltaColor:'#1E6B4E', icon:'clock', tone:'neutral' },
      { label:'Ofertas recusadas/expiradas', value:'42', delta:'3,5% do total', deltaColor:'#B23434', icon:'circle-x', tone:'warning' },
    ]},
    { title:'Aproveitamento', cols:4, items:[
      { label:'Kg disponibilizados', value:'28.400', delta:'meta: 30.000', deltaColor:'#7C838B', icon:'scale', tone:'neutral' },
      { label:'Kg recebidos', value:'26.150', delta:'92% do ofertado', deltaColor:'#7C838B', icon:'truck', tone:'neutral' },
      { label:'Kg aproveitados', value:'24.800', delta:'87% do ofertado', deltaColor:'#1E6B4E', icon:'check-circle', tone:'positive' },
      { label:'Perdas / recusas', value:'3,2%', delta:'-0,6pp vs. jun', deltaColor:'#1E6B4E', icon:'triangle-alert', tone:'warning' },
    ]},
    { title:'Impacto social e econômico', cols:3, items:[
      { label:'Refeições apoiadas', value:'≈52.300', delta:'+11% vs. jun', deltaColor:'#1E6B4E', icon:'utensils', tone:'neutral' },
      { label:'Economia gerada (est.)', value:'R$ 186,4 mil', delta:'+9% vs. jun', deltaColor:'#1E6B4E', icon:'piggy-bank', tone:'neutral' },
      { label:'Unidades beneficiadas', value:'58', delta:'todas ativas', deltaColor:'#7C838B', icon:'heart-handshake', tone:'neutral' },
    ]},
  ];


  const COMPATIBILIZACOES = [
    { oferta:'Legumes e verduras excedentes', doador:'Restaurante Sabor do Mar', quantidade:'32 kg',
      motivo:'Recomendada por: prioridade territorial + menor distância',
      candidatas:[
        { unidade:'Cozinha Comunitária Bom Jardim', distancia:'2,4 km', prioridade:'Alta', capacidade:'OK', historico:'recorrente', frequencia:{ texto:'última doação há 26 dias', dias:26 } },
        { unidade:'Restaurante Popular Centro', distancia:'3,0 km', prioridade:'Média', capacidade:'OK', historico:'recorrente', frequencia:{ texto:'recebeu 2x este mês', dias:6 } },
        { unidade:'Banco Municipal de Alimentos', distancia:'5,2 km', prioridade:'Baixa', capacidade:'Limitada', historico:'sem histórico', frequencia:{ texto:'recebeu 3x este mês', dias:3 } },
      ] },
    { oferta:'Iogurtes próximos do vencimento', doador:'Supermercado Bom Preço', quantidade:'40 un',
      motivo:'Recomendada por: prioridade média e capacidade adequada, sem outras unidades concorrentes',
      candidatas:[
        { unidade:'Banco Municipal de Alimentos', distancia:'3,1 km', prioridade:'Média', capacidade:'OK', historico:'recorrente', frequencia:{ texto:'recebeu 2x este mês', dias:9 } },
      ] },
    { oferta:'Grãos e cereais a granel', doador:'Mercadinho São José', quantidade:'25 kg',
      motivo:'Recomendada por: menor distância + menor frequência de recebimento recente',
      candidatas:[
        { unidade:'Restaurante Popular Centro', distancia:'1,8 km', prioridade:'Alta', capacidade:'OK', historico:'recorrente', frequencia:{ texto:'última doação há 21 dias', dias:21 } },
        { unidade:'Cozinha Comunitária Vila União', distancia:'4,1 km', prioridade:'Média', capacidade:'OK', historico:'sem histórico', frequencia:{ texto:'recebeu 2x este mês', dias:5 } },
      ] },
    { oferta:'Marmitas prontas não vendidas', doador:'Padaria Trigo Dourado', quantidade:'45 un',
      motivo:'Recomendada por: única unidade compatível no território, dentro da capacidade disponível',
      candidatas:[
        { unidade:'Cozinha Comunitária Vila União', distancia:'4,6 km', prioridade:'Média', capacidade:'OK', historico:'sem histórico', frequencia:{ texto:'última doação há 12 dias', dias:12 } },
      ] },
  ];

  // candidatas padrão atribuídas a ofertas criadas na hora (fora do roteiro
  // fixo de demonstração), para que "Buscar melhor encaixe" e a comparação
  // funcionem normalmente mesmo para uma oferta nova
  const CANDIDATAS_OFERTA_NOVA = [
    { unidade:'Cozinha Comunitária Bom Jardim', distancia:'2,4 km', prioridade:'Alta', capacidade:'OK', historico:'recorrente', frequencia:{ texto:'última doação há 18 dias', dias:18 } },
    { unidade:'Restaurante Popular Centro', distancia:'3,0 km', prioridade:'Média', capacidade:'OK', historico:'recorrente', frequencia:{ texto:'recebeu 1x este mês', dias:4 } },
  ];

  // COMPATIBILIZACOES (roteiro fixo) + qualquer oferta publicada ao vivo pelo
  // Doador (js/shared-state.js) que ainda não tenha sido processada aqui —
  // sempre no fim da lista, para não deslocar os índices já usados no state
  function todasCompatibilizacoes(){
    const novas = getOfertasNovas()
      .filter(n => !COMPATIBILIZACOES.some(c => c.oferta === n.titulo))
      .map(n => ({
        oferta: n.titulo, doador: n.doador, quantidade: n.quantidade,
        motivo: 'Recomendada por: prioridade territorial + histórico de atendimento',
        candidatas: CANDIDATAS_OFERTA_NOVA,
      }));
    return [...COMPATIBILIZACOES, ...novas];
  }

  const CADASTROS = [
    { nome:'Feira Livre da Parangaba — Box 14', tipo:'Estabelecimento doador', bairro:'Parangaba', docStatus:'completos', iniciais:'FP' },
    { nome:'Cozinha Comunitária Vila União', tipo:'Unidade receptora', bairro:'Vila União', docStatus:'completos', iniciais:'VU' },
    { nome:'Mercadinho São José', tipo:'Estabelecimento doador', bairro:'Messejana', docStatus:'pendente CNPJ', iniciais:'MJ' },
    { nome:'Restaurante Popular Centro', tipo:'Unidade receptora', bairro:'Centro', docStatus:'completos', iniciais:'RC' },
  ];

  const LOTES_RELATORIO = [
    { id:'L-2044', doador:'Restaurante Sabor do Mar', bairro:'Meireles', unidade:'Cozinha Bom Jardim', tipo:'Hortifruti', quantidade:'32 kg', diasAtras:0, ...meta('entregue') },
    { id:'L-2043', doador:'Padaria Trigo Dourado', bairro:'Aldeota', unidade:'Banco Municipal', tipo:'Padaria', quantidade:'18 kg', diasAtras:1, ...meta('coletada') },
    { id:'L-2041', doador:'Supermercado Bom Preço', bairro:'Centro', unidade:'Banco Municipal', tipo:'Laticínios', quantidade:'40 un', diasAtras:3, ...meta('pendente') },
    { id:'L-2039', doador:'Hortifruti Vale Verde', bairro:'Messejana', unidade:'Restaurante Popular', tipo:'Hortifruti', quantidade:'12 kg', diasAtras:5, ...meta('recusada') },
    { id:'L-2036', doador:'Mercadinho São José', bairro:'Messejana', unidade:'Restaurante Popular', tipo:'Grãos', quantidade:'25 kg', diasAtras:9, ...meta('aberta') },
    { id:'L-2031', doador:'Restaurante Sabor do Mar', bairro:'Meireles', unidade:'Vila União', tipo:'Preparados', quantidade:'45 un', diasAtras:20, ...meta('expirada') },
  ];

  function valoresUnicos(campo){ return [...new Set(LOTES_RELATORIO.map(l => l[campo]))]; }

  const FILTRO_DEFS = [
    { key:'periodo', label:'Período', options:[
        { value:'', label:'Últimos 30 dias' },
        { value:'7', label:'Últimos 7 dias' },
        { value:'15', label:'Últimos 15 dias' },
      ] },
    { key:'estabelecimento', label:'Estabelecimento', options:[{ value:'', label:'Estabelecimento: todos' }, ...valoresUnicos('doador').map(v => ({ value:v, label:v }))] },
    { key:'territorio', label:'Território', options:[{ value:'', label:'Território: todos os bairros' }, ...valoresUnicos('bairro').map(v => ({ value:v, label:v }))] },
    { key:'unidade', label:'Unidade receptora', options:[{ value:'', label:'Unidade receptora: todas' }, ...valoresUnicos('unidade').map(v => ({ value:v, label:v }))] },
    { key:'tipo', label:'Tipo de alimento', options:[{ value:'', label:'Tipo de alimento: todos' }, ...valoresUnicos('tipo').map(v => ({ value:v, label:v }))] },
    { key:'status', label:'Status do lote', options:[{ value:'', label:'Status do lote: todos' }, ...valoresUnicos('status').map(v => ({ value:v, label:LOTES_RELATORIO.find(l=>l.status===v).statusLabel }))] },
  ];

  function lotesFiltrados(filtros){
    return LOTES_RELATORIO.filter(l => {
      if (filtros.periodo && l.diasAtras > Number(filtros.periodo)) return false;
      if (filtros.estabelecimento && l.doador !== filtros.estabelecimento) return false;
      if (filtros.territorio && l.bairro !== filtros.territorio) return false;
      if (filtros.unidade && l.unidade !== filtros.unidade) return false;
      if (filtros.tipo && l.tipo !== filtros.tipo) return false;
      if (filtros.status && l.status !== filtros.status) return false;
      return true;
    });
  }

  function csvEscape(v){
    const s = String(v);
    return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function exportarCSV(linhas){
    const header = ['Lote','Estabelecimento','Unidade receptora','Tipo','Quantidade','Status'];
    const rows = linhas.map(l => [l.id, l.doador, l.unidade, l.tipo, l.quantidade, l.statusLabel]);
    const csv = [header, ...rows].map(r => r.map(csvEscape).join(';')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-conecta-prato-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ── validação de cadastros: aprovação/rejeição persistida em localStorage ──
  const CADASTROS_KEY = 'cpf_cadastros_validados';
  function getCadastrosStatus(){
    try { return JSON.parse(localStorage.getItem(CADASTROS_KEY)) || {}; } catch (e) { return {}; }
  }
  function setCadastroStatus(nome, status){
    const all = getCadastrosStatus();
    all[nome] = status;
    localStorage.setItem(CADASTROS_KEY, JSON.stringify(all));
  }
  function cadastrosPendentes(){
    const status = getCadastrosStatus();
    return CADASTROS.filter(c => !status[c.nome]);
  }

  const AUDITORIA = {
    'L-2044': { resumo:'Legumes e verduras · Sabor do Mar → Bom Jardim', eventos:[
      { t:'19/07 14:02', who:'Restaurante Sabor do Mar', action:'Oferta criada', detail:'32 kg de legumes e verduras excedentes registrados' },
      { t:'19/07 14:05', who:'Sistema', action:'Compatibilização automática', detail:'Sugerida Cozinha Comunitária Bom Jardim (2,4 km, prioridade alta)' },
      { t:'19/07 14:20', who:'Ana Beatriz — SDHDS', action:'Compatibilização confirmada', detail:'Atribuição oficializada à unidade' },
      { t:'19/07 15:10', who:'Carlos Lima — Operador', action:'Retirada realizada', detail:'Coleta confirmada no estabelecimento' },
      { t:'19/07 15:55', who:'Cozinha Comunitária Bom Jardim', action:'Recebimento confirmado', detail:'Aceite total — 32 kg em boas condições' },
      { t:'19/07 16:00', who:'Sistema', action:'Lote encerrado', detail:'Ciclo completo em 1h58' },
    ]},
    'L-2039': { resumo:'Hortifruti · Vale Verde → Restaurante Popular', eventos:[
      { t:'15/07 11:14', who:'Hortifruti Vale Verde', action:'Oferta criada', detail:'12 kg de frutas e legumes diversos' },
      { t:'15/07 11:20', who:'Sistema', action:'Compatibilização automática', detail:'Sugerido Restaurante Popular Centro' },
      { t:'15/07 13:40', who:'Operador não atribuído', action:'Retirada não realizada', detail:'Janela de retirada expirada sem confirmação' },
      { t:'15/07 14:00', who:'Restaurante Popular Centro', action:'Recebimento recusado', detail:'Divergência: lote não chegou à unidade' },
    ]},
    'L-2031': { resumo:'Preparados · Sabor do Mar → Vila União', eventos:[
      { t:'12/07 09:00', who:'Restaurante Sabor do Mar', action:'Oferta criada', detail:'45 unidades de marmitas preparadas' },
      { t:'12/07 09:05', who:'Sistema', action:'Compatibilização automática', detail:'Sugerida Cozinha Comunitária Vila União' },
      { t:'12/07 20:00', who:'Sistema', action:'Lote expirado', detail:'Prazo de retirada encerrado sem confirmação de nenhuma etapa' },
    ]},
  };

  const state = {
    screen:'kpis', loteAuditoriaId:'L-2044', sidebarOpen:false,
    buscadas:new Set(), buscando:{}, comparacaoAberta:[], escolhas:{},
    confirmadas:{}, modalOfertaIdx:null, modalTransporte:null,
    filtrosRelatorio: { periodo:'', estabelecimento:'', territorio:'', unidade:'', tipo:'', status:'' },
    loadingCadastro:null, loadingExport:false,
  };

  function formatHorario(date){
    return `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
  }
  function previsaoRetirada(minutos){
    return formatHorario(new Date(Date.now() + minutos * 60000));
  }

  const VERIFICATION_STEPS = [
    'Verificando prioridade territorial...',
    'Calculando distância...',
    'Avaliando capacidade de recebimento...',
    'Consultando histórico de atendimento...',
    'Analisando equidade de distribuição...',
  ];
  const BUSCA_STEP_MS = 1000; // ~900ms–1.2s por critério

  function delay(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }

  async function runBusca(idxStr){
    state.buscando[idxStr] = 0;
    render();
    for (let i = 0; i < VERIFICATION_STEPS.length; i++) {
      await delay(BUSCA_STEP_MS);
      state.buscando[idxStr] = i + 1;
      render();
    }
    await delay(300);
    delete state.buscando[idxStr];
    state.buscadas.add(idxStr);
    if (!state.comparacaoAberta.includes(idxStr)) state.comparacaoAberta.push(idxStr);
    render();
  }

  const ACTIONS = {
    setScreen: (screen) => { state.screen = screen; state.sidebarOpen = false; render(); },
    setLoteAuditoria: (id) => { state.loteAuditoriaId = id; render(); },
    toggleSidebar: () => { state.sidebarOpen = !state.sidebarOpen; render(); },
    closeSidebar: () => { state.sidebarOpen = false; render(); },
    buscarMelhorEncaixe: (idx) => {
      if (state.buscadas.has(idx) || Object.prototype.hasOwnProperty.call(state.buscando, idx)) return;
      runBusca(idx);
    },
    toggleComparacao: (idx) => {
      const i = state.comparacaoAberta.indexOf(idx);
      if (i === -1) state.comparacaoAberta.push(idx); else state.comparacaoAberta.splice(i, 1);
      render();
    },
    reatribuir: (idx) => {
      if (!state.comparacaoAberta.includes(idx)) state.comparacaoAberta.push(idx);
      render();
    },
    selecionarUnidade: (arg) => {
      const [idx, unidade] = arg.split('|');
      if (state.confirmadas[idx]) return; // não é mais possível reatribuir após confirmar o transporte
      state.escolhas[idx] = unidade;
      render();
      showToast('success', 'Encaixe reatribuído', `A oferta foi reatribuída para "${unidade}".`);
    },
    abrirModalConfirmar: (idx) => {
      if (!state.buscadas.has(idx)) return; // só é possível confirmar depois da busca revelar a unidade
      state.modalOfertaIdx = idx;
      state.modalTransporte = null;
      render();
    },
    fecharModal: () => {
      state.modalOfertaIdx = null;
      state.modalTransporte = null;
      render();
    },
    selecionarTransporte: (tipo) => { state.modalTransporte = tipo; render(); },
    confirmarTransporte: () => {
      if (!state.modalTransporte || state.modalOfertaIdx === null) return;
      const opcao = TRANSPORTE_OPCOES.find(o => o.key === state.modalTransporte);
      const horario = previsaoRetirada(opcao.tempoEstimadoMin);
      state.confirmadas[state.modalOfertaIdx] = { tipo: state.modalTransporte, horario };
      const oferta = todasCompatibilizacoes()[Number(state.modalOfertaIdx)];
      const escolhida = unidadeEscolhida(oferta, state.modalOfertaIdx);
      setOfertaStatus(oferta.oferta, { status:'confirmada', transporte: state.modalTransporte, previsao: horario, unidade: escolhida.unidade });
      state.modalOfertaIdx = null;
      state.modalTransporte = null;
      render();
    },
    noop: () => {},
    aprovarCadastro: (nome) => {
      if (state.loadingCadastro) return;
      state.loadingCadastro = nome;
      render();
      setTimeout(() => {
        setCadastroStatus(nome, 'aprovado');
        state.loadingCadastro = null;
        render();
        showToast('success', 'Cadastro aprovado', `O cadastro de "${nome}" foi aprovado e já pode operar no sistema.`);
      }, 700);
    },
    rejeitarCadastro: (nome) => {
      if (state.loadingCadastro) return;
      state.loadingCadastro = nome;
      render();
      setTimeout(() => {
        setCadastroStatus(nome, 'rejeitado');
        state.loadingCadastro = null;
        render();
        showToast('error', 'Cadastro rejeitado', `O cadastro de "${nome}" foi rejeitado.`);
      }, 700);
    },
    exportarRelatorio: () => {
      if (state.loadingExport) return;
      state.loadingExport = true;
      render();
      setTimeout(() => {
        const linhas = lotesFiltrados(state.filtrosRelatorio);
        exportarCSV(linhas);
        state.loadingExport = false;
        render();
        showToast('success', 'Relatório exportado', `${linhas.length} lote(s) exportado(s) em CSV.`);
      }, 700);
    },
  };

  document.addEventListener('change', (e) => {
    const sel = e.target.closest('select[data-filtro]');
    if (!sel) return;
    state.filtrosRelatorio[sel.dataset.filtro] = sel.value;
    render();
  });

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    ACTIONS[el.dataset.act]?.(el.dataset.arg);
  });

  // reflete, ao vivo, novas ofertas publicadas pelo Doador em outra aba
  window.addEventListener('storage', (e) => {
    if (e.key === OFERTAS_NOVAS_KEY) render();
  });

  // ícones e helper de nav (icon, ICON_PATHS, navBtn) vêm de common.js
  function toneColor(tone){
    return tone === 'positive' ? 'var(--color-primary)' : tone === 'warning' ? 'var(--color-accent)' : 'var(--color-ink)';
  }

  function gestaoKpis(){
    return `
      <div class="content-wide">
        <div>
          <div style="font-size:22px; font-weight:800; color:#182A22;">Painel de indicadores</div>
          <div style="font-size:13.5px; color:#7C838B; font-weight:600;">Julho de 2026 · atualizado há 12 minutos</div>
        </div>
        ${KPI_SECTIONS.map(section => `
          <div class="kpi-section">
            <div class="kpi-section-title">${section.title}</div>
            <div class="kpi-grid kpi-grid-${section.cols}">
              ${section.items.map(k => `
                <div class="card card--hoverable">
                  <div style="display:flex; align-items:center; gap:8px; font-size:11.5px; font-weight:700; color:#7C838B; text-transform:uppercase; letter-spacing:.02em;">
                    ${icon(k.icon, toneColor(k.tone))}<span>${k.label}</span>
                  </div>
                  <div style="font-size:28px; font-weight:900; color:#182A22; margin-top:8px; letter-spacing:-.01em;">${k.value}</div>
                  <div style="font-size:12px; font-weight:700; color:${k.deltaColor}; margin-top:4px;">${k.delta}</div>
                </div>`).join('')}
            </div>
          </div>`).join('')}
      </div>`;
  }

  function prioridadeRank(p){ return { Alta:3, 'Média':2, Baixa:1 }[p] || 0; }
  function parseKm(d){ return parseFloat(String(d).replace(' km', '').replace(',', '.')); }

  // cada critério vira um número onde "maior é melhor", para comparar as candidatas de forma uniforme
  const CRITERIA_DEFS = [
    { label:'Prioridade territorial', display:u => u.prioridade, value:u => prioridadeRank(u.prioridade) },
    { label:'Distância', display:u => u.distancia, value:u => -parseKm(u.distancia) },
    { label:'Capacidade de recebimento', display:u => u.capacidade, value:u => u.capacidade === 'OK' ? 1 : 0 },
    { label:'Histórico de atendimento', display:u => u.historico, value:u => u.historico === 'recorrente' ? 1 : 0 },
    { label:'Equidade de distribuição', display:u => u.frequencia.texto, value:u => u.frequencia.dias },
  ];

  // vencedora exclusiva de um critério entre as candidatas: só marca ✓ quando exatamente uma se destaca
  function criteriaWinners(cands){
    return CRITERIA_DEFS.map(def => {
      const vals = cands.map(def.value);
      const best = Math.max(...vals);
      const winners = vals.filter(v => v === best).length;
      return winners === 1 ? best : null;
    });
  }

  function criterioIcon(favorece){
    return favorece
      ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex:0 0 auto;"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`
      : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#BFC5CA" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex:0 0 auto;"><circle cx="12" cy="12" r="10"/></svg>`;
  }

  function freqColor(isBest){ return isBest ? 'var(--color-primary)' : '#9AA0A6'; }

  // candidata efetivamente escolhida para a oferta: a recomendação automática
  // (candidatas[0]), a menos que o gestor tenha reatribuído manualmente
  function unidadeEscolhida(c, idxStr){
    const nome = state.escolhas[idxStr];
    return (nome && c.candidatas.find(u => u.unidade === nome)) || c.candidatas[0];
  }

  function ofertaComparePanel(c, idxStr, isConfirmed){
    const cands = c.candidatas;
    if (cands.length < 2) {
      return `
        <div class="compare-panel">
          <div class="compare-empty">
            <strong>${cands[0].unidade}</strong> — sem outras unidades concorrentes no território para esta oferta.
          </div>
        </div>`;
    }
    const escolhidaNome = unidadeEscolhida(c, idxStr).unidade;
    const winners = criteriaWinners(cands);
    return `
      <div class="compare-panel">
        <div class="compare-grid compare-grid-${cands.length}">
          ${cands.map(u => {
            const isOriginalRec = u === cands[0];
            const isChosen = u.unidade === escolhidaNome;
            const favFrequencia = winners[4] !== null && CRITERIA_DEFS[4].value(u) === winners[4];
            const colClass = isChosen ? (isOriginalRec ? ' is-recommended' : ' is-chosen') : '';
            return `
            <div class="compare-col${colClass}">
              ${isOriginalRec ? `<div class="compare-badge">Recomendada</div>` : ''}
              ${isChosen && !isOriginalRec ? `<div class="compare-badge compare-badge--selected">Selecionada</div>` : ''}
              <div class="compare-col-title">${u.unidade}</div>
              <div class="compare-col-sub">${u.distancia}</div>
              ${isConfirmed ? (isChosen
                ? `<div class="compare-status compare-status--confirmed">${icon('check-circle', '#1E6B4E', 12)}<span>Confirmada</span></div>`
                : `<div class="compare-status compare-status--available"><span>Disponível</span></div>`) : ''}
              <div class="compare-col-freq" style="color:${freqColor(favFrequencia)};">${u.frequencia.texto}</div>
              <div class="compare-criteria">
                ${CRITERIA_DEFS.map((def, i) => {
                  const fav = winners[i] !== null && def.value(u) === winners[i];
                  return `
                  <div class="compare-criterion">
                    <span>${def.label}</span>
                    <span class="compare-crit-val">${criterioIcon(fav)}${def.display(u)}</span>
                  </div>`;
                }).join('')}
              </div>
              ${!isConfirmed && !isChosen ? `<button type="button" class="compare-select-btn" data-act="selecionarUnidade" data-arg="${idxStr}|${u.unidade}">Selecionar esta unidade</button>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>`;
  }

  function ofertaVerifyingPanel(completedSteps){
    return `
      <div class="verify-panel">
        ${VERIFICATION_STEPS.map((label, i) => {
          const done = i < completedSteps;
          const active = i === completedSteps;
          const icon = done
            ? `<svg class="verify-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`
            : active
              ? `<span class="verify-spinner"></span>`
              : `<span class="verify-dot"></span>`;
          return `
          <div class="verify-step${done ? ' is-done' : ''}${active ? ' is-active' : ''}">
            <span class="verify-step-icon">${icon}</span>
            <span class="verify-step-label">${label}</span>
          </div>`;
        }).join('')}
      </div>`;
  }

  const TRANSPORTE_OPCOES = [
    { key:'estado', label:'Transporte pelo Estado', desc:'Operador logístico da Prefeitura realiza a coleta', iconName:'truck', tempoEstimadoMin:45, tempoEstimadoLabel:'45 min' },
    { key:'voluntario', label:'Transporte por voluntário', desc:'Um voluntário cadastrado realiza a coleta', iconName:'heart-handshake', tempoEstimadoMin:90, tempoEstimadoLabel:'1h30' },
  ];

  function modalConfirmarDestinacao(){
    if (state.modalOfertaIdx === null) return '';
    const c = todasCompatibilizacoes()[Number(state.modalOfertaIdx)];
    const escolhida = unidadeEscolhida(c, state.modalOfertaIdx);
    const opcaoSelecionada = TRANSPORTE_OPCOES.find(o => o.key === state.modalTransporte);
    return `
      <div class="modal-overlay" data-act="fecharModal">
        <div class="modal-card" data-act="noop">
          <div class="modal-header">
            <div>
              <div class="modal-title">Confirmar destinação</div>
              <div class="modal-subtitle">${c.oferta} → ${escolhida.unidade}</div>
            </div>
            <button class="modal-close" data-act="fecharModal" aria-label="Fechar">×</button>
          </div>
          <div class="modal-question">Como será feito o transporte desta retirada?</div>
          <div class="transport-options">
            ${TRANSPORTE_OPCOES.map(o => {
              const sel = state.modalTransporte === o.key;
              return `
              <button class="transport-card${sel ? ' is-selected' : ''}" data-act="selecionarTransporte" data-arg="${o.key}">
                <span class="transport-radio">${criterioIcon(sel)}</span>
                ${icon(o.iconName, sel ? 'var(--color-primary)' : '#7C838B', 22)}
                <div class="transport-card-label">${o.label}</div>
                <div class="transport-card-desc">${o.desc}</div>
                <div class="transport-card-tempo">${icon('clock', '#7C838B', 13)}<span>Tempo estimado: ${o.tempoEstimadoLabel}</span></div>
              </button>`;
            }).join('')}
          </div>
          ${opcaoSelecionada ? `<div class="modal-previsao">Previsão de retirada: hoje, às ${previsaoRetirada(opcaoSelecionada.tempoEstimadoMin)}</div>` : ''}
          <div class="modal-actions">
            <button class="btn btn-secondary" data-act="fecharModal">Cancelar</button>
            <button class="btn btn-primary" ${!state.modalTransporte ? 'disabled' : ''} data-act="confirmarTransporte">Confirmar</button>
          </div>
        </div>
      </div>`;
  }

  function gestaoMapa(){
    return `
      <div class="content-wide">
        <div>
          <div style="font-size:22px; font-weight:800; color:#182A22;">Compatibilização de ofertas</div>
          <div style="font-size:13.5px; color:#7C838B; font-weight:600;">Sugestões automáticas aguardando validação do gestor</div>
        </div>
        <div class="list-stack">
          ${todasCompatibilizacoes().map((c, idx) => {
            const idxStr = String(idx);
            const isBuscando = Object.prototype.hasOwnProperty.call(state.buscando, idxStr);
            const isBuscada = state.buscadas.has(idxStr);
            const isComparando = state.comparacaoAberta.includes(idxStr);
            const transporteConfirmado = state.confirmadas[idxStr];
            const escolhida = unidadeEscolhida(c, idxStr);
            const foiReatribuida = escolhida !== c.candidatas[0];
            const temConcorrentes = c.candidatas.length > 1;
            const winners = temConcorrentes ? criteriaWinners(c.candidatas) : null;
            const freqFavorece = temConcorrentes && winners[4] !== null && escolhida.frequencia.dias === winners[4];
            const painelAberto = isBuscando || (isBuscada && isComparando);
            return `
            <div class="oferta-block">
              <div class="row-card${painelAberto ? ' is-expanded' : ''}">
                <div style="flex:1.3;">
                  <div style="font-size:13.5px; font-weight:800;">${c.oferta}</div>
                  <div style="font-size:12px; color:#7C838B; font-weight:600; margin-top:2px;">${c.doador} · ${c.quantidade}</div>
                </div>
                ${isBuscada ? `
                  <div style="font-size:16px; color:#BFC5CA;">→</div>
                  <div style="flex:1.3;">
                    <div style="font-size:13.5px; font-weight:800; color:#1E6B4E;">${escolhida.unidade}</div>
                    <div style="font-size:12px; color:#7C838B; font-weight:600; margin-top:2px;">${escolhida.distancia} · prioridade ${escolhida.prioridade}</div>
                    <div style="font-size:11.5px; font-weight:700; margin-top:2px; color:${freqColor(freqFavorece)};">${escolhida.frequencia.texto}</div>
                  </div>
                  <div style="max-width:230px;">
                    ${foiReatribuida
                      ? `<div style="display:flex; align-items:center; gap:6px; font-size:11.5px; color:#B9660F; font-weight:700;">${icon('git-merge', '#B9660F', 14)}<span>Reatribuída manualmente pelo gestor</span></div>`
                      : `<div style="font-size:11.5px; color:#7C838B; font-weight:600; line-height:1.4;">${c.motivo}</div>`}
                  </div>
                ` : ''}
                <div class="row-trailing">
                  ${!isBuscada && !isBuscando ? `
                    <button class="btn btn-primary" data-act="buscarMelhorEncaixe" data-arg="${idxStr}">Buscar melhor encaixe</button>
                  ` : ''}
                  ${isBuscando ? `
                    <span class="row-buscando"><span class="verify-spinner"></span> Buscando melhor encaixe...</span>
                  ` : ''}
                  ${isBuscada && transporteConfirmado ? `
                    <div class="row-confirmed">
                      <span class="status-pill status-pill--transporting">${icon('truck', '#fff', 14)}<span>Em transporte</span></span>
                      <span class="transport-tag">Transporte: ${TRANSPORTE_LABEL[transporteConfirmado.tipo]} · previsão ${transporteConfirmado.horario}</span>
                    </div>
                  ` : isBuscada ? `
                    <div class="row-actions">
                      <button class="btn btn-primary" data-act="abrirModalConfirmar" data-arg="${idxStr}">Confirmar</button>
                      ${temConcorrentes ? `<button class="btn btn-secondary" data-act="reatribuir" data-arg="${idxStr}">Reatribuir</button>` : ''}
                    </div>
                  ` : ''}
                  ${isBuscada ? `
                    <button class="compare-link" data-act="toggleComparacao" data-arg="${idxStr}" aria-expanded="${isComparando}">
                      <span>Ver comparação com outras unidades</span>
                      <svg class="chevron-icon${isComparando ? ' is-open' : ''}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS['chevron-down']}</svg>
                    </button>
                  ` : ''}
                </div>
              </div>
              ${isBuscando ? ofertaVerifyingPanel(state.buscando[idxStr]) : ''}
              ${isBuscada && isComparando ? ofertaComparePanel(c, idxStr, !!transporteConfirmado) : ''}
            </div>`;
          }).join('')}
        </div>
      </div>`;
  }

  function avatarColorFor(tipo){
    return tipo === 'Estabelecimento doador' ? 'var(--color-primary)' : 'var(--color-institutional)';
  }

  function gestaoValidacao(){
    const pendentes = cadastrosPendentes();
    return `
      <div class="content-wide">
        <div>
          <div style="font-size:22px; font-weight:800; color:#182A22;">Validação de cadastros</div>
          <div style="font-size:13.5px; color:#7C838B; font-weight:600;">Novos doadores e unidades receptoras aguardando aprovação</div>
        </div>
        ${pendentes.length === 0
          ? `<div class="card empty-state">
              ${icon('badge-check', '#BFC5CA', 34)}
              <div class="empty-state-text">Nenhum cadastro pendente no momento</div>
            </div>`
          : `<div class="list-stack">
              ${pendentes.map(c => `
                <div class="row-card">
                  <div style="width:42px; height:42px; border-radius:10px; background:${avatarColorFor(c.tipo)}; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; flex:0 0 auto;">${c.iniciais}</div>
                  <div style="flex:1;">
                    <div style="font-size:14px; font-weight:800;">${c.nome}</div>
                    <div style="font-size:12px; color:#7C838B; font-weight:600; margin-top:2px;">${c.tipo} · ${c.bairro} · docs ${c.docStatus}</div>
                  </div>
                  <div style="display:flex; gap:8px;">
                    ${state.loadingCadastro === c.nome
                      ? `<button class="btn btn-secondary" disabled style="display:flex; align-items:center; gap:7px;"><span class="verify-spinner"></span>Processando...</button>`
                      : `<button class="btn btn-primary" data-act="aprovarCadastro" data-arg="${c.nome}">Aprovar</button>
                         <button class="btn btn-outline-danger" data-act="rejeitarCadastro" data-arg="${c.nome}">Rejeitar</button>`}
                  </div>
                </div>`).join('')}
            </div>`}
      </div>`;
  }

  function gestaoRelatorios(){
    const filtros = state.filtrosRelatorio;
    const linhas = lotesFiltrados(filtros);
    return `
      <div class="content-wide">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <div style="font-size:22px; font-weight:800; color:#182A22;">Relatórios</div>
            <div style="font-size:13.5px; color:#7C838B; font-weight:600;">Filtre e exporte dados operacionais do programa</div>
          </div>
          <button class="btn btn-solid-green" data-act="exportarRelatorio" ${state.loadingExport ? 'disabled' : ''} style="padding:11px 18px; font-size:13.5px; display:flex; align-items:center; gap:8px;">
            ${state.loadingExport ? `<span class="verify-spinner"></span>Exportando...` : 'Exportar (.csv)'}
          </button>
        </div>
        <div class="card" style="display:flex; gap:10px; flex-wrap:wrap;">
          ${FILTRO_DEFS.map(f => `
            <select class="select-mini" data-custom-select data-filtro="${f.key}">
              ${f.options.map(o => `<option value="${o.value}" ${filtros[f.key]===o.value?'selected':''}>${o.label}</option>`).join('')}
            </select>`).join('')}
        </div>
        ${linhas.length === 0
          ? `<div class="card empty-state">
              ${icon('file-text', '#BFC5CA', 34)}
              <div class="empty-state-text">Nenhum lote encontrado para os filtros selecionados</div>
            </div>`
          : `<div class="table-scroll">
              <div class="table-wrap" style="min-width:720px;">
                <div class="table-head-row" style="grid-template-columns:0.7fr 1.4fr 1.2fr 1fr 1fr 1fr;">
                  <span>Lote</span><span>Estabelecimento</span><span>Unidade receptora</span><span>Tipo</span><span>Qtd.</span><span>Status</span>
                </div>
                ${linhas.map(l => `
                  <div class="table-body-row" style="grid-template-columns:0.7fr 1.4fr 1.2fr 1fr 1fr 1fr; font-size:13px;">
                    <span style="font-weight:700; color:#4A4F55;">${l.id}</span>
                    <span style="font-weight:700;">${l.doador}</span>
                    <span style="color:#4A4F55; font-weight:600;">${l.unidade}</span>
                    <span style="color:#7C838B; font-weight:600;">${l.tipo}</span>
                    <span style="color:#4A4F55; font-weight:600;">${l.quantidade}</span>
                    <span style="background:${l.statusBg}; color:${l.statusColor}; font-size:10.5px; font-weight:800; padding:3px 9px; border-radius:20px; width:fit-content;">${l.statusLabel}</span>
                  </div>`).join('')}
              </div>
            </div>`}
      </div>`;
  }

  function gestaoAuditoria(){
    const ids = Object.keys(AUDITORIA);
    const lote = AUDITORIA[state.loteAuditoriaId];
    return `
      <div class="split-row">
        <div class="split-aside" style="display:flex; flex-direction:column; gap:8px;">
          <div style="font-size:13px; font-weight:800; color:#182A22; margin-bottom:2px;">Selecione um lote</div>
          ${ids.map(id => `
            <button data-act="setLoteAuditoria" data-arg="${id}" class="pick-item${state.loteAuditoriaId===id?' is-active':''}" style="text-align:left; border-radius:12px; padding:12px 14px; border:none; cursor:pointer; ${state.loteAuditoriaId===id?'background:#2E5FA3; color:#fff;':'background:#fff; color:#4A4F55; border:1px solid #E4E6E8;'}">
              <span style="font-weight:800; font-size:13px; display:block;">${id}</span>
              <span style="font-size:11.5px; opacity:.85; font-weight:600;">${AUDITORIA[id].resumo}</span>
            </button>`).join('')}
        </div>
        <div class="split-main">
          <div style="font-size:22px; font-weight:800; color:#182A22; margin-bottom:4px;">Trilha de auditoria — ${state.loteAuditoriaId}</div>
          <div style="font-size:13.5px; color:#7C838B; font-weight:600; margin-bottom:20px;">${lote.resumo}</div>
          <div style="display:flex; flex-direction:column;">
            ${lote.eventos.map((e, idx) => {
              const isSystem = e.who === 'Sistema';
              const isLast = idx === lote.eventos.length - 1;
              return `
              <div style="display:flex; gap:14px;">
                <div style="display:flex; flex-direction:column; align-items:center;">
                  <div style="width:22px; height:22px; border-radius:50%; background:${isSystem?'var(--color-institutional)':'var(--color-primary)'}; color:#fff; font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center; flex:0 0 auto;">${isSystem?'⚙':'●'}</div>
                  ${!isLast ? `<div style="width:2px; flex:1; min-height:16px; background:#C7CDD0; margin-top:2px;"></div>` : ''}
                </div>
                <div style="padding-bottom:${isLast?'2px':'22px'};">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <div style="font-size:11.5px; font-weight:700; color:#9AA0A6;">${e.t}</div>
                    ${isSystem ? `<span style="font-size:9.5px; font-weight:800; letter-spacing:.03em; color:var(--color-institutional); background:#EAF1FF; padding:2px 7px; border-radius:20px; text-transform:uppercase;">automático</span>` : ''}
                  </div>
                  <div style="font-size:14px; font-weight:800; color:#182A22; margin-top:2px;">${e.action}</div>
                  <div style="font-size:12.5px; color:#4A4F55; font-weight:600; margin-top:2px;">${e.who}</div>
                  <div style="font-size:12.5px; color:#7C838B; font-weight:500; margin-top:2px;">${e.detail}</div>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>`;
  }

  function render(){
    const navDefs = [
      ['kpis','Painel de indicadores','layout-dashboard'],
      ['mapa','Compatibilização','git-merge'],
      ['validacao','Validação de cadastros','badge-check'],
      ['relatorios','Relatórios','file-text'],
      ['auditoria','Trilha de auditoria','history'],
    ];
    const content = state.screen === 'kpis' ? gestaoKpis()
      : state.screen === 'mapa' ? gestaoMapa()
      : state.screen === 'validacao' ? gestaoValidacao()
      : state.screen === 'relatorios' ? gestaoRelatorios()
      : gestaoAuditoria();
    document.getElementById('app').innerHTML = `
      <div class="app-shell">
        <button class="sidebar-toggle" data-act="toggleSidebar">
          <span class="sidebar-toggle-icon"><span></span><span></span><span></span></span>
          Menu
        </button>
        <div class="sidebar-backdrop${state.sidebarOpen?' is-open':''}" data-act="closeSidebar"></div>
        <div class="app-sidebar${state.sidebarOpen?' is-open':''}" style="background:#1B2733;">
          <div class="app-sidebar-label" style="color:#7FA8D6;">SDHDS · GESTÃO PÚBLICA</div>
          ${navDefs.map(([key,label,iconName]) => navBtn(state.screen===key, true, iconName, label, key)).join('')}
        </div>
        <div class="app-content">${content}</div>
      </div>
      ${modalConfirmarDestinacao()}`;
    document.body.style.overflow = state.sidebarOpen || state.modalOfertaIdx !== null ? 'hidden' : '';
    initImageSlots(render);
    renderAccountBar(session, cadastrosPendentes().length, 'validacao', 'Cadastros pendentes');
  }

  render();
})();
