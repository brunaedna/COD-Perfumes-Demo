# Extensao COD Perfumes - WhatsApp Web

Esta e a primeira versao da extensao para capturar mensagens de vendas no WhatsApp Web e enviar para a fila de revisao do ERP.

## Como instalar no Chrome ou Edge

1. Abra `chrome://extensions` ou `edge://extensions`.
2. Ative o `Modo do desenvolvedor`.
3. Clique em `Carregar sem compactacao`.
4. Selecione a pasta:

```text
C:\Users\bruna\Documents\Codex\2026-06-16\trabalho-com-cash-on-delivery-pagamento\outputs\erp-cod-perfumes\extension
```

5. Abra o ERP em:

```text
http://127.0.0.1:4173/index.html
```

6. Abra o WhatsApp Web no grupo onde as vendas sao lancadas.
7. Clique no icone da extensao.
8. Informe o nome exato do grupo no campo `Grupo autorizado`.
9. Salve e use `Capturar agora`.

## Formato recomendado da mensagem

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

## Como funciona

- A extensao le mensagens visiveis no WhatsApp Web.
- A captura so acontece quando o grupo aberto corresponde ao grupo autorizado.
- Ela filtra apenas mensagens contendo todas as palavras-chave configuradas.
- Mensagens entregues anteriormente sao ignoradas mesmo apos atualizar a pagina.
- O ERP recebe as mensagens na aba `Integracoes`.
- A venda so e criada depois da aprovacao manual.
- O popup mostra o horario da ultima entrega confirmada.

## Observacoes importantes

- O WhatsApp Web nao fornece uma API oficial para esse tipo de captura.
- Mudancas visuais no WhatsApp Web podem exigir ajuste no seletor da extensao.
- Para usar com `file://`, habilite `Permitir acesso a URLs de arquivo` nos detalhes da extensao.
- A forma mais estavel para testar e manter o ERP em `http://127.0.0.1:4173/index.html`.
- Depois de atualizar os arquivos da extensao, clique em `Recarregar` na pagina de extensoes.
