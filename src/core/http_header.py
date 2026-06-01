from fastapi import Request
from starlette.responses import Response

from src.core.config import ENVIRONMENT

SENSITIVE_HEADER_NAMES = {
    "authorization",
    "cookie",
    "set-cookie",
    "x-api-key",
}

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
}

ADMIN_CONTENT_SECURITY_POLICY = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net; "
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
    "img-src 'self' data:; "
    "font-src 'self' data: https://cdn.jsdelivr.net; "
    "connect-src 'self'; "
    "frame-ancestors 'self'; "
    "base-uri 'self'; "
    "form-action 'self'"
)

def get_forwarded_for(request: Request) -> str | None:
    value = request.headers.get("x-forwarded-for")
    if not value:
        return None

    return value.split(",")[0].strip()


def get_real_ip(request: Request) -> str | None:
    return request.headers.get("x-real-ip")


def get_user_agent(request: Request) -> str | None:
    return request.headers.get("user-agent")


def apply_security_headers(request: Request, response: Response) -> None:
    for header_name, header_value in SECURITY_HEADERS.items():
        response.headers.setdefault(header_name, header_value)

    if ENVIRONMENT == "production" or request.url.scheme == "https":
        response.headers.setdefault(
            "Strict-Transport-Security",
            "max-age=31536000; includeSubDomains",
        )

    if request.url.path.startswith("/admin"):
        response.headers.setdefault(
            "Content-Security-Policy",
            ADMIN_CONTENT_SECURITY_POLICY,
        )