from typing import Union
from fastapi import Depends, Header, HTTPException

from .actor_security import ActorSecurity
from .context import UserContext, BusinessIntegrationContext, IntegrationContext

def get_business_scope(actor: Union[UserContext, IntegrationContext, BusinessIntegrationContext] = Depends(ActorSecurity.get_current_actor),
     x_business_id: int | str | None = Header(default = None, alias = "X-Business-ID")) -> Union[int, str]:

    if isinstance(actor, UserContext) and actor.role == "super_admin":

        if x_business_id is None:
            raise HTTPException(status_code=400, detail="X-Business-ID obrigatório para super admin!")

        return x_business_id

    if isinstance(actor, UserContext):

        if actor.business_id is None:
            raise HTTPException(status_code=403)

        return actor.business_id
    
    if isinstance(actor, IntegrationContext):

        if x_business_id is not None:
            raise HTTPException(status_code=400, detail="X-Business-ID obrigatório para integracao!")

        return x_business_id
    
    if isinstance(actor, BusinessIntegrationContext):

        if x_business_id is not None and x_business_id != actor.business_id:
            raise HTTPException(status_code=403)

        return actor.business_id

    raise HTTPException(status_code=403)