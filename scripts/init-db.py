#!/usr/bin/env python3
"""
Initialize the music social platform database in Supabase
"""

import os
from supabase import create_client, Client

# Get Supabase credentials from environment
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables")

# Initialize Supabase client with service role key (admin access)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Read and execute the schema
with open("/vercel/share/v0-project/supabase-schema.sql", "r") as f:
    schema_sql = f.read()

print("Initializing database schema...")
try:
    # Execute raw SQL
    response = supabase.postgrest.sql(schema_sql)
    print("✓ Database schema initialized successfully!")
except Exception as e:
    print(f"✗ Error initializing schema: {str(e)}")
    raise

print("Database setup complete!")
