import os
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')

TELEGRAM_API = None
if TOKEN:
    TELEGRAM_API = f'https://api.telegram.org/bot{TOKEN}/sendMessage'


@app.route('/alert', methods=['POST'])
def alert():
    data = request.get_json() or {}
    alerts = data.get('alerts', [])
    sent = 0
    for a in alerts:
        status = a.get('status')
        labels = a.get('labels', {})
        annotations = a.get('annotations', {})
        startsAt = a.get('startsAt')
        endsAt = a.get('endsAt')
        msg = (
            f"Alert: {labels.get('alertname')}\n"
            f"Status: {status}\n"
            f"Severity: {labels.get('severity','')}\n"
            f"Summary: {annotations.get('summary','')}\n"
            f"Description: {annotations.get('description','')}\n"
            f"StartsAt: {startsAt}\n"
            f"EndsAt: {endsAt}"
        )

        if TELEGRAM_API and CHAT_ID:
            try:
                resp = requests.post(TELEGRAM_API, data={'chat_id': CHAT_ID, 'text': msg}, timeout=10)
                resp.raise_for_status()
                sent += 1
            except Exception as e:
                app.logger.error('Failed to send Telegram message: %s', e)
        else:
            app.logger.warning('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set; skipping send')

    return jsonify({'ok': True, 'sent': sent})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
