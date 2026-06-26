# ============================================================
# switch-frontend.ps1
# Usage: .\switch-frontend.ps1 -To netlify
#        .\switch-frontend.ps1 -To cloudflare
# ============================================================
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("netlify","cloudflare")]
    [string]$To
)

# ── URLs des deux frontends ──────────────────────────────────
$NETLIFY_URL    = "https://habitkids.netlify.app"
$CLOUDFLARE_URL = "https://habitkids.pages.dev"

$targetUrl = if ($To -eq "netlify") { $NETLIFY_URL } else { $CLOUDFLARE_URL }

# ── Token Fly.io (sauvegardé localement dans .fly-token) ────
$tokenFile = "$PSScriptRoot\.fly-token"
if (Test-Path $tokenFile) {
    $flyToken = (Get-Content $tokenFile -Raw).Trim()
    Write-Host "Token Fly.io chargé depuis .fly-token"
} else {
    Write-Host "⚠️  Fichier .fly-token introuvable."
    Write-Host "Créez-le avec la commande :"
    Write-Host '   echo "FlyV1 fm2_..." | Out-File -FilePath .fly-token -Encoding utf8'
    exit 1
}

$env:FLY_API_TOKEN = $flyToken
$flyctl = "C:\Users\lenovo\.fly\bin\flyctl.exe"

Write-Host ""
Write-Host "🔄 Bascule vers : $To"
Write-Host "🌐 URL cible    : $targetUrl"
Write-Host ""

# Met à jour FRONTEND_URL sur Fly.io (liens email reset mot de passe)
& $flyctl secrets set FRONTEND_URL=$targetUrl --app habitkids-api 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Bascule terminée !"
    Write-Host "   Frontend actif : $targetUrl"
    Write-Host "   (Les emails de reset pointeront vers $targetUrl)"
} else {
    Write-Host "❌ Erreur lors de la mise à jour du secret Fly.io"
    Write-Host "   Vérifie que le token dans .fly-token est valide"
}
