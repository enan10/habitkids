#!/bin/bash
set -e

# Check .env.android is configured
if grep -q "TON_IP_LOCAL" .env.android 2>/dev/null; then
  echo ""
  echo "❌ Configure d'abord .env.android avec ton IP locale !"
  echo ""
  echo "   1. Ouvre un terminal Windows et lance: ipconfig"
  echo "      Cherche 'Adresse IPv4' (ex: 192.168.1.25)"
  echo ""
  echo "   2. Modifie .env.android:"
  echo "      VITE_API_URL=http://192.168.1.25:3000/api"
  echo ""
  exit 1
fi

echo "🏗️  Build des assets web (mode Android)..."
npm run build:android

echo "📱 Sync vers le projet Android..."
npx cap sync android

echo ""
echo "🐳 Build de l'APK via Docker..."
echo "   ⏳ Première fois : ~10-15 min (télécharge JDK + Android SDK ~1.5 GB)"
echo "   ⚡ Fois suivantes : ~2-3 min (layers Docker en cache)"
echo ""

docker build -f Dockerfile.android -t habitkids-apk-builder .

echo ""
echo "📦 Extraction de l'APK..."
CONTAINER=$(docker create habitkids-apk-builder)
docker cp "$CONTAINER":/project/android/app/build/outputs/apk/debug/app-debug.apk ./habitkids-debug.apk
docker rm "$CONTAINER" > /dev/null

echo ""
echo "✅ APK généré : habitkids-debug.apk"
echo ""
echo "📲 Pour installer sur ton téléphone Android :"
echo "   1. Paramètres > Sécurité > Active 'Sources inconnues' (ou 'Installer des apps inconnues')"
echo "   2. Transfère habitkids-debug.apk via USB, WhatsApp ou email"
echo "   3. Ouvre le fichier sur ton téléphone et installe"
echo ""
echo "⚠️  Assure-toi que ton téléphone et ton PC sont sur le même WiFi"
