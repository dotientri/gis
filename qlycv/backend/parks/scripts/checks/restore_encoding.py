import sys
import os

def restore_string(text):
    # Try restoring up to 4 depths
    best_text = text
    current_text = text
    for i in range(4):
        try:
            # We want to reverse: utf8_bytes.decode('cp1258')
            # So we do: string.encode('cp1258').decode('utf-8')
            current_text = current_text.encode('cp1258').decode('utf-8')
            best_text = current_text
        except Exception:
            break
    return best_text

def restore_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Could not read {filepath}: {e}")
        return False
        
    # We shouldn't just decode the whole file at once because it might have mixed depths
    # But usually, it's the whole file. Let's try decoding the whole file first.
    current_content = content
    depth = 0
    for i in range(4):
        try:
            restored = current_content.encode('cp1258').decode('utf-8')
            current_content = restored
            depth = i + 1
        except Exception:
            # Cannot decode further
            break
            
    if depth > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(current_content)
        print(f"Restored {filepath} by {depth} levels.")
        return True
    else:
        # Maybe it's mixed? Let's check if there are still corrupted chars.
        print(f"File {filepath} could not be restored globally.")
        return False

print("Restoring EditParkPage.jsx...")
restore_file('frontend/src/pages/EditParkPage.jsx')

print("Restoring CreateParkPage.jsx...")
restore_file('frontend/src/pages/CreateParkPage.jsx')

# Let's check other pages
pages_dir = 'frontend/src/pages'
for filename in os.listdir(pages_dir):
    if filename.endswith('.jsx') and filename not in ['EditParkPage.jsx', 'CreateParkPage.jsx']:
        filepath = os.path.join(pages_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        if 'á»' in content or 'Ä‚' in content or 'Ă' in content:
            print(f"Found corruption in {filename}, attempting restore...")
            restore_file(filepath)

print("Done.")
