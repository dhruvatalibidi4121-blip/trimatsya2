from __future__ import annotations
import httpx
from ..core.config import settings


def emit_n8n_event(event: str, data: dict) -> bool:
    """Best-effort POST of platform events to an n8n webhook (if configured)."""
    url = (settings.n8n_webhook_url or "").strip()
    if not url:
        return False
    payload = {"event": event, "source": "tri-matsya", "data": data}
    headers = {"Content-Type": "application/json"}
    if settings.n8n_webhook_secret:
        headers["X-N8N-Webhook-Secret"] = settings.n8n_webhook_secret
    try:
        with httpx.Client(timeout=5.0) as client:
            r = client.post(url, json=payload, headers=headers)
            return r.status_code < 400
    except Exception:
        return False
