#!/usr/bin/env sh
set -eu

mkdir -p backups
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
destination="backups/forticestas-data-${timestamp}.tar.gz"

docker compose exec -T web sh -c 'tar -czf - -C /app/data .' > "$destination"
echo "Backup criado: $destination"
