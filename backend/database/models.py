import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

DATABASE_URL = "sqlite:///./civicai.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="Citizen") # Citizen, Officer, Admin
    department = Column(String, nullable=True) # If role is Officer
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    complaints = relationship("Complaint", back_populates="creator")

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    category = Column(String, nullable=False) # Pothole, Garbage, Streetlight, Water Leakage, Drainage, Other
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    image_url = Column(String, nullable=True)
    voice_url = Column(String, nullable=True)
    status = Column(String, default="pending") # pending, verified, assigned, in_progress, inspection, resolved, closed
    priority = Column(String, default="Medium") # Low, Medium, High, Critical
    assigned_department = Column(String, nullable=True)
    officer_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Official Note drafted by AI
    ai_note = Column(String, nullable=True)
    ai_confidence = Column(Float, default=100.0)

    creator_id = Column(Integer, ForeignKey("users.id"))
    creator = relationship("User", back_populates="complaints")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)
    # Pre-populate default users and mock complaints
    db = SessionLocal()
    try:
        # Check if citizen exists
        citizen = db.query(User).filter(User.email == "user@civicai.com").first()
        if not citizen:
            from passlib.context import CryptContext
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            
            # Default Citizen
            u1 = User(
                email="user@civicai.com",
                hashed_password=pwd_context.hash("123456"),
                name="Aravind Kumar",
                role="Citizen"
            )
            # Default Admin
            u2 = User(
                email="admin@civicai.com",
                hashed_password=pwd_context.hash("admin123"),
                name="Suresh Naidu (Commissioner)",
                role="Admin"
            )
            # Default Officers
            u3 = User(
                email="officer1@civicai.com",
                hashed_password=pwd_context.hash("officer123"),
                name="Ramesh Babu",
                role="Officer",
                department="Roads Department"
            )
            u4 = User(
                email="officer2@civicai.com",
                hashed_password=pwd_context.hash("officer123"),
                name="Madan Gopal",
                role="Officer",
                department="Sanitation"
            )
            db.add_all([u1, u2, u3, u4])
            db.commit()
            
            # Mock complaints for beautiful initial dashboard
            c1 = Complaint(
                title="Massive Pothole near Hitech City metro pillar 34",
                description="The pothole is very deep. Multiple two-wheelers have skid here already. Please fix immediately.",
                category="Pothole",
                latitude=17.4483,
                longitude=78.3741,
                image_url="https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=500",
                status="assigned",
                priority="High",
                assigned_department="Roads Department",
                officer_name="Ramesh Babu",
                creator_id=1,
                ai_note="To:\nRoads Department\n\nSubject:\nUrgent Road Repair Request\n\nA major pothole has been detected on a public roadway. Based on image analysis and complaint context, immediate action is recommended.\n\nPriority:\nHigh",
                ai_confidence=96.4
            )
            c2 = Complaint(
                title="Garbage overflowing on Street 4 road corner",
                description="Garbage bin is full and trash is spilled all over the street. The odor is unbearable.",
                category="Garbage Overflow",
                latitude=17.4435,
                longitude=78.3820,
                image_url="https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?q=80&w=500",
                status="in_progress",
                priority="Medium",
                assigned_department="Sanitation",
                officer_name="Madan Gopal",
                creator_id=1,
                ai_note="To:\nSanitation Department\n\nSubject:\nGarbage Clearance Request\n\nSpilled garbage overflow has been detected. Odor complaints received from residents. Please dispatch sanitation truck.\n\nPriority:\nMedium",
                ai_confidence=91.2
            )
            db.add_all([c1, c2])
            db.commit()
    finally:
        db.close()
