from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import Optional
from pydantic import BaseModel
import datetime
from supabase import create_client, Client
import os
import json
from utils.security import require_admin
from utils.limiter import limiter

from services.supabase_client import get_supabase

# Initialize Supabase client via Singleton
supabase: Client = get_supabase()

# Move status to a public diagnostic router or define it before the protected one
diag_router = APIRouter(prefix="/api/diag", tags=["Diagnostics"])

@diag_router.get("/status")
def get_admin_status():
    """Diagnostic endpoint to verify Supabase service role connectivity (Public)"""
    try:
        # Try to read from a restricted table to verify service role permissions
        res = supabase.table("user_roles").select("count").limit(1).execute()
        return {
            "status": "online",
            "supabase_connectivity": "ok",
            "service_role_authorized": True
        }
    except Exception as e:
        return {
            "status": "degraded",
            "supabase_connectivity": "failed",
            "error": str(e)
        }

# Protect remaining routes in this router
router = APIRouter(
    prefix="/api/admin", 
    tags=["admin"],
    dependencies=[Depends(require_admin)]
)

class CleanupRequest(BaseModel):
    days_to_keep: int
    tables: list[str] = ["gaming_sessions", "sales", "expenses"]

@router.delete("/cleanup")
@limiter.limit("5/hour")
def cleanup_data(request: Request, body: CleanupRequest):
    """
    Deletes data older than X days from specified tables to free up space.
    """
    try:
        request_data = body
        cutoff_date = (datetime.datetime.now() - datetime.timedelta(days=request_data.days_to_keep)).isoformat()
        
        results = {}
        # Hard warning: protecting critical tables not in list
        allowed_tables = ["gaming_sessions", "sales", "expenses", "audit_logs", "staff_sessions", "points_transactions"]
        
        for table in request_data.tables:
            if table not in allowed_tables:
                results[table] = "Skipped: table not in allowed list"
                continue
                
            try:
                # Perform deletion
                response = supabase.table(table).delete().lt("created_at", cutoff_date).execute()
                
                # Check for errors in response (Postgrest response format)
                if hasattr(response, 'error') and response.error:
                     results[table] = f"Error: {response.error}"
                else:
                     results[table] = f"Cleanup executed successfully (Cutoff: {cutoff_date})"
            except Exception as table_err:
                results[table] = f"Execution failed: {str(table_err)}"

        return {
            "status": "completed", 
            "cutoff_date": cutoff_date, 
            "details": results
        }

    except Exception as e:
        # logger.error(f"Cleanup general error: {e}")
        raise HTTPException(status_code=500, detail=f"Cleanup process failed: {str(e)}")

@router.get("/export")
@limiter.limit("2/hour")
def export_data(request: Request):
    """
    Exports core data as JSON for backup.
    """
    try:
        backup = {}
        # Aligning with actual table names and preventing huge dumps
        tables = ["gaming_sessions", "sales", "expenses", "clients", "products", "services_catalog"]
        
        for table in tables:
            try:
                # Fetch last 2000 records (increased from 1000)
                response = supabase.table(table).select("*").order("created_at", desc=True).limit(2000).execute()
                
                if hasattr(response, 'error') and response.error:
                    backup[table] = {"error": str(response.error)}
                else:
                    backup[table] = response.data
            except Exception as table_err:
                backup[table] = {"error": f"Table fetch failed: {str(table_err)}"}
            
        return {
            "timestamp": datetime.datetime.now().isoformat(),
            "data": backup
        }
    except Exception as e:
        # logger.error(f"Export general error: {e}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")



class CreateStaffRequest(BaseModel):
    email: str
    password: str
    role: str # 'owner' or 'worker'
    phone: Optional[str] = None
    full_name: Optional[str] = "Staff Member"
    skip_email: bool = False
    lang: str = "fr"


@router.post("/staff")
@limiter.limit("10/minute")
def create_staff_member(request: Request, body: CreateStaffRequest):
    request_data = body
    """
    Creates a new staff member:
    1. Creates Auth User (via Admin API)
    2. Assigns Role
    3. Creates Profile
    4. Sends Invitation Email
    """
    try:
        # 1. Create Auth User
        # Note: supabase-py admin usage might vary by version. 
        # Using safely wrapped call or raw request if needed.
        # Assuming supabase.auth.admin.create_user works.
        
        attributes = {
            "email": request_data.email,
            "password": request_data.password,
            "email_confirm": True
        }
        
        # User metadata
        user_metadata = {"full_name": request_data.full_name}
        attributes["user_metadata"] = user_metadata
        
        try:
            # create_user is the admin method
            # Reverting to dictionary attributes for better compatibility with this SDK version
            user_response = supabase.auth.admin.create_user(attributes)
            user_id = user_response.user.id
        except Exception as auth_error:
            error_str = str(auth_error)
            # logger.error(f"Auth Admin Error: {error_str}")
            # Check for common errors
            if "already registered" in error_str.lower() or "already exists" in error_str.lower():
                raise HTTPException(status_code=400, detail="Ce membre du personnel est déjà enregistré.")
            if "weak_password" in error_str.lower() or "password" in error_str.lower():
                raise HTTPException(status_code=400, detail=f"Mot de passe invalide: {error_str}")
            
            # If it's already an HTTPException, re-raise it
            if isinstance(auth_error, HTTPException):
                raise auth_error
                
            raise HTTPException(status_code=400, detail=f"Erreur Supabase Auth: {error_str}")

        # 2. Assign Role
        try:
            supabase.table("user_roles").insert({
                "user_id": user_id,
                "role": request_data.role
            }).execute()
        except Exception as role_error:
            # logger.error(f"Failed to assign role: {role_error}")
            # Clean up user if role assignment fails
            try:
                supabase.auth.admin.delete_user(user_id)
            except:
                pass
            raise HTTPException(status_code=400, detail=f"Impossible d'assigner le rôle: {str(role_error)}")

        try:
            supabase.table("profiles").upsert({
                "id": user_id,
                "email": request_data.email,
                "full_name": request_data.full_name,
                "phone": request_data.phone,
                "is_active": True,
                "updated_at": datetime.datetime.now().isoformat()
            }).execute()
        except Exception as profile_error:
            # logger.error(f"Profile upsert error: {profile_error}")
            # Non-critical, but logged
            pass
            
        # 4. Send Invitation Email
        # We import here to avoid circular dependencies if simple structure
        from email_service import send_staff_invitation
        
        email_sent = False
        if not request_data.skip_email:
            email_sent = send_staff_invitation(
                email=request_data.email,
                role=request_data.role,
                password=request_data.password,
                lang=request_data.lang
            )
        
        return {
            "status": "success", 
            "user_id": user_id, 
            "email_sent": email_sent,
            "message": "Staff member created and invited successfully"
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        # logger.error(f"Create staff error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/sync-profiles")
@limiter.limit("5/minute")
def sync_profiles(request: Request):
    """
    Force-syncs auth.users data to public.profiles.
    Fixes 'Email non disponible' issues.
    """
    try:
        # 1. Fetch all users from Auth (using admin client)
        # Note: list_users returns a UserList object with .users prop
        all_users = supabase.auth.admin.list_users()
        
        synced_count = 0
        errors = []

        for user in all_users:
            try:
                # Extract metadata
                user_meta = user.user_metadata or {}
                full_name = user_meta.get("full_name", "Staff Member")
                
                # Upsert to profiles
                supabase.table("profiles").upsert({
                    "id": user.id,
                    "full_name": full_name,
                    "is_active": True,
                    "updated_at": datetime.datetime.now().isoformat()
                }).execute()
                synced_count += 1
            except Exception as u_err:
                errors.append(f"Failed to sync {user.email}: {u_err}")
        
        return {
            "status": "success",
            "synced_count": synced_count,
            "total_found": len(all_users),
            "errors": errors
        }

    except Exception as e:
        # logger.error(f"Sync profiles error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/staff/{user_id}")
@limiter.limit("10/minute")
def delete_staff_member(request: Request, user_id: str):
    """
    Fully deletes a staff member:
    1. Removes from auth.users
    2. Removes from user_roles
    3. Removes from profiles
    This allows the email to be reused for a new account.
    """
    try:
        # 1. Delete from auth.users (using admin API)
        try:
            supabase.auth.admin.delete_user(user_id)
        except Exception as auth_err:
            error_str = str(auth_err)
            # logger.error(f"Auth delete error: {error_str}")
            # Continue anyway to clean database
            pass
        
        # 2. Delete from user_roles
        try:
            supabase.table("user_roles").delete().eq("user_id", user_id).execute()
        except Exception as role_err:
            # logger.error(f"Role delete error: {role_err}")
            pass
        
        # 3. Delete from profiles
        try:
            supabase.table("profiles").delete().eq("id", user_id).execute()
        except Exception as profile_err:
            # logger.error(f"Profile delete error: {profile_err}")
            pass
        
        return {
            "status": "success",
            "message": "Staff member fully deleted from auth and database",
            "user_id": user_id
        }

    except Exception as e:
        # logger.error(f"Delete staff error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

