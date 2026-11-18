import hmac
from fastapi import APIRouter, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from app.core.config import get_settings, BASE_DIR
from app.core.auth import create_session_cookie, COOKIE_NAME

auth_router = APIRouter()
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

@auth_router.get("/login", response_class=HTMLResponse)
def login_page(request: Request, error: str = ""):
    return templates.TemplateResponse(
        request=request,
        name="login.html",
        context={"error": error}
    )

@auth_router.post("/login")
def login_submit(request: Request, password: str = Form(...)):
    settings = get_settings()
    # Constant-time comparison to prevent timing attacks
    if hmac.compare_digest(password, settings.app_password):
        response = RedirectResponse(url="/", status_code=303)
        create_session_cookie(response, settings)
        return response
    return templates.TemplateResponse(
        request=request,
        name="login.html",
        context={"error": "Incorrect password. Please try again."},
        status_code=401,
    )

@auth_router.get("/logout")
def logout():
    response = RedirectResponse(url="/login", status_code=303)
    response.delete_cookie(COOKIE_NAME)
    return response

