# Map visual predictions & NLP intent to municipal department classification
DEPARTMENTS = {
    "Pothole": "Roads Department",
    "Road Damage": "Roads Department",
    "Garbage Overflow": "Sanitation",
    "Sanitation Issue": "Sanitation",
    "Broken Streetlight": "Electricity",
    "Water Leakage": "Water Works",
    "Drainage Blockage": "Drainage",
    "Public Infrastructure Damage": "Urban Planning"
}

class MultimodalFusion:
    def fuse(self, image_prediction: dict, text_prediction: dict) -> dict:
        img_issue = image_prediction.get("issue", "Other")
        nlp_intent = text_prediction.get("intent", "General Complaint")
        
        # 1. Resolve target department based on multimodal inputs
        # Priority is given to Image prediction, falling back to NLP intent
        mapped_issue = img_issue if img_issue in DEPARTMENTS else nlp_intent.replace(" Complaint", "")
        department = DEPARTMENTS.get(mapped_issue, "General Administration")
        
        # 2. Determine Priority levels based on severity keywords and categories
        # Default priority maps
        priority_matrix = {
            "Pothole": "High",
            "Road Damage": "Medium",
            "Garbage Overflow": "Medium",
            "Sanitation Issue": "Low",
            "Broken Streetlight": "Medium",
            "Water Leakage": "High",
            "Drainage Blockage": "High",
            "Public Infrastructure Damage": "Medium"
        }
        
        base_priority = priority_matrix.get(img_issue, "Medium")
        
        # Boost priority to Critical/High if severity keywords are detected
        keywords = [kw.lower() for kw in text_prediction.get("keywords", [])]
        severity_triggers = ["danger", "accident", "skid", "broken", "overflow", "flooded", "deep", "pedda", "smell", "vasana"]
        
        if any(trigger in keywords for trigger in severity_triggers):
            if base_priority == "High":
                base_priority = "Critical"
            elif base_priority == "Medium":
                base_priority = "High"
                
        # 3. Compute weighted confidence fusion score
        img_conf = image_prediction.get("confidence", 90.0)
        # NLP match confidence based on keyword overlap count
        keyword_count = len(text_prediction.get("keywords", []))
        nlp_conf = min(70.0 + (keyword_count * 10.0), 98.5)
        
        # Fusion weighting: 60% Visual, 40% Linguistic
        fused_confidence = round((img_conf * 0.6) + (nlp_conf * 0.4), 1)
        
        return {
            "department": department,
            "priority": base_priority,
            "confidence": fused_confidence
        }

fusion = MultimodalFusion()
