from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


ContactPolicy = Literal["BOT", "HUMAN", "AUTO"]


class ContactIdentityRequest(BaseModel):
    connection_key: str = Field(min_length=3, max_length=255)
    provider_user_id: str | None = Field(default=None, max_length=191)
    parent_provider_user_id: str | None = Field(default=None, max_length=191)
    wa_id: str | None = Field(default=None, max_length=32)
    phone: str | None = Field(default=None, max_length=32)
    username: str | None = Field(default=None, max_length=191)
    name: str | None = Field(default=None, max_length=255)
    saved: bool = False

    model_config = ConfigDict(extra="forbid")

    @model_validator(mode="after")
    def has_identity(self):
        if not any((self.provider_user_id, self.wa_id, self.phone, self.username)):
            raise ValueError("ao menos uma identidade do contato é obrigatória")
        return self


class ContactResponse(BaseModel):
    id: int
    business_id: int
    client_id: int | None = None
    whatsapp_connection_id: int | None = None
    provider: str | None = None
    provider_user_id: str | None = None
    parent_provider_user_id: str | None = None
    wa_id: str | None = None
    phone: str | None = None
    username: str | None = None
    name: str | None = None
    source: str
    is_saved: bool
    bot_policy: ContactPolicy
    policy_manually_overridden: bool

    model_config = ConfigDict(from_attributes=True)


class ContactOwnershipResponse(BaseModel):
    contact: ContactResponse
    human_takeover: bool
    should_respond: bool


class ContactTakeoverRequest(BaseModel):
    source: str = Field(default="workflow_handoff", min_length=1, max_length=64)
    conversation_key: str | None = Field(default=None, min_length=1, max_length=255, pattern=r"^[^*?\[\]]+$")

    model_config = ConfigDict(extra="forbid")
