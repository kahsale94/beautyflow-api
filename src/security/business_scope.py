from fastapi import Depends, Header, HTTPException

from .authentication import get_current_actor
from .authorization import require_integration
from .context import UserContext, BusinessIntegrationContext, IntegrationContext

def get_business_scope(actor: UserContext | BusinessIntegrationContext = Depends(get_current_actor),
     x_business_id: int | None = Header(default = None, alias = "X-Business-ID")) -> int:

    if isinstance(actor, UserContext) and actor.role == "super_admin":

        if x_business_id is None:
            raise HTTPException(status_code=400, detail="X-Business-ID obrigatório para super admin!")

        return x_business_id

    if isinstance(actor, UserContext):

        if actor.business_id is None:
            raise HTTPException(status_code=403)

        return actor.business_id
    
    if isinstance(actor, BusinessIntegrationContext):

        if x_business_id is not None and x_business_id != actor.business_id:
            raise HTTPException(status_code=403, detail="Escopo de empresa inválido!")
        
        return actor.business_id

    raise HTTPException(status_code=403, detail="Acesso negado!")

def normalize_phone(phone: str) -> str:
    return "".join(ch for ch in phone if ch.isdigit())

def get_business_phone(actor: IntegrationContext = Depends(require_integration), x_business_phone: str | None = Header(default=None, alias="X-Business-Phone")) -> str:
    if not x_business_phone:
        raise HTTPException(status_code=400, detail="X-Business-Phone obrigatório!")

    normalized = normalize_phone(x_business_phone)

    if len(normalized) < 10:
        raise HTTPException(status_code=400, detail="Telefone inválido!")

    return normalized