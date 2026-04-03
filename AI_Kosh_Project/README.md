# AI Kosh - Team 1: AutoML Wizard

End-to-end AutoML pipeline using H2O AutoML. Upload a CSV dataset, configure columns with AI-assisted recommendations, train multiple ML models, and view a ranked leaderboard of best-fitting models.

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Python | 3.10+ | https://python.org |
| Java JDK | 17 (LTS) | https://adoptium.net |
| Node.js | 18+ | https://nodejs.org |

## Quick Start

### 1. Set Java path (required every new terminal)

```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
```

### 2. Start the backend

```powershell
cd "c:\Users\HP\Desktop\AI kosh\AI_Kosh_Project"
python -m modules.team1_automl.run_local
```

Backend runs at **http://localhost:8001** (Swagger docs at http://localhost:8001/docs)

### 3. Start the frontend (new terminal)

```powershell
cd "c:\Users\HP\Desktop\AI kosh\UI_kosh"
npm run dev
```

Frontend runs at **http://localhost:5173**

## First-Time Setup (only once)

```powershell
# Backend dependencies
cd "c:\Users\HP\Desktop\AI kosh\AI_Kosh_Project"
pip install -r requirements.txt

# Frontend dependencies
cd "c:\Users\HP\Desktop\AI kosh\UI_kosh"
npm install
```

## Configuration (.env)

Edit `AI_Kosh_Project/.env` to configure:

| Variable | Purpose | Required |
|----------|---------|----------|
| `HUGGINGFACE_TOKEN` | HuggingFace API token for AI recommendations | Optional (rule-based fallback works without it) |
| `H2O_MAX_MODELS` | Max models to train per run (default: 20) | No |
| `H2O_MAX_RUNTIME_SECS` | Max training time in seconds (default: 300) | No |

### Switching to Azure (Phase 2)

When Azure access is granted, uncomment these in `.env`:

```env
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;...
```

The system auto-detects and switches. No code changes needed.

## Project Structure

```
AI_Kosh_Project/
├── modules/team1_automl/       <- Our team's backend code
│   ├── router.py               <- API endpoints (integration team reads this)
│   ├── services.py             <- Business logic orchestrator
│   ├── h2o_engine.py           <- H2O AutoML wrapper
│   ├── data_processor.py       <- Pandas data analysis
│   ├── ai_huggingface.py       <- Open-source AI (Mistral-7B)
│   ├── ai_azure_openai.py      <- Azure OpenAI (Phase 2)
│   ├── storage_local.py        <- Local file storage
│   ├── storage_azure.py        <- Azure Blob storage (Phase 2)
│   ├── config.py               <- Auto-toggle local vs Azure
│   ├── team_db.py              <- SQLite for metadata
│   ├── schemas.py              <- Pydantic models
│   ├── enums.py                <- Enums
│   └── run_local.py            <- Independent test server
├── shared_workspace/
│   ├── 1_raw_uploads/          <- Uploaded CSV files
│   ├── 2_processed_data/       <- Exported results
│   └── 3_models/               <- Saved H2O models
├── requirements.txt
└── .env

UI_kosh/
├── src/pages/model-exchange/tools/  <- Our team's frontend code
│   ├── AutoMLWizard.tsx             <- Main wizard (onBack prop)
│   ├── AutoMLWizard.css             <- Styles (aw- prefix)
│   ├── api.ts                       <- API client
│   ├── types.ts                     <- TypeScript types
│   ├── components/
│   │   ├── WizardStepper.tsx        <- 5-step stepper
│   │   ├── StepSelectDataset.tsx    <- Step 1: Upload
│   │   ├── StepConfigureData.tsx    <- Step 2: Columns + AI
│   │   ├── StepConfiguration.tsx    <- Step 3: Task/Models
│   │   ├── StepTraining.tsx         <- Step 4: Live training
│   │   └── StepResults.tsx          <- Step 5: Leaderboard
│   └── hooks/
│       └── useWebSocket.ts          <- WebSocket hook
└── .env
```

## API Endpoints

All prefixed with `/team1`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /team1/datasets/upload | Upload CSV |
| GET | /team1/datasets | List datasets |
| GET | /team1/datasets/{id}/preview | Preview rows |
| GET | /team1/datasets/{id}/columns | Column metadata |
| POST | /team1/configure/ai-recommend | AI column recommendation |
| POST | /team1/configure/validate | Validate config |
| POST | /team1/training/start | Start H2O training |
| GET | /team1/training/{run_id}/status | Training status |
| WS | /team1/ws/training/{run_id} | Live training logs |
| GET | /team1/results/{run_id}/leaderboard | Model leaderboard |
| GET | /team1/results/{run_id}/best-model | Best model details |
| GET | /team1/results/{run_id}/feature-importance | Feature importance |
| GET | /team1/results/{run_id}/export | Download CSV/JSON |

## Sample Datasets

Three test datasets are included in `shared_workspace/sample_data/`:
- `iris.csv` (30 rows, 5 cols) - Classification
- `housing.csv` (50 rows, 6 cols) - Regression
- `fe_data.csv` (10 rows, 7 cols) - Matches AI Kosh demo
