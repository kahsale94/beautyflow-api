from typing import Annotated
from pydantic import StringConstraints

phone_type = Annotated[str, StringConstraints(strip_whitespace=True, min_length=9, max_length=13)]
name_type = Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=50)]