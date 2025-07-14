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

def openai_streaming_completion(prompt: str):
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    http_client = httpx.Client(verify=False)
    client = OpenAI(http_client=http_client)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        stream=True
    )
    for chunk in response:
        content = chunk.choices[0].delta.content or ""
        yield content


@router.post("/answer/")
async def chat_stream(payload: PromptInput):
    context, sources = get_context_from_rag(payload.answer)
    prompt = f"Usa la siguiente información para responder la pregunta:\n{context}\n\nPregunta: {payload.answer}"

    def generate():
        full_answer = ""
        for chunk in openai_streaming_completion(prompt):
            yield f"data: {json.dumps({'answer': chunk, 'sources': None})}\n\n"
            full_answer += chunk
        yield f"data: {json.dumps({'answer': None, 'sources': sources})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )