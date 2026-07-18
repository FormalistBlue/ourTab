#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
sudo -n docker exec ourtab node /app/scripts/backup.mjs
sudo -n find ../backups -type f -name 'ourtab-*.db' -mtime +14 -delete
