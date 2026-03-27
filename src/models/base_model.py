from typing import Annotated
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import DeclarativeBase, mapped_column

intpk = Annotated[int, mapped_column(primary_key=True)]

business_fk = Annotated[int, mapped_column(ForeignKey("businesses.id", ondelete="cascade"), nullable=False, index=True)]
integration_fk = Annotated[int, mapped_column(ForeignKey("integrations.id", ondelete="cascade"), nullable=False, index=True)]
service_fk = Annotated[int, mapped_column(ForeignKey("services.id", ondelete="cascade"), nullable=False, index=True)]
professional_fk = Annotated[int, mapped_column(ForeignKey("professionals.id", ondelete="cascade"), nullable=False, index=True)]
client_fk = Annotated[int, mapped_column(ForeignKey("clients.id", ondelete="cascade"), nullable=False, index=True)]

name_type = Annotated[str, mapped_column(String(50))]
phone_type = Annotated[str, mapped_column(String(13))]

class Base(DeclarativeBase):
    pass