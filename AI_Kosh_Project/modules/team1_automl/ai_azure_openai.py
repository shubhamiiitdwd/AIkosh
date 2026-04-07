"""
Azure OpenAI implementation for column recommendation.
Activated when AZURE_OPENAI_API_KEY is set in .env.
"""
import json
import logging
from .config import (
    AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_DEPLOYMENT, AZURE_OPENAI_API_VERSION,
)
from .schemas import AIRecommendResponse, AISummaryResponse, ColumnInfo

logger = logging.getLogger(__name__)


async def recommend(columns: list[ColumnInfo], use_case: str) -> AIRecommendResponse:
    from openai import AzureOpenAI

    col_desc = "\n".join(
        f"- {c.name} ({c.dtype}, {c.null_count} nulls, {c.unique_count} unique)"
        for c in columns
    )

    client = AzureOpenAI(
        api_key=AZURE_OPENAI_API_KEY,
        api_version=AZURE_OPENAI_API_VERSION,
        azure_endpoint=AZURE_OPENAI_ENDPOINT,
    )

    response = client.chat.completions.create(
        model=AZURE_OPENAI_DEPLOYMENT,
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
    )

    text = response.choices[0].message.content.strip()
    start = text.find("{")
    end = text.rfind("}") + 1
    if start >= 0 and end > start:
        data = json.loads(text[start:end])
        valid_cols = {c.name for c in columns}
        target = data.get("target", "")
        features = [f for f in data.get("features", []) if f in valid_cols and f != target]
        if not features:
            features = [c.name for c in columns if c.name != target]
        return AIRecommendResponse(
            target_column=target,
            features=features,
            confidence="high confidence",
            reasoning=data.get("reasoning", "AI-powered recommendation via Azure OpenAI"),
            source="azure",
        )

    raise ValueError("Could not parse Azure OpenAI response")


async def generate_results_summary(
    best_algo: str,
    best_id: str,
    target: str,
    ml_task: str,
    metrics: dict,
    num_models: int,
) -> AISummaryResponse:
    """Executive summary of AutoML results via Azure OpenAI."""
    from openai import AzureOpenAI

    metrics_str = "\n".join(f"- {k}: {v}" for k, v in metrics.items() if v is not None)
    client = AzureOpenAI(
        api_key=AZURE_OPENAI_API_KEY,
        api_version=AZURE_OPENAI_API_VERSION,
        azure_endpoint=AZURE_OPENAI_ENDPOINT,
    )
    response = client.chat.completions.create(
        model=AZURE_OPENAI_DEPLOYMENT,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a data science expert. Analyze ML results and provide insights. "
                    "Respond in this exact JSON format:\n"
                    '{"executive_summary": "...", "key_insights": ["..."], '
                    '"recommendations": ["..."], "real_world_example": "..."}'
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Task: {ml_task}\nTarget: {target}\nBest model: {best_id} ({best_algo})\n"
                    f"Models trained: {num_models}\nMetrics:\n{metrics_str}\n\n"
                    f"Provide: executive summary, 3-4 key insights, 3-4 recommendations, "
                    f"and a real-world example. JSON only."
                ),
            },
        ],
        max_tokens=800,
    )
    text = response.choices[0].message.content.strip()
    start = text.find("{")
    end = text.rfind("}") + 1
    if start < 0 or end <= start:
        raise ValueError("Could not parse Azure OpenAI summary response")
    data = json.loads(text[start:end])
    return AISummaryResponse(
        executive_summary=data.get("executive_summary", ""),
        key_insights=data.get("key_insights", []),
        recommendations=data.get("recommendations", []),
        real_world_example=data.get("real_world_example", ""),
        source="azure",
    )
