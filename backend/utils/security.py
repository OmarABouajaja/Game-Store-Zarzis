from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client, create_client
import os
from typing import Optional

# Initialize Supabase client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

security = HTTPBearer()

import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validates the Bearer token against Supabase Auth.
    Returns the user object if valid, raises HTTPException otherwise.
    """
    token = credentials.credentials
    try:
        # Verify the token by getting the user
        user = supabase.auth.get_user(token)
        if not user:
            logger.warning("Authentication failed: Invalid credentials provided")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user
    except Exception as e:
        logger.error(f"Authentication exception: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def require_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validates the token and checks if the user has 'owner' role.
    """
    try:
        user_response = supabase.auth.get_user(credentials.credentials)
        if not user_response or not user_response.user:
             logger.warning("Auth Error: Invalid or missing user response in require_admin")
             raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = user_response.user.id
        
        # Check role in database
        try:
            response = supabase.table("user_roles").select("role").eq("user_id", user_id).single().execute()
            
            if not response.data:
                logger.warning(f"Access denied: No role found for user {user_id}")
                raise HTTPException(status_code=403, detail="No role assigned to user")
            
            if response.data['role'] != 'owner':
                logger.warning(f"Access denied: User {user_id} has role '{response.data['role']}', owner required")
                raise HTTPException(status_code=403, detail="Admin privileges required")
                
            logger.info(f"Admin access granted to user {user_id}")
            return user_response.user
            
        except HTTPException:
            raise
        except Exception as role_error:
            logger.error(f"Role check error for user {user_id}: {str(role_error)}")
            raise HTTPException(status_code=500, detail="Role verification failed")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth Error Details in require_admin: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication error")

