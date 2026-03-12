from dotenv import load_dotenv
import os
from supabase import create_client
import cloudinary

load_dotenv()

FRONTEND_ORIGIN = os.getenv("FRONTEND_URL")

ADMIN_ACCESS_USERS = os.getenv("ACCESS_USERS").split(" ")

ADMIN_SECRET_KEY = os.getenv("SECRET_KEY")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SECRET_KEY")
SUPABASE_TABLE = os.getenv("SUPABASE_TABLE_NAME")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

cloudinary.config(
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)