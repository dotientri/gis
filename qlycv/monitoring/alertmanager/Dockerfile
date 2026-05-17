FROM prom/alertmanager:latest
USER root
RUN apt-get update && apt-get install -y gettext-base curl && rm -rf /var/lib/apt/lists/*
COPY config.yml.tmpl /etc/alertmanager/config.yml.tmpl
# At container start, render template and exec alertmanager
ENTRYPOINT ["/bin/sh", "-c"]
CMD ["envsubst < /etc/alertmanager/config.yml.tmpl > /etc/alertmanager/config.yml && exec /bin/alertmanager --config.file=/etc/alertmanager/config.yml --storage.path=/alertmanager"]
