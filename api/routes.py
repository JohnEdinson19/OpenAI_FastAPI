from fastapi import APIRouter
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
from utils.retriever import create_vectorstore_from_csv
from dotenv import load_dotenv
import openai, os, httpx, ssl, json
from openai import OpenAI

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
router = APIRouter()
vectorstore = create_vectorstore_from_csv("documents.csv")

class PromptInput(BaseModel):
    answer: str

def get_context_from_rag(question: str):
    docs = vectorstore.similarity_search(question, k=5)
    context = "\n".join([f"id={d.metadata['id']}, data={d.page_content}" for d in docs])
    sources = [d.metadata["id"] for d in docs]
    return context, sources

def openai_completion(prompt: str) -> str:
    # Configurar SSL
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE    
    http_client = httpx.Client(verify=False)
    client = OpenAI(http_client=http_client)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        stream=False
    )
    return response.choices[0].message.content.strip()

@router.post("/answer/")
async def chat_stream(payload: PromptInput):
    context, sources = get_context_from_rag(payload.answer)
    prompt = f"Usa la siguiente información para responder la pregunta:\n{context}\n\nPregunta: {payload.answer}"
    answer = openai_completion(prompt)
    return {"answer": answer, "sources": sources}