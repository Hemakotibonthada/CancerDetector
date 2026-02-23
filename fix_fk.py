"""Fix FK table name mismatches in all model files."""
import os

models_dir = os.path.join("backend", "app", "models")
changes = 0

for fname in os.listdir(models_dir):
    if not fname.endswith(".py"):
        continue
    fpath = os.path.join(models_dir, fname)
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
    
    new_content = content
    
    # Fix __tablename__ in specific files
    if fname == "user.py":
        new_content = new_content.replace('__tablename__ = "users"', '__tablename__ = "user"')
    if fname == "patient.py":
        new_content = new_content.replace('__tablename__ = "patients"', '__tablename__ = "patient"')
    if fname == "hospital.py":
        new_content = new_content.replace('__tablename__ = "hospitals"', '__tablename__ = "hospital"')
    
    # Fix plural FK references to singular across ALL files
    new_content = new_content.replace('ForeignKey("users.', 'ForeignKey("user.')
    new_content = new_content.replace('ForeignKey("patients.', 'ForeignKey("patient.')
    new_content = new_content.replace('ForeignKey("hospitals.', 'ForeignKey("hospital.')
    
    # Fix missing table: sdoh_assessment -> remove FK, keep column
    new_content = new_content.replace(
        'ForeignKey("sdoh_assessment.id"), nullable=True',
        'nullable=True'
    )
    
    # Fix missing table: ai_reading_result -> remove FK, keep column
    new_content = new_content.replace(
        'ForeignKey("ai_reading_result.id"), nullable=True',
        'nullable=True'
    )
    
    if new_content != content:
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(new_content)
        count = sum(1 for a, b in zip(content.split("\n"), new_content.split("\n")) if a != b)
        print(f"Fixed {fname}: {count} lines changed")
        changes += count

print(f"\nTotal lines modified: {changes}")
