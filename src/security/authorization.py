from fastapi import Depends, HTTPException

from .authentication import get_current_actor
from .context import UserContext, IntegrationContext, BusinessIntegrationContext

def require_integration(actor: IntegrationContext = Depends(get_current_actor)) -> IntegrationContext:
    if actor.type != "integration":
        raise HTTPException(status_code=403)

    return actor

def require_business_integration(actor: BusinessIntegrationContext = Depends(get_current_actor)) -> BusinessIntegrationContext:
    if actor.type != "business_integration":
        raise HTTPException(status_code=403, detail="Token de business integration obrigatório!")
    
    return actor

def require_user_or_business_integration(actor: UserContext | BusinessIntegrationContext = Depends(get_current_actor)) -> UserContext | BusinessIntegrationContext:
    if actor.type not in ("user", "business_integration"):
        raise HTTPException(status_code=403, detail="Acesso não autorizado")

    return actor

def require_user(actor: UserContext = Depends(get_current_actor)) -> UserContext:
    if actor.type != "user":
        raise HTTPException(status_code=403)

    return actor

def require_admin(actor: UserContext = Depends(get_current_actor)) -> UserContext:
    if actor.type != "user" or actor.role == "user":
        raise HTTPException(status_code=403, detail="Acesso restrito a admin")

    return actor

def require_super_admin(actor: UserContext = Depends(get_current_actor)) -> UserContext:
    if actor.type != "user" or actor.role != "super_admin":
        raise HTTPException(status_code=403, detail="Acesso restrito a super admin")

    return actor