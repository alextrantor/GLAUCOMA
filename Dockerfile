FROM python:3.9.13-slim

WORKDIR /app

# Copia solo los archivos necesarios
COPY Backend/requirements.txt .
COPY Backend/ .

# Instala dependencias
RUN pip install --upgrade pip==23.0.1 setuptools==65.5.1 wheel==0.38.4 && \
    pip install --no-cache-dir -r requirements.txt

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]