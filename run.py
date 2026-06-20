"""
Render entrypoint when the service root is the repo (not backend/).

Usage:
  uvicorn run:app --host 0.0.0.0 --port $PORT
"""

from __future__ import annotations

import os
import sys

_BACKEND = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
if _BACKEND not in sys.path:
    sys.path.insert(0, _BACKEND)
os.chdir(_BACKEND)

from app.main import app  # noqa: E402
