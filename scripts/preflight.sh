#!/usr/bin/env bash
# Revisión previa al despliegue. Ejecutar en el servidor, dentro de la carpeta del proyecto y con .env ya completo:
#   ./scripts/preflight.sh
set -u
FAIL=0
ok(){ echo "  ✔ $1"; }
bad(){ echo "  ✘ $1"; FAIL=1; }
[ -f .env ] || { echo "Falta .env  →  cp .env.production.example .env  y complétalo"; exit 1; }
set -a; . ./.env; set +a

echo "1) Docker"
if command -v docker >/dev/null && docker compose version >/dev/null 2>&1; then ok "docker compose instalado"; else bad "falta docker compose (bash scripts/server-setup.sh)"; fi

echo "2) Recursos del servidor"
MEM=$(awk '/MemTotal/{print int($2/1024)}' /proc/meminfo)
[ "$MEM" -ge 3500 ] && ok "RAM ${MEM} MB" || bad "RAM ${MEM} MB: con menos de 4 GB la compilación puede fallar"
FREE=$(df -BG --output=avail / | tail -1 | tr -dc 0-9)
[ "$FREE" -ge 10 ] && ok "disco libre ${FREE} GB" || bad "poco disco libre (${FREE} GB)"

echo "3) Configuración (.env)"
for v in DOMAIN APP_URL ADMIN_EMAIL ADMIN_PASSWORD; do [ -n "${!v:-}" ] && ok "$v definido" || bad "$v está vacío"; done
case "${APP_URL:-}" in https://*) ok "APP_URL usa https";; *) bad "APP_URL debe empezar con https://";; esac
[ "${#ADMIN_PASSWORD}" -ge 12 ] && ok "ADMIN_PASSWORD de 12+ caracteres" || bad "ADMIN_PASSWORD demasiado corta (mínimo 12)"
if [ -n "${SMTP_HOST:-}" ]; then ok "SMTP_HOST definido"; else bad "SMTP_HOST vacío: no saldrán correos de recuperación ni recordatorios"; fi
[ "${SMTP_PORT:-587}" = "587" ] && ok "SMTP_PORT=587" || bad "Hetzner bloquea los puertos 25 y 465: usa 587"
if [ -n "${MP_ACCESS_TOKEN:-}" ]; then
  ok "MP_ACCESS_TOKEN definido"; [ -n "${MP_WEBHOOK_SECRET:-}" ] && ok "MP_WEBHOOK_SECRET definido" || bad "falta MP_WEBHOOK_SECRET (firma del webhook)"
else echo "  · MP_ACCESS_TOKEN vacío: los pagos en línea quedan desactivados"; fi

echo "4) Red"
IP=$(curl -s -4 --max-time 8 https://ifconfig.me || true)
DNSIP=$(getent ahostsv4 "${DOMAIN:-x}" 2>/dev/null | awk '{print $1; exit}')
if [ -n "$IP" ] && [ "$IP" = "$DNSIP" ]; then ok "${DOMAIN} → ${IP} (apunta a este servidor)"; else bad "el DNS de ${DOMAIN:-?} (${DNSIP:-sin resolver}) no apunta a este servidor (${IP:-?}); sin eso no se emite el certificado HTTPS"; fi
if timeout 5 bash -c "exec 3<>/dev/tcp/${SMTP_HOST:-smtp-relay.brevo.com}/587" 2>/dev/null; then ok "salida SMTP por 587 abierta"; else bad "no se alcanza el SMTP por el puerto 587"; fi

echo
if [ "$FAIL" = 0 ]; then echo "Todo listo →  docker compose up -d --build"; else echo "Corrige lo marcado con ✘ antes de continuar."; exit 1; fi
