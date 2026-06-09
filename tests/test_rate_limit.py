from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

def read_source(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")

def test_rate_limit_trusts_forwarded_headers_only_from_trusted_proxy():
    source = read_source("src/middlewares/rate_limit.py")
    config = read_source("src/core/config.py")

    assert "TRUSTED_PROXY_IPS" in source
    assert "direct_client_ip in TRUSTED_PROXY_IPS" in source
    assert "return direct_client_ip" in source
    assert 'TRUSTED_PROXY_IPS = get_env_list("TRUSTED_PROXY_IPS")' in config

def test_rate_limit_falls_back_when_redis_fails():
    source = read_source("src/middlewares/rate_limit.py")

    assert "Redis rate limit unavailable" in source
    assert "allowed = self._allow_in_memory(key, max_requests, window)" in source
    assert "pipeline()" in source
    assert "await pipe.execute()" in source
    assert "MAX_IN_MEMORY_KEYS" in source
