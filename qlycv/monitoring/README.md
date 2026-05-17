# Monitoring stack (ELK + Prometheus + Grafana) with Telegram alerts

This folder contains a minimal docker-compose setup for Elasticsearch, Kibana, Logstash, Filebeat, Prometheus, Alertmanager, Grafana and a node exporter.

Quick steps to integrate Telegram alerts and run the stack:

1. Create a Telegram bot and get `BOT_TOKEN`:
   - Open Telegram and chat with `@BotFather`.
   - Send `/newbot`, follow prompts, and copy the token (format `123456:ABCDEF...`).

2. Get your `CHAT_ID`:
   - Send a message to your bot from the account or group you want to receive alerts.
   - Call:
```bash
curl -s "https://api.telegram.org/bot<BOT_TOKEN>/getUpdates" | jq .
```
   - Find `chat.id` in the response (or use `@userinfobot` to get your id).

3. Provide bot token and chat id to Alertmanager (recommended via environment file or Jenkins credentials):

Option A — local `.env` (do not commit):
```bash
cat > .env <<EOF
ALERT_BOT_TOKEN=your_bot_token_here
ALERT_CHAT_ID=your_chat_id_here
EOF
```

Option B — Jenkins: add `telegram-bot-token` and `telegram-chat-id` as Secret Text credentials and the pipeline will export them when deploying.

4. Start the stack:
```bash
cd monitoring
docker compose up -d --build
```

5. Verify services:
- Prometheus: http://localhost:9090 (Targets page)
- Alertmanager: http://localhost:9093
- Grafana: http://localhost:3000 (admin/admin)
- Kibana: http://localhost:5601

6. Test alert:
- Stop `node_exporter` container to trigger `InstanceDown` alert after ~1 minute.
- Or temporarily change `prometheus/rules/alerts.yml` to fire immediately and reload Prometheus.

Notes:
- Replace images/tags for production and set persistent volumes and resource limits.
- For automated secret injection, you can template `alertmanager/config.yml` from environment variables before starting.
