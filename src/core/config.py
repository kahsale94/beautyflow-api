import os

from dotenv import load_dotenv

load_dotenv()

def get_required_env(name: str) -> str:
    value = os.getenv(name)
    if value is None or value == "":
        raise RuntimeError(f"Variável de ambiente obrigatória ausente: {name}")
    return value

def get_required_int_env(name: str) -> int:
    return int(get_required_env(name))

ALGORITHM = get_required_env("ALGORITHM")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DATABASE_URL = get_required_env("DATABASE_URL")

USER_SECRET_KEY = get_required_env("USER_SECRET_KEY")
INTEGRATION_SECRET_KEY = get_required_env("INTEGRATION_SECRET_KEY")
BUSINESS_INTEGRATION_SECRET_KEY = get_required_env("BUSINESS_INTEGRATION_SECRET_KEY")

USER_ACCESS_TOKEN_EXPIRE_MINUTES = get_required_int_env("USER_ACCESS_TOKEN_EXPIRE_MINUTES")
USER_REFRESH_TOKEN_EXPIRE_DAYS = get_required_int_env("USER_REFRESH_TOKEN_EXPIRE_DAYS")
INTEGRATION_TOKEN_EXPIRE_DAYS = get_required_int_env("INTEGRATION_TOKEN_EXPIRE_DAYS")
BUSINESS_INTEGRATION_TOKEN_EXPIRE_MINUTES = get_required_int_env("BUSINESS_INTEGRATION_TOKEN_EXPIRE_MINUTES")

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "").split(",") if os.getenv("CORS_ORIGINS") else []

ADMIN_ACCESS_COOKIE = os.getenv("ADMIN_ACCESS_COOKIE")
ADMIN_REFRESH_COOKIE = os.getenv("ADMIN_REFRESH_COOKIE")
ADMIN_CSRF_COOKIE = os.getenv("ADMIN_CSRF_COOKIE")
ADMIN_FLASH_COOKIE = os.getenv("ADMIN_FLASH_COOKIE")
ADMIN_BUSINESS_COOKIE = os.getenv("ADMIN_BUSINESS_COOKIE")

ADMIN_COOKIE_SECURE = os.getenv("ADMIN_COOKIE_SECURE",
    "true" if ENVIRONMENT == "production" else "false").lower() in {"true", "1", "yes", "on"}

ADMIN_COOKIE_SAMESITE = os.getenv("ADMIN_COOKIE_SAMESITE")
ADMIN_COOKIE_PATH = os.getenv("ADMIN_COOKIE_PATH")