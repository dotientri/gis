import os

def restore_string(text, max_depth=3):
    best_text = text
    current_text = text
    for d in range(max_depth):
        try:
            # Revert the CP1252 encoding corruption
            current_text = current_text.encode('cp1252').decode('utf-8')
            best_text = current_text
        except Exception:
            break
    return best_text

def restore_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception:
        return
        
    changed = False
    new_lines = []
    for line in lines:
        restored = restore_string(line, 3)
        if restored != line:
            changed = True
        new_lines.append(restored)
        
    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print(f"Restored: {filepath}")

for root, _, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            restore_file(os.path.join(root, file))
            
print("Final restore pass complete.")
