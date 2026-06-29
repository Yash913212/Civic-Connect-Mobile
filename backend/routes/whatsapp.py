from fastapi import APIRouter, Form, Depends
from sqlalchemy.orm import Session
from database.models import SessionLocal, User, Complaint, Notification
from ai.classifier import classifier
from ai.muril_nlp import muril
from ai.fusion import fusion
from ai.generator import note_generator
from routes.complaints import broadcast_update
import random

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/webhook")
async def whatsapp_webhook(
    Body: str = Form(None),
    MediaUrl0: str = Form(None),
    From: str = Form("+919999999999"),
    db: Session = Depends(get_db)
):
    # Simulated Twilio WhatsApp integration webhook
    # 1. Fetch or create a default user for this phone number
    user = db.query(User).filter(User.email == "user@civicai.com").first()
    if not user:
        user = db.query(User).first() # Fallback to first available
        
    # 2. Run AI models on incoming WhatsApp media
    title = Body[:50] if Body else "WhatsApp Image Submission"
    description = Body if Body else "Submitted via WhatsApp."
    
    img_pred = {"issue": "Other", "confidence": 100.0}
    if MediaUrl0:
        # In actual system, fetch media bytes from Twilio. Here we mock visual parsing
        # based on keywords inside body or general fallback
        img_pred = classifier.predict(b"") # Run mock forward pass
        
    text_pred = muril.analyze_text(description)
    fused = fusion.fuse(img_pred, text_pred)
    
    # 3. Create the Database Record (simulate near GPS coordinate relative to city center)
    new_complaint = Complaint(
        title=f"WA: {title}",
        description=description,
        category=img_pred["issue"] if img_pred["issue"] != "Other" else text_pred["intent"].replace(" Complaint", ""),
        latitude=17.44 + random.uniform(-0.01, 0.01),
        longitude=78.37 + random.uniform(-0.01, 0.01),
        image_url=MediaUrl0 or "https://images.unsplash.com/photo-1599740831119-971f1b21f92e?q=80&w=500",
        status="verified",
        priority=fused["priority"],
        assigned_department=fused["department"],
        ai_note=note_generator.generate(img_pred["issue"], description, fused["department"], fused["priority"]),
        ai_confidence=fused["confidence"],
        creator_id=user.id
    )
    
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    
    # Alert user
    notif = Notification(
        user_id=user.id,
        title="WhatsApp Grievance Created",
        message=f"A new report '{new_complaint.title}' was automatically initialized from your WhatsApp text."
    )
    db.add(notif)
    db.commit()

    # Broadcast websocket event
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
        "status": "success",
        "message": "Complaint automatically compiled via AI engine",
        "complaint_id": new_complaint.id
    }
