# Vridhi.ai — Predictive Credit Risk Analytics Platform for MSMEs

**Smart India Hackathon — PS 12: Predictive Credit Risk Analytics for MSMEs**

Vridhi.ai is an interactive analytics dashboard that evaluates and visualizes predictive credit-risk models for Micro, Small, and Medium Enterprises using alternative data sources instead of relying solely on traditional credit scores.

## Features

- **Alternative-data credit-risk prediction** — XGBoost model using 8 features: income, loan amount, GST compliance, UPI volume, utility delays, vendor trust, sector type, AFHI score
- **Explainable AI** — SHAP TreeExplainer on the XGBoost classifier step with plain-English factor explanations
- **Cash-flow forecasting** — statsmodels ExponentialSmoothing with numpy polyfit fallback
- **Borrower risk segmentation** — scatter plot visualization with filters (sector, region, size)
- **Fairness and bias analysis** — disparate impact ratio, four-fifths rule, deviation alerts across gender, region, and sector
- **Scenario-based economic simulations** — 5 macro scenarios (baseline, recession, inflation spike, interest rate hike, festive boom)
- **Batch portfolio scoring** — CSV upload with vectorized prediction
- **Loan recommendation logic** — rule-based eligibility, amount, interest rate, and conditions
- **Interactive analytics dashboard** — KPI cards, score gauge, charts, tables
- **AI chatbot** — Groq-powered Vridhi Assistant with SSE streaming

## Architecture

```
Vridhi-ai/
│
├── backend/                    # FastAPI Python backend
│   ├── main.py                 # FastAPI app with lifespan, CORS, routers
│   ├── schemas.py              # Pydantic v2 request/response schemas
│   ├── requirements.txt        # Pinned Python dependencies
│   ├── .env.example            # Environment variable template
│   ├── model/
│   │   ├── vridhi_multidataset_model.pkl  # Trained imblearn pipeline
│   │   ├── model_service.py    # Model loading + prediction helpers
│   │   ├── shap_explain.py     # SHAP explainability
│   │   ├── verify_model.py     # Model verification script
│   │   └── train_model.py      # Model training (run once, not at runtime)
│   ├── data/
│   │   ├── generate_mock_data.py  # Mock data generator
│   │   ├── msme_mock.csv          # 300 mock MSMEs
│   │   └── scored_portfolio.csv   # Scored portfolio (real model output)
│   ├── routes/                 # API route handlers
│   │   ├── health.py           # GET /api/health
│   │   ├── predict.py          # POST /api/predict
│   │   ├── batch.py            # POST /api/predict/batch, GET /api/sample-csv
│   │   ├── segmentation.py     # GET /api/segmentation
│   │   ├── fairness.py         # GET /api/fairness
│   │   ├── simulate.py         # POST /api/simulate
│   │   ├── forecast.py         # POST /api/forecast
│   │   └── chat.py             # POST /api/chat, POST /api/chat/stream
│   ├── services/               # Business logic
│   │   ├── prediction_service.py
│   │   ├── fairness_service.py
│   │   ├── segmentation_service.py
│   │   ├── simulation_service.py
│   │   ├── forecast_service.py
│   │   ├── recommendation_service.py
│   │   └── chatbot_service.py
│   └── utils/
│       └── portfolio_store.py  # In-memory portfolio store
│
└── frontend/                   # Next.js 14 frontend
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── .env.example
    └── src/
        ├── app/                # App Router pages
        │   ├── layout.jsx      # Root layout with Providers + Sidebar
        │   ├── page.jsx        # Assessment page (/)
        │   ├── dashboard/      # Risk dashboard (/dashboard)
        │   ├── portfolio/      # Portfolio & segmentation (/portfolio)
        │   ├── simulator/      # Scenario simulator (/simulator)
        │   ├── fairness/       # Fairness & bias analysis (/fairness)
        │   └── batch/          # Batch CSV scoring (/batch)
        ├── components/         # Reusable UI components
        ├── context/            # React Context for shared state
        └── lib/                # API helpers and utilities
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React, Tailwind CSS, Recharts, lucide-react |
| Backend | FastAPI, Uvicorn, Pydantic v2, CORSMiddleware |
| ML | XGBoost, scikit-learn 1.6.1, imbalanced-learn (SMOTE), joblib |
| Explainability | SHAP TreeExplainer |
| Forecasting | statsmodels ExponentialSmoothing |
| Chatbot | Groq Python SDK (SSE streaming) |
| Deployment | Vercel (frontend), Render (backend) |

## ML Model Information

The model is an imbalanced-learn pipeline:

```
ColumnTransformer (RobustScaler + OneHotEncoder) → SMOTE → XGBClassifier
```

- **Input features (8):** income, loan_amount, gst_compliance_rate, monthly_upi_volume, utility_delay_days, vendor_trust_score, sector_type, afhi_score
- **Loading:** `joblib.load()` (NOT pickle)
- **Loaded once** at application startup via FastAPI lifespan
- **Default class index** is auto-detected using strong-vs-weak sample comparison

### Score Logic

- `risk_score = round((1 - P(default)) * 100)` — higher is safer
- 70–100 → LOW, 40–69 → MEDIUM, 0–39 → HIGH
- Confidence = `max(predict_proba)`

### Model Verification

```bash
cd backend
python -m backend.model.verify_model
```

## Setup Instructions

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Installation

```bash
cd Vridhi-ai/backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# Run the backend
uvicorn main:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`.
API docs at `http://localhost:8000/docs`.

### Frontend Installation

```bash
cd Vridhi-ai/frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Run the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `GROQ_API_KEY` | Groq API key for the chatbot | Required |
| `GROQ_MODEL` | Groq model name | `llama-3.3-70b-versatile` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:3000` |
| `PORT` | Server port | `8000` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |

## How to Run

1. Start the backend:
   ```bash
   cd backend
   uvicorn main:app --reload --port 8000
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open `http://localhost:3000` in your browser.

## API Documentation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check + model status |
| POST | `/api/predict` | Single business credit risk assessment |
| POST | `/api/predict/batch` | Batch CSV upload scoring |
| GET | `/api/sample-csv` | Download CSV template |
| GET | `/api/segmentation` | Portfolio segmentation data |
| GET | `/api/fairness` | Fairness & bias analysis |
| POST | `/api/simulate` | Scenario simulation |
| POST | `/api/forecast` | Cash-flow forecasting |
| POST | `/api/chat` | Non-streaming chatbot |
| POST | `/api/chat/stream` | Streaming chatbot (SSE) |

## Groq Chatbot Setup

1. Get a free API key from [Groq Console](https://console.groq.com/keys)
2. Add it to `backend/.env`:
   ```
   GROQ_API_KEY=gsk_your_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   ```
3. Restart the backend

The chatbot is the **Vridhi Assistant** — a credit-risk explainer that uses only supplied application context. It never invents scores or financial figures and never promises loan approval.

## Mock Data Generation

```bash
cd backend
python -m backend.data.generate_mock_data
```

This generates:
- `data/msme_mock.csv` — 300 realistic Indian MSMEs with 8 model features + metadata + 12-month revenue history
- `data/scored_portfolio.csv` — The above scored using the REAL model (risk_score, risk_label, approved)

## Testing

### Backend Tests

```bash
cd backend
python -m backend.model.verify_model   # Verify model loads and behaves correctly
```

### Manual API Tests

```bash
# Health check
curl http://localhost:8000/api/health

# Single prediction
curl -X POST http://localhost:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"income":5000000,"loan_amount":1500000,"gst_compliance_rate":85,"monthly_upi_volume":200000,"utility_delay_days":5,"vendor_trust_score":75,"sector_type":"Manufacturing","afhi_score":70}'

# Batch scoring
curl -X POST http://localhost:8000/api/predict/batch \
  -F "file=@data/msme_mock.csv"
```

### Frontend Build

```bash
cd frontend
npm run build
```

## Deployment

### Backend — Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your repository
3. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables:** Add `GROQ_API_KEY`, `GROQ_MODEL`, `CORS_ORIGINS`

### Frontend — Vercel

1. Import your repository on [Vercel](https://vercel.com)
2. Settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Next.js
   - **Environment Variables:** `NEXT_PUBLIC_API_URL` = your Render backend URL
3. Deploy

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Model fails to load | Ensure `scikit-learn==1.6.1` is installed; use `joblib.load()` not `pickle.load()` |
| CORS errors | Set `CORS_ORIGINS` in backend `.env` to match your frontend URL |
| Chatbot not responding | Set `GROQ_API_KEY` in backend `.env` |
| Frontend can't reach API | Set `NEXT_PUBLIC_API_URL` in frontend `.env.local` |
| SHAP values error | Ensure `shap` is installed; the model must be an XGBoost pipeline |
| Forecast fails | Provide at least 6 months of revenue history |

## Hackathon Demo Flow

1. **Assessment** (`/`) — Enter MSME business details, submit for credit risk assessment
2. **Dashboard** (`/dashboard`) — View score gauge, KPIs, SHAP explainability, loan recommendation, cash-flow forecast, and chat with Vridhi Assistant
3. **Portfolio** (`/portfolio`) — Explore 300 MSMEs in scatter plot, filter by sector/region/size
4. **Simulator** (`/simulator`) — Adjust sliders and macro scenarios, see score changes in real-time
5. **Fairness** (`/fairness`) — Review bias analysis across gender, region, and sector
6. **Batch** (`/batch`) — Upload CSV, score portfolio in bulk, download results

## License

This project is built for the Smart India Hackathon.
