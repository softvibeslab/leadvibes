"""
Pocket Authentication Module

Handles authentication specifically for Rovi Pocket mobile app.
Extends the existing auth system with Pocket-specific features.
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import os

from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# JWT Configuration
JWT_SECRET = os.getenv('JWT_SECRET', 'dev-secret-key')
JWT_ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', '24'))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security scheme
security = HTTPBearer()


class PocketTokenData(BaseModel):
    user_id: str
    email: str
    exp: Optional[datetime] = None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def create_pocket_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token for Pocket app."""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

    return encoded_jwt


async def get_current_pocket_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db=None  # Will be injected from main app
) -> dict:
    """
    Get the current authenticated Pocket user from JWT token.

    This is a dependency that can be used in Pocket endpoints.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

        user_id: str = payload.get("sub")
        email: str = payload.get("email")

        if user_id is None or email is None:
            raise credentials_exception

        token_data = PocketTokenData(user_id=user_id, email=email)

    except JWTError:
        raise credentials_exception

    # Fetch user from database
    if db is None:
        # For compatibility, return token data if db not provided
        return {
            "id": token_data.user_id,
            "email": token_data.email,
        }

    user = await db.users.find_one({"id": token_data.user_id})

    if user is None:
        raise credentials_exception

    return user


async def require_pocket_auth(
    current_user: dict = Depends(get_current_pocket_user)
) -> dict:
    """
    Require Pocket authentication and ensure user is active.

    This dependency checks that the user is authenticated and active.
    """
    if current_user.get("disabled", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )

    return current_user


def create_pocket_user_response(user: dict) -> dict:
    """
    Create a standardized Pocket user response.

    Filters user data to only include fields needed by the Pocket app.
    """
    return {
        "id": user.get("id"),
        "email": user.get("email"),
        "name": user.get("name"),
        "phone": user.get("phone"),
        "account_type": user.get("account_type", "individual"),
        "onboarding_completed": user.get("onboarding_completed", False),
        "created_at": user.get("created_at"),
        "profile": {
            "title": user.get("profile", {}).get("title", ""),
            "bio": user.get("profile", {}).get("bio", ""),
            "avatar_url": user.get("profile", {}).get("avatar_url", ""),
        },
        "goals": user.get("goals", {}),
        "settings": user.get("settings", {}),
    }
