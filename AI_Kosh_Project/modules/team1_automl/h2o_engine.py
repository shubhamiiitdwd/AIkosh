import logging
import threading
from typing import Optional
from pathlib import Path

logger = logging.getLogger(__name__)

_h2o = None
_h2o_lock = threading.Lock()
_h2o_available = None


def _check_h2o():
    global _h2o, _h2o_available
    if _h2o_available is not None:
        return _h2o_available
    try:
        import h2o as _h2o_mod
        _h2o = _h2o_mod
        _h2o_available = True
    except ImportError:
        logger.warning("h2o package not installed. Run: pip install h2o")
        _h2o_available = False
    return _h2o_available


def init_h2o(max_mem_size: str = "2G") -> bool:
    if not _check_h2o():
        return False
    with _h2o_lock:
        try:
            _h2o.init(max_mem_size=max_mem_size, nthreads=-1)
            logger.info("H2O cluster initialized successfully")
            return True
        except Exception as e:
            logger.error(f"H2O init failed (Java 17+ required): {e}")
            return False


def shutdown_h2o():
    if _h2o and _h2o_available:
        try:
            _h2o.cluster().shutdown()
        except Exception:
            pass


def load_dataset(file_path: str):
    if not _h2o:
        raise RuntimeError("H2O not initialized")
    return _h2o.import_file(file_path)


def run_automl(
    frame,
    target: str,
    features: list[str],
    ml_task: str,
    include_algos: list[str] = None,
    max_models: int = 20,
    max_runtime_secs: int = 300,
    nfolds: int = 5,
    seed: int = 42,
    progress_callback=None,
):
    from h2o.automl import H2OAutoML

    if ml_task == "classification":
        col_type = frame[target].types[target]
        if col_type == "real":
            frame[target] = frame[target].round().ascharacter().asfactor()
        elif col_type == "int":
            frame[target] = frame[target].asfactor()
        elif col_type == "string" or col_type == "enum":
            frame[target] = frame[target].asfactor()
        else:
            frame[target] = frame[target].ascharacter().asfactor()

    if progress_callback:
        progress_callback("data_check", 10, "Validating data...")

    if progress_callback:
        progress_callback("features", 20, "Analyzing features...")

    algo_map = {
        "DRF": "DRF",
        "GLM": "GLM",
        "XGBoost": "XGBoost",
        "GBM": "GBM",
        "DeepLearning": "DeepLearning",
        "StackedEnsemble": "StackedEnsemble",
    }
    algos = [algo_map[a] for a in (include_algos or []) if a in algo_map] or None

    if progress_callback:
        progress_callback("training", 30, "Starting AutoML training...")

    aml = H2OAutoML(
        max_models=max_models,
        max_runtime_secs=max_runtime_secs,
        seed=seed,
        nfolds=nfolds,
        include_algos=algos,
        sort_metric="AUTO",
    )
    aml.train(x=features, y=target, training_frame=frame)

    if progress_callback:
        progress_callback("evaluation", 85, "Evaluating models...")

    return aml


def get_leaderboard(aml, extra_columns: list[str] = None) -> list[dict]:
    lb = aml.leaderboard
    if extra_columns:
        lb = _h2o.automl.get_leaderboard(aml, extra_columns=extra_columns)
    df = lb.as_data_frame()
    return df.to_dict(orient="records")


def get_best_model(aml):
    return aml.leader


def get_variable_importance(model) -> list[dict]:
    try:
        varimp = model.varimp(use_pandas=True)
        if varimp is not None and not varimp.empty:
            return varimp.to_dict(orient="records")
    except Exception:
        pass
    return []


def get_confusion_matrix(model, frame) -> Optional[dict]:
    try:
        perf = model.model_performance(frame)
        cm = perf.confusion_matrix()
        if cm is not None:
            cm_df = cm.to_list()
            labels = cm.col_header[:-1] if hasattr(cm, 'col_header') else []
            return {"matrix": cm_df, "labels": labels}
    except Exception:
        pass
    return None


def get_model_metrics(model, frame, ml_task: str) -> dict:
    try:
        perf = model.model_performance(frame)
        metrics = {}
        if ml_task == "classification":
            metrics["auc"] = _safe_metric(perf.auc)
            metrics["accuracy"] = _safe_metric(lambda: 1 - perf.mean_per_class_error())
            metrics["logloss"] = _safe_metric(perf.logloss)
            metrics["f1"] = _safe_metric(lambda: perf.F1()[0][1] if perf.F1() else None)
            metrics["precision"] = _safe_metric(lambda: perf.precision()[0][1] if perf.precision() else None)
            metrics["recall"] = _safe_metric(lambda: perf.recall()[0][1] if perf.recall() else None)
        else:
            metrics["rmse"] = _safe_metric(perf.rmse)
            metrics["mae"] = _safe_metric(perf.mae)
            metrics["r2"] = _safe_metric(perf.r2)
            metrics["mse"] = _safe_metric(perf.mse)
            metrics["rmsle"] = _safe_metric(perf.rmsle)
        return metrics
    except Exception as e:
        logger.error(f"Error getting metrics: {e}")
        return {}


def get_predictions(model, frame) -> tuple[list, list]:
    preds = model.predict(frame)
    pred_df = preds.as_data_frame()
    actual_df = frame.as_data_frame()
    target_col = [c for c in actual_df.columns if c not in pred_df.columns]
    return [], []


def save_model(model, path: str) -> str:
    return _h2o.save_model(model=model, path=path, force=True)


def load_model(path: str):
    return _h2o.load_model(path)


def _safe_metric(fn):
    try:
        val = fn() if callable(fn) else fn
        return round(float(val), 6) if val is not None else None
    except Exception:
        return None
