import asyncio
from collections.abc import Mapping, Sequence
from typing import Any

import httpx


class CovercutConfigurationError(Exception):
    pass


class CovercutAPIError(Exception):
    def __init__(
        self,
        status_code: int,
        detail: str = "",
        *,
        code: str | None = None,
        retryable: bool = False,
    ):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail
        self.code = code
        self.retryable = retryable


class CovercutRateLimitError(CovercutAPIError):
    pass


class CovercutAmbiguousSendError(CovercutAPIError):
    """The provider may have accepted a message before the connection failed."""


class CovercutMediaError(CovercutAPIError):
    pass


class CovercutClient:
    READ_RETRY_DELAYS_SECONDS = (0.15, 0.35)

    def __init__(
        self,
        base_url: str | None,
        api_key: str | None,
        api_secret: str | None,
        timeout_seconds: int = 15,
        transport: httpx.AsyncBaseTransport | None = None,
    ):
        self.base_url = (base_url or "").rstrip("/")
        self.api_key = api_key or ""
        self.api_secret = api_secret or ""
        self.timeout_seconds = timeout_seconds
        self.transport = transport

    @property
    def configured(self) -> bool:
        return bool(self.base_url and self.api_key and self.api_secret)

    def _ensure_configured(self) -> None:
        if not self.configured:
            raise CovercutConfigurationError("CoverCut API não configurada.")

    def _client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(
            base_url=self.base_url,
            headers={
                "X-API-Key": self.api_key,
                "X-API-Secret": self.api_secret,
                "Accept": "application/json",
            },
            timeout=self.timeout_seconds,
            transport=self.transport,
        )

    def _sanitize(self, value: Any) -> str:
        detail = str(value or "")[:500]
        for secret in (self.api_key, self.api_secret):
            if secret:
                detail = detail.replace(secret, "[redacted]")
        return detail

    def _response_error(self, response: httpx.Response) -> CovercutAPIError:
        code = None
        detail = ""
        try:
            payload = response.json()
            if isinstance(payload, Mapping):
                provider_error = payload.get("error")
                if isinstance(provider_error, Mapping):
                    code = self._sanitize(provider_error.get("code") or payload.get("code")) or None
                    detail = self._sanitize(
                        provider_error.get("message")
                        or provider_error.get("detail")
                        or payload.get("message")
                    )
                else:
                    code = self._sanitize(payload.get("code")) or None
                    detail = self._sanitize(
                        provider_error
                        or payload.get("message")
                        or payload.get("detail")
                    )
        except ValueError:
            detail = self._sanitize(response.text)

        if not detail:
            detail = f"CoverCut respondeu com HTTP {response.status_code}."

        retryable = response.status_code == 429 or response.status_code >= 500
        error_type = CovercutRateLimitError if response.status_code == 429 else CovercutAPIError
        return error_type(
            response.status_code,
            detail,
            code=code,
            retryable=retryable,
        )

    async def _request_json(
        self,
        method: str,
        path: str,
        *,
        json: dict[str, Any] | None = None,
        params: dict[str, str] | None = None,
        retry_safe: bool = False,
        ambiguous_on_network_error: bool = False,
    ) -> dict[str, Any]:
        self._ensure_configured()
        attempts = 1 + (len(self.READ_RETRY_DELAYS_SECONDS) if retry_safe else 0)

        for attempt in range(attempts):
            try:
                async with self._client() as client:
                    response = await client.request(method, path, json=json, params=params)
            except httpx.HTTPError as exc:
                if retry_safe and attempt + 1 < attempts:
                    await asyncio.sleep(self.READ_RETRY_DELAYS_SECONDS[attempt])
                    continue
                error_type = CovercutAmbiguousSendError if ambiguous_on_network_error else CovercutAPIError
                raise error_type(
                    503,
                    "Falha de comunicação com a CoverCut API.",
                    retryable=not ambiguous_on_network_error,
                ) from exc

            if response.is_error:
                error = self._response_error(response)
                if retry_safe and error.retryable and attempt + 1 < attempts:
                    await asyncio.sleep(self.READ_RETRY_DELAYS_SECONDS[attempt])
                    continue
                raise error

            if response.status_code == 204 or not response.content:
                return {}

            try:
                payload = response.json()
            except ValueError as exc:
                raise CovercutAPIError(502, "Resposta inválida da CoverCut API.") from exc

            if not isinstance(payload, dict):
                raise CovercutAPIError(502, "Resposta inválida da CoverCut API.")

            if payload.get("success") is False:
                synthetic_response = httpx.Response(
                    400,
                    json=payload,
                    request=response.request,
                )
                raise self._response_error(synthetic_response)

            return payload

        raise CovercutAPIError(503, "Falha de comunicação com a CoverCut API.")

    async def create_saas_account(
        self,
        *,
        company_name: str,
        external_id: str,
    ) -> dict[str, Any]:
        return await self._request_json(
            "POST",
            "/saas/create",
            json={
                "company_name": company_name[:100],
                "number_limit": 1,
                "external_id": external_id[:191],
                "title": "Conectar WhatsApp",
                "hide_greeting": True,
                "autostart": True,
                "layout": "popup",
            },
            retry_safe=True,
        )

    async def list_saas_accounts(self, *, external_id: str) -> dict[str, Any]:
        return await self._request_json(
            "GET",
            "/saas/list",
            params={"external_id": external_id[:191]},
            retry_safe=True,
        )

    async def change_number_status(self, *, phone_number_id: str, action: str) -> dict[str, Any]:
        if action not in {"suspend", "activate", "disconnect"}:
            raise ValueError("Ação de número CoverCut inválida.")
        return await self._request_json(
            "POST",
            "/saas/number_status",
            json={"phone_number_id": phone_number_id, "action": action},
            retry_safe=action == "disconnect",
        )

    async def get_number_status(self, *, phone_number_id: str) -> dict[str, Any]:
        return await self._request_json(
            "GET",
            "/numbers/status",
            params={"from": phone_number_id},
            retry_safe=True,
        )

    async def send_text(
        self,
        *,
        phone_number_id: str,
        to: str,
        text: str,
    ) -> dict[str, Any]:
        return await self._request_json(
            "POST",
            "/messages/send",
            json={
                "from": phone_number_id,
                "to": to,
                "type": "text",
                "text": {"body": text},
                "agent_name": "Beautyflow",
            },
            ambiguous_on_network_error=True,
        )

    async def send_template(
        self,
        *,
        phone_number_id: str,
        to: str,
        name: str,
        language: str,
        body_parameters: Sequence[str],
    ) -> dict[str, Any]:
        return await self._request_json(
            "POST",
            "/messages/template",
            json={
                "from": phone_number_id,
                "to": to,
                "type": "template",
                "template": {
                    "name": name,
                    "language": {"code": language},
                    "components": [
                        {
                            "type": "body",
                            "parameters": [
                                {"type": "text", "text": str(value)}
                                for value in body_parameters
                            ],
                        }
                    ],
                },
                "agent_name": "Beautyflow",
            },
            ambiguous_on_network_error=True,
        )

    async def get_media(
        self,
        *,
        phone_number_id: str,
        media_id: str,
        max_bytes: int,
        allowed_mime_prefixes: tuple[str, ...] = ("audio/",),
    ) -> tuple[bytes, str]:
        self._ensure_configured()
        try:
            async with self._client() as client:
                async with client.stream(
                    "GET",
                    "/media/get",
                    params={"id": media_id, "from": phone_number_id, "mode": "stream"},
                ) as response:
                    if response.is_error:
                        raise self._response_error(response)

                    mime_type = response.headers.get("content-type", "application/octet-stream").split(";", 1)[0].lower()
                    if not any(mime_type.startswith(prefix) for prefix in allowed_mime_prefixes):
                        raise CovercutMediaError(415, "Tipo de mídia recebido não é permitido.")

                    declared_size = response.headers.get("content-length")
                    if declared_size and int(declared_size) > max_bytes:
                        raise CovercutMediaError(413, "Mídia recebida excede o limite permitido.")

                    chunks: list[bytes] = []
                    size = 0
                    async for chunk in response.aiter_bytes():
                        size += len(chunk)
                        if size > max_bytes:
                            raise CovercutMediaError(413, "Mídia recebida excede o limite permitido.")
                        chunks.append(chunk)
        except CovercutAPIError:
            raise
        except (httpx.HTTPError, ValueError) as exc:
            raise CovercutMediaError(503, "Falha ao obter mídia da CoverCut API.") from exc

        return b"".join(chunks), mime_type
