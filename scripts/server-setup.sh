#!/usr/bin/env bash
# Prepara un Ubuntu 22.04/24.04 recién creado (Hetzner u otro): Docker, firewall, fail2ban,
# actualizaciones de seguridad automáticas y swap. Ejecutar UNA vez como root:  bash scripts/server-setup.sh
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "Ejecútalo como root"; exit 1; }
export DEBIAN_FRONTEND=noninteractive
apt-get update && apt-get -y upgrade
apt-get -y install ca-certificates curl git ufw fail2ban unattended-upgrades
command -v docker >/dev/null || curl -fsSL https://get.docker.com | sh
ufw default deny incoming && ufw default allow outgoing
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp
ufw --force enable
systemctl enable --now fail2ban
dpkg-reconfigure -f noninteractive unattended-upgrades
if ! swapon --show | grep -q .; then   # red de seguridad al compilar la imagen
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile && echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
timedatectl set-timezone America/Bogota
echo "Listo. Siguiente: copia .env.production.example a .env, complétalo y ejecuta: docker compose up -d --build"
