#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
docker exec ourtab node /app/scripts/backup.mjs
find ./backups -type f -name 'ourtab-*.db' -mtime +14 -delete
