from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from database.models import init_db, SessionLocal, Notification
from routes import auth, complaints, analytics, whatsapp
from ai.chatbot import chatbot
import json
import os

app = FastAPI(title="CivicAI – Intelligent Urban Governance Engine", version="2.0.0")

# Initialize Database tables
init_db()

# Enable CORS for mobile and web connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081", "http://localhost:19006", "http://localhost:8000", "http://10.0.2.2:8081", "http://10.0.2.2:19006"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(complaints.router)
app.include_router(analytics.router)
app.include_router(whatsapp.router)

# Mount Uploads static directory for image assets retrieval
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# WebSocket Real-Time Event Hub
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    complaints.active_ws_connections.append(websocket)
    
    try:
        while True:
            # Handle incoming client messages (e.g. Chatbot questions)
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            # Simple chatbot execution over WebSockets
            if payload.get("event") == "chat_query":
                db = SessionLocal()
                try:
                    query = payload.get("query", "")
                    user_id = payload.get("user_id", 1)
                    
                    reply_text = chatbot.reply(query, user_id, db)
                    
                    await websocket.send_json({
                        "event": "chat_reply",
                        "data": {
                            "reply": reply_text
                        }
                    })
                finally:
                    db.close()
    except WebSocketDisconnect:
        if websocket in complaints.active_ws_connections:
            complaints.active_ws_connections.remove(websocket)
    except Exception as e:
        print(f"WS error: {e}")
        if websocket in complaints.active_ws_connections:
            complaints.active_ws_connections.remove(websocket)

@app.get("/")
def home():
    return {"message": "CivicAI Centralized Core running successfully."}
