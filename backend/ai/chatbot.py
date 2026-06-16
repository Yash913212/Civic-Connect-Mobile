from sqlalchemy.orm import Session
from database.models import Complaint
import re

class CivicAIChatbot:
    def reply(self, query: str, user_id: int, db: Session) -> str:
        q = query.lower().strip()
        
        # 1. Fetch complaints associated with this user
        user_complaints = db.query(Complaint).filter(Complaint.creator_id == user_id).all()
        
        # Check if the user is asking about status
        if any(w in q for w in ["status", "where is", "update", "progress", "complaint"]):
            if not user_complaints:
                return "You haven't filed any complaints yet! You can report a new issue by going to the 'Report' tab."
            
            # Find the most recent complaint or category match
            target = user_complaints[-1] # Default to latest
            for c in user_complaints:
                if c.category.lower() in q or c.title.lower() in q:
                    target = c
                    break
                    
            status_map = {
                "pending": "is currently pending review by our AI ingestion system",
                "verified": "has been verified by our automated classification model",
                "assigned": f"has been assigned to {target.officer_name if target.officer_name else 'a field inspector'} of the {target.assigned_department}",
                "in_progress": f"is active! {target.officer_name} is currently working on resolution",
                "inspection": "has been resolved and is currently undergoing quality inspection",
                "resolved": "has been marked as RESOLVED! Thank you for helping build a smarter city!",
                "closed": "is resolved and closed."
            }
            
            status_desc = status_map.get(target.status, "is being processed")
            
            return f"🤖 **CivicAI Assistant**: Your complaint regarding *'{target.title}'* {status_desc}.\n\n* **Category**: {target.category}\n* **Assigned Department**: {target.assigned_department if target.assigned_department else 'Under Routing'}\n* **Priority**: {target.priority}\n* **Last Updated**: {target.updated_at.strftime('%Y-%m-%d %H:%M')}"

        # Information queries
        if any(w in q for w in ["how to", "report", "file", "submit"]):
            return "🤖 **CivicAI Assistant**: Filing a complaint is simple! Just click on the **'Report'** icon at the bottom of your screen, snap/upload an image, add a brief description (or record a voice note), and tap **Submit**. Our AI pipeline will automatically classify the issue and dispatch it to the correct department instantly."
            
        if any(w in q for w in ["department", "who takes care"]):
            return "🤖 **CivicAI Assistant**: CivicAI automatically routes complaints to various local departments: Roads Department (potholes), Sanitation (garbage overflow), Electricity (streetlights), Water Works (water leaks), and Drainage. Each issue is assigned to a certified local officer."
            
        return "🤖 **CivicAI Assistant**: Hello! I am your CivicAI Virtual Assistant. I can track the status of your complaints, provide details about municipal departments, or guide you on how to file a new report. How can I help you today?"

chatbot = CivicAIChatbot()
