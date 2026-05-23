import re
from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from typing import Optional


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Parola trebuie să aibă cel puțin 8 caractere")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Parola trebuie să conțină cel puțin o literă mare")
        if not re.search(r"\d", v):
            raise ValueError("Parola trebuie să conțină cel puțin o cifră")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    UserID: int
    Email: str
    FirstName: Optional[str]
    LastName: Optional[str]
    CreatedAt: Optional[datetime]
    RoleID: int

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[int] = None
