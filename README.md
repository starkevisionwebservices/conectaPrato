# Conecta Prato Fortaleza

Protótipo navegável da plataforma do **Programa Fortaleza Sem Fome** que conecta estabelecimentos com alimentos excedentes (restaurantes, supermercados, padarias, feiras) a unidades receptoras (cozinhas comunitárias, restaurantes populares, bancos de alimentos). A plataforma cobre o ciclo completo e rastreável de uma doação: oferta → compatibilização → transporte → retirada → recebimento → auditoria.

> **Protótipo demonstrativo.** Site estático (HTML, CSS e JavaScript puros), sem back-end nem banco de dados. Os dados são ilustrativos e o que é feito durante o uso fica salvo apenas no navegador.

## Documentação

| Documento | Para quem |
|---|---|
| [docs/Apresentacao-Conecta-Prato-Fortaleza.pdf](docs/Apresentacao-Conecta-Prato-Fortaleza.pdf) | Instituição: apresentação da plataforma, passo a passo com telas, implantação e acesso ao ambiente de demonstração. |
| [docs/Manual-Conecta-Prato-Fortaleza.pdf](docs/Manual-Conecta-Prato-Fortaleza.pdf) | Conceito do projeto e passo a passo com telas, com as limitações do protótipo descritas. |
| [docs/Roteiro-Demonstracao-Conecta-Prato.pdf](docs/Roteiro-Demonstracao-Conecta-Prato.pdf) | Uso interno: roteiro para apresentar o protótipo e comportamentos que convém conhecer. |

## Acesso

Usuário `admin` e senha `admin`. O campo **Perfil** na tela de login define a área que abre:

| Perfil | Página | Telas |
|---|---|---|
| Estabelecimento Doador | `pages/doador.html` | Início, Nova oferta, Ofertas, Histórico |
| Gestão Pública (SDHDS) | `pages/gestao.html` | Painel de indicadores, Compatibilização, Validação de cadastros, Relatórios, Trilha de auditoria |
| Operador Logístico | `pages/operador.html` | Disponíveis, Minhas retiradas, Concluídas |
| Unidade Receptora | `pages/receptora.html` | Entregas a caminho, Confirmar recebimento, Demanda prevista, Histórico |

O link **Cadastre-se** (`cadastro.html`) mostra o cadastro em três etapas (perfil, dados, acesso). Ele valida os campos, mas não grava nada: ao concluir, entra direto no perfil escolhido.

## Rodar localmente

Sem dependências, basta servir a pasta:

```bash
python3 -m http.server 8080
# http://localhost:8080
```

Ou com a mesma imagem usada no servidor:

```bash
docker build -t conectaprato .
docker run --rm -p 8080:80 conectaprato
# http://localhost:8080
```

O `docker-compose.yml` não publica porta no host (`expose: 80`), porque foi feito para o proxy do EasyPanel. Para testar localmente, use o `docker run` acima.

## Publicação (EasyPanel)

O site roda em Nginx (`nginx:1.27-alpine`). O [Dockerfile](Dockerfile) copia só os arquivos do site, e o [nginx.conf](nginx.conf) serve os estáticos com gzip e cache de 7 dias para css, js e imagens.

1. No projeto do EasyPanel, crie um serviço do tipo **Compose** com origem **Git**:
   - Repository URL: `https://github.com/starkevisionwebservices/conectaprato.git`
   - Branch: `main` · Build Path: `/` · Docker Compose File: `docker-compose.yml`
2. Clique em **Deploy**.
3. Em **Domains**, adicione o domínio com **Protocol** `HTTP`, **Port** `80` e **Compose Service** `web`.
4. Faça um novo **Deploy** depois de salvar o domínio. Sem isso, o proxy responde "Service is not reachable".

Para atualizar, faça push na `main` e clique em **Deploy** de novo.

## Estrutura

```
index.html            login (admin/admin + escolha do perfil)
cadastro.html         cadastro em 3 etapas
pages/                uma página por perfil (doador, gestao, operador, receptora)
js/
  auth.js             sessão, proteção das páginas por perfil, barra da conta e sino
  common.js           status das ofertas, ícones e componentes de navegação
  shared-state.js     estado compartilhado entre perfis (localStorage)
  doador.js           telas do doador
  gestao.js           telas da gestão, incluindo a compatibilização
  operador.js         telas do operador
  receptora.js        telas da unidade receptora
  cadastro.js         fluxo de cadastro
  custom-select.js    select estilizado sobre o <select> nativo
  toast.js            avisos de sucesso/erro
css/                  estilos (style.css geral, login.css, cadastro.css)
imgs/                 logos e fotos
docs/                 manual e roteiro em PDF
```

## Como o protótipo funciona por dentro

- Cada página de perfil renderiza as telas por JavaScript (`innerHTML`), e os botões disparam ações pelo atributo `data-act`.
- A sessão (nome e perfil) fica no `sessionStorage` (`cpf_session`). Cada página chama `guard('<perfil>')` e volta ao login se o perfil não bater.
- Os perfis trocam informação pelo `localStorage`, então tudo funciona dentro do mesmo navegador. Com várias abas abertas, as telas de Gestão, Operador e Receptora se atualizam sozinhas pelo evento `storage`.

| Chave | Conteúdo |
|---|---|
| `cpf_ofertas_novas` | Ofertas publicadas pelo doador durante o uso |
| `cpf_ofertas_status` | Andamento de cada oferta: destino, transporte e previsão (Gestão), retirada assumida/realizada (Operador), entregue (Receptora) |
| `cpf_demanda_bom-jardim` | Demanda prevista da unidade receptora |
| `cpf_cadastros_validados` | Cadastros aprovados ou rejeitados pela gestão |

- As ofertas são identificadas pelo **título**, porque não há IDs. Os títulos das ofertas de exemplo precisam ser iguais em `gestao.js`, `operador.js` e `receptora.js`.
- Para recomeçar do zero, limpe os dados do site no navegador ou use uma janela anônima.

## Limitações conhecidas

- Login único de demonstração; o cadastro não cria usuários.
- Sem banco de dados: nada é compartilhado entre computadores ou navegadores.
- Indicadores, históricos, candidatas da compatibilização, distâncias e auditoria são dados fixos de exemplo.
- A tela **Confirmar recebimento** usa sempre o lote L-2044 (Legumes e verduras excedentes).
- Na **Compatibilização**, as decisões da tela se perdem ao recarregar a página, mas as confirmações já gravadas continuam valendo para os outros perfis.
- "Gerar relatório de impacto (PDF)" e "comprovante" (Doador) são ilustrativos. A exportação CSV da Gestão funciona.
