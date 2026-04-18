import os
from supabase import create_client, Client
from functools import lru_cache
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SupabaseSingleton:
    _instance: Client = None

    @classmethod
    def get_client(cls) -> Client:
        if cls._instance is None:
            url = os.environ.get("SUPABASE_URL")
            key = os.environ.get("SUPABASE_SERVICE_KEY")
            
            if not url or not key:
                logger.error("Supabase credentials missing!")
                raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
                
            try:
                logger.info("Initializing new Supabase Client connection...")
                cls._instance = create_client(url, key)
                logger.info("Supabase Client initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase Client: {e}")
                raise e
                
        return cls._instance

# Global retrieval function
@lru_cache()
def get_supabase() -> Client:
    return SupabaseSingleton.get_client()
