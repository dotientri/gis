def fix_encoding(text, depth=1):
    for i in range(depth):
        try:
            text = text.encode('cp1252').decode('utf-8')
        except Exception as e:
            return f"Failed at depth {i+1}: {e}"
    return text

print("Depth 1:", fix_encoding("Chá»‰nh Sá»­a", 1))
print("Depth 2:", fix_encoding("ChĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă‚Â°nh SĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â­a", 2))
print("Depth 3:", fix_encoding("ChĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă‚Â°nh SĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â­a", 3))
print("EditParkPage garbled:", fix_encoding("hÄ‚Â¡Ă‚Â»Ă¢â‚¬Â°nh SÄ‚Â¡Ă‚Â»Ă‚Â­a", 3))
print("EditParkPage title:", fix_encoding("ChÄ‚Â¡Ă‚Â»Ă¢â‚¬Â°nh SÄ‚Â¡Ă‚Â»Ă‚Â­a", 3))
print("EditParkPage basic info:", fix_encoding("ThĂ„â€Ă‚Â´ng Tin CÄ‚â€ Ă‚Â¡ BÄ‚Â¡Ă‚ÂºĂ‚Â£n", 3))

import sys
print(sys.stdout.encoding)