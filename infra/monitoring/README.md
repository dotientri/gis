Setup Prometheus + Alertmanager + Telegram notifier

1) Create a Telegram bot via BotFather and get the bot token.
2) Obtain your chat id (send a message to the bot and inspect updates, or use @userinfobot).
3) Set environment variables before running compose:

   - `TELEGRAM_BOT_TOKEN` — token from BotFather
   - `TELEGRAM_CHAT_ID` — numeric chat id to receive messages

You can export them in your shell or create a `.env` file in project root.

Run the stack:

```bash
docker-compose up -d prometheus alertmanager telegram_notifier
```

Open Prometheus: http://localhost:9090
Open Alertmanager: http://localhost:9093

Testing:
- Use Alertmanager UI to send a test alert, or trigger the `PrometheusDown` alert by stopping the Prometheus container briefly.
- Check that messages arrive in your Telegram chat.
