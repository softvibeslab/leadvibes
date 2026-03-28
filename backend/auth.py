import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.environ.get("JWT_SECRET", "selvavibes_secret_key")
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_MINUTES = int(os.environ.get("JWT_EXPIRATION_MINUTES", "15"))  # Access token: 15 min
REFRESH_TOKEN_DAYS = int(os.environ.get("REFRESH_TOKEN_DAYS", "7"))  # Refresh token: 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create short-lived access token (15 minutes by default)"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRATION_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> tuple[str, str]:
    """
    Create refresh token (7 days by default).
    Returns (token_jti, token) where jti is the unique ID for storage in DB.
    """
    token_jti = str(uuid.uuid4())
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_DAYS)
    to_encode.update({
        "exp": expire,
        "type": "refresh",
        "jti": token_jti
    })
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token_jti, encoded_jwt

def decode_token(token: str) -> dict:
    """Decode and validate JWT token (access or refresh)"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        token_type = payload.get("type", "access")

        if token_type not in ["access", "refresh"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Tipo de token inválido",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {
        "user_id": user_id,
        "tenant_id": payload.get("tenant_id", ""),
        "email": payload.get("email", ""),
        "role": payload.get("role", "broker"),
        "name": payload.get("name", "")
    }

def require_role(allowed_roles: list):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para esta acción"
            )
        return current_user
    return role_checker


async def get_refresh_token_user(db, token_jti: str) -> dict:
    """
    Validate refresh token exists in database and is not revoked/used.
    Returns the user associated with the refresh token.
    """
    refresh_token = await db.refresh_tokens.find_one({"jti": token_jti})

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token no encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if refresh_token.get("revoked", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token revocado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if refresh_token.get("used", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token ya fue usado (posible reutilización detectada)",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get user
    user = await db.users.find_one({"id": refresh_token["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
        )

    return {
        "user_id": user["id"],
        "tenant_id": user.get("tenant_id", ""),
        "email": user.get("email", ""),
        "role": user.get("role", "broker"),
        "name": user.get("name", "")
    }
