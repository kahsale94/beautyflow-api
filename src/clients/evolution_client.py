from typing import Any
from urllib.parse import quote

import httpx


class EvolutionConfigurationError(Exception):
    pass


class EvolutionAPIError(Exception):

    def __init__(self, status_code: int, detail: str = ""):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


class EvolutionClient:

    def __init__(
        self,
        base_url: str | None,
        api_key: str | None,
        timeout_seconds: int = 15,
        transport: httpx.AsyncBaseTransport | None = None,
    ):
        self.base_url = (base_url or "").rstrip("/")
        self.api_key = api_key or ""
        self.timeout_seconds = timeout_seconds
        self.transport = transport

    @property
    def configured(self) -> bool:
        return bool(self.base_url and self.api_key)

    def _ensure_configured(self) -> None:
        if not self.configured:
            raise EvolutionConfigurationError("Evolution API não configurada.")

    async def _request(
        self,
        method: str,
        path: str,
        json: dict[str, Any] | None = None,
        params: dict[str, str] | None = None,
    ) -> Any:
        self._ensure_configured()

        async with httpx.AsyncClient(
            base_url=self.base_url,
            headers={"apikey": self.api_key, "Accept": "application/json"},
            timeout=self.timeout_seconds,
            transport=self.transport,
        ) as client:
            try:
                response = await client.request(method, path, json=json, params=params)
            except httpx.HTTPError as exc:
                raise EvolutionAPIError(503, "Falha de comunicação com a Evolution API.") from exc

        if response.is_error:
            detail = ""
            try:
                payload = response.json()
                if isinstance(payload, dict):
                    detail = str(payload.get("message") or payload.get("error") or payload.get("response") or "")
            except ValueError:
                detail = response.text

            raise EvolutionAPIError(response.status_code, detail[:300])

        if response.status_code == 204 or not response.content:
            return {}

        try:
            return response.json()
        except ValueError as exc:
            raise EvolutionAPIError(502, "Resposta inválida da Evolution API.") from exc

    @staticmethod
    def _instance_path(instance_name: str) -> str:
        return quote(instance_name, safe="")

    async def create_instance(self, instance_name: str) -> dict[str, Any]:
        return await self._request(
            "POST",
            "/instance/create",
            json={
                "instanceName": instance_name,
                "qrcode": True,
                "integration": "WHATSAPP-BAILEYS",
            },
        )

    async def connect_instance(self, instance_name: str) -> dict[str, Any]:
        return await self._request("GET", f"/instance/connect/{self._instance_path(instance_name)}")

    async def connection_state(self, instance_name: str) -> dict[str, Any]:
        return await self._request("GET", f"/instance/connectionState/{self._instance_path(instance_name)}")

    async def fetch_instances(
        self,
        instance_name: str | None = None,
        instance_id: str | None = None,
        number: str | None = None,
    ) -> Any:
        params = {}
        if instance_name:
            params["instanceName"] = instance_name
        if instance_id:
            params["instanceId"] = instance_id
        if number:
            params["number"] = number

        return await self._request("GET", "/instance/fetchInstances", params=params or None)

    async def server_info(self) -> dict[str, Any]:
        payload = await self._request("GET", "/")
        return payload if isinstance(payload, dict) else {}

    async def set_webhook(
        self,
        instance_name: str,
        webhook_url: str,
        webhook_header: str,
        webhook_secret: str,
    ) -> dict[str, Any]:
        server_info = await self.server_info()
        version = str(server_info.get("version") or "")
        major_version = version.split(".", 1)[0]

        webhook = {
            "enabled": True,
            "url": webhook_url,
            "events": ["MESSAGES_UPSERT"],
            "headers": {webhook_header: webhook_secret},
            "base64": True,
        }

        # Evolution v2 wraps webhook settings and uses webhookByEvents.
        payload = (
            {"webhook": {**webhook, "webhookByEvents": False}}
            if major_version == "2"
            else webhook
        )

        return await self._request(
            "POST",
            f"/webhook/set/{self._instance_path(instance_name)}",
            json=payload,
        )

    async def logout_instance(self, instance_name: str) -> dict[str, Any]:
        return await self._request("DELETE", f"/instance/logout/{self._instance_path(instance_name)}")

    async def delete_instance(self, instance_name: str) -> dict[str, Any]:
        return await self._request("DELETE", f"/instance/delete/{self._instance_path(instance_name)}")
