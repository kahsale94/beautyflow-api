from typing import Annotated
from sqlalchemy import ForeignKey
from sqlalchemy.orm import DeclarativeBase, mapped_column

class Base(DeclarativeBase):
    pass

intpk = Annotated[int, mapped_column(primary_key=True)]

business_fk = Annotated[int, mapped_column(ForeignKey("businesses.id", ondelete="cascade"), nullable=False)]
integration_fk = Annotated[int, mapped_column(ForeignKey("integration.id", ondelete="cascade"), nullable=False)]
professional_fk = Annotated[int, mapped_column(ForeignKey("professionals.id", ondelete="cascade"), nullable=False)]
service_fk = Annotated[int, mapped_column(ForeignKey("services.id", ondelete="cascade"), nullable=False)]