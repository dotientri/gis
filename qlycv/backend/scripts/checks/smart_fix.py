import os

def fix_mixed_string(text, depth=3):
    for _ in range(depth):
        new_text = ""
        current_segment = ""
        for char in text:
            if ord(char) < 256:
                current_segment += char
            else:
                if current_segment:
                    try:
                        # Try decoding the segment
                        decoded = current_segment.encode('cp1252').decode('utf-8')
                        new_text += decoded
                    except UnicodeError:
                        new_text += current_segment
                    current_segment = ""
                new_text += char
        if current_segment:
            try:
                decoded = current_segment.encode('cp1252').decode('utf-8')
                new_text += decoded
            except UnicodeError:
                new_text += current_segment
        text = new_text
    return text

files_to_fix = [
    'frontend/src/pages/EditParkPage.jsx',
    'frontend/src/pages/CreateParkPage.jsx'
]

for filepath in files_to_fix:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    fixed_content = fix_mixed_string(content, 3)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(fixed_content)
        
print("Smart fix applied.")