# OpenAI_FastAPI

Proyecto de API RAG (Recuperación-Augmentación-Generación) con FastAPI y OpenAI

## Descripción
Esta API implementa un sistema de pregunta-respuesta usando la técnica RAG (Retrieval-Augmented Generation) sobre documentos locales, combinando búsqueda semántica y léxica, y generación de respuestas con el modelo `gpt-4o-mini` de OpenAI. Incluye una interfaz web simple para interactuar con la API.

## Características
- Recuperación híbrida (léxica + semántica) de documentos relevantes.
- Generación de respuestas usando solo el contexto recuperado.
- Respuestas en formato JSON con la respuesta y las fuentes utilizadas.
- Interfaz web lista para usar.

## Requisitos
- Python 3.11+
- [OpenAI API Key](https://platform.openai.com/account/api-keys)
- Docker (opcional, para despliegue)

## Instalación
1. Clona el repositorio:
   ```bash
   git clone https://github.com/JohnEdinson19/OpenAI_FastAPI.git
   cd OpenAI_FastAPI
   ```
2. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```
3. Crea un archivo `.env` con tu clave de OpenAI:
   ```env
   OPENAI_API_KEY=sk-...
   ```

## Ejecución
### Modo local
```bash
uvicorn main:app --reload
```
Accede a la interfaz en [http://localhost:8000](http://localhost:8000)

### Con Docker
```bash
docker build -t openai_fastapi .
docker run -p 8000:8000 --env-file .env openai_fastapi
```

## Uso de la API

### Endpoint principal
#### `POST /answer`
Recibe una pregunta y devuelve una respuesta generada junto con los IDs de los documentos fuente.

**Request:**
```json
{
  "answer": "¿Cuál es la misión de la empresa?"
}
```

**Response:**
```json
{
  "answer": "La misión de la empresa es...",
  "sources": ["doc1", "doc2", "doc3"]
}
```

### Interfaz web
Accede a `/` para usar el chat web.

## Estructura del proyecto

```
├── main.py                # Punto de entrada FastAPI
├── api/
│   └── routes.py          # Endpoints de la API
├── utils/
│   └── retriever.py       # Lógica de recuperación de documentos
├── documents.csv          # Base de datos de documentos
├── static/                # Archivos estáticos (frontend)
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── images/
├── requirements.txt
├── Dockerfile
└── .env                   # Clave de API (no subir a git)
```

## Notas
- El sistema utiliza búsqueda híbrida simulada. Puedes mejorar la recuperación integrando FAISS, Elasticsearch, o Pinecone.
- El modelo `gpt-4o-mini` solo responde con la información recuperada, no inventa fuentes.
- Para producción, asegúrate de proteger tu clave OpenAI y usar HTTPS.

---
Desarrollado por JohnEdinson19