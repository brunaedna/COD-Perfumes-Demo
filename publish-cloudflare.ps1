if (-not $env:CLOUDFLARE_API_TOKEN) {
  Write-Host "Defina CLOUDFLARE_API_TOKEN antes de publicar."
  Write-Host 'Exemplo: $env:CLOUDFLARE_API_TOKEN="seu-token"'
  exit 1
}

npx.cmd wrangler pages deploy "." --project-name cod-perfumes-erp
