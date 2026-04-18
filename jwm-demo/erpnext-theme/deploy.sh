#!/usr/bin/env bash
# Re-apply the JWM brand CSS + settings to the ERPNext site on CT 171.
# Idempotent: safe to rerun after container rebuilds or site migrations.

set -euo pipefail

CSS_FILE="$(dirname "$0")/jwm_brand.css"
SITE="jwm-erp.beyondpandora.com"
CT=171
BACKEND=frappe_docker-backend-1
FRONTEND=frappe_docker-frontend-1
APP_DIR="/home/frappe/frappe-bench/apps/jwm_manufacturing/jwm_manufacturing/public/css"
ASSETS_DIR="/home/frappe/frappe-bench/sites/assets/jwm_manufacturing/css"
LOGO_URL="/files/logo-master.svg"

echo "==> Pushing CSS to Proxmox host"
scp -q "$CSS_FILE" "root@10.90.10.10:/tmp/jwm_brand.css"
ssh root@10.90.10.10 "pct push $CT /tmp/jwm_brand.css /tmp/jwm_brand.css"

echo "==> Copying CSS into backend + frontend containers"
ssh root@10.90.10.10 "pct exec $CT -- bash -c '
  docker exec $BACKEND mkdir -p $APP_DIR
  docker cp /tmp/jwm_brand.css $BACKEND:$APP_DIR/jwm_brand.css
  docker exec $FRONTEND mkdir -p $ASSETS_DIR
  docker cp /tmp/jwm_brand.css $FRONTEND:$ASSETS_DIR/jwm_brand.css
'"

echo "==> Registering CSS in hooks.py if not already"
ssh root@10.90.10.10 "pct exec $CT -- docker exec -u frappe $BACKEND bash -c '
  HOOK=/home/frappe/frappe-bench/apps/jwm_manufacturing/jwm_manufacturing/hooks.py
  grep -q \"jwm_brand.css\" \$HOOK || cat >> \$HOOK <<HEOF

# JWM brand theme
app_include_css = [\"/assets/jwm_manufacturing/css/jwm_brand.css\"]
web_include_css = [\"/assets/jwm_manufacturing/css/jwm_brand.css\"]
HEOF
'"

echo "==> Applying brand settings (app_name, logo, favicon)"
ssh root@10.90.10.10 "pct exec $CT -- docker exec -u frappe $BACKEND bench --site $SITE execute frappe.client.set_value --kwargs '{\"doctype\":\"Website Settings\",\"name\":\"Website Settings\",\"fieldname\":{\"app_name\":\"JWM\",\"app_logo\":\"$LOGO_URL\",\"banner_image\":\"$LOGO_URL\",\"favicon\":\"$LOGO_URL\",\"splash_image\":\"$LOGO_URL\",\"brand_html\":\"<b style=\\\"color:#e69b40\\\">JWM</b>\",\"footer_powered\":\"Powered by sovereign.ai\"}}' > /dev/null"
ssh root@10.90.10.10 "pct exec $CT -- docker exec -u frappe $BACKEND bench --site $SITE execute frappe.client.set_value --kwargs '{\"doctype\":\"System Settings\",\"name\":\"System Settings\",\"fieldname\":{\"app_name\":\"JWM Manufacturing\"}}' > /dev/null"
ssh root@10.90.10.10 "pct exec $CT -- docker exec -u frappe $BACKEND bench --site $SITE execute frappe.client.set_value --kwargs '{\"doctype\":\"Navbar Settings\",\"name\":\"Navbar Settings\",\"fieldname\":{\"app_logo\":\"$LOGO_URL\",\"logo_width\":32}}' > /dev/null"

echo "==> Clearing cache"
ssh root@10.90.10.10 "pct exec $CT -- docker exec -u frappe $BACKEND bench --site $SITE clear-cache > /dev/null 2>&1"
ssh root@10.90.10.10 "pct exec $CT -- docker exec -u frappe $BACKEND bench --site $SITE clear-website-cache > /dev/null 2>&1"

echo "==> Verifying"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://jwm-erp.beyondpandora.com/assets/jwm_manufacturing/css/jwm_brand.css")
SIZE=$(curl -s -o /dev/null -w "%{size_download}" "https://jwm-erp.beyondpandora.com/assets/jwm_manufacturing/css/jwm_brand.css")
echo "    CSS served: HTTP $CODE, $SIZE bytes"
[[ "$CODE" == "200" ]] && echo "==> Done. Hard-refresh browser (⇧⌘R)."
