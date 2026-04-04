FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt requirements_full.txt ./
RUN pip install --upgrade pip && pip install -r requirements_full.txt

COPY . .

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["bash", "-c", "python manage.py migrate --noinput && python manage.py runserver 0.0.0.0:8000"]
