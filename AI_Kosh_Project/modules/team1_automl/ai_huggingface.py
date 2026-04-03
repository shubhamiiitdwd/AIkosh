import logging
from .config import HUGGINGFACE_TOKEN, HUGGINGFACE_MODEL
from .schemas import AIRecommendResponse, ColumnInfo

logger = logging.getLogger(__name__)


def _rule_based_recommend(columns: list[ColumnInfo], use_case: str) -> AIRecommendResponse:
    """Fallback: rule-based column recommendation when HF API is unavailable."""
    use_case_lower = use_case.lower()
    scores = {}

    for col in columns:
        score = 0
        name_lower = col.name.lower()

        if any(kw in name_lower for kw in ("id", "sl_no", "index", "serial", "unnamed")):
            score -= 100

        if any(kw in use_case_lower for kw in name_lower.split("_") if len(kw) > 2):
            score += 50

        if col.dtype in ("float64", "int64"):
            score += 5
        if col.dtype == "object":
            score -= 2

        if 2 <= col.unique_count <= 20:
            score += 10

        scores[col.name] = score

    target = max(scores, key=scores.get) if scores else columns[-1].name
    features = [c.name for c in columns if c.name != target]

    reasoning = (
        f"Based on your use case '{use_case}', the column '{target}' was selected as the target "
        f"because it best matches the described objective. The remaining {len(features)} columns "
        f"are selected as features to provide predictive information."
    )
    return AIRecommendResponse(
        target_column=target,
        features=features,
        confidence="high confidence",
        reasoning=reasoning,
    )


async def recommend(columns: list[ColumnInfo], use_case: str) -> AIRecommendResponse:
    if not HUGGINGFACE_TOKEN:
        logger.info("No HuggingFace token set, using rule-based recommendation")
        return _rule_based_recommend(columns, use_case)

    try:
        from huggingface_hub import InferenceClient

        col_desc = "\n".join(
            f"- {c.name} ({c.dtype}, {c.null_count} nulls, {c.unique_count} unique)"
            for c in columns
        )

        client = InferenceClient(model=HUGGINGFACE_MODEL, token=HUGGINGFACE_TOKEN)
        response = client.chat_completion(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a data science assistant. Given dataset columns and a use case, "
                        "recommend the target variable and features. Respond in this exact JSON format:\n"
                        '{"target": "column_name", "features": ["col1", "col2"], "reasoning": "explanation"}'
                    ),
                },
                {
                    "role": "user",
                    "content": f"Use case: {use_case}\n\nColumns:\n{col_desc}\n\nWhich column should be the target? Which should be features? Respond in JSON only.",
                },
            ],
            max_tokens=500,
        )

        import json
        text = response.choices[0].message.content.strip()
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            data = json.loads(text[start:end])
            valid_cols = {c.name for c in columns}
            target = data.get("target", "")
            if target not in valid_cols:
                return _rule_based_recommend(columns, use_case)
            features = [f for f in data.get("features", []) if f in valid_cols and f != target]
            if not features:
                features = [c.name for c in columns if c.name != target]
            return AIRecommendResponse(
                target_column=target,
                features=features,
                confidence="high confidence",
                reasoning=data.get("reasoning", "AI-powered recommendation"),
            )
        else:
            return _rule_based_recommend(columns, use_case)

    except Exception as e:
        logger.warning(f"HuggingFace API failed, falling back to rule-based: {e}")
        return _rule_based_recommend(columns, use_case)
