"""
Incremental migration:
1. Add order_code column to orders table
2. Create auto-generate trigger for order_code (YYMMDD_00001)
3. Update existing users' emails
4. Backfill order_code for existing orders
"""
import psycopg2
import sys

DB_CONFIG = {
    "host": "aws-1-ap-northeast-1.pooler.supabase.com",
    "port": 6543,
    "dbname": "postgres",
    "user": "postgres.zqfgqwaxuytqjyfqlhuh",
    "password": "Giahan@8590",
    "sslmode": "require",
}

EMAIL_MAPPING = {
    "manager@posrestaurant.com": "quanly@pos.com",
    "waiter@posrestaurant.com": "boiban@pos.com",
    "kitchen@posrestaurant.com": "bep@pos.com",
    "cashier@posrestaurant.com": "thungan@pos.com",
}


def run(cursor, conn):
    print("=" * 50)
    print("Step 1: Add order_code column")
    print("=" * 50)
    try:
        cursor.execute("""
            ALTER TABLE public.orders
            ADD COLUMN IF NOT EXISTS order_code VARCHAR(12) UNIQUE;
        """)
        conn.commit()
        print("  OK - order_code column added\n")
    except Exception as e:
        conn.rollback()
        if "already exists" in str(e):
            print("  SKIP - column already exists\n")
        else:
            print(f"  ERROR: {e}\n")

    print("=" * 50)
    print("Step 2: Create order_code trigger function")
    print("=" * 50)
    try:
        cursor.execute("""
            CREATE OR REPLACE FUNCTION public.generate_order_code()
            RETURNS TRIGGER AS $$
            DECLARE
              today_prefix TEXT;
              seq_num INTEGER;
            BEGIN
              today_prefix := TO_CHAR(NOW(), 'YYMMDD');

              SELECT COALESCE(MAX(
                NULLIF(SPLIT_PART(order_code, '_', 2), '')::INTEGER
              ), 0) + 1
              INTO seq_num
              FROM public.orders
              WHERE order_code LIKE today_prefix || '_%';

              NEW.order_code := today_prefix || '_' || LPAD(seq_num::TEXT, 5, '0');
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        """)
        conn.commit()
        print("  OK - function created\n")
    except Exception as e:
        conn.rollback()
        print(f"  ERROR: {e}\n")

    print("=" * 50)
    print("Step 3: Create trigger on orders table")
    print("=" * 50)
    try:
        cursor.execute("DROP TRIGGER IF EXISTS set_order_code ON public.orders;")
        cursor.execute("""
            CREATE TRIGGER set_order_code
              BEFORE INSERT ON public.orders
              FOR EACH ROW
              WHEN (NEW.order_code IS NULL)
              EXECUTE FUNCTION public.generate_order_code();
        """)
        conn.commit()
        print("  OK - trigger created\n")
    except Exception as e:
        conn.rollback()
        print(f"  ERROR: {e}\n")

    print("=" * 50)
    print("Step 4: Backfill order_code for existing orders")
    print("=" * 50)
    try:
        cursor.execute("""
            WITH numbered AS (
              SELECT id, created_at,
                     TO_CHAR(created_at, 'YYMMDD') AS prefix,
                     ROW_NUMBER() OVER (
                       PARTITION BY created_at::DATE
                       ORDER BY created_at
                     ) AS seq
              FROM public.orders
              WHERE order_code IS NULL
            )
            UPDATE public.orders o
            SET order_code = n.prefix || '_' || LPAD(n.seq::TEXT, 5, '0')
            FROM numbered n
            WHERE o.id = n.id;
        """)
        conn.commit()
        cursor.execute("SELECT COUNT(*) FROM public.orders WHERE order_code IS NOT NULL;")
        count = cursor.fetchone()[0]
        print(f"  OK - {count} orders now have order_code\n")
    except Exception as e:
        conn.rollback()
        print(f"  ERROR: {e}\n")

    print("=" * 50)
    print("Step 5: Update user emails in auth.users")
    print("=" * 50)
    for old_email, new_email in EMAIL_MAPPING.items():
        try:
            # Check if old email exists
            cursor.execute("SELECT id FROM auth.users WHERE email = %s", (old_email,))
            row = cursor.fetchone()
            if not row:
                # Check if new email already exists
                cursor.execute("SELECT id FROM auth.users WHERE email = %s", (new_email,))
                if cursor.fetchone():
                    print(f"  SKIP {new_email} (already migrated)")
                else:
                    print(f"  SKIP {old_email} (not found)")
                continue

            uid = row[0]

            # Update auth.users email
            cursor.execute(
                "UPDATE auth.users SET email = %s WHERE id = %s",
                (new_email, uid),
            )

            # Update raw_user_meta_data email field
            cursor.execute(
                """
                UPDATE auth.users
                SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{email}', %s::jsonb)
                WHERE id = %s
                """,
                (f'"{new_email}"', uid),
            )

            # Update auth.identities
            cursor.execute(
                """
                UPDATE auth.identities
                SET identity_data = jsonb_set(identity_data, '{email}', %s::jsonb)
                WHERE user_id = %s AND provider = 'email'
                """,
                (f'"{new_email}"', uid),
            )

            conn.commit()
            print(f"  OK: {old_email} -> {new_email}")

        except Exception as e:
            conn.rollback()
            print(f"  ERROR {old_email}: {e}")

    print()


def main():
    print("Connecting to Supabase PostgreSQL...")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = False
        cursor = conn.cursor()
        print("Connected!\n")
    except Exception as e:
        print(f"Connection failed: {e}")
        sys.exit(1)

    run(cursor, conn)

    cursor.close()
    conn.close()

    print("=" * 50)
    print("Incremental migration completed!")
    print("=" * 50)


if __name__ == "__main__":
    main()
