# Arquitetura de integracao - WhatsApp Web para ERP COD

## Objetivo

Preparar o ERP para receber mensagens capturadas futuramente por uma extensao do navegador no WhatsApp Web, sem criar vendas definitivas automaticamente.

## Fluxo operacional

1. A venda e lancada no grupo autorizado do WhatsApp.
2. A extensao identifica mensagens novas no grupo monitorado.
3. A extensao envia as mensagens para o ERP.
4. O ERP interpreta cliente, produto, quantidade, pagamento, vendedor, entregador e telefone.
5. O ERP cria um rascunho na tela `Integracoes`.
6. O usuario revisa e aprova.
7. Somente depois da aprovacao o ERP:
   - cria a venda;
   - baixa o estoque;
   - gera comissao do vendedor;
   - gera comissao do entregador;
   - atualiza a conta corrente do colaborador.

## Arquitetura implementada nesta etapa

O ERP agora usa uma estrutura mais modular:

- `src/storage.js`: persistencia local e normalizacao do estado.
- `src/message-parser.js`: leitura e interpretacao das mensagens de venda.
- `src/extension-bridge.js`: contrato de entrada para mensagens externas.
- `src/app.js`: orquestracao da interface, aprovacoes, vendas, estoque e financeiro.
- `src/inventory-engine.js`: regras puras de saldo, separacao e disponibilidade de estoque.
- `assets/css/styles.css`: camada visual da aplicacao.

A extensao foi iniciada na pasta `extension/` com Manifest V3:

- `manifest.json`: permissoes e declaracao dos scripts.
- `content-whatsapp.js`: captura mensagens visiveis no WhatsApp Web.
- `background.js`: recebe mensagens capturadas e envia ao ERP.
- `content-erp-bridge.js`: entrega mensagens ao ERP via `window.postMessage`.
- `popup.html`, `popup.css`, `popup.js`: configuracao e captura manual.

## Contrato atual da extensao

Enquanto o ERP estiver aberto, a ponte da extensao envia mensagens com:

```js
window.postMessage({
  source: "cod-wa-extension",
  type: "SALE_MESSAGES",
  messages: [
    `Venda finalizada
Cliente: Maria
Produto: Malbec Gold 100ml
Qtd: 1
Pagamento: PIX
Vendedor: Camila Vendas
Entregador: Rafael Entregas
Telefone: 11999990000`
  ]
});
```

## Formato recomendado das mensagens no grupo

```text
Venda finalizada
Cliente: Nome do cliente
Produto: Nome do perfume
Qtd: 1
Pagamento: PIX
Vendedor: Nome do vendedor
Entregador: Nome do entregador
Telefone: 11999999999
```

## Decisoes de seguranca

- A extensao deve monitorar apenas grupos autorizados pelo usuario.
- O ERP nunca deve aprovar venda automaticamente.
- Toda importacao deve ficar auditavel na fila de revisao.
- Mensagens incompletas devem entrar com baixa confianca e exigir correcao manual.
- A baixa de estoque e as comissoes so acontecem depois da aprovacao.

## Proxima etapa

Evoluir a extensao Manifest V3 para Chrome/Edge com:

- tela de configuracao do grupo autorizado;
- leitura mais precisa das mensagens visiveis no WhatsApp Web;
- deduplicacao persistente de mensagens ja enviadas;
- envio para a fila de revisao do ERP com status detalhado;
- indicador visual de conectado/desconectado.
