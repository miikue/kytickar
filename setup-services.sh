#!/bin/bash
set -e

echo "🔧 Kytickar - nasazeni systemd sluzeb"

# Ensure script is run as root because it writes to /etc/systemd/system.
if [ "${EUID}" -ne 0 ]; then
  echo "Spust tento skript jako root (napr. sudo ./setup-services.sh)."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cp "${SCRIPT_DIR}/deploy/systemd/kytickar-backend.service" /etc/systemd/system/
cp "${SCRIPT_DIR}/deploy/systemd/kytickar-frontend.service" /etc/systemd/system/

systemctl daemon-reload
systemctl enable --now kytickar-backend
systemctl enable --now kytickar-frontend

echo ""
echo "✅ Sluzby jsou zapnute."
echo ""
echo "Kontrola stavu:"
echo "  systemctl status kytickar-backend"
echo "  systemctl status kytickar-frontend"
echo ""
echo "Logy:"
echo "  journalctl -u kytickar-backend -f"
echo "  journalctl -u kytickar-frontend -f"
