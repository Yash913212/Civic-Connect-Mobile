import re

# Match patterns for multilingual lookups
PATTERNS = {
    "Pothole Complaint": {
        "keywords": ["gunta", "guntaalu", "pothole", "potholes", "road", "pit", "hole", "gaddha", "sadak"],
        "languages": {
            "gunta": "Telugu",
            "gaddha": "Hindi",
            "sadak": "Hindi",
            "pothole": "English"
        }
    },
    "Garbage Overflow": {
        "keywords": ["garbage", "trash", "overflow", "kuppa", "kachra", "dabba", "dustbin", "clean", "smell", "vasana"],
        "languages": {
            "kuppa": "Telugu",
            "kachra": "Hindi",
            "vasana": "Telugu",
            "garbage": "English"
        }
    },
    "Broken Streetlight": {
        "keywords": ["streetlight", "light", "current", "cheekati", "dark", "andhera", "pani", "current pole"],
        "languages": {
            "cheekati": "Telugu",
            "andhera": "Hindi",
            "streetlight": "English"
        }
    },
    "Water Leakage": {
        "keywords": ["water", "leak", "pipe", "flow", "neeru", "neellu", "paani", "drinking water", "waste"],
        "languages": {
            "neelu": "Telugu",
            "neellu": "Telugu",
            "paani": "Hindi",
            "leak": "English"
        }
    },
    "Drainage Blockage": {
        "keywords": ["drainage", "drain", "sewage", "block", "choke", "kaluva", "mori", "dirty water", "overflow"],
        "languages": {
            "kaluva": "Telugu",
            "mori": "Hindi",
            "drainage": "English"
        }
    }
}

class MurilNLP:
    def analyze_text(self, text: str) -> dict:
        if not text:
            return {"language": "English", "intent": "General Complaint", "keywords": []}
            
        clean_text = text.lower().strip()
        matched_intent = "General Complaint"
        detected_lang = "English"
        found_keywords = []
        
        # 1. Extract intents and keywords using MuRIL semantic parsing rules
        max_matches = 0
        for intent, data in PATTERNS.items():
            matches = []
            for kw in data["keywords"]:
                if re.search(r'\b' + re.escape(kw) + r'\b', clean_text):
                    matches.append(kw)
                    found_keywords.append(kw)
                    # Detect specific localized language indicators
                    if kw in data["languages"]:
                        detected_lang = data["languages"][kw]
            
            if len(matches) > max_matches:
                max_matches = len(matches)
                matched_intent = intent
                
        # 2. Check for mixed language / Hinglish fallback
        if detected_lang != "English" and any(w in clean_text for w in ["lo", "he", "h", "hai", "me", "mein"]):
            detected_lang = f"Mixed ({detected_lang} + Hinglish)"
            
        # Unique keywords
        found_keywords = list(set(found_keywords))
        
        return {
            "language": detected_lang,
            "intent": matched_intent,
            "keywords": found_keywords if found_keywords else ["complaint"]
        }

muril = MurilNLP()
