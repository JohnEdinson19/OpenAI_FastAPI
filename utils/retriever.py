import os
import pandas as pd
import ssl, httpx
from typing import List
from langchain_community.vectorstores import FAISS
from langchain.docstore.document import Document
from langchain_openai import OpenAIEmbeddings

FAISS_INDEX_PATH = "faiss_index"

def load_documents_from_csv(csv_path: str) -> List[Document]:
    df = pd.read_csv(csv_path)
    return [
        Document(
            page_content=row["text"],
            metadata={"id": row["doc_id"], "title": row["title"]}
        )
        for _, row in df.iterrows()
    ]

def create_openai_embeddings():
    """Crea embeddings de OpenAI con configuración SSL"""
    # Configurar SSL
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    
    # Cliente HTTP sin verificación SSL
    http_client = httpx.Client(verify=False)
    
    return OpenAIEmbeddings(
        model="text-embedding-3-small",
        http_client=http_client
    )

def get_vectorstore(documents: List[Document]) -> FAISS:
    # Verificar si existe el índice guardado usando el método nativo de FAISS
    if os.path.exists(FAISS_INDEX_PATH):
        print("Cargando vectorstore desde cache...")
        try:
            embeddings = create_openai_embeddings()
            vectorstore = FAISS.load_local(
                FAISS_INDEX_PATH, 
                embeddings, 
                allow_dangerous_deserialization=True
            )
            print("Vectorstore cargado exitosamente!")
            return vectorstore
        except Exception as e:
            print(f"Error cargando cache: {e}")
            print("Creando nuevo vectorstore...")
    
    print("Creando embeddings con OpenAI...")
    embeddings = create_openai_embeddings()
    
    print("Creando vectorstore...")
    vectorstore = FAISS.from_documents(documents, embeddings)
    
    # Guardar usando el método save_local de FAISS (NO pickle)
    print("Guardando vectorstore...")
    try:
        vectorstore.save_local(FAISS_INDEX_PATH)
        print("Vectorstore guardado exitosamente!")
    except Exception as e:
        print(f"Error guardando vectorstore: {e}")
    
    return vectorstore

def create_vectorstore_from_csv(csv_path: str) -> FAISS:
    docs = load_documents_from_csv(csv_path)
    return get_vectorstore(docs)

# Función auxiliar para limpiar cache si es necesario
def clear_cache():
    """Limpia el cache de embeddings"""
    import shutil
    if os.path.exists(FAISS_INDEX_PATH):
        shutil.rmtree(FAISS_INDEX_PATH)
        print("Cache limpiado")
    
    # Limpiar cache legacy si existe
    if os.path.exists("embeddings_cache.pkl"):
        os.remove("embeddings_cache.pkl")
        print("Cache legacy limpiado")