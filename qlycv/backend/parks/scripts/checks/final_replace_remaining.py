def final_replace_remaining(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()

    text = text.replace('XĂ„â€Ă‚Â³a', 'Xóa')
    text = text.replace('lĂ„â€Ă‚\xa0', 'là')
    text = text.replace('thĂ„â€Ă‚Â´ng', 'thông')
    text = text.replace('VĂ„â€Ă‚\xa0', 'Và')
    text = text.replace('ThĂ„â€Ă‚Â¡i', 'Thái')
    text = text.replace('ViĂ„â€Ă‚Âªn', 'Viên')
    text = text.replace('TĂ„â€Ă‚Â¹y', 'Tùy')
    text = text.replace('CĂ„â€Ă‚Â¢y', 'Cây')
    text = text.replace('TĂ„â€Ă‚¬nh', 'Tình')
    text = text.replace('KhĂ„â€Ă‚Â¡', 'Khá')
    text = text.replace('BĂ„â€Ă‚¬nh', 'Bình')
    text = text.replace('KĂ„â€Ă‚Â©m', 'Kém')
    text = text.replace('Ăt', 'Ít')
    text = text.replace('Ăch', 'Ích')
    text = text.replace('ViĂ„â€Ă‚ªn', 'Viên')
    text = text.replace('KhĂ„â€Ă‚¡', 'Khá')
    text = text.replace('lĂ„â€Ă‚ ', 'là')
    text = text.replace('VĂ„â€Ă‚ ', 'Và')
    text = text.replace('ThĂ„â€Ă‚¡i', 'Thái')
    text = text.replace('XĂ„â€Ă‚³a', 'Xóa')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(text)

final_replace_remaining('frontend/src/pages/EditParkPage.jsx')
final_replace_remaining('frontend/src/pages/CreateParkPage.jsx')
print("Final fragments fixed.")