"""
Standalone test server for Team 1 AutoML module.
Run: python -m modules.team1_automl.run_local
  OR: cd modules/team1_automl && python run_local.py
"""
import os
import sys
from pathlib import Path

project_root = Path(__file__).resolve().parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from dotenv import load_dotenv

load_dotenv(project_root / ".env")

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from modules.team1_automl.router import router

app = FastAPI(
    title="AI Kosh - Team 1 AutoML (Local Test)",
    description="Independent test server for the AutoML Wizard module",
    version="1.1.0",
)

# Never use allow_origins=["*"] with allow_credentials=True — invalid CORS; browsers may block.
# Default: allow all origins without credentials (works with direct API calls + LAN localhost).
_cors = (os.getenv("CORS_ORIGINS", "*") or "*").strip()
if _cors == "*":
    _origins, _creds = ["*"], False
else:
    _origins = [o.strip() for o in _cors.split(",") if o.strip()]
    _creds = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=_creds,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

_DEFAULT_PORT = int(os.getenv("BACKEND_PORT", "8099"))


@app.get("/")
def root():
    port = _DEFAULT_PORT
    return {
        "module": "Team 1 - AutoML Wizard",
        "status": "running",
        "docs": f"http://localhost:{port}/docs",
    }


if __name__ == "__main__":
    uvicorn.run(
        "modules.team1_automl.run_local:app",
        host="0.0.0.0",
        port=_DEFAULT_PORT,
        reload=True,
    )
