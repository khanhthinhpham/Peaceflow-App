import os
import re
from collections import Counter
from pathlib import Path

import openpyxl
import psycopg2
from psycopg2.extras import Json


ROOT = Path(__file__).resolve().parents[3]
XLSX_PATH = ROOT / "Copy of tasks-review.xlsx"
ENV_PATH = ROOT / "backend" / ".env"


def load_database_url():
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line.startswith("DATABASE_URL="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise RuntimeError(f"DATABASE_URL not found in {ENV_PATH}")


def split_steps(value):
    if not value:
        return []
    return [part.strip() for part in str(value).split("|") if part.strip()]


def split_benefits(value):
    if not value:
        return []
    return [part.strip() for part in str(value).split(";") if part.strip()]


def as_active(value):
    return str(value).strip().lower() in {"có", "co", "yes", "true", "1"}


def read_tasks():
    workbook = openpyxl.load_workbook(XLSX_PATH, data_only=True, read_only=True)
    worksheet = workbook["Tasks Review"]
    rows = list(worksheet.iter_rows(min_row=2, values_only=True))
    seen = Counter()
    tasks = []

    for row_number, row in enumerate(rows, start=2):
        code = str(row[0]).strip()
        seen[code] += 1
        suffix = "" if seen[code] == 1 else f"-{chr(96 + seen[code])}"
        import_code = f"{code}{suffix}"
        title = str(row[1] or "").strip()[:255]
        warnings = [str(row[index]).strip() for index in (11, 12, 13, 14) if row[index]]

        tasks.append({
            "code": import_code,
            "title": title,
            "category": str(row[2] or "general").strip(),
            "difficulty": str(row[3] or "easy").strip(),
            "duration_minutes": int(row[4]),
            "xp_reward": int(row[5] or 0),
            "active": as_active(row[6]),
            "description": str(row[7] or "").strip(),
            "steps": split_steps(row[9]),
            "metadata": {
                "source": XLSX_PATH.name,
                "source_row": row_number,
                "original_code": code,
                "benefits": split_benefits(row[10]),
                "review_warnings": warnings,
            },
        })

    if len({task["code"] for task in tasks}) != len(tasks):
        raise RuntimeError("Normalized task codes are still duplicated")
    return tasks


def import_tasks():
    tasks = read_tasks()
    database_url = load_database_url()
    codes = [task["code"] for task in tasks]

    with psycopg2.connect(database_url) as connection:
        with connection.cursor() as cursor:
            for task in tasks:
                cursor.execute(
                    """
                    INSERT INTO tasks
                      (code, title, category, difficulty, duration_minutes, xp_reward,
                       description, steps, active, metadata)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (code) DO UPDATE SET
                      title = EXCLUDED.title,
                      category = EXCLUDED.category,
                      difficulty = EXCLUDED.difficulty,
                      duration_minutes = EXCLUDED.duration_minutes,
                      xp_reward = EXCLUDED.xp_reward,
                      description = EXCLUDED.description,
                      steps = EXCLUDED.steps,
                      active = EXCLUDED.active,
                      metadata = EXCLUDED.metadata,
                      updated_at = now()
                    """,
                    (
                        task["code"], task["title"], task["category"], task["difficulty"],
                        task["duration_minutes"], task["xp_reward"], task["description"],
                        Json(task["steps"]), task["active"], Json(task["metadata"]),
                    ),
                )

            cursor.execute(
                "UPDATE tasks SET active = FALSE, updated_at = now() WHERE NOT (code = ANY(%s))",
                (codes,),
            )
            deactivated = cursor.rowcount

    duplicate_codes = sorted(code for code, count in Counter(task["metadata"]["original_code"] for task in tasks).items() if count > 1)
    print(f"Imported/updated: {len(tasks)}")
    print(f"Deactivated old tasks: {deactivated}")
    print(f"Duplicate source codes normalized: {len(duplicate_codes)}")
    print("Transaction committed")


if __name__ == "__main__":
    import_tasks()
