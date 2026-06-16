from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from database.models import SessionLocal, Complaint, User, Notification
from routes.auth import get_current_user
from ai.classifier import classifier
from ai.muril_nlp import muril
from ai.fusion import fusion
from ai.generator import note_generator
from pydantic import BaseModel
import datetime
import os
import shutil

router = APIRouter(prefix="/complaints", tags=["complaints"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# List to track live WebSocket connections
# Will be accessed from main app for broadcasts
active_ws_connections = []

async def broadcast_update(message: dict):
    # Attempt to broadcast state change to all listening sockets
    for connection in active_ws_connections:
        try:
            await connection.send_json(message)
        except Exception:
            # Clean up dead sockets
            if connection in active_ws_connections:
                active_ws_connections.remove(connection)

@router.post("/create")
async def create_complaint(
    title: str = Form(...),
    description: str = Form(""),
    latitude: float = Form(...),
    longitude: float = Form(...),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Store the uploaded image locally
    image_url = None
    if image:
        os.makedirs("uploads", exist_ok=True)
        file_path = f"uploads/{datetime.datetime.now().timestamp()}_{image.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        image_url = f"http://localhost:8000/{file_path}"
        
        # Read file bytes for visual classification
        image.file.seek(0)
        img_bytes = await image.read()
    else:
        img_bytes = b""

    # 2. RUN AI MULTIMODAL PIPELINE IN PARALLEL
    # A. Visual Classification (EfficientNet)
    img_pred = classifier.predict(img_bytes)
    
    # B. Linguistic Text Analysis (Google MuRIL NLP)
    text_pred = muril.analyze_text(description or title)
    
    # C. Multimodal Decision Fusion
    fused = fusion.fuse(img_pred, text_pred)
    
    # D. Official Work Order Draft Note Generator
    official_note = note_generator.generate(
        category=img_pred["issue"],
        text=description,
        department=fused["department"],
        priority=fused["priority"]
    )
    
    # 3. Create the Database Record
    new_complaint = Complaint(
        title=title,
        description=description,
        category=img_pred["issue"],
        latitude=latitude,
        longitude=longitude,
        image_url=image_url,
        status="verified", # Verified directly by our AI parser!
        priority=fused["priority"],
        assigned_department=fused["department"],
        ai_note=official_note,
        ai_confidence=fused["confidence"],
        creator_id=current_user.id
    )
    
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    
    # Create notification for user
    notif = Notification(
        user_id=current_user.id,
        title="Grievance Registered",
        message=f"Your complaint regarding '{title}' was verified and routed to the {fused['department']}."
    )
    db.add(notif)
    db.commit()

    # Trigger a real-time broadcast of the new complaint submission to all listening officers and citizens
    payload = {
        "event": "new_complaint",
        "data": {
            "id": new_complaint.id,
            "title": new_complaint.title,
            "category": new_complaint.category,
            "department": new_complaint.assigned_department,
            "priority": new_complaint.priority,
            "status": new_complaint.status,
            "latitude": new_complaint.latitude,
            "longitude": new_complaint.longitude
        }
    }
    await broadcast_update(payload)

    return {
        "id": new_complaint.id,
        "category": new_complaint.category,
        "priority": new_complaint.priority,
        "department": new_complaint.assigned_department,
        "confidence": new_complaint.ai_confidence,
        "ai_note": new_complaint.ai_note
    }

@router.get("/all")
def get_all_complaints(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == "Admin":
        return db.query(Complaint).order_by(Complaint.created_at.desc()).all()
    elif current_user.role == "Officer":
        # Officers see issues assigned to their department
        return db.query(Complaint).filter(Complaint.assigned_department == current_user.department).order_by(Complaint.created_at.desc()).all()
    else:
        # Citizens see their own complaints
        return db.query(Complaint).filter(Complaint.creator_id == current_user.id).order_by(Complaint.created_at.desc()).all()

@router.get("/{id}")
def get_complaint(id: int, db: Session = Depends(get_db)):
    comp = db.query(Complaint).filter(Complaint.id == id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return comp

@router.put("/update/{id}")
async def update_complaint(
    id: int, 
    status: str = Form(None), 
    officer_name: str = Form(None),
    priority: str = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comp = db.query(Complaint).filter(Complaint.id == id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    if status:
        comp.status = status
    if officer_name:
        comp.officer_name = officer_name
    if priority:
        comp.priority = priority
        
    db.commit()
    db.refresh(comp)
    
    # Notify complaint owner
    notif = Notification(
        user_id=comp.creator_id,
        title="Grievance Status Updated",
        message=f"The status of your complaint '{comp.title}' has been changed to '{comp.status}'."
    )
    db.add(notif)
    db.commit()

    # Trigger dynamic real-time updates broadcast
    payload = {
        "event": "complaint_status_update",
        "data": {
            "id": comp.id,
            "status": comp.status,
            "officer_name": comp.officer_name,
            "priority": comp.priority
        }
    }
    await broadcast_update(payload)

    return comp

@router.delete("/delete/{id}")
def delete_complaint(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    comp = db.query(Complaint).filter(Complaint.id == id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Complaint not found")
    db.delete(comp)
    db.commit()
    return {"message": "Complaint deleted successfully"}
