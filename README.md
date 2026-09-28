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
|   `-- js/
|       `-- app.js
|-- database/
|   `-- supabase-schema.sql
|-- docs/
|   |-- ARQUITETURA-INTEGRACAO.md
|   `-- DEPLOY.md
|-- extension/
|-- src/
|-- index.html
|-- _redirects
`-- publish-cloudflare.ps1
```

## Deploy

O projeto pode ser publicado como site estatico no Cloudflare Pages.

```powershell
npx.cmd wrangler pages deploy "." --project-name cod-perfumes-demo
```

## Observacao

Este projeto e um MVP funcional com foco em regras reais de uma operacao Cash on Delivery. Para uso comercial em escala, recomenda-se evoluir a arquitetura para backend dedicado, rotinas de backup automatizadas e testes automatizados.
