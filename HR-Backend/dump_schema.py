from sqlalchemy import inspect
from app.database import engine
import json

def get_detailed_schema():
    inspector = inspect(engine)
    schema = {}
    for table_name in inspector.get_table_names():
        schema[table_name] = [col['name'] for col in inspector.get_columns(table_name)]
    
    with open("schema_dump.json", "w", encoding="utf-8") as f:
        json.dump(schema, f, indent=4)
    print("Schema dumped to schema_dump.json")

    # Also dump as full_schema.txt
    with open("full_schema.txt", "w", encoding="utf-8") as f:
        for table, cols in schema.items():
            f.write(f"Columns in '{table}' table:\n")
            for col in cols:
                f.write(f"- {col}\n")
            f.write("\n")
    print("Schema dumped to full_schema.txt")

if __name__ == "__main__":
    try:
        get_detailed_schema()
    except Exception as e:
        print(f"Error: {e}")
