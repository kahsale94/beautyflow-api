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

def get_optional_int_env(name: str, default: int) -> int:
    value = os.getenv(name)
    return int(value) if value not in {None, ""} else default

def get_env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.lower() in {"true", "1", "yes", "on"}

def get_env_list(name: str) -> list[str]:
    value = os.getenv(name, "")
    return [item.strip() for item in value.split(",") if item.strip()]

ALGORITHM = get_required_env("ALGORITHM")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DATABASE_URL = get_required_env("DATABASE_URL")
REDIS_URL = os.getenv("REDIS_URL")

USER_SECRET_KEY = get_required_env("USER_SECRET_KEY")
INTEGRATION_SECRET_KEY = get_required_env("INTEGRATION_SECRET_KEY")
BUSINESS_INTEGRATION_SECRET_KEY = get_required_env("BUSINESS_INTEGRATION_SECRET_KEY")
USER_SECRET_KEY_ID = os.getenv("USER_SECRET_KEY_ID", "current")
INTEGRATION_SECRET_KEY_ID = os.getenv("INTEGRATION_SECRET_KEY_ID", "current")
BUSINESS_INTEGRATION_SECRET_KEY_ID = os.getenv("BUSINESS_INTEGRATION_SECRET_KEY_ID", "current")
USER_SECRET_KEY_FALLBACKS = get_env_list("USER_SECRET_KEY_FALLBACKS")
INTEGRATION_SECRET_KEY_FALLBACKS = get_env_list("INTEGRATION_SECRET_KEY_FALLBACKS")
BUSINESS_INTEGRATION_SECRET_KEY_FALLBACKS = get_env_list("BUSINESS_INTEGRATION_SECRET_KEY_FALLBACKS")

USER_ACCESS_TOKEN_EXPIRE_MINUTES = get_required_int_env("USER_ACCESS_TOKEN_EXPIRE_MINUTES")
USER_REFRESH_TOKEN_EXPIRE_DAYS = get_required_int_env("USER_REFRESH_TOKEN_EXPIRE_DAYS")
INTEGRATION_TOKEN_EXPIRE_DAYS = get_required_int_env("INTEGRATION_TOKEN_EXPIRE_DAYS")
BUSINESS_INTEGRATION_TOKEN_EXPIRE_MINUTES = get_required_int_env("BUSINESS_INTEGRATION_TOKEN_EXPIRE_MINUTES")

CORS_ORIGINS = get_env_list("CORS_ORIGINS")

USER_REFRESH_COOKIE = os.getenv("USER_REFRESH_COOKIE", "bf_refresh_token")
USER_REFRESH_COOKIE_PATH = os.getenv("USER_REFRESH_COOKIE_PATH", "/v1/auth")
USER_REFRESH_COOKIE_SAMESITE = os.getenv("USER_REFRESH_COOKIE_SAMESITE", "lax")
USER_REFRESH_COOKIE_SECURE = get_env_bool("USER_REFRESH_COOKIE_SECURE", ENVIRONMENT == "production")

ADMIN_ACCESS_COOKIE = os.getenv("ADMIN_ACCESS_COOKIE", "bf_admin_access")
ADMIN_REFRESH_COOKIE = os.getenv("ADMIN_REFRESH_COOKIE", "bf_admin_refresh")
ADMIN_CSRF_COOKIE = os.getenv("ADMIN_CSRF_COOKIE", "bf_admin_csrf")
ADMIN_FLASH_COOKIE = os.getenv("ADMIN_FLASH_COOKIE", "bf_admin_flash")
ADMIN_BUSINESS_COOKIE = os.getenv("ADMIN_BUSINESS_COOKIE", "bf_admin_business")

ADMIN_COOKIE_SECURE = get_env_bool("ADMIN_COOKIE_SECURE", ENVIRONMENT == "production")
ADMIN_COOKIE_SAMESITE = os.getenv("ADMIN_COOKIE_SAMESITE", "lax")
ADMIN_COOKIE_PATH = os.getenv("ADMIN_COOKIE_PATH", "/admin")

RATE_LIMIT_REDIS_URL = os.getenv("RATE_LIMIT_REDIS_URL", REDIS_URL)
RATE_LIMIT_MAX_REQUESTS = get_optional_int_env("RATE_LIMIT_MAX_REQUESTS", 300)
RATE_LIMIT_WINDOW_SECONDS = get_optional_int_env("RATE_LIMIT_WINDOW_SECONDS", 60)
RATE_LIMIT_AUTH_MAX_REQUESTS = get_optional_int_env("RATE_LIMIT_AUTH_MAX_REQUESTS", 10)
RATE_LIMIT_AUTH_WINDOW_SECONDS = get_optional_int_env("RATE_LIMIT_AUTH_WINDOW_SECONDS", 60)
TRUSTED_PROXY_IPS = get_env_list("TRUSTED_PROXY_IPS")
N8N_ERROR_WEBHOOK_URL = os.getenv("N8N_ERROR_WEBHOOK_URL")
N8N_WEBHOOK_HEADER = os.getenv("N8N_WEBHOOK_HEADER")
N8N_WEBHOOK_SECRET = os.getenv("N8N_WEBHOOK_SECRET")
EVOLUTION_API_URL = os.getenv("EVOLUTION_API_URL")
EVOLUTION_API_KEY = os.getenv("EVOLUTION_API_KEY")
EVOLUTION_WEBHOOK_URL = os.getenv("EVOLUTION_WEBHOOK_URL")
EVOLUTION_INSTANCE_PREFIX = os.getenv("EVOLUTION_INSTANCE_PREFIX", "beautyflow")
EVOLUTION_REQUEST_TIMEOUT_SECONDS = get_optional_int_env("EVOLUTION_REQUEST_TIMEOUT_SECONDS", 15)

if ALGORITHM not in {"HS256", "HS384", "HS512"}:
    raise RuntimeError("ALGORITHM deve usar HS256, HS384 ou HS512")

if USER_REFRESH_COOKIE_SAMESITE not in {"lax", "strict", "none"}:
    raise RuntimeError("USER_REFRESH_COOKIE_SAMESITE inválido")

if ADMIN_COOKIE_SAMESITE not in {"lax", "strict", "none"}:
    raise RuntimeError("ADMIN_COOKIE_SAMESITE inválido")

if USER_REFRESH_COOKIE_SAMESITE == "none" and not USER_REFRESH_COOKIE_SECURE:
    raise RuntimeError("USER_REFRESH_COOKIE_SAMESITE=none exige cookie Secure")

if ADMIN_COOKIE_SAMESITE == "none" and not ADMIN_COOKIE_SECURE:
    raise RuntimeError("ADMIN_COOKIE_SAMESITE=none exige cookie Secure")

if ENVIRONMENT == "production":
    secret_values = {
        "USER_SECRET_KEY": USER_SECRET_KEY,
        "INTEGRATION_SECRET_KEY": INTEGRATION_SECRET_KEY,
        "BUSINESS_INTEGRATION_SECRET_KEY": BUSINESS_INTEGRATION_SECRET_KEY,
    }
    for name, fallback_entries in {
        "USER_SECRET_KEY_FALLBACKS": USER_SECRET_KEY_FALLBACKS,
        "INTEGRATION_SECRET_KEY_FALLBACKS": INTEGRATION_SECRET_KEY_FALLBACKS,
        "BUSINESS_INTEGRATION_SECRET_KEY_FALLBACKS": BUSINESS_INTEGRATION_SECRET_KEY_FALLBACKS,
    }.items():
        for index, entry in enumerate(fallback_entries, start=1):
            secret_values[f"{name}[{index}]"] = entry.split(":", 1)[1].strip() if ":" in entry else entry

    weak_secrets = [name for name, value in secret_values.items() if len(value) < 32]
    if weak_secrets:
        raise RuntimeError(f"Segredos JWT devem ter ao menos 32 caracteres: {', '.join(weak_secrets)}")

    if not USER_REFRESH_COOKIE_SECURE or not ADMIN_COOKIE_SECURE:
        raise RuntimeError("Cookies de autenticação devem ser Secure em produção")

    missing_error_reporting = [
        name
        for name, value in {
            "N8N_ERROR_WEBHOOK_URL": N8N_ERROR_WEBHOOK_URL,
            "N8N_WEBHOOK_HEADER": N8N_WEBHOOK_HEADER,
            "N8N_WEBHOOK_SECRET": N8N_WEBHOOK_SECRET,
        }.items()
        if not value
    ]
    if missing_error_reporting:
        raise RuntimeError(
            "Monitoramento de erros obrigatório em produção: "
            + ", ".join(missing_error_reporting)
        )

    missing_evolution = [
        name
        for name, value in {
            "EVOLUTION_API_URL": EVOLUTION_API_URL,
            "EVOLUTION_API_KEY": EVOLUTION_API_KEY,
            "EVOLUTION_WEBHOOK_URL": EVOLUTION_WEBHOOK_URL,
        }.items()
        if not value
    ]
    if missing_evolution:
        raise RuntimeError(
            "Evolution API obrigatória em produção: "
            + ", ".join(missing_evolution)
        )
