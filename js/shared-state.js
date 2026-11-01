// Estado compartilhado entre telas (protótipo sem backend) — persistido em
// localStorage (não sessionStorage) para sobreviver entre páginas/abas
// durante a gravação de um vídeo demonstrando o fluxo completo.
const OFERTAS_STATUS_KEY = 'cpf_ofertas_status';

function getAllOfertasStatus(){
  try {
    return JSON.parse(localStorage.getItem(OFERTAS_STATUS_KEY)) || {};
  } catch (e) {
    return {};
  }
}

// nomeOferta é usado como chave por enquanto, na ausência de IDs formais de oferta
function getOfertaStatus(nomeOferta){
  const dados = getAllOfertasStatus()[nomeOferta];
  // retiradaRealizada tem default false para registros gravados antes deste campo existir
  return dados ? { retiradaRealizada:false, ...dados } : null;
}

function setOfertaStatus(nomeOferta, dados){
  const all = getAllOfertasStatus();
  all[nomeOferta] = dados;
  localStorage.setItem(OFERTAS_STATUS_KEY, JSON.stringify(all));
}

// ofertas criadas dinamicamente pelo Doador (formulário "Nova oferta"), para
// que apareçam também na Compatibilização (Gestão), Disponíveis (Operador) e
// Entregas a caminho (Receptora) — as listas hardcoded de cada página cobrem
// só os títulos usados no roteiro de demonstração original.
const OFERTAS_NOVAS_KEY = 'cpf_ofertas_novas';

function getOfertasNovas(){
  try {
    return JSON.parse(localStorage.getItem(OFERTAS_NOVAS_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function addOfertaNova(oferta){
  const atuais = getOfertasNovas();
  atuais.push(oferta);
  localStorage.setItem(OFERTAS_NOVAS_KEY, JSON.stringify(atuais));
}
