(function(){
  const session = guard('doador');
  if (!session) return;

  const OFERTAS_INICIAIS = [
    { id:1, titulo:'Legumes e verduras excedentes', categoria:'Hortifruti', quantidade:'32 kg', data:'Hoje 16:30', prazo:'até 20:00', ...meta('reservada') },
    { id:2, titulo:'Pães e bolos do dia', categoria:'Padaria', quantidade:'18 kg', data:'Hoje 18:00', prazo:'até 21:00', ...meta('aberta') },
    { id:3, titulo:'Marmitas prontas não vendidas', categoria:'Preparados', quantidade:'45 un', data:'Ontem', prazo:'retirado', ...meta('coletada') },
    { id:4, titulo:'Frutas maduras selecionadas', categoria:'Hortifruti', quantidade:'12 kg', data:'18/07', prazo:'concluído', ...meta('entregue') },
    { id:5, titulo:'Pão de forma vencendo validade', categoria:'Padaria', quantidade:'6 kg', data:'14/07', prazo:'—', ...meta('recusada') },
    { id:6, titulo:'Sobras de buffet de evento', categoria:'Preparados', quantidade:'8 kg', data:'12/07', prazo:'—', ...meta('expirada') },
    { id:7, titulo:'Iogurtes próximos do vencimento', categoria:'Laticínios', quantidade:'40 un', data:'Hoje 09:00', prazo:'aguardando', ...meta('pendente') },
  ];

  const HISTORICO_DOADOR = [
    { titulo:'Frutas maduras selecionadas', data:'18/07/2026', unidade:'Cozinha Comunitária Bom Jardim' },
    { titulo:'Marmitas prontas não vendidas', data:'17/07/2026', unidade:'Banco Municipal de Alimentos' },
    { titulo:'Legumes diversos', data:'10/07/2026', unidade:'Restaurante Popular Centro' },
    { titulo:'Pães e bolos do dia', data:'05/07/2026', unidade:'Cozinha Comunitária Bom Jardim' },
  ];

  const state = {
    screen: 'dashboard',
    doadorFiltro: 'todas',
    ofertas: OFERTAS_INICIAIS.slice(),
  };

  // o form de nova oferta é renderizado duas vezes no DOM (versão mobile e
  // desktop, alternadas por CSS — ver render()); lemos os valores só da
  // cópia atualmente visível, escolhida pelo mesmo breakpoint usado no CSS.
  function containerOfertaAtivo(){
    const desktop = window.matchMedia('(min-width:900px)').matches;
    return document.querySelector(desktop ? '.doador-desktop' : '.doador-mobile');
  }

  function lerCamposOferta(){
    const root = containerOfertaAtivo();
    if (!root) return null;
    return {
      categoria: root.querySelector('[data-field="categoria"] select')?.value.trim() || '',
      descricao: root.querySelector('[data-field="descricao"] textarea')?.value.trim() || '',
      quantidade: root.querySelector('[data-field="quantidade"] input')?.value.trim() || '',
      unidade: root.querySelector('[data-field="unidade"] select')?.value.trim() || '',
      prazo: root.querySelector('[data-field="prazo"] input')?.value.trim() || '',
    };
  }

  const ACTIONS = {
    setScreen: (screen) => { state.screen = screen; render(); },
    setDoadorFiltro: (f) => { state.doadorFiltro = f; render(); },
    publicarOferta: () => {
      const dados = lerCamposOferta();
      if (!dados) return;
      const novo = {
        id: Date.now(),
        titulo: dados.descricao || `Nova oferta — ${dados.categoria || 'alimento'}`,
        categoria: dados.categoria || 'Não especificada',
        quantidade: `${dados.quantidade || '—'} ${dados.unidade}`.trim(),
        data: 'Agora',
        prazo: dados.prazo || 'a combinar',
        ...meta('aberta'),
      };
      state.ofertas = [novo, ...state.ofertas];
      // torna a oferta visível também para Gestão (Compatibilização), Operador
      // (Disponíveis) e Receptora (Entregas a caminho) — títulos fora do roteiro
      // fixo de demonstração só existem através deste registro compartilhado
      addOfertaNova({
        titulo: novo.titulo,
        doador: 'Restaurante Sabor do Mar',
        quantidade: novo.quantidade,
        janela: novo.prazo,
      });
      state.screen = 'lista';
      render();
    },
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    ACTIONS[el.dataset.act]?.(el.dataset.arg);
  });

  function doadorDashboard(){
    const resumo = state.ofertas.slice(0,3);
    return `
      <div style="display:flex; flex-direction:column; gap:14px;">
        <div>
          <div style="font-size:19px; font-weight:800; color:#0F4C3A;">Olá, Sabor do Mar 👋</div>
          <div style="font-size:12.5px; color:#7C838B; font-weight:600;">Meireles · Fortaleza-CE</div>
        </div>
        <div style="background:linear-gradient(135deg,#0F4C3A,#1E6B4E); border-radius:16px; padding:18px; color:#fff; display:flex; flex-direction:column; gap:10px;">
          <div style="font-size:12.5px; font-weight:700; opacity:.85; text-transform:uppercase; letter-spacing:.03em;">Seu impacto este mês</div>
          <div style="display:flex; gap:18px;">
            <div>
              <div style="font-size:26px; font-weight:900;">1.240<span style="font-size:14px; font-weight:700;">kg</span></div>
              <div style="font-size:11.5px; opacity:.8; font-weight:600;">alimento doado</div>
            </div>
            <div style="width:1px; background:rgba(255,255,255,.25);"></div>
            <div>
              <div style="font-size:26px; font-weight:900;">≈2.480</div>
              <div style="font-size:11.5px; opacity:.8; font-weight:600;">refeições geradas</div>
            </div>
          </div>
        </div>
        <div style="display:flex; gap:10px;">
          <div style="flex:1; background:#fff; border:1px solid #E4E6E8; border-radius:14px; padding:12px;">
            <div style="font-size:20px; font-weight:800; color:#23272B;">3</div>
            <div style="font-size:11.5px; color:#7C838B; font-weight:600;">ofertas em aberto</div>
          </div>
          <div style="flex:1; background:#fff; border:1px solid #E4E6E8; border-radius:14px; padding:12px;">
            <div style="font-size:20px; font-weight:800; color:#23272B;">98%</div>
            <div style="font-size:11.5px; color:#7C838B; font-weight:600;">taxa de aproveitamento</div>
          </div>
        </div>
        <button data-act="setScreen" data-arg="oferta" style="background:#F2994A; color:#fff; border:none; border-radius:14px; padding:15px; font-size:15px; font-weight:800; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 8px 18px -6px rgba(242,153,74,.55);">+ Registrar nova oferta</button>
        <div>
          <div style="font-size:13.5px; font-weight:800; color:#23272B; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
            <span>Ofertas em andamento</span>
            <a data-act="setScreen" data-arg="lista" style="font-size:12px; font-weight:700; cursor:pointer;">ver todas</a>
          </div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${resumo.map(o => `
              <div style="background:#fff; border:1px solid #E4E6E8; border-radius:12px; padding:11px 12px; display:flex; flex-direction:column; gap:5px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                  <span style="font-size:13.5px; font-weight:700;">${o.titulo}</span>
                  ${badge(o)}
                </div>
                <span style="font-size:12px; color:#7C838B; font-weight:600;">${o.categoria} · ${o.quantidade} · ${o.data}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>`;
  }

  function doadorOferta(){
    return `
      <div style="display:flex; flex-direction:column; gap:14px;">
        <div style="font-size:17px; font-weight:800; color:#0F4C3A;">Nova oferta de alimento</div>
        <div data-field="categoria" style="display:flex; flex-direction:column; gap:5px;">
          <label style="font-size:12.5px; font-weight:700; color:#4A4F55;">Categoria</label>
          <select data-custom-select>
            <option>Hortifruti (legumes, verduras, frutas)</option>
            <option>Padaria e confeitaria</option>
            <option>Refeições/marmitas preparadas</option>
            <option>Laticínios</option>
            <option>Proteína animal</option>
            <option>Grãos e cereais</option>
          </select>
        </div>
        <div data-field="descricao" style="display:flex; flex-direction:column; gap:5px;">
          <label style="font-size:12.5px; font-weight:700; color:#4A4F55;">Descrição</label>
          <textarea rows="3" placeholder="Ex.: legumes e verduras que sobraram da feira de hoje, ainda em boas condições" style="border:1px solid #DADFE1; border-radius:10px; padding:11px; font-size:14px; resize:none; font-family:inherit;"></textarea>
        </div>
        <div style="display:flex; gap:10px;">
          <div data-field="quantidade" style="flex:1.3; display:flex; flex-direction:column; gap:5px;">
            <label style="font-size:12.5px; font-weight:700; color:#4A4F55;">Quantidade / peso</label>
            <input type="text" placeholder="Ex.: 25" style="border:1px solid #DADFE1; border-radius:10px; padding:11px; font-size:14px;">
          </div>
          <div data-field="unidade" style="flex:1; display:flex; flex-direction:column; gap:5px;">
            <label style="font-size:12.5px; font-weight:700; color:#4A4F55;">Unidade</label>
            <select data-custom-select>
              <option>kg</option>
              <option>unidades</option>
              <option>litros</option>
            </select>
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:5px;">
          <label style="font-size:12.5px; font-weight:700; color:#4A4F55;">Forma de acondicionamento</label>
          <select data-custom-select>
            <option>Caixas plásticas</option>
            <option>Sacos/embalagens fechadas</option>
            <option>Bandejas</option>
            <option>Embalagem original</option>
          </select>
        </div>
        <div style="display:flex; gap:10px;">
          <div style="flex:1; display:flex; flex-direction:column; gap:5px;">
            <label style="font-size:12.5px; font-weight:700; color:#4A4F55;">Disponível a partir de</label>
            <input type="text" placeholder="Hoje, 17:30" style="border:1px solid #DADFE1; border-radius:10px; padding:11px; font-size:14px;">
          </div>
          <div data-field="prazo" style="flex:1; display:flex; flex-direction:column; gap:5px;">
            <label style="font-size:12.5px; font-weight:700; color:#4A4F55;">Prazo p/ retirada</label>
            <input type="text" placeholder="Hoje, 20:00" style="border:1px solid #DADFE1; border-radius:10px; padding:11px; font-size:14px;">
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:5px;">
          <label style="font-size:12.5px; font-weight:700; color:#4A4F55;">Foto (opcional)</label>
          <div style="width:100%; height:120px;">${imageSlot('foto-nova-oferta', 'Adicionar foto do alimento')}</div>
        </div>
        <button data-act="publicarOferta" style="background:#F2994A; color:#fff; border:none; border-radius:14px; padding:15px; font-size:15px; font-weight:800; box-shadow:0 8px 18px -6px rgba(242,153,74,.55); margin-top:4px;">Publicar oferta</button>
      </div>`;
  }

  function doadorLista(){
    const filtroKeys = ['todas','aberta','pendente','reservada','coletada','entregue','recusada','expirada'];
    const filtradas = state.doadorFiltro === 'todas' ? state.ofertas : state.ofertas.filter(o => o.status === state.doadorFiltro);
    return `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div style="font-size:17px; font-weight:800; color:#0F4C3A;">Minhas ofertas</div>
        <div style="display:flex; gap:6px; overflow-x:auto; padding-bottom:2px;">
          ${filtroKeys.map(f => `<button data-act="setDoadorFiltro" data-arg="${f}" style="border:none; border-radius:20px; padding:7px 13px; font-size:12px; font-weight:700; white-space:nowrap; cursor:pointer; ${state.doadorFiltro===f?'background:#0F4C3A; color:#fff;':'background:#fff; color:#7C838B; border:1px solid #E4E6E8;'}">${f==='todas'?'Todas':STATUS_META[f].label}</button>`).join('')}
        </div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${filtradas.map(o => `
            <div style="background:#fff; border:1px solid #E4E6E8; border-radius:12px; padding:12px; display:flex; flex-direction:column; gap:6px;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                <span style="font-size:13.5px; font-weight:700;">${o.titulo}</span>
                ${badge(o)}
              </div>
              <span style="font-size:12px; color:#7C838B; font-weight:600;">${o.categoria} · ${o.quantidade}</span>
              <span style="font-size:11.5px; color:#9AA0A6; font-weight:600;">${o.data} · ${o.prazo}</span>
            </div>`).join('')}
        </div>
      </div>`;
  }

  function doadorHistorico(){
    return `
      <div style="display:flex; flex-direction:column; gap:14px;">
        <div style="font-size:17px; font-weight:800; color:#0F4C3A;">Histórico e impacto</div>
        <div class="card" style="display:flex; flex-direction:column; gap:10px;">
          <div style="font-size:12.5px; font-weight:700; color:#4A4F55;">Relatório ESG</div>
          <div style="font-size:12px; color:#7C838B; font-weight:600; line-height:1.5;">Gere um comprovante consolidado das suas doações para uso em relatórios de responsabilidade socioambiental.</div>
          <button class="btn btn-solid-green">Gerar relatório de impacto (PDF)</button>
        </div>
        <div class="list-stack">
          ${HISTORICO_DOADOR.map(h => `
            <div class="card" style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
              <div style="display:flex; flex-direction:column; gap:3px;">
                <span style="font-size:13px; font-weight:700;">${h.titulo}</span>
                <span style="font-size:11.5px; color:#9AA0A6; font-weight:600;">${h.data} · ${h.unidade}</span>
              </div>
              <a style="font-size:12px; font-weight:700; cursor:pointer; white-space:nowrap;">comprovante</a>
            </div>`).join('')}
        </div>
      </div>`;
  }

  // ── telas equivalentes em layout desktop (sidebar + conteúdo largo) ──

  function doadorDashboardDesktop(){
    const KPIS = [
      { label:'Alimento doado no mês', value:'1.240 kg', icon:'scale' },
      { label:'Refeições geradas', value:'≈2.480', icon:'utensils' },
      { label:'Ofertas em aberto', value:'3', icon:'package' },
      { label:'Taxa de aproveitamento', value:'98%', icon:'check-circle' },
    ];
    const recentes = state.ofertas.slice(0,6);
    return `
      <div class="content-wide">
        <div>
          <div style="font-size:22px; font-weight:800; color:#0F4C3A;">Olá, Sabor do Mar 👋</div>
          <div style="font-size:13.5px; color:#7C838B; font-weight:600;">Meireles · Fortaleza-CE</div>
        </div>
        <div class="kpi-section">
          <div class="kpi-section-title">Seu impacto este mês</div>
          <div class="kpi-grid kpi-grid-4">
            ${KPIS.map(k => `
              <div class="card card--hoverable">
                <div style="display:flex; align-items:center; gap:8px; font-size:11.5px; font-weight:700; color:#7C838B; text-transform:uppercase; letter-spacing:.02em;">
                  ${icon(k.icon, '#0F4C3A')}<span>${k.label}</span>
                </div>
                <div style="font-size:28px; font-weight:900; color:#182A22; margin-top:8px; letter-spacing:-.01em;">${k.value}</div>
              </div>`).join('')}
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <div style="font-size:16px; font-weight:800; color:#23272B;">Ofertas em andamento</div>
            <div style="font-size:12.5px; color:#7C838B; font-weight:600;">Suas publicações mais recentes</div>
          </div>
          <button data-act="setScreen" data-arg="oferta" class="btn btn-primary" style="padding:12px 18px; font-size:13.5px; box-shadow:0 8px 18px -6px rgba(242,153,74,.55);">+ Registrar nova oferta</button>
        </div>
        <div class="table-scroll">
          <div class="table-wrap">
            <div class="table-head-row" style="grid-template-columns:1.6fr 1fr 1fr 1fr 1fr;">
              <span>Título</span><span>Categoria</span><span>Quantidade</span><span>Data</span><span>Status</span>
            </div>
            ${recentes.map(o => `
              <div class="table-body-row" style="grid-template-columns:1.6fr 1fr 1fr 1fr 1fr;">
                <span style="font-weight:700;">${o.titulo}</span>
                <span style="color:#4A4F55; font-weight:600;">${o.categoria}</span>
                <span style="color:#4A4F55; font-weight:600;">${o.quantidade}</span>
                <span style="color:#7C838B; font-weight:600;">${o.data}</span>
                <span>${badge(o)}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>`;
  }

  function doadorListaDesktop(){
    const filtroKeys = ['todas','aberta','pendente','reservada','coletada','entregue','recusada','expirada'];
    const filtradas = state.doadorFiltro === 'todas' ? state.ofertas : state.ofertas.filter(o => o.status === state.doadorFiltro);
    return `
      <div class="content-wide">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div style="font-size:22px; font-weight:800; color:#0F4C3A;">Minhas ofertas</div>
          <button data-act="setScreen" data-arg="oferta" class="btn btn-primary">+ Registrar nova oferta</button>
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          ${filtroKeys.map(f => `<button data-act="setDoadorFiltro" data-arg="${f}" class="btn ${state.doadorFiltro===f?'btn-solid-green':'btn-secondary'}" style="padding:8px 14px; font-size:12.5px;">${f==='todas'?'Todas':STATUS_META[f].label}</button>`).join('')}
        </div>
        <div class="table-scroll">
          <div class="table-wrap">
            <div class="table-head-row" style="grid-template-columns:1.6fr 1fr 1fr 1.2fr 1fr;">
              <span>Título</span><span>Categoria</span><span>Quantidade</span><span>Data / prazo</span><span>Status</span>
            </div>
            ${filtradas.length ? filtradas.map(o => `
              <div class="table-body-row" style="grid-template-columns:1.6fr 1fr 1fr 1.2fr 1fr;">
                <span style="font-weight:700;">${o.titulo}</span>
                <span style="color:#4A4F55; font-weight:600;">${o.categoria}</span>
                <span style="color:#4A4F55; font-weight:600;">${o.quantidade}</span>
                <span style="color:#7C838B; font-weight:600;">${o.data} · ${o.prazo}</span>
                <span>${badge(o)}</span>
              </div>`).join('') : `<div class="card empty-state">${icon('package', '#BFC5CA', 34)}<div class="empty-state-text">Nenhuma oferta neste status</div></div>`}
          </div>
        </div>
      </div>`;
  }

  function doadorHistoricoDesktop(){
    return `
      <div class="content-wide">
        <div style="font-size:22px; font-weight:800; color:#0F4C3A;">Histórico e impacto</div>
        <div class="card" style="display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap;">
          <div>
            <div style="font-size:13.5px; font-weight:800; color:#182A22;">Relatório ESG</div>
            <div style="font-size:12.5px; color:#7C838B; font-weight:600; margin-top:4px; max-width:480px; line-height:1.5;">Gere um comprovante consolidado das suas doações para uso em relatórios de responsabilidade socioambiental.</div>
          </div>
          <button class="btn btn-solid-green" style="padding:12px 20px;">Gerar relatório de impacto (PDF)</button>
        </div>
        <div class="table-scroll">
          <div class="table-wrap">
            <div class="table-head-row" style="grid-template-columns:1.6fr 1fr 1.4fr;">
              <span>Título</span><span>Data</span><span>Unidade receptora</span>
            </div>
            ${HISTORICO_DOADOR.map(h => `
              <div class="table-body-row" style="grid-template-columns:1.6fr 1fr 1.4fr;">
                <span style="font-weight:700;">${h.titulo}</span>
                <span style="color:#7C838B; font-weight:600;">${h.data}</span>
                <span style="color:#4A4F55; font-weight:600;">${h.unidade}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>`;
  }

  function render(){
    const navDefs = [
      ['dashboard','Início','layout-dashboard'],
      ['oferta','Nova oferta','plus-circle'],
      ['lista','Ofertas','list'],
      ['historico','Histórico','history'],
    ];
    const contentMobile = state.screen === 'dashboard' ? doadorDashboard()
      : state.screen === 'oferta' ? doadorOferta()
      : state.screen === 'lista' ? doadorLista()
      : doadorHistorico();
    const contentDesktop = state.screen === 'dashboard' ? doadorDashboardDesktop()
      : state.screen === 'oferta' ? `<div class="content-form">${doadorOferta()}</div>`
      : state.screen === 'lista' ? doadorListaDesktop()
      : doadorHistoricoDesktop();
    const tabs = [['dashboard','Início','⌂'], ['oferta','Nova oferta','+'], ['lista','Ofertas','≡'], ['historico','Histórico','◔']];
    document.getElementById('app').innerHTML = `
      <div class="app-shell doador-desktop">
        <div class="app-sidebar" style="background:#0F4C3A;">
          <div class="app-sidebar-label" style="color:#BFE0CE;">RESTAURANTE SABOR DO MAR</div>
          ${navDefs.map(([key,label,iconName]) => navBtn(state.screen===key, false, iconName, label, key)).join('')}
        </div>
        <div class="app-content">${contentDesktop}</div>
      </div>
      <div class="card-shell doador-mobile">
        <div class="card-shell-inner">
          <div class="app-card">
            <div class="app-card-body">${contentMobile}</div>
            <div class="app-card-tabbar">
              ${tabs.map(([key,label,tabIcon]) => `
                <button data-act="setScreen" data-arg="${key}" style="flex:1; display:flex; flex-direction:column; align-items:center; gap:2px; background:none; border:none; padding:8px 2px; cursor:pointer; ${state.screen===key?'color:#F2994A;':'color:#9AA0A6;'}">
                  <span style="font-size:16px;">${tabIcon}</span>
                  <span style="font-size:10px; font-weight:700;">${label}</span>
                </button>`).join('')}
            </div>
          </div>
        </div>
      </div>`;
    initImageSlots(render);
    const reservadas = state.ofertas.filter(o => o.status === 'reservada').length;
    renderAccountBar(session, reservadas, 'lista', 'Ofertas reservadas');
  }

  render();
})();
