from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv()


GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
GROQ_BASE_URL: str = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
LLM_MODEL: str = os.getenv("LLM_MODEL", "openai/gpt-oss-20b")

APPROVAL_THRESHOLD: float = float(os.getenv("APPROVAL_THRESHOLD", "10000"))
JUST_BELOW_BAND: float = float(os.getenv("JUST_BELOW_BAND", "0.05"))
BUSINESS_HOUR_START: int = int(os.getenv("BUSINESS_HOUR_START", "7"))
BUSINESS_HOUR_END: int = int(os.getenv("BUSINESS_HOUR_END", "19"))
RARE_COMBO_MAX_SHARE: float = float(os.getenv("RARE_COMBO_MAX_SHARE", "0.01"))

MAX_UPLOAD_MB: int = int(os.getenv("MAX_UPLOAD_MB", "15"))
