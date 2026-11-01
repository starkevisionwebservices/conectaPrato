(function(){
  const TIPOS_ALIMENTO = ['Hortifruti','Padaria','Preparados','Grãos','Laticínios','Outros'];
  const PERFIL_LABEL = { doador:'do seu estabelecimento doador', receptora:'da sua unidade receptora', operador:'do seu operador logístico' };

  const state = {
    step: 1,
    perfil: null,
    erro: false,
    dados: {
      doador:    { nome:'', responsavel:'', segmento:'', endereco:'', armazenamento:'', tipos:[] },
      receptora: { nome:'', endereco:'', horaInicio:'', horaFim:'', capacidade:'', tipos:[], territorio:'' },
      operador:  { nome:'', cobertura:'', veiculo:'' },
    },
    acesso: { email:'', senha:'' },
  };

  function esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // aponta um id de campo para a chave correspondente no state, para que o
  // valor digitado sobreviva a um re-render disparado por outra ação (ex.:
  // alternar uma tag) antes do usuário clicar em "Continuar".
  const FIELD_MAP = {
    doador: { 'cad-nome':'nome', 'cad-responsavel':'responsavel', 'cad-segmento':'segmento', 'cad-endereco':'endereco', 'cad-armazenamento':'armazenamento' },
    receptora: { 'cad-nome':'nome', 'cad-endereco':'endereco', 'cad-hora-inicio':'horaInicio', 'cad-hora-fim':'horaFim', 'cad-capacidade':'capacidade', 'cad-territorio':'territorio' },
    operador: { 'cad-nome':'nome', 'cad-cobertura':'cobertura', 'cad-veiculo':'veiculo' },
  };

  function fieldRef(id){
    if (id === 'cad-email') return [state.acesso, 'email'];
    if (id === 'cad-senha') return [state.acesso, 'senha'];
    const p = state.perfil;
    const key = p && FIELD_MAP[p][id];
    return key ? [state.dados[p], key] : null;
  }

  function syncField(target){
    const ref = fieldRef(target.id);
    if (ref) ref[0][ref[1]] = target.value;
  }

  document.addEventListener('input', (e) => { if (e.target.id) syncField(e.target); });
  document.addEventListener('change', (e) => { if (e.target.tagName === 'SELECT') syncField(e.target); });

  function etapa2Valida(){
    const p = state.perfil;
    const d = state.dados[p];
    if (p === 'doador') return !!(d.nome.trim() && d.responsavel.trim() && d.segmento && d.endereco.trim() && d.armazenamento && d.tipos.length);
    if (p === 'receptora') return !!(d.nome.trim() && d.endereco.trim() && d.horaInicio && d.horaFim && d.capacidade && d.tipos.length && d.territorio.trim());
    if (p === 'operador') return !!(d.nome.trim() && d.cobertura.trim() && d.veiculo);
    return false;
  }

  const ACTIONS = {
    selecionarPerfil: (key) => { state.perfil = key; state.erro = false; render(); },
    toggleTipo: (tipo) => {
      const arr = state.dados[state.perfil].tipos;
      const i = arr.indexOf(tipo);
      if (i === -1) arr.push(tipo); else arr.splice(i, 1);
      render();
    },
    avancar: () => {
      if (state.step === 1 && !state.perfil){ state.erro = true; render(); return; }
      if (state.step === 2 && !etapa2Valida()){ state.erro = true; render(); return; }
      state.erro = false;
      state.step += 1;
      render();
    },
    voltar: () => { state.erro = false; state.step -= 1; render(); },
    voltarLogin: () => { window.location.href = 'index.html'; },
    concluirCadastro: () => {
      if (!state.acesso.email.trim() || !state.acesso.senha.trim()){ state.erro = true; render(); return; }
      const nome = state.dados[state.perfil].nome;
      login(nome, state.perfil);
    },
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    ACTIONS[el.dataset.act]?.(el.dataset.arg);
  });

  // ── campos ──────────────────────────────────────────────────────────
  function textField(id, label, value, placeholder, type){
    return `
      <div class="field">
        <label for="${id}">${label}</label>
        <input id="${id}" type="${type || 'text'}" value="${esc(value)}" placeholder="${esc(placeholder || '')}">
      </div>`;
  }

  function selectField(id, label, options, value){
    return `
      <div class="field">
        <label for="${id}">${label}</label>
        <select id="${id}" data-custom-select>
          <option value="" disabled ${!value ? 'selected' : ''}>Selecione</option>
          ${options.map(o => `<option value="${esc(o)}" ${o === value ? 'selected' : ''}>${esc(o)}</option>`).join('')}
        </select>
      </div>`;
  }

  function tagField(label, selected){
    return `
      <div class="field">
        <label>${label}</label>
        <div class="tag-select">
          ${TIPOS_ALIMENTO.map(o => `
            <button type="button" class="tag-chip${selected.includes(o) ? ' is-selected' : ''}" data-act="toggleTipo" data-arg="${esc(o)}">${esc(o)}</button>`).join('')}
        </div>
      </div>`;
  }

  // ── etapas ──────────────────────────────────────────────────────────
  function renderProgress(){
    const labels = ['Perfil', 'Dados', 'Acesso'];
    return `
      <div class="cadastro-progress">
        ${labels.map((l, i) => {
          const n = i + 1;
          const cls = n < state.step ? 'is-done' : n === state.step ? 'is-active' : '';
          return `
            <div class="cadastro-progress-step ${cls}">
              <div class="cadastro-progress-bar"></div>
              <div class="cadastro-progress-label">${l}</div>
            </div>`;
        }).join('')}
      </div>`;
  }

  function renderEtapa1(){
    const perfis = [
      { key:'doador', iconName:'store', titulo:'Estabelecimento Doador', desc:'Restaurantes, mercados e feiras que doam alimentos excedentes.' },
      { key:'receptora', iconName:'warehouse', titulo:'Unidade Receptora', desc:'Cozinhas comunitárias e bancos de alimentos que recebem doações.' },
      { key:'operador', iconName:'truck', titulo:'Operador Logístico', desc:'Responsável pela coleta e transporte das doações até o destino.' },
    ];
    return `
      <div class="cadastro-step">
        <div class="cadastro-step-title">Qual é o seu perfil?</div>
        <div class="cadastro-step-sub">Escolha a opção que melhor descreve sua atuação no programa.</div>
        <div class="profile-cards">
          ${perfis.map(p => {
            const sel = state.perfil === p.key;
            return `
              <button type="button" class="profile-card${sel ? ' is-selected' : ''}" data-act="selecionarPerfil" data-arg="${p.key}">
                ${sel ? `<span class="profile-card-check">${icon('check-circle', '#1b4332', 18)}</span>` : ''}
                <span class="profile-card-icon">${icon(p.iconName, sel ? '#1b4332' : '#7C838B', 26)}</span>
                <span class="profile-card-title">${p.titulo}</span>
                <span class="profile-card-desc">${p.desc}</span>
              </button>`;
          }).join('')}
        </div>
        ${state.erro ? `<div class="cadastro-error">Selecione um perfil para continuar.</div>` : ''}
        <div class="cadastro-nav">
          <button type="button" class="btn-voltar" data-act="voltarLogin">Voltar</button>
          <button type="button" class="btn-entrar" data-act="avancar">Continuar</button>
        </div>
      </div>`;
  }

  function renderEtapa2(){
    const p = state.perfil;
    let campos = '';
    if (p === 'doador'){
      const d = state.dados.doador;
      campos = `
        ${textField('cad-nome', 'Nome do estabelecimento', d.nome, 'Ex.: Restaurante Sabor do Mar')}
        ${textField('cad-responsavel', 'Responsável', d.responsavel, 'Nome do responsável')}
        ${selectField('cad-segmento', 'Segmento', ['Restaurante','Supermercado','Feira','Hotel','Padaria','Outro'], d.segmento)}
        ${textField('cad-endereco', 'Endereço', d.endereco, 'Rua, número, bairro')}
        ${selectField('cad-armazenamento', 'Estrutura de armazenamento', ['Refrigerado','Ambiente','Ambos'], d.armazenamento)}
        ${tagField('Tipos de alimento que costuma disponibilizar', d.tipos)}`;
    } else if (p === 'receptora'){
      const d = state.dados.receptora;
      campos = `
        ${textField('cad-nome', 'Nome da unidade', d.nome, 'Ex.: Cozinha Comunitária Bom Jardim')}
        ${textField('cad-endereco', 'Endereço', d.endereco, 'Rua, número, bairro')}
        <div class="field-row">
          ${textField('cad-hora-inicio', 'Início do funcionamento', d.horaInicio, '', 'time')}
          ${textField('cad-hora-fim', 'Fim do funcionamento', d.horaFim, '', 'time')}
        </div>
        ${selectField('cad-capacidade', 'Capacidade de armazenamento', ['Baixa','Média','Alta'], d.capacidade)}
        ${tagField('Tipos de alimentos aceitos', d.tipos)}
        ${textField('cad-territorio', 'Território atendido', d.territorio, 'Ex.: Bairro Bom Jardim')}`;
    } else if (p === 'operador'){
      const d = state.dados.operador;
      campos = `
        ${textField('cad-nome', 'Nome / empresa', d.nome, 'Ex.: João Transportes')}
        ${textField('cad-cobertura', 'Área de cobertura', d.cobertura, 'Ex.: Regional V')}
        ${selectField('cad-veiculo', 'Tipo de veículo', ['Moto','Carro','Van','Caminhão'], d.veiculo)}`;
    }
    return `
      <div class="cadastro-step">
        <div class="cadastro-step-title">Dados do perfil</div>
        <div class="cadastro-step-sub">Preencha as informações ${PERFIL_LABEL[p]}.</div>
        <div class="cadastro-form">${campos}</div>
        ${state.erro ? `<div class="cadastro-error">Preencha todos os campos obrigatórios.</div>` : ''}
        <div class="cadastro-nav">
          <button type="button" class="btn-voltar" data-act="voltar">Voltar</button>
          <button type="button" class="btn-entrar" data-act="avancar">Continuar</button>
        </div>
      </div>`;
  }

  function resumoRows(p, d){
    let linhas;
    if (p === 'doador'){
      linhas = [
        ['Perfil', 'Estabelecimento Doador'],
        ['Estabelecimento', d.nome],
        ['Responsável', d.responsavel],
        ['Segmento', d.segmento],
        ['Endereço', d.endereco],
        ['Armazenamento', d.armazenamento],
        ['Tipos de alimento', d.tipos.join(', ') || '—'],
      ];
    } else if (p === 'receptora'){
      linhas = [
        ['Perfil', 'Unidade Receptora'],
        ['Unidade', d.nome],
        ['Endereço', d.endereco],
        ['Funcionamento', `${d.horaInicio} – ${d.horaFim}`],
        ['Capacidade', d.capacidade],
        ['Tipos aceitos', d.tipos.join(', ') || '—'],
        ['Território', d.territorio],
      ];
    } else {
      linhas = [
        ['Perfil', 'Operador Logístico'],
        ['Nome/Empresa', d.nome],
        ['Cobertura', d.cobertura],
        ['Veículo', d.veiculo],
      ];
    }
    return `<div class="cadastro-resumo-grid">${linhas.map(([k, v]) => `
      <div class="cadastro-resumo-row"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}</div>`;
  }

  function renderEtapa3(){
    const p = state.perfil;
    const d = state.dados[p];
    return `
      <div class="cadastro-step">
        <div class="cadastro-step-title">Acesso à plataforma</div>
        <div class="cadastro-step-sub">Defina como você vai entrar no sistema.</div>
        <div class="cadastro-form">
          ${textField('cad-email', 'E-mail', state.acesso.email, 'seu@email.com', 'email')}
          ${textField('cad-senha', 'Senha', state.acesso.senha, '••••••••', 'password')}
        </div>
        <div class="cadastro-resumo">
          <div class="cadastro-resumo-title">Resumo do cadastro</div>
          ${resumoRows(p, d)}
        </div>
        ${state.erro ? `<div class="cadastro-error">Preencha e-mail e senha para concluir.</div>` : ''}
        <div class="cadastro-nav">
          <button type="button" class="btn-voltar" data-act="voltar">Voltar</button>
          <button type="button" class="btn-entrar" data-act="concluirCadastro">Concluir cadastro</button>
        </div>
      </div>`;
  }

  function render(){
    const conteudo = state.step === 1 ? renderEtapa1() : state.step === 2 ? renderEtapa2() : renderEtapa3();
    document.getElementById('app').innerHTML = renderProgress() + conteudo;
  }

  render();
})();
