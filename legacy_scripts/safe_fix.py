import os
import re

dir_path = r"c:\Users\USER\Documents\DQ\Plant4.0\PT4.0 Product\EP.IoT\plant-app\DQ_Prod_Plant4.0_Skunk\supabase\migrations"

# Files to process
files_to_fix = [f for f in os.listdir(dir_path) if f.endswith(".sql")]

def safe_wrap_policies(content):
    # Match CREATE POLICY that is NOT a comment and NOT already wrapped
    pattern = r'(?m)^\s*(CREATE POLICY "([^"]+)" ON (\w+).*?;)'
    
    def repl(match):
        full_stmt = match.group(1)
        policy_name = match.group(2)
        table_name = match.group(3)
        # Check if already wrapped (look back)
        start_idx = match.start()
        prefix = content[max(0, start_idx-100):start_idx]
        if "IF NOT EXISTS" in prefix and "pg_policies" in prefix:
            return full_stmt
        return (f"DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE "
                f"policyname = '{policy_name}' AND tablename = '{table_name}') "
                f"THEN {full_stmt} END IF; END $$;")
    
    return re.sub(pattern, repl, content, flags=re.DOTALL)

def safe_wrap_constraints(content):
    # Match ALTER TABLE ... ADD CONSTRAINT that is NOT already wrapped
    pattern = r'(?m)^\s*(ALTER TABLE (\w+) ADD CONSTRAINT (\w+) .*?;)'
    
    def repl(match):
        full_stmt = match.group(1)
        table_name = match.group(2)
        con_name = match.group(3)
        start_idx = match.start()
        prefix = content[max(0, start_idx-100):start_idx]
        if "IF NOT EXISTS" in prefix and "pg_constraint" in prefix:
            return full_stmt
        return (f"DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '{con_name}') "
                f"THEN {full_stmt} END IF; END $$;")

    return re.sub(pattern, repl, content, flags=re.DOTALL)

def safe_wrap_triggers(content):
    # Match CREATE TRIGGER only if it has ON on the same or next line
    # Avoid greedy matching across multiple statements
    pattern = r'(?m)^\s*(CREATE TRIGGER\s+(\w+)\s+.*?\s+ON\s+(\w+))'
    
    def repl(match):
        full_stmt = match.group(1)
        trigger_name = match.group(2)
        table_name = match.group(3)
        
        # Check if DROP TRIGGER IF EXISTS already exists for this trigger
        if f"DROP TRIGGER IF EXISTS {trigger_name} ON {table_name}" in content[max(0, match.start()-200):match.start()]:
            return full_stmt
            
        return f"DROP TRIGGER IF EXISTS {trigger_name} ON {table_name};\n{full_stmt}"

    # Do NOT use re.DOTALL here to keep it constrained to a few lines usually
    # (But trigger body can be multiline, so we use a non-greedy .*? and carefully check)
    return re.sub(pattern, repl, content)

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Apply fixes
    content = safe_wrap_policies(content)
    content = safe_wrap_constraints(content)
    content = safe_wrap_triggers(content)
    
    # Generic IF NOT EXISTS for tables/indexes (only if at start of line)
    content = re.sub(r"(?m)^\s*CREATE TABLE (?!IF NOT EXISTS)", "CREATE TABLE IF NOT EXISTS ", content)
    content = re.sub(r"(?m)^\s*CREATE INDEX (?!IF NOT EXISTS)", "CREATE INDEX IF NOT EXISTS ", content)
    content = re.sub(r"(?m)^\s*CREATE UNIQUE INDEX (?!IF NOT EXISTS)", "CREATE UNIQUE INDEX IF NOT EXISTS ", content)

    # UUID function standardization
    content = content.replace("uuid_generate_v4()", "gen_random_uuid()")

    with open(file_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)

for file_name in files_to_fix:
    # Skip consolidated files if they exist (though they were restored)
    # Actually, we want them fixed too.
    process_file(os.path.join(dir_path, file_name))

print(f"Standardized {len(files_to_fix)} migration files (Sanely).")
