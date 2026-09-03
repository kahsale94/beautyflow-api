from dataclasses import dataclass
from typing import Any, Protocol

from src.clients import CovercutClient, EvolutionClient
from src.models import WhatsAppConnection, WhatsAppConnectionStatus, WhatsAppProviderType


def normalize_connection_status(provider: str, provider_status: str | None) -> str:
    status = str(provider_status or "").strip().lower()
    if status in {"open", "connected", "active"}:
        return WhatsAppConnectionStatus.connected.value
    if status in {"new", "creating", "connecting", "pending"}:
        return WhatsAppConnectionStatus.connecting.value
    if status in {"close", "closed", "disconnected", "missing", "suspended", "inactive"}:
        return WhatsAppConnectionStatus.disconnected.value
    if status in {"", "not_configured"}:
        return WhatsAppConnectionStatus.not_configured.value
    return WhatsAppConnectionStatus.error.value


@dataclass(frozen=True)
class WhatsAppOperationContext:
    business_id: int
    integration_id: int
    business_name: str
    external_reference: str
    connection: WhatsAppConnection | None = None


@dataclass(frozen=True)
class ProviderConnectionResult:
    provider: str
    provider_connection_id: str
    status: str
    provider_status: str
    phone: str | None = None
    provider_account_id: str | None = None
    business_account_id: str | None = None
    external_reference: str | None = None
    onboarding_url: str | None = None
    qr_code: str | None = None
    pairing_code: str | None = None
    metadata: dict[str, Any] | None = None


class WhatsAppProvider(Protocol):
    name: str

    @property
    def configured(self) -> bool: ...

    async def start_connection(self, context: WhatsAppOperationContext) -> ProviderConnectionResult: ...

    async def get_connection_status(self, context: WhatsAppOperationContext) -> ProviderConnectionResult: ...

    async def disconnect(self, context: WhatsAppOperationContext) -> ProviderConnectionResult: ...

    async def remove(self, context: WhatsAppOperationContext) -> None: ...

    async def send_text(self, connection: WhatsAppConnection, to: str, text: str) -> dict[str, Any]: ...

    async def send_template(
        self,
        connection: WhatsAppConnection,
        to: str,
        name: str,
        language: str,
        body_parameters: list[str],
    ) -> dict[str, Any]: ...


class EvolutionWhatsAppProvider:
    name = WhatsAppProviderType.evolution.value

    def __init__(self, lifecycle_service: Any, client: EvolutionClient):
        self.lifecycle_service = lifecycle_service
        self.client = client

    @property
    def configured(self) -> bool:
        return self.lifecycle_service.configured

    @staticmethod
    def _result(result) -> ProviderConnectionResult:
        return ProviderConnectionResult(
            provider=WhatsAppProviderType.evolution.value,
            provider_connection_id=result.instance_name,
            status=normalize_connection_status("evolution", result.state),
            provider_status=result.state,
            phone=result.phone,
            qr_code=result.qr_code,
            pairing_code=result.pairing_code,
            metadata={"compatibility_record": "evolution_instances"},
        )

    async def start_connection(self, context: WhatsAppOperationContext) -> ProviderConnectionResult:
        return self._result(
            await self.lifecycle_service.provision(context.business_id, context.integration_id)
        )

    async def get_connection_status(self, context: WhatsAppOperationContext) -> ProviderConnectionResult:
        return self._result(
            await self.lifecycle_service.refresh_status(context.business_id, context.integration_id)
        )

    async def refresh_qr_code(self, context: WhatsAppOperationContext) -> ProviderConnectionResult:
        return self._result(
            await self.lifecycle_service.refresh_qr_code(context.business_id, context.integration_id)
        )

    async def disconnect(self, context: WhatsAppOperationContext) -> ProviderConnectionResult:
        return self._result(
            await self.lifecycle_service.logout(context.business_id, context.integration_id)
        )

    async def remove(self, context: WhatsAppOperationContext) -> None:
        await self.lifecycle_service.delete(context.business_id, context.integration_id)

    async def send_text(self, connection: WhatsAppConnection, to: str, text: str) -> dict[str, Any]:
        return await self.client.send_text(connection.provider_connection_id, to, text)

    async def send_template(
        self,
        connection: WhatsAppConnection,
        to: str,
        name: str,
        language: str,
        body_parameters: list[str],
    ) -> dict[str, Any]:
        raise NotImplementedError("Templates não são suportados pelo provider Evolution configurado.")


class CovercutWhatsAppProvider:
    name = WhatsAppProviderType.covercut.value

    def __init__(self, client: CovercutClient):
        self.client = client

    @property
    def configured(self) -> bool:
        return self.client.configured

    @staticmethod
    def _require_connection(context: WhatsAppOperationContext) -> WhatsAppConnection:
        if context.connection is None:
            raise ValueError("Conexão CoverCut não encontrada.")
        return context.connection

    async def start_connection(self, context: WhatsAppOperationContext) -> ProviderConnectionResult:
        connection = context.connection
        if (
            connection
            and not connection.provider_connection_id.startswith("pending:")
            and str(connection.provider_status or "").lower() == "suspended"
        ):
            payload = await self.client.change_number_status(
                phone_number_id=connection.provider_connection_id,
                action="activate",
            )
            raw_status = str(payload.get("status") or "active")
            return ProviderConnectionResult(
                provider=self.name,
                provider_connection_id=connection.provider_connection_id,
                status=normalize_connection_status(self.name, raw_status),
                provider_status=raw_status,
                phone=connection.phone,
                provider_account_id=connection.provider_account_id,
                business_account_id=connection.business_account_id,
                external_reference=context.external_reference,
            )

        payload = await self.client.create_saas_account(
            company_name=context.business_name,
            external_id=context.external_reference,
        )
        account_id = payload.get("sub_customer_id")
        direct_link = payload.get("direct_link")
        if not account_id or not direct_link:
            from src.clients import CovercutAPIError

            raise CovercutAPIError(502, "Resposta de onboarding CoverCut incompleta.")

        provider_connection_id = (
            connection.provider_connection_id
            if connection and not connection.provider_connection_id.startswith("pending:")
            else f"pending:{context.external_reference}"
        )
        return ProviderConnectionResult(
            provider=self.name,
            provider_connection_id=provider_connection_id,
            status=(
                connection.status
                if connection and connection.status == WhatsAppConnectionStatus.connected.value
                else WhatsAppConnectionStatus.connecting.value
            ),
            provider_status=(connection.provider_status if connection else None) or "pending",
            phone=connection.phone if connection else None,
            provider_account_id=str(account_id),
            business_account_id=connection.business_account_id if connection else None,
            external_reference=context.external_reference,
            onboarding_url=str(direct_link),
            metadata={"reused_existing": bool(payload.get("reused_existing"))},
        )

    async def get_connection_status(self, context: WhatsAppOperationContext) -> ProviderConnectionResult:
        connection = self._require_connection(context)
        if connection.provider_connection_id.startswith("pending:"):
            payload = await self.client.list_saas_accounts(external_id=context.external_reference)
            clients = payload.get("clients") if isinstance(payload.get("clients"), list) else []
            account = next(
                (
                    item
                    for item in clients
                    if isinstance(item, dict)
                    and str(item.get("external_id") or "") == context.external_reference
                ),
                None,
            )
            numbers = account.get("numbers") if isinstance(account, dict) else []
            number = numbers[0] if isinstance(numbers, list) and len(numbers) == 1 else None
            if not isinstance(number, dict) or not number.get("phone_number_id"):
                return ProviderConnectionResult(
                    provider=self.name,
                    provider_connection_id=connection.provider_connection_id,
                    status=WhatsAppConnectionStatus.connecting.value,
                    provider_status="pending",
                    provider_account_id=(
                        str(account.get("id")) if isinstance(account, dict) and account.get("id") else connection.provider_account_id
                    ),
                    external_reference=context.external_reference,
                )
            phone_number_id = str(number["phone_number_id"])
            raw_status = str(number.get("status") or "active")
            return ProviderConnectionResult(
                provider=self.name,
                provider_connection_id=phone_number_id,
                status=normalize_connection_status(self.name, raw_status),
                provider_status=raw_status,
                phone=str(number.get("display_phone_number") or "") or None,
                provider_account_id=str(account.get("id")) if account.get("id") else connection.provider_account_id,
                external_reference=context.external_reference,
            )

        payload = await self.client.get_number_status(
            phone_number_id=connection.provider_connection_id
        )
        data = payload.get("data") if isinstance(payload.get("data"), dict) else payload
        raw_status = str(data.get("status") or "error")
        return ProviderConnectionResult(
            provider=self.name,
            provider_connection_id=connection.provider_connection_id,
            status=normalize_connection_status(self.name, raw_status),
            provider_status=raw_status,
            phone=str(data.get("display_phone_number") or connection.phone or "") or None,
            provider_account_id=connection.provider_account_id,
            business_account_id=connection.business_account_id,
            external_reference=context.external_reference,
            metadata={"quality_rating": data.get("quality_rating")},
        )

    async def refresh_qr_code(self, context: WhatsAppOperationContext) -> ProviderConnectionResult:
        return await self.start_connection(context)

    async def disconnect(self, context: WhatsAppOperationContext) -> ProviderConnectionResult:
        connection = self._require_connection(context)
        if connection.provider_connection_id.startswith("pending:"):
            return ProviderConnectionResult(
                provider=self.name,
                provider_connection_id=connection.provider_connection_id,
                status=WhatsAppConnectionStatus.disconnected.value,
                provider_status="suspended",
                provider_account_id=connection.provider_account_id,
                external_reference=context.external_reference,
            )
        payload = await self.client.change_number_status(
            phone_number_id=connection.provider_connection_id,
            action="suspend",
        )
        raw_status = str(payload.get("status") or "suspended")
        return ProviderConnectionResult(
            provider=self.name,
            provider_connection_id=connection.provider_connection_id,
            status=normalize_connection_status(self.name, raw_status),
            provider_status=raw_status,
            phone=connection.phone,
            provider_account_id=connection.provider_account_id,
            business_account_id=connection.business_account_id,
            external_reference=context.external_reference,
        )

    async def remove(self, context: WhatsAppOperationContext) -> None:
        connection = self._require_connection(context)
        if not connection.provider_connection_id.startswith("pending:"):
            await self.client.change_number_status(
                phone_number_id=connection.provider_connection_id,
                action="disconnect",
            )

    async def send_text(self, connection: WhatsAppConnection, to: str, text: str) -> dict[str, Any]:
        return await self.client.send_text(
            phone_number_id=connection.provider_connection_id,
            to=to,
            text=text,
        )

    async def send_template(
        self,
        connection: WhatsAppConnection,
        to: str,
        name: str,
        language: str,
        body_parameters: list[str],
    ) -> dict[str, Any]:
        return await self.client.send_template(
            phone_number_id=connection.provider_connection_id,
            to=to,
            name=name,
            language=language,
            body_parameters=body_parameters,
        )
