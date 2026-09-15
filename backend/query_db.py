import os
import sqlite3
import uuid
from datetime import datetime

db_path = r"C:\Users\qibra\.gemini\antigravity\scratch\Skyrecon\backend\db.sqlite3"
backend_dir = r"C:\Users\qibra\.gemini\antigravity\scratch\Skyrecon\backend"

conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Get table names
cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [r[0] for r in cur.fetchall()]
print("Tables:", tables)

table_name = None
if "ai_models" in tables:
    table_name = "ai_models"
elif "core_aimodel" in tables:
    table_name = "core_aimodel"

if table_name:
    cur.execute(f"DELETE FROM {table_name}")

    # Find pt files
    for f in os.listdir(backend_dir):
        if f.endswith(".pt"):
            name = f.replace(".pt", "")
            version = "2.6.0" if "26" in name else "8.0.0" if "8" in name else "1.0.0"
            idd = str(uuid.uuid4()).replace("-", "")
            now = datetime.now().isoformat(" ")
            cur.execute(
                f"""
                INSERT INTO {table_name} (id, name, version, framework, status, accuracy, file_path, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
                (idd, name, version, "YOLO", "READY", 85.0, f, 0, now, now),
            )
            print(f"Inserted {f}")
    conn.commit()
    print("Models synced successfully!")
else:
    print("Could not find the AI models table.")

conn.close()
