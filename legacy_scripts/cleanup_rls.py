import os
import re

dir_path = r"c:\Users\USER\Documents\DQ\Plant4.0\PT4.0 Product\EP.IoT\plant-app\DQ_Prod_Plant4.0_Skunk\supabase\migrations"

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # --- 1. CLEANUP PREVIOUS MANGLED ATTEMPTS ---
    # Strip existing DO blocks for policies
    content = re.sub(r"DO \$\$ BEGIN IF NOT EXISTS \(SELECT 1 FROM pg_policies WHERE policyname = '.*?' AND tablename = '.*?'\) THEN\s+", "", content, flags=re.DOTALL)
    # Strip existing DO blocks for constraints
    content = re.sub(r"DO \$\$ BEGIN IF NOT EXISTS \(SELECT 1 FROM pg_constraint WHERE conname = '.*?'\) THEN\s+", "", content, flags=re.DOTALL)
    # Strip universal DO blocks
    content = re.sub(r"DO \$\$ BEGIN\s+", "", content)
    # Strip suffixes
    content = content.replace(" END IF; END $$;", "")
    content = content.replace(" END $$;", "")
    content = content.replace("END $$;", "")

    # --- 2. MAKE IDEMPOTENT ---
    
    # 2a. POLICIES
    pattern_policy = r'CREATE POLICY "([^"]+)" ON (\w+)(.*?);'
    def wrap_policy_repl(match):
        policy_name = match.group(1)
        table_name = match.group(2)
        body = match.group(3)
        return (f"DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE "
                f"policyname = '{policy_name}' AND tablename = '{table_name}') "
                f"THEN CREATE POLICY \"{policy_name}\" ON {table_name}{body}; "
                f"END IF; END $$;")
    content = re.sub(pattern_policy, wrap_policy_repl, content, flags=re.DOTALL)

    # 2b. CONSTRAINTS
    pattern_constraint = r'ALTER TABLE (\w+) ADD CONSTRAINT (\w+) (.*?);'
    def wrap_constraint_repl(match):
        table_name = match.group(1)
        con_name = match.group(2)
        body = match.group(3)
        return (f"DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '{con_name}') "
                f"THEN ALTER TABLE {table_name} ADD CONSTRAINT {con_name} {body}; "
                f"END IF; END $$;")
    content = re.sub(pattern_constraint, wrap_constraint_repl, content, flags=re.DOTALL)

    # 2c. TRIGGERS
    content = re.sub(r"DROP TRIGGER IF EXISTS \w+ ON \w+;\n", "", content)
    def trigger_repl(match):
        trigger_name = match.group(1)
        table_name = match.group(3)
        full_statement = match.group(0)
        return f"DROP TRIGGER IF EXISTS {trigger_name} ON {table_name};\n{full_statement}"
    content = re.sub(r"CREATE TRIGGER\s+(\w+)\s+(.*?)\s+ON\s+(\w+)", trigger_repl, content, flags=re.DOTALL)

    # 2d. TABLES & INDEXES
    content = content.replace("CREATE TABLE ", "CREATE TABLE IF NOT EXISTS ")
    content = content.replace("CREATE INDEX ", "CREATE INDEX IF NOT EXISTS ")
    content = content.replace("CREATE UNIQUE INDEX ", "CREATE UNIQUE INDEX IF NOT EXISTS ")
    # Fix potential double keywords
    content = content.replace("IF NOT EXISTS IF NOT EXISTS", "IF NOT EXISTS")

    # --- 3. FIX COMMON MISTAKES ---
    content = content.replace("DO $ BEGIN", "DO $$ BEGIN")
    content = content.replace("END $;", "END $$;")
    content = content.replace("END IF; END $$; END IF; END $$;", "END IF; END $$;")

    with open(file_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)

# Process all .sql files in the directory
for file_name in os.listdir(dir_path):
    if file_name.endswith(".sql"):
        process_file(os.path.join(dir_path, file_name))

print("Independently standardized all migration files in the directory.")
