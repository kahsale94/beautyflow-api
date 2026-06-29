import hashlib
import hmac
from dataclasses import dataclass

from src.core import (
    BUSINESS_INTEGRATION_SECRET_KEY,
    BUSINESS_INTEGRATION_SECRET_KEY_FALLBACKS,
    BUSINESS_INTEGRATION_SECRET_KEY_ID,
    INTEGRATION_SECRET_KEY,
    INTEGRATION_SECRET_KEY_FALLBACKS,
    INTEGRATION_SECRET_KEY_ID,
    USER_SECRET_KEY,
    USER_SECRET_KEY_FALLBACKS,
    USER_SECRET_KEY_ID,
)


@dataclass(frozen=True)
class JwtKey:
    kid: str
    secret: str


@dataclass(frozen=True)
class JwtKeySet:
    current: JwtKey
    fallbacks: tuple[JwtKey, ...] = ()

    def validation_keys(self, kid: str | None = None) -> tuple[JwtKey, ...]:
        keys = (self.current, *self.fallbacks)
        if kid:
            keys = (
                *(key for key in keys if key.kid == kid),
                *(key for key in keys if key.kid != kid),
            )

        unique_keys: list[JwtKey] = []
        seen_secrets: set[str] = set()
        for key in keys:
            if key.secret in seen_secrets:
                continue
            unique_keys.append(key)
            seen_secrets.add(key.secret)

        return tuple(unique_keys)


def _parse_fallback_keys(env_name: str, entries: list[str]) -> tuple[JwtKey, ...]:
    keys: list[JwtKey] = []
    for index, entry in enumerate(entries, start=1):
        if ":" in entry:
            kid, secret = entry.split(":", 1)
            kid = kid.strip()
            secret = secret.strip()
            if not kid or not secret:
                raise RuntimeError(f"{env_name} inválida; use kid:secret ou secret")
            keys.append(JwtKey(kid=kid, secret=secret))
            continue

        keys.append(JwtKey(kid=f"legacy-{index}", secret=entry))

    return tuple(keys)


JWT_KEY_SETS: dict[str, JwtKeySet] = {
    "user": JwtKeySet(
        current=JwtKey(kid=USER_SECRET_KEY_ID, secret=USER_SECRET_KEY),
        fallbacks=_parse_fallback_keys("USER_SECRET_KEY_FALLBACKS", USER_SECRET_KEY_FALLBACKS),
    ),
    "integration": JwtKeySet(
        current=JwtKey(kid=INTEGRATION_SECRET_KEY_ID, secret=INTEGRATION_SECRET_KEY),
        fallbacks=_parse_fallback_keys("INTEGRATION_SECRET_KEY_FALLBACKS", INTEGRATION_SECRET_KEY_FALLBACKS),
    ),
    "business_integration": JwtKeySet(
        current=JwtKey(kid=BUSINESS_INTEGRATION_SECRET_KEY_ID, secret=BUSINESS_INTEGRATION_SECRET_KEY),
        fallbacks=_parse_fallback_keys(
            "BUSINESS_INTEGRATION_SECRET_KEY_FALLBACKS",
            BUSINESS_INTEGRATION_SECRET_KEY_FALLBACKS,
        ),
    ),
}


def get_jwt_key_set(token_type: str) -> JwtKeySet | None:
    return JWT_KEY_SETS.get(token_type)


def current_hmac_digest(token_type: str, value: str) -> str:
    key_set = JWT_KEY_SETS[token_type]
    return hmac.new(key_set.current.secret.encode("utf-8"), value.encode("utf-8"), hashlib.sha256).hexdigest()


def hmac_digest_candidates(token_type: str, value: str) -> tuple[str, ...]:
    key_set = JWT_KEY_SETS[token_type]
    digests: list[str] = []
    seen: set[str] = set()
    for key in key_set.validation_keys():
        digest = hmac.new(key.secret.encode("utf-8"), value.encode("utf-8"), hashlib.sha256).hexdigest()
        if digest in seen:
            continue
        digests.append(digest)
        seen.add(digest)

    return tuple(digests)
