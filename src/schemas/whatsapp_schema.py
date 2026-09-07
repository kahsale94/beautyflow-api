from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class WhatsAppTemplateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=512, pattern=r"^[a-z0-9_]+$")
    language: str = Field(default="pt_BR", min_length=2, max_length=10)
    body_parameters: list[str] = Field(default_factory=list, max_length=20)

    model_config = ConfigDict(extra="forbid")


class WhatsAppMessageRequest(BaseModel):
    type: Literal["text", "template", "request_contact_info"]
    to: str | None = Field(default=None, min_length=9, max_length=32)
    recipient: str | None = Field(default=None, min_length=1, max_length=191)
    contact_id: int | None = Field(default=None, gt=0)
    text: str | None = Field(default=None, min_length=1, max_length=4096)
    template: WhatsAppTemplateRequest | None = None

    model_config = ConfigDict(extra="forbid")

    @model_validator(mode="after")
    def validate_payload(self):
        if bool(self.to) == bool(self.recipient):
            raise ValueError("informe exatamente um entre to e recipient")
        if self.type == "text" and not self.text:
            raise ValueError("text é obrigatório para mensagem de texto")
        if self.type == "template" and not self.template:
            raise ValueError("template é obrigatório para mensagem de template")
        if self.type == "request_contact_info" and not self.text:
            raise ValueError("text é obrigatório para solicitar o telefone")
        if self.type == "request_contact_info" and not self.recipient:
            raise ValueError("recipient é obrigatório para solicitar o telefone")
        return self


class WhatsAppMessageResponse(BaseModel):
    provider: str
    external_message_id: str | None = None
    status: str
