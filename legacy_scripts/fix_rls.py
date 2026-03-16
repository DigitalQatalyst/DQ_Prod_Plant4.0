import os

files = [
    "029_create_performance_tables.sql",
    "030_create_sim_tables.sql",
    "031_create_ci_tables.sql",
    "032_create_optimisation_tables.sql"
]
dir_path = r"c:\Users\USER\Documents\DQ\Plant4.0\PT4.0 Product\EP.IoT\plant-app\DQ_Prod_Plant4.0_Skunk\supabase\migrations"

for file_name in files:
    file_path = os.path.join(dir_path, file_name)
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Precise replacements to fix the broken DO blocks
    content = content.replace("DO $ BEGIN", "DO $$ BEGIN")
    content = content.replace("END ;", "END $$;")
    content = content.replace("END $;", "END $$;")
    
    with open(file_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)

print("Fixed RLS syntax in migration files.")
