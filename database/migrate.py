"""
Restaurant POS - Database Migration for Supabase
Executes SQL files in order: 00-schema → 01-indexes → 02-rls → 03-seed → 04-functions
Then creates default users via Supabase Auth API + public.users table.

Usage: python migrate.py [--skip-users]
"""
import psycopg2
import os
import sys
import uuid
import json
import time

# ============================================
# Configuration
# ============================================
DB_CONFIG = {
    "host": "aws-1-ap-northeast-1.pooler.supabase.com",
    "port": 6543,
    "dbname": "postgres",
    "user": "postgres.zqfgqwaxuytqjyfqlhuh",
    "password": "Giahan@8590",
    "sslmode": "require",
}

SUPABASE_URL = "https://zqfgqwaxuytqjyfqlhuh.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_uy-fMoMc80Ck908y6cffNg_QNvQZAsk"

SQL_FILES = [
    "00-schema.sql",
    "01-indexes.sql",
    "02-rls-policies.sql",
    "03-seed-data.sql",
    "04-functions.sql",
]

DEFAULT_USERS = [
    ("manager@posrestaurant.com", "Manager@123", "manager", "Admin Manager", "manager"),
    ("waiter@posrestaurant.com", "Test@123", "waiter01", "Nguyễn Văn A", "waiter"),
    ("kitchen@posrestaurant.com", "Test@123", "kitchen01", "Trần Văn B", "kitchen"),
    ("cashier@posrestaurant.com", "Test@123", "cashier01", "Lê Thị C", "cashier"),
]


def run_sql_file(cursor, conn, filepath, filename):
    """Execute a SQL file, with statement-by-statement fallback on error."""
    print(f"{'=' * 50}")
    print(f"Running: {filename}")
    print(f"{'=' * 50}")

    with open(filepath, "r", encoding="utf-8") as f:
        sql = f.read()

    try:
        cursor.execute(sql)
        print(f"  OK - {filename}\n")
        return
    except psycopg2.Error as e:
        print(f"  Bulk failed: {(e.pgerror or str(e))[:80]}")
        print(f"  Retrying statement by statement...\n")
        conn.rollback()
        conn.autocommit = True

    # Statement-by-statement execution
    statements = split_sql(sql)
    success = errors = 0

    for stmt in statements:
        if not stmt.strip() or stmt.strip().startswith("--"):
            continue
        try:
            cursor.execute(stmt)
            success += 1
        except psycopg2.Error as stmt_err:
            errors += 1
            err_msg = str(stmt_err.pgerror or stmt_err)
            if "already exists" in err_msg or "duplicate" in err_msg.lower():
                pass  # Skip already-exists errors silently
            else:
                print(f"    ERROR: {err_msg.strip()[:100]}")
            conn.rollback()
            conn.autocommit = True

    print(f"  Done: {success} OK, {errors} skipped/errors\n")


def split_sql(sql):
    """Split SQL by semicolons, respecting $$ dollar-quoted blocks."""
    statements = []
    current = []
    in_dollar = False

    for line in sql.split("\n"):
        stripped = line.strip()
        if "$$" in stripped:
            in_dollar = not in_dollar
        current.append(line)
        if not in_dollar and stripped.endswith(";"):
            stmt = "\n".join(current).strip()
            if stmt and not stmt.startswith("--"):
                statements.append(stmt)
            current = []

    if current:
        stmt = "\n".join(current).strip()
        if stmt and not stmt.startswith("--"):
            statements.append(stmt)

    return statements


def create_users(cursor, conn):
    """Create default users directly in auth.users + public.users."""
    print(f"{'=' * 50}")
    print("Creating default users")
    print(f"{'=' * 50}")

    for email, password, username, full_name, role in DEFAULT_USERS:
        uid = str(uuid.uuid4())
        app_meta = json.dumps({"provider": "email", "providers": ["email"]})
        user_meta = json.dumps({
            "sub": uid,
            "role": role,
            "email": email,
            "username": username,
            "full_name": full_name,
            "email_verified": False,
            "phone_verified": False,
        })

        try:
            # Check if user already exists
            cursor.execute(
                "SELECT id FROM public.users WHERE username = %s", (username,)
            )
            if cursor.fetchone():
                print(f"  SKIP {username} (already exists)")
                continue

            # Insert into auth.users
            cursor.execute(
                """
                INSERT INTO auth.users (
                    instance_id, id, aud, role, email, encrypted_password,
                    email_confirmed_at, confirmation_token, recovery_token,
                    email_change_token_new, email_change, email_change_token_current,
                    email_change_confirm_status, phone, phone_change, phone_change_token,
                    reauthentication_token,
                    raw_app_meta_data, raw_user_meta_data,
                    is_super_admin, is_sso_user, is_anonymous,
                    created_at, updated_at
                ) VALUES (
                    '00000000-0000-0000-0000-000000000000',
                    %s, 'authenticated', 'authenticated', %s,
                    crypt(%s, gen_salt('bf', 10)),
                    NOW(), '', '', '', '', '', 0, NULL, '', '', '',
                    %s::jsonb, %s::jsonb,
                    NULL, false, false, NOW(), NOW()
                )
                """,
                (uid, email, password, app_meta, user_meta),
            )

            # Insert identity
            iid = str(uuid.uuid4())
            identity_data = json.dumps({
                "sub": uid,
                "role": role,
                "email": email,
                "username": username,
                "full_name": full_name,
                "email_verified": False,
                "phone_verified": False,
            })
            cursor.execute(
                """
                INSERT INTO auth.identities (
                    id, provider_id, user_id, identity_data, provider,
                    last_sign_in_at, created_at, updated_at
                ) VALUES (%s, %s, %s, %s::jsonb, 'email', NOW(), NOW(), NOW())
                """,
                (iid, uid, uid, identity_data),
            )

            # Insert public profile
            cursor.execute(
                """
                INSERT INTO public.users (auth_id, username, full_name, role, is_active)
                VALUES (%s, %s, %s, %s, true)
                """,
                (uid, username, full_name, role),
            )

            conn.commit()
            print(f"  Created: {username} ({role}) - {email} / {password}")

        except Exception as e:
            conn.rollback()
            print(f"  ERROR {username}: {e}")


def verify_login():
    """Test login for all default users via Supabase Auth API."""
    try:
        import httpx
    except ImportError:
        print("\n  (httpx not installed, skipping login verification)")
        return

    print(f"\n{'=' * 50}")
    print("Verifying logins")
    print(f"{'=' * 50}")

    for email, password, username, _, role in DEFAULT_USERS:
        resp = httpx.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
            json={"email": email, "password": password},
            timeout=15,
        )
        if resp.status_code == 200:
            print(f"  {username} ({role}): OK")
        else:
            msg = resp.json().get("msg", "Unknown error")
            print(f"  {username} ({role}): FAIL - {msg}")


def main():
    skip_users = "--skip-users" in sys.argv
    script_dir = os.path.dirname(os.path.abspath(__file__))

    print("Connecting to Supabase PostgreSQL...")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True
        cursor = conn.cursor()
        print("Connected!\n")
    except Exception as e:
        print(f"Connection failed: {e}")
        sys.exit(1)

    # Run SQL migrations
    for sql_file in SQL_FILES:
        filepath = os.path.join(script_dir, sql_file)
        run_sql_file(cursor, conn, filepath, sql_file)

    # Create users
    if not skip_users:
        create_users(cursor, conn)
        verify_login()
    else:
        print("\nSkipping user creation (--skip-users)")

    cursor.close()
    conn.close()

    print(f"\n{'=' * 50}")
    print("Migration completed!")
    print(f"{'=' * 50}")


if __name__ == "__main__":
    main()
