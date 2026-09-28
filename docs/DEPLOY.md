# Publicacao do COD Perfumes ERP

## 1. Supabase

1. Acesse o painel do Supabase.
2. Crie um projeto.
3. Abra SQL Editor.
4. Cole e execute o conteudo de `database/supabase-schema.sql`.
5. Em Project Settings > API, copie:
   - Project URL
   - anon public key
6. Edite `src/supabase-config.js`:

```js
export const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
export const SUPABASE_ANON_KEY = "SUA_CHAVE_ANON_PUBLICA";
```

## 2. GitHub

1. Crie um repositorio novo.
2. Envie todos os arquivos da pasta `erp-cod-perfumes`.
3. Confirme que `index.html`, `assets/`, `src/`, `database/`, `docs/` e `extension/` foram enviados.

## 3. Cloudflare Pages

### Opcao A: painel da Cloudflare

1. Acesse Cloudflare Pages.
2. Clique em Create a project.
3. Conecte ao repositorio do GitHub.
4. Configure:
   - Framework preset: None
   - Build command: vazio
   - Output directory: /
5. Publique.

### Opcao B: deploy direto com token

1. Crie um token na Cloudflare com permissao para Cloudflare Pages.
2. No PowerShell, dentro da pasta do ERP, rode:

```powershell
$env:CLOUDFLARE_API_TOKEN="SEU_TOKEN"
.\publish-cloudflare.ps1
```

O projeto sera publicado como `cod-perfumes-erp`.

## 4. Primeiro acesso

1. Abra o link `*.pages.dev`.
2. Va em Backup > Conta e nuvem.
3. Crie uma conta com e-mail e senha.
4. Clique em Sincronizar.

Se o Supabase exigir confirmacao por e-mail, confirme antes de entrar.
