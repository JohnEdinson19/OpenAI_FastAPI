from fastapi import APIRouter
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
from utils.retriever import create_vectorstore_from_csv
from dotenv import load_dotenv
import openai, os, httpx, ssl
from openai import OpenAI

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
router = APIRouter()
vectorstore = create_vectorstore_from_csv("documents.csv")

class Query(BaseModel):
    question: str

def get_context_from_rag(question: str) -> str:
    docs = vectorstore.similarity_search(question, k=3)
    return "\n".join([d.page_content for d in docs])

def openai_stream_response(prompt: str):
    # Configurar SSL
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE    
    http_client = httpx.Client(verify=False)
    client = OpenAI(http_client=http_client)
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        stream=True
    )

    def generate():
        for chunk in response:
            content = chunk.choices[0].delta.content or ""
            yield content

    return StreamingResponse(generate(), media_type="text/plain")

@router.post("/chat-stream/")
async def chat_stream(query: Query):
    context = get_context_from_rag(query.question)
    prompt = f"""Usa la siguiente información para responder la pregunta:\n{context}\n\nPregunta: {query.question}"""
    return openai_stream_response(prompt)
