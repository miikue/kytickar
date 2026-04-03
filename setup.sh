#!/bin/bash
set -e

echo "🌱 Kytickar - Instalace a nastaveni..."
echo ""

# Backend: npm install
echo "📦 Instaluji backend balicky..."
cd app/backend
npm install

# Database: migrate + seed
echo "🗄️  Nastavuji databazi..."
npx prisma migrate deploy
npm run db:seed

# Frontend: npm install + build
echo "🎨 Instaluji frontend balicky..."
cd ../
npm install

echo "🔨 Buildim frontend..."
npm run build

echo ""
echo "✅ Hotovo!"
echo ""
echo "Další kroky:"
echo "1. Zkopíruj systemd services:"
echo "   sudo cp deploy/systemd/*.service /etc/systemd/system/"
echo ""
echo "2. Zaladuj a spust:"
echo "   sudo systemctl daemon-reload"
echo "   sudo systemctl enable --now kytickar-backend kytickar-frontend"
echo ""
echo "3. Ověř status:"
echo "   systemctl status kytickar-backend"
echo "   systemctl status kytickar-frontend"
echo ""
echo "4. Otevrij v prohlizeci:"
echo "   http://DEBIAN_IP:5173"
