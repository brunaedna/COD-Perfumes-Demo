# COD Perfumes ERP

ERP web para operacao Cash on Delivery de perfumes, com controle integrado de vendas, estoque, entregadores, colaboradores, comissoes, vales, pagamentos e relatorios.

## Projeto sob encomenda

Este sistema foi desenvolvido sob encomenda, a partir das necessidades reais apresentadas pelo cliente. A versao deste repositorio foi preparada exclusivamente para demonstracao em portfolio: utiliza um projeto Supabase independente e nao contem dados, credenciais ou informacoes operacionais do cliente.

## Visao Geral

O sistema foi criado para uma operacao real de COD, onde vendedores e entregadores participam do fluxo de venda e acerto financeiro. A aplicacao ajuda a evitar contas manuais, organiza o estoque em base e em maos dos entregadores, e registra o saldo de cada colaborador.

## Funcionalidades

- Cadastro e edicao de vendas.
- Baixa automatica de estoque.
- Controle de estoque base e estoque com entregadores.
- Entrada de estoque manual ou por lista de fornecedor.
- Conta corrente por colaborador.
- Controle de comissoes, vales, pagamentos e saldos.
- Registro de vendas canceladas com taxa de entrega.
- Operações transacionais para criar, editar e excluir vendas com rollback automático.
- Trilha de auditoria técnica para alterações no ciclo de vida das vendas.
- Controle de campanhas para calculo de lucro real.
- Relatorios e exportacoes em Excel e TXT.
- Estrutura preparada para integracao com extensao do WhatsApp Web.
- Sincronizacao de dados com Supabase.
- Publicacao em Cloudflare Pages.

## Tecnologias

- HTML
- CSS
- JavaScript
- Supabase
- Cloudflare Pages
- Extensao Chrome/WhatsApp Web

## Estrutura

```text
.
|-- assets/
|   |-- css/
|   |   `-- styles.css
|-- database/
|   `-- supabase-schema.sql
|-- docs/
|   |-- ARQUITETURA-INTEGRACAO.md
|   `-- DEPLOY.md
|-- extension/
|-- src/
|   |-- app.js
|   |-- core/
|   |   |-- commission-engine.js
|   |   |-- date-utils.js
|   |   |-- formatters.js
|   |   |-- sale-service.js
|   |   `-- sales-utils.js
|   |-- storage.js
|   |-- inventory-engine.js
|   |-- excel-export.js
|   |-- message-parser.js
|   |-- extension-bridge.js
|   `-- supabase-config.js
|-- index.html
|-- _redirects
`-- publish-cloudflare.ps1
```

## Organizacao do codigo

O arquivo `src/app.js` coordena a interface e os eventos do navegador. Regras que nao dependem da tela ficam em modulos pequenos e testaveis:

- `core/commission-engine.js`: calculo de comissoes, venda propria e taxa de entrega cancelada;
- `core/sale-service.js`: transacao de venda, estoque, conta corrente, rollback e auditoria;
- `core/sales-utils.js`: filtros, ordenacao, resumo por produto e pagamentos;
- `core/date-utils.js`: periodos e operacoes com datas;
- `core/formatters.js`: moeda, datas e protecao de texto exibido em HTML;
- `inventory-engine.js`: saldo e movimentacao de estoque;
- `storage.js`: persistencia local e sincronizacao com Supabase.

Essa separacao mantem as regras de negocio independentes do DOM, reduz duplicacao e permite validar os fluxos criticos sem abrir o navegador.

O servico de vendas recebe suas dependencias, como geracao de identificadores e relogio, por injecao. Isso permite testes deterministas e mantem a interface desacoplada das regras de estoque e financeiras. Em uma edicao invalida, o estado anterior e restaurado integralmente para evitar saldos parciais.

## Testes

```bash
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Os testes unitarios cobrem estoque, transacoes de venda, rollback, auditoria, pagamentos, comissoes, importacao de mensagens, persistencia e exportacao. O teste de interface cadastra um produto e registra uma venda completa no navegador.

## Link do projeto https://cod-perfumes-demo.brunaflow.workers.dev/
