from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from db.session import get_db
from models.user import User, Role
from schemas.user import UserRegister, UserOut, Token
from utils.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(data: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.Email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    member_role = db.query(Role).filter(Role.RoleName == "Member").first()
    if not member_role:
        raise HTTPException(status_code=500, detail="Role configuration error")

    user = User(
        Email=data.email,
        PasswordHash=hash_password(data.password),
        FirstName=data.first_name,
        LastName=data.last_name,
        RoleID=member_role.RoleID,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.Email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.PasswordHash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.UserID), "role": user.RoleID})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
