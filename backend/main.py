"""
Game Store Zarzis Backend API
Secure FastAPI backend with rate limiting and email integration
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler, Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from utils.limiter import limiter
import os
from dotenv import load_dotenv

load_dotenv()

# Environment Settings
DEBUG = os.environ.get("DEBUG", "False").lower() == "true"

# Import routers
from routers.email_routes import router as email_router
from routers.verification_routes import router as verification_router
from routers.expenses_routes import router as expenses_router
from routers.admin_routes import router as admin_router, diag_router as diag_router

# Rate limiter - Already initialized in utils/limiter.py
# If re-initialization is needed:
# limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Game Store Zarzis API",
    description="Backend for Game Store Zarzis Management System",
    version="2.1.0",
    docs_url="/docs" if DEBUG else None,
    redoc_url="/redoc" if DEBUG else None,
)

# Add rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Configuration - Allow frontend access
origins = [
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:8082",
    "http://localhost:5173",  # Vite default
    "https://www.gamestorezarzis.com.tn",  # Live site
    "https://gamestorezarzis.com.tn",
    "https://bck.gamestorezarzis.com.tn",
]

from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Trusted Host Middleware - Prevent Host Header Attacks
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=[
        "localhost",
        "127.0.0.1",
        "bck.gamestorezarzis.com.tn",
        "gamestorezarzis.com.tn",
        "www.gamestorezarzis.com.tn",
        "*.onrender.com",
    ]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(email_router)
app.include_router(verification_router)
app.include_router(expenses_router)
if DEBUG:
    app.include_router(diag_router)
app.include_router(admin_router)



@app.get("/")
async def root():
    return {
        "message": "Welcome to Game Store Zarzis API",
        "status": "online",
        "version": "2.1.0",
        "docs": "/docs" if DEBUG else "Disabled"
    }


@app.get("/health")
@limiter.limit("10/minute")
async def health_check(request: Request):
    return {
        "status": "healthy",
        "services": {
            "api": "online",
            "email": "configured" if os.getenv("RESEND_API_KEY") else "not_configured"
        }
    }

@app.post("/cleanup")
@limiter.limit("5/hour")
async def cleanup_temp_data(request: Request):
    """
    Cleans up temporary data like expired verification codes.
    Should be called periodically (e.g., daily cron job).
    """
    try:
        from routers.verification_routes import supabase
        from datetime import datetime
        
        # Delete expired verification codes
        res = supabase.table("verification_codes")\
            .delete()\
            .lt("expires_at", datetime.utcnow().isoformat())\
            .execute()
            
        return {
            "success": True, 
            "message": "Cleanup completed", 
            "deleted_codes": len(res.data) if res.data else 0
        }
    except Exception as e:
        print(f"Cleanup error: {e}")
        return {"success": False, "message": str(e)}
