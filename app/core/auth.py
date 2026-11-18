import hmac
import hashlib
import time
from fastapi import Request, HTTPException
from fastapi.responses import RedirectResponse
from app.core.config import get_settings

COOKIE_NAME = "it_session"

def _sign(value: str, secret: str) -> str:
    """HMAC-SHA256 sign a value with the secret key."""
    return hmac.new(secret.encode(), value.encode(), hashlib.sha256).hexdigest()

def create_session_cookie(response, settings=None):
    """Create a signed session cookie with expiry timestamp."""
    if settings is None:
        settings = get_settings()
    expire_at = int(time.time()) + settings.session_expire_hours * 3600
    payload = f"authenticated:{expire_at}"
    signature = _sign(payload, settings.session_secret)
    token = f"{payload}:{signature}"
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,          # Not accessible via JS (XSS safe)
        samesite="lax",
        max_age=settings.session_expire_hours * 3600,
    )
    return response

def verify_session(request: Request) -> bool:
    """Return True if the request has a valid, non-expired session cookie."""
    settings = get_settings()
    token = request.cookies.get(COOKIE_NAME, "")
    if not token:
        return False
    parts = token.rsplit(":", 1)
    if len(parts) != 2:
        return False
    payload, signature = parts
    expected = _sign(payload, settings.session_secret)
    if not hmac.compare_digest(signature, expected):
        return False  # Tampered cookie
    try:
        _, expire_at = payload.split(":")
        if int(time.time()) > int(expire_at):
            return False  # Expired
    except ValueError:
        return False
    return True

def require_login(request: Request):
    """FastAPI Depends — raises 401 if session is invalid (for API routes)."""
    if not verify_session(request):
        raise HTTPException(status_code=401, detail="Not authenticated. Please log in.")
    return True
