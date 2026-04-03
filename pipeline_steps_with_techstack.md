# AutoML Pipeline — Step-by-Step Process with Tools & Tech Stack

## End-to-End Pipeline Steps

| Step | Process | Tools / Tech Stack | Output |
|------|---------|--------------------|--------|
| **1. Data Ingestion** | Upload CSV dataset, store in cloud, extract metadata (rows, columns, size, types) | Azure Blob Storage, Pandas, FastAPI | Stored dataset with metadata |
| **2. Data Preview & Profiling** | Display dataset preview, column statistics (data types, null counts, unique values, distributions) | Pandas, NumPy | Column profile report |
| **3. Column Configuration** | Select target variable, include/exclude features, AI-assisted recommendation for optimal configuration | Azure OpenAI (GPT-4o), Pandas | Configured target + feature set |
| **4. ML Task Selection** | Choose task type — Classification (categorical), Regression (continuous), or Clustering (grouping) | H2O AutoML | Selected ML task |
| **5. Model & Hyperparameter Configuration** | Select algorithms (GBM, XGBoost, DRF, GLM, Deep Learning, Stacked Ensemble), set train/test split, cross-validation folds, max models, max runtime | H2O AutoML | Training configuration |
| **6. Automated Model Training** | Run H2O AutoML — automatic algorithm selection, hyperparameter tuning, k-fold cross-validation across all selected models | H2O AutoML, Java (H2O backend), Azure VM/ACI | Trained model pool |
| **7. Model Comparison & Leaderboard** | Rank all trained models by performance metric (AUC/Accuracy for classification, RMSE/R² for regression), identify best model | H2O AutoML Leaderboard | Ranked leaderboard + best model |
| **8. Feature Importance Analysis** | Extract and visualize which features contribute most to predictions from the best model | H2O Variable Importance, Matplotlib, Recharts | Feature importance chart |
| **9. Evaluation Metrics & Visualization** | Generate confusion matrix (classification), residual plots (regression), model comparison charts, cross-validation results | Matplotlib, Plotly, Recharts | Evaluation dashboards |
| **10. Model Persistence & Export** | Save best model artifacts to cloud storage, export leaderboard results as CSV/JSON | Azure Blob Storage, H2O Model Save | Saved models + exportable results |

---

## Tech Stack Summary

| Category | Technologies |
|----------|-------------|
| **ML Engine** | H2O AutoML (GBM, XGBoost, DRF, GLM, Deep Learning, Stacked Ensemble) |
| **Cloud** | Azure Blob Storage, Azure Container Instance, Azure OpenAI |
| **Backend** | Python, FastAPI, Pandas, NumPy |
| **Frontend** | React (Vite), WebSocket, Recharts |
| **Visualization** | Matplotlib, Plotly, Recharts |
| **Auth** | Azure API Key + Endpoint |
