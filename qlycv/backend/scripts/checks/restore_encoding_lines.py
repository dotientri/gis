import os

def restore_line(line, max_depth=3):
    # Try the highest depth first, down to 1
    for d in range(max_depth, 0, -1):
        try:
            current_line = line
            for _ in range(d):
                current_line = current_line.encode('cp1258').decode('utf-8')
            return current_line
        except Exception:
            continue
    return line

def restore_file_line_by_line(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    new_lines = []
    changed = False
    for line in lines:
        restored = restore_line(line, 3)
        if restored != line:
            changed = True
        new_lines.append(restored)
        
    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print(f"Restored {filepath} line-by-line.")
    else:
        print(f"No changes made to {filepath}.")

print("Restoring EditParkPage.jsx line-by-line...")
restore_file_line_by_line('frontend/src/pages/EditParkPage.jsx')

print("Restoring CreateParkPage.jsx line-by-line...")
restore_file_line_by_line('frontend/src/pages/CreateParkPage.jsx')

pages_dir = 'frontend/src/pages'
for filename in os.listdir(pages_dir):
    if filename.endswith('.jsx') and filename not in ['EditParkPage.jsx', 'CreateParkPage.jsx']:
        filepath = os.path.join(pages_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        if 'á»' in content or 'Ä‚' in content or 'Ă' in content or 'Ă¡' in content:
            print(f"Found corruption in {filename}, attempting restore...")
            restore_file_line_by_line(filepath)
            
print("Done.")
