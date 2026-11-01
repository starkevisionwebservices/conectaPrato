const STATUS_META = {
  aberta:     { bg:'#EAF1FF', color:'#2E5FA3', label:'Aberta' },
  pendente:   { bg:'#FDECD8', color:'#B9660F', label:'Pendente' },
  reservada:  { bg:'#F2994A', color:'#FFFFFF', label:'Reservada' },
  coletada:   { bg:'#DCEEE4', color:'#1E6B4E', label:'Coletada' },
  entregue:   { bg:'#1E6B4E', color:'#FFFFFF', label:'Entregue' },
  recusada:   { bg:'#FBE1E1', color:'#B23434', label:'Recusada' },
  expirada:   { bg:'#EAECED', color:'#7C838B', label:'Expirada' },
};

function meta(status){
  const m = STATUS_META[status] || STATUS_META.aberta;
  return { status, statusBg:m.bg, statusColor:m.color, statusLabel:m.label };
}

function badge(o){
  return `<span style="background:${o.statusBg}; color:${o.statusColor}; font-size:10.5px; font-weight:800; padding:3px 8px; border-radius:20px; white-space:nowrap;">${o.statusLabel}</span>`;
}

// rótulos de tipo de transporte (compatibilização ↔ unidade receptora)
const TRANSPORTE_LABEL = { estado:'Estado', voluntario:'Voluntário' };

function navBtnStyle(active, dark){
  const base = 'text-align:left; border:none; border-radius:10px; padding:11px 12px; font-size:13.5px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:10px;';
  if (active) return base + (dark ? 'background:#2E5FA3; color:#fff;' : 'background:#F2994A; color:#fff;');
  return base + 'background:transparent; color:' + (dark ? '#B7C4D1' : '#BFE0CE') + ';';
}

function navBtnColor(active, dark){
  return active ? '#fff' : (dark ? '#B7C4D1' : '#BFE0CE');
}

// button de item de navegação da sidebar, com ícone + rótulo
function navBtn(active, dark, iconName, label, screenKey){
  return `<button data-act="setScreen" data-arg="${screenKey}" style="${navBtnStyle(active, dark)}">${icon(iconName, navBtnColor(active, dark), 19)}<span>${label}</span></button>`;
}

// ícones estilo Lucide (SVG inline, traço uniforme, sem dependência externa)
const ICON_PATHS = {
  store: `<path d="M3 9a2 2 0 0 0 2 2c1.1 0 2-.9 2-2 0 1.1.9 2 2 2s2-.9 2-2c0 1.1.9 2 2 2s2-.9 2-2c0 1.1.9 2 2 2a2 2 0 0 0 2-2M3 9l1.5-5h15L21 9M3 9v10a1 1 0 0 0 1 1h4v-6h8v6h4a1 1 0 0 0 1-1V9"/>`,
  'building-2': `<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>`,
  package: `<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/>`,
  scale: `<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>`,
  truck: `<path d="M14 18V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h1"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>`,
  'check-circle': `<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>`,
  'triangle-alert': `<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>`,
  clock: `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
  utensils: `<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>`,
  'piggy-bank': `<path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2Z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h0"/>`,
  'heart-handshake': `<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66"/><path d="m18 15-2-2"/><path d="m15 18-2-2"/>`,
  'circle-x': `<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>`,
  'chevron-down': `<path d="m6 9 6 6 6-6"/>`,
  'layout-dashboard': `<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>`,
  'git-merge': `<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>`,
  'badge-check': `<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>`,
  'file-text': `<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>`,
  history: `<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>`,
  inbox: `<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>`,
  'package-check': `<path d="m16 16 2 2 4-4"/><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l1.65-.94"/><path d="m7.5 4.27 9 5.15"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" x2="12" y1="22" y2="12"/>`,
  'clipboard-list': `<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>`,
  bell: `<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>`,
  'plus-circle': `<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>`,
  list: `<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>`,
  warehouse: `<path d="M3 21V10l9-6 9 6v11"/><path d="M3 21h18"/><rect width="8" height="8" x="8" y="13" rx="1"/>`,
};
function icon(name, color, size){
  const s = size || 17;
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="flex:0 0 auto;">${ICON_PATHS[name]||''}</svg>`;
}

// ── placeholder de imagem (clique ou arraste) ──────────────────
function imageSlot(id, placeholder){
  const saved = localStorage.getItem('img-slot:' + id);
  return `
    <div class="img-slot${saved ? ' has-image' : ''}" data-slot-id="${id}">
      ${saved
        ? `<img src="${saved}" alt=""><button type="button" class="img-slot-remove" data-slot-remove>×</button>`
        : `<span class="img-slot-icon">🖼️</span><span class="img-slot-label">${placeholder}</span>`}
      <input type="file" accept="image/*" style="display:none">
    </div>`;
}

function handleImageFile(id, file, onDone){
  const reader = new FileReader();
  reader.onload = () => {
    localStorage.setItem('img-slot:' + id, reader.result);
    onDone();
  };
  reader.readAsDataURL(file);
}

function initImageSlots(onChange){
  document.querySelectorAll('.img-slot').forEach(slot => {
    const id = slot.dataset.slotId;
    const input = slot.querySelector('input[type=file]');
    const removeBtn = slot.querySelector('[data-slot-remove]');

    slot.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      if (input.files[0]) handleImageFile(id, input.files[0], onChange);
    });
    slot.addEventListener('dragover', (e) => { e.preventDefault(); slot.classList.add('dragover'); });
    slot.addEventListener('dragleave', () => slot.classList.remove('dragover'));
    slot.addEventListener('drop', (e) => {
      e.preventDefault();
      slot.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) handleImageFile(id, file, onChange);
    });
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        localStorage.removeItem('img-slot:' + id);
        onChange();
      });
    }
  });
}
