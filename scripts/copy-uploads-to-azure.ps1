# Копирует локальную папку backend/uploads на Azure App Service через Kudu.
# Одноразовая заливка, если фото ещё не в Git / не попали в последний deploy.
#
# Требования: Azure CLI (az login), папка backend/uploads с файлами.
#
# Пример:
#   .\scripts\copy-uploads-to-azure.ps1 -AppName bookingmoterom -ResourceGroup rg

param(
  [string]$AppName = "bookingmoterom",
  [string]$ResourceGroup = "rg",
  [string]$UploadsDir = (Join-Path $PSScriptRoot "..\backend\uploads")
)

$resolved = Resolve-Path $UploadsDir -ErrorAction SilentlyContinue
if ($resolved) { $UploadsDir = $resolved.Path }
if (-not (Test-Path $UploadsDir)) {
  Write-Error "Папка не найдена: $UploadsDir. Сначала загрузите фото локально (админка) или восстановите бэкап."
  exit 1
}

$files = Get-ChildItem $UploadsDir -File
if ($files.Count -eq 0) {
  Write-Error "В $UploadsDir нет файлов."
  exit 1
}

Write-Host "Файлов: $($files.Count) → $AppName (Kudu wwwroot/uploads)"

$credsJson = az webapp deployment list-publishing-credentials `
  --name $AppName --resource-group $ResourceGroup -o json 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Error "az webapp ... failed. Выполните: az login"
  exit 1
}
$creds = $credsJson | ConvertFrom-Json
$user = $creds.publishingUserName
$pass = $creds.publishingPassword

$scmHost = "$AppName.scm.azurewebsites.net"
# У bookingmoterom полный хост может быть с суффиксом — берём из az:
$hostname = az webapp show --name $AppName --resource-group $ResourceGroup --query defaultHostName -o tsv
if ($hostname -match "^(.+)\.azurewebsites\.net$") {
  $scmHost = ($hostname -replace "\.azurewebsites\.net$", ".scm.azurewebsites.net")
}

$zipPath = Join-Path $env:TEMP "ferma-uploads-$(Get-Date -Format 'yyyyMMddHHmmss').zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Join-Path $UploadsDir "*") -DestinationPath $zipPath -Force

$uri = "https://$scmHost/api/zip/site/wwwroot/uploads/"
$pair = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${user}:${pass}"))
$headers = @{ Authorization = "Basic $pair" }

try {
  Invoke-RestMethod -Uri $uri -Method Post -InFile $zipPath -ContentType "application/zip" -Headers $headers
  Write-Host "OK. Проверка: https://$hostname/uploads/<имя-файла>.jpg"
} catch {
  Write-Error $_
  exit 1
} finally {
  Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
}
