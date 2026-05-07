import os
import re

def fix_token(token):
    current = token
    for _ in range(4):
        try:
            decoded = current.encode('cp1258').decode('utf-8')
            if decoded == current:
                break
            current = decoded
        except Exception:
            break
    return current

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by word boundaries that keep punctuation separate, or just split by non-cp1258 characters?
    # Better: use regex to find sequences of characters that could be corrupted.
    # Corrupted text consists of ASCII letters, and characters in the range \u0080-\u00FF, plus some others like \u201A, \u201C, etc.
    # Let's just split by whitespace and some punctuations, but keep them so we can reconstruct.
    # Actually, we can just find any sequence of characters that does not contain precomposed Vietnamese characters.
    # But splitting by spaces is easiest. Wait, if a word is attached to a parenthesis like `(cÄ‚Â¡Ă‚ÂºĂ‚Â­p`, 
    # the parenthesis is in cp1258, so the whole `(cÄ‚Â¡Ă‚ÂºĂ‚Â­p` will be fixed!
    
    # We split the string by non-word characters, but keep the delimiters so we can reconstruct the string
    tokens = re.split(r'([ \t\n\r"\'()\[\]{}.,:;!<>?]+)', content)
    
    new_tokens = []
    for token in tokens:
        if token:
            new_tokens.append(fix_token(token))
            
    new_content = "".join(new_tokens)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")

files_to_fix = [
    'frontend/src/pages/EditParkPage.jsx',
    'frontend/src/pages/CreateParkPage.jsx'
]

for fp in files_to_fix:
    process_file(fp)

print("Smart CP1258 fix applied.")