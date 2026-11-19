from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from app.api.routes import router
from app.api.auth_routes import auth_router
from app.core.config import get_settings, BASE_DIR
from app.core.logging import configure_logging
from app.core.auth import verify_session
from app.services.audit import init_db


configure_logging()
settings = get_settings()
init_db()

app = FastAPI(title=settings.app_name, version="1.0.0")

# Auth routes (login/logout) — no authentication required for these
app.include_router(auth_router)

# API + main router
app.include_router(router)
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    """Redirect unauthenticated users to /login for all page routes."""
    # Paths that never require auth
    public_paths = {"/login", "/static", "/preview"}
    path = request.url.path

    # Allow static files and login page always
    if any(path.startswith(p) for p in public_paths):
        return await call_next(request)

    # API routes return 401 JSON (handled by Depends in routes.py)
    if path.startswith("/api"):
        return await call_next(request)

    # For page routes: redirect to /login if not authenticated
    if not verify_session(request):
        return RedirectResponse(url="/login", status_code=303)

    return await call_next(request)

@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={"app_name": settings.app_name}
    )

@app.get("/preview", response_class=HTMLResponse)
def preview(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={"app_name": settings.app_name}
    )

