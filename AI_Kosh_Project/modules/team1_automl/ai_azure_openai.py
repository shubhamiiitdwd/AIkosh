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
from .schemas import AIRecommendResponse, ColumnInfo

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
        )

    raise ValueError("Could not parse Azure OpenAI response")
