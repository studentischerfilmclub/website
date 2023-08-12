ARG HOST=0.0.0.0
ARG PORT=5000

FROM python:3.11
WORKDIR /app

COPY ./requirements.txt ./requirements.txt
RUN  pip install --no-cache-dir --upgrade -r ./requirements.txt
COPY . ./api

CMD uvicorn api.main:app \
    --host "$HOST"       \
    --port "$PORT"       \
    --log-level info     \
    --proxy-headers      \
    --reload             \