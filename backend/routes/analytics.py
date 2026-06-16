from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.models import SessionLocal, Complaint, User
from routes.auth import get_current_user
import random

router = APIRouter(prefix="/analytics", tags=["analytics"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/dashboard")
def get_dashboard_aggregates(db: Session = Depends(get_db)):
    all_complaints = db.query(Complaint).all()
    
    total = len(all_complaints)
    active = len([c for c in all_complaints if c.status in ["assigned", "in_progress", "inspection"]])
    resolved = len([c for c in all_complaints if c.status in ["resolved", "closed"]])
    critical = len([c for c in all_complaints if c.priority == "Critical"])
    
    return {
        "total": total,
        "active": active,
        "resolved": resolved,
        "critical": critical
    }

@router.get("/departments")
def get_department_distribution(db: Session = Depends(get_db)):
    all_complaints = db.query(Complaint).all()
    
    distribution = {}
    for c in all_complaints:
        dept = c.assigned_department or "Unassigned"
        distribution[dept] = distribution.get(dept, 0) + 1
        
    return distribution

@router.get("/heatmap")
def get_heatmap_coordinates(db: Session = Depends(get_db)):
    all_complaints = db.query(Complaint).all()
    
    points = []
    for c in all_complaints:
        points.append({
            "id": c.id,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "category": c.category,
            "priority": c.priority,
            "title": c.title
        })
        
    # If database is empty, return some premium pre-populated mock coordinate hotspots matching Hyderabad / Hitech City area
    if not points:
        points = [
            {"id": 101, "latitude": 17.4483, "longitude": 78.3741, "category": "Pothole", "priority": "High", "title": "Pothole Near Pillar 34"},
            {"id": 102, "latitude": 17.4435, "longitude": 78.3820, "category": "Garbage Overflow", "priority": "Medium", "title": "Garbage Heap Corner"},
            {"id": 103, "latitude": 17.4510, "longitude": 78.3685, "category": "Broken Streetlight", "priority": "Low", "title": "Dark Street Light failure"},
            {"id": 104, "latitude": 17.4390, "longitude": 78.3790, "category": "Water Leakage", "priority": "Critical", "title": "Burst Water Mains"}
        ]
        
    return points
