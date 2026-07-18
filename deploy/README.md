# ourTab production deployment

The production container binds to `127.0.0.1:3003`, matching the existing
OpenResty route for `ourtab.shandawang.cc`.

```bash
cd /home/ubuntu/apps/ourtab
cp /path/to/repo/deploy/.env.example .env
sed -i "s#replace-with-at-least-32-random-characters#$(openssl rand -base64 36 | tr -d '=+/')#" .env
sed -i "s#replace-with-a-long-random-token#$(openssl rand -base64 36 | tr -d '=+/')#" .env
mkdir -p data uploads backups
sudo chown -R 1000:1000 data uploads backups
docker compose -f deploy/docker-compose.yml up -d --build
docker compose -f deploy/docker-compose.yml ps
```

Open `https://ourtab.shandawang.cc/setup` once and enter the setup token from
`.env`. The setup endpoint disables itself after the first administrator is
created.

Run `./deploy/backup.sh` daily. It uses SQLite's online backup API and keeps
the most recent 14 days of local backups.

Install the included root cron entry once:

```bash
sudo install -m 644 deploy/ourtab.cron /etc/cron.d/ourtab
```
