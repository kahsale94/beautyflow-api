from fastapi import Depends, HTTPException

from .context import UserContext
from .actor_security import ActorSecurity

def require_user(actor: UserContext = Depends(ActorSecurity.get_current_actor)) -> UserContext:
    if actor.type != "user":
        raise HTTPException(status_code=403)

    return actor

def require_admin(actor: UserContext = Depends(ActorSecurity.get_current_actor)) -> UserContext:
    if actor.type != "user" or actor.role == "user":
        raise HTTPException(status_code=403, detail="Acesso restrito a admin")

    return actor

def require_super_admin(actor: UserContext = Depends(ActorSecurity.get_current_actor)) -> UserContext:
    if actor.type != "user" or actor.role != "super_admin":
        raise HTTPException(status_code=403, detail="Acesso restrito a super admin")

    return actor