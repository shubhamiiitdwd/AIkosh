# AutoML Pipeline — Task Summary

## Task Description

Build an end-to-end **Automated Machine Learning (AutoML) pipeline** using **H2O AutoML** integrated with **Azure cloud services**. The system provides a guided wizard interface where users can upload datasets, configure target/feature columns (with AI-assisted recommendations), select ML tasks (Classification, Regression, Clustering), and automatically train & compare multiple models (GBM, XGBoost, Random Forest, Deep Learning, GLM, Stacked Ensemble). The pipeline handles automatic algorithm selection, hyperparameter tuning, cross-validation, feature importance analysis, and outputs a **ranked leaderboard identifying the best-fitting model** — no deployment required.

---

## AI/ML Tech Stack

| Layer | Technology |
|-------|-----------|
| **AutoML Engine** | H2O AutoML (algorithm selection, hyperparameter tuning, cross-validation) |
| **ML Algorithms** | Gradient Boosting (GBM), XGBoost, Distributed Random Forest, Deep Learning (Neural Nets), GLM, Stacked Ensemble |
| **AI Assistant** | Azure OpenAI (GPT-4o) — for intelligent column/task recommendation |
| **Cloud Storage** | Azure Blob Storage — dataset & model persistence |
| **Compute** | Azure Container Instance / VM — H2O server hosting |
| **Backend** | Python, FastAPI, Pandas, NumPy |
| **Frontend** | React (Vite), Recharts, WebSocket (live training logs) |
| **Visualization** | Matplotlib, Plotly — feature importance, confusion matrix, model comparison charts |

---

## Scope

- ✅ Dataset upload & preview
- ✅ AI-powered column configuration
- ✅ Multi-task support (Classification, Regression, Clustering)
- ✅ Automatic model training & hyperparameter tuning
- ✅ Cross-validation (k-fold)
- ✅ Model leaderboard & best model identification
- ✅ Feature importance analysis
- ✅ Model persistence (Azure Blob)
- ✅ Results export (CSV/JSON)
- ❌ Model deployment (out of scope)

**Timeline:** 2 Weeks | **Azure Auth:** API Key + Endpoint only
