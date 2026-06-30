# Civic Connect 🏛️✨

### *Autonomous Multi-Modal Grievance Routing & Smart City Dispatch Engine*

Civic Connect is a premium, enterprise-grade mobile platform and AI-driven dispatcher that bridges the gap between citizens and municipal authorities. It fuses client-side NLP, OpenRouter-powered AI, multilingual i18n, and real-time WebSockets to automate complaint intake, route to city departments, track resolution, and present live analytics to citizens and admins.

Inspired by premium dark UI aesthetics from **Linear, Apple, and Tesla**, the app uses a **"Gold-Midnight"** design system, dynamic **glassmorphic surfaces** via `react-native-reanimated`, **Sora typography**, and cinematic particle backgrounds.

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph Mobile Client [React Native & Expo]
        UI[Gold-Midnight UI / Sora]
        Intake[Multimodal Intake: Voice, GPS, Photo]
        Store[Zustand Store + Persist]
        i18n[i18n: EN / TE / HI]
        NLP[Client NLP: Language Detection]
        AI[OpenRouter AI: Analysis, Chat, Insights]
        WS_Client[WebSocket Listener]
    end

    subgraph FastAPI AI Backend (Optional)
        App[FastAPI Server]
        Auth[JWT Auth]
        Complaints[Complaints CRUD]
        WS_Server[WebSocket Manager]
        DB[(SQLite / PostgreSQL)]
    end

    Intake -->|Post Grievance| AI
    AI -->|Analyze| NLP
    AI -->|Route| Complaints
    Complaints -->|Save| DB
    Complaints -->|Broadcast| WS_Server
    WS_Server -->|Real-Time Sync| WS_Client
    WS_Client -->|Update| Store
    Store -->|Refresh UI| UI
```

---

## 👥 User Roles: Citizen vs. Administrator

| Feature | 👤 Citizen | 🏛️ Admin / Officer |
| :--- | :---: | :---: |
| **AI Grievance Intake** (photo/text/voice) | ✅ | ✅ |
| **Interactive Hotspot Heatmap** | ✅ View | ✅ View |
| **Personal Grievance Logs & History** | ✅ | ✅ |
| **AI Chatbot Assistant** (OpenRouter-powered) | ✅ | ✅ |
| **Municipal Dispatch Command Center** | 🚫 Restricted | ✅ Full Access |
| **Interactive Queue Management** | 🚫 Restricted | ✅ Assign & Resolve |
| **Officer Deployment & Status Control** | 🚫 Restricted | ✅ |
| **Department Workload Monitoring** | 🚫 Restricted | ✅ Real-time meters |
| **AI Insights & Recommendations** | ✅ Summary | ✅ Full analytics |

---

## 🌟 Core Features

### 1. 🔑 Dual-Role Authentication
- Seamless **Citizen** vs. **Admin Portal** login with prefilled test credentials.
- Forgot password flow with email input and success state.

### 2. 🎙️ Multi-Modal Grievance Intake
- **Rich Media:** Snap photos or pick from gallery.
- **Voice Input:** Animated soundwave visualizer with mock voice-to-text.
- **GPS Auto-Clustering:** Precise geolocation with Google Maps WebView embed.
- **AI Category Suggestion:** OpenRouter analyzes description text and suggests a category with confidence %, shown as an actionable AI badge.

### 3. 🧠 AI-Powered Analysis (Client + OpenRouter)
- **Local NLP:** Language detection (Telugu/Hindi/English via Unicode ranges), keyword extraction (TF scoring), category/department/priority suggestion, sentiment analysis.
- **OpenRouter AI:** Full complaint analysis (category, department, priority, sentiment, municipal note, keywords, suggested officer response) with graceful fallback to local NLP when offline.

### 4. 🌐 Multi-Language i18n
- Full translation support for **English**, **Telugu**, and **Hindi** (~250 strings across 15 screen categories).
- Language selector screen with native label + English label per language.
- Persistent language preference via Zustand + AsyncStorage.
- `t()` function with automatic fallback to English.

### 5. 🏛️ Municipal Command & Dispatch Center (Admin)
- **Dispatch Board:** Live queue with status filters (all, pending, assigned, in_progress, resolved).
- **Deploy Modal:** Assign field officers to unassigned complaints.
- **Resolve Action:** Mark assigned complaints as resolved.
- **Officer Roster:** Performance metrics per officer (active vs. resolved).
- **AI Officer Response Drafting:** 🤖 button generates a professional municipal reply using OpenRouter.
- **AI Insights Dashboard:** Generate AI-powered summary, trends, and recommendations from complaint data.

### 6. 📊 Citizen Dashboard & AI Summary
- Stats grid (total, active, resolved, high priority) with animated counters.
- Department load bars (role-restricted for citizens).
- **Auto-loading AI Summary card** — OpenRouter analyzes complaint data and shows insights + refresh button.

### 7. 🤖 Context-Aware AI Chatbot
- Powered by OpenRouter with conversation history, complaint context, and user role awareness.
- Quick suggestion chips for common queries.
- Falls back to local `generateBotReply()` when offline.

### 8. 🗺️ Radar Heatmap & HUD
- Dark geographic sector visualizer with complaint markers.
- Priority-colored pulsing radar pings and category filtering.

### 9. 🔔 Notification Deep-Linking
- Mock notifications with optional `complaintId` field.
- Tapping navigates to `/complaint-detail`.

### 10. 💾 Offline Persistence
- Zustand `persist` middleware with AsyncStorage.
- Persists: user, token, login state, complaints, notifications, chat messages, language, launch state.
- WebSocket sync when online.

---

## 🛠️ Technology Stack

### Frontend Mobile App
- **Framework:** [Expo SDK 56 / Expo Router v3](https://expo.dev/)
- **Styling:** StyleSheet with Gold-Midnight design tokens
- **State Management:** [Zustand v5](https://github.com/pmndrs/zustand) with `persist` middleware
- **Animations:** [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- **AI / NLP:** [OpenRouter API](https://openrouter.ai) (`google/gemini-2.0-flash-lite-preview-02-05:free`) + custom client-side NLP
- **i18n:** Custom `t()` function with 3 language files
- **Storage:** `@react-native-async-storage/async-storage`
- **Maps:** Google Maps via `react-native-webview`
- **Haptics:** `expo-haptics`
- **Location:** `expo-location`
- **Graphics:** `react-native-svg`
- **Fonts:** Sora (400, 600, 700, 800 weights)

---

## 📂 Project Architecture

```
Civic-Mobile/
├── src/
│   ├── app/                    # Expo Router file-based navigation
│   │   ├── _layout.tsx         # Root stack + screen animations + splash
│   │   ├── index.tsx           # 5-tab home: hero, stats, map, tiles, nav
│   │   ├── login.tsx           # Dual-role auth with prefill
│   │   ├── signup.tsx          # Registration
│   │   ├── forgot-password.tsx # Reset flow
│   │   ├── edit-profile.tsx    # Name/email/mobile editor
│   │   ├── report.tsx          # Complaint submission (photo, voice, GPS, AI category)
│   │   ├── processing.tsx      # Animated AI pipeline with real OpenRouter analysis
│   │   ├── result.tsx          # AI results: category, dept, priority, confidence
│   │   ├── dashboard.tsx       # Citizen stats + AI Summary card
│   │   ├── history.tsx         # Searchable complaint log with filters
│   │   ├── complaint-detail.tsx # Timeline tracker + municipal note
│   │   ├── notifications.tsx   # Push notification list with deep-linking
│   │   ├── chat.tsx            # OpenRouter-powered AI assistant
│   │   ├── language-select.tsx # EN / TE / HI picker
│   │   ├── profile.tsx         # User stats + sign out
│   │   ├── settings.tsx        # Language + preferences
│   │   ├── admin.tsx           # Queue, Officers, Insights tabs + AI features
│   │   └── heatmap.tsx         # Location-based complaint clusters
│   ├── components/
│   │   ├── GlassCard.tsx       # Apple-style glassmorphism with top sheen
│   │   ├── SmartCityBackground.tsx # Cinematic particles + auroras
│   │   ├── MapPreview.tsx      # Lightweight complaint marker dots
│   │   ├── icons/index.tsx     # Animated BellIcon, CameraIcon
│   │   ├── ScreenLayout.tsx    # SafeArea + background wrapper
│   │   ├── AnimatedCounter.tsx # Count-up animation
│   │   └── ...
│   ├── services/
│   │   ├── ai.ts               # OpenRouter API: analysis, chat, insights, translate
│   │   └── nlp.ts              # Client-side NLP: lang detect, keywords, categories
│   ├── i18n/
│   │   ├── index.ts            # t() function, types, constants
│   │   ├── en.ts               # English translations (~250 strings)
│   │   ├── te.ts               # Telugu translations
│   │   └── hi.ts               # Hindi translations
│   ├── store/
│   │   ├── index.ts            # Zustand + persist (AsyncStorage)
│   │   ├── types.ts            # Complaint, User, ChatMessage, NotificationItem
│   │   ├── websocket.ts        # WebSocket connection manager
│   │   └── slices/
│   │       ├── authSlice.ts
│   │       ├── complaintSlice.ts  # NLP-powered submitComplaint()
│   │       ├── chatSlice.ts       # OpenRouter-powered sendChatMessage()
│   │       ├── appSlice.ts
│   │       └── notificationSlice.ts
│   └── theme/
│       ├── colors.ts           # Gold, navy, civicBlue palette
│       ├── typography.ts       # Sora font configuration
│       └── spacing.ts
├── env.ts                      # API keys (Google Maps, OpenRouter)
└── backend/                    # Optional FastAPI backend
```

---

## 🚀 Getting Started

### 1. Environment Variables
Set these in your environment or edit `src/env.ts`:
```bash
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
EXPO_PUBLIC_API_URL=http://localhost:8000/api
```

### 2. Install & Run
```bash
npm install --legacy-peer-deps
npx expo start -c
```
- Scan QR with **Expo Go** on your device.
- Press `w` for web preview (limited native module support).

### 3. Backend (Optional)
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt && python app.py
```

---

## 🎨 Design Philosophy

- **Background:** Midnight Navy (`#050816` to `#030C18`) for cinematic depth.
- **Accent:** Premium gold (`#C9A84C`) active states.
- **Glassmorphism:** Semi-transparent layers + micro borders (`rgba(255,255,255,0.06)`) with top highlight sheen.
- **Typography:** Sora throughout (400/600/700/800 weights) for clean hierarchy.
- **Animations:** Reanimated shared values for particles, auroras, glass sheen, and step progress.

---

## 🔑 API Keys

**OpenRouter** key is configured in `src/env.ts` for AI features. The app uses `google/gemini-2.0-flash-lite-preview-02-05:free` model.
**Google Maps** key is needed for the location embed in the report screen.

> ⚠️ In production, route AI calls through a backend proxy to avoid exposing API keys on clients.
