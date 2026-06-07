def final_fix(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()

    text = text.replace('GÄ‚¡Ă‚»Ă‚Â­i', 'Gửi')
    text = text.replace('CÄ‚¡Ă‚ºĂ‚Â­p', 'Cập')
    text = text.replace('nhÄ‚¡Ă‚ºĂ‚Â­t', 'nhật')
    text = text.replace('lÄ‚¡Ă‚ºĂ‚Â¥y', 'lấy')
    text = text.replace('cÄ‚â€¦Ă‚©', 'cũ')
    text = text.replace('sÄ‚¡Ă‚»Ă‚­', 'sử')
    text = text.replace('NhÄ‚¡Ă‚ºĂ‚­t', 'Nhật')
    text = text.replace('ÄĂ n', 'Đàn')
    text = text.replace('Ä‘iá»\x81u', 'điều')
    text = text.replace('giá»\x9d', 'giờ')
    text = text.replace('lĂ„â€Ă‚Â\xa0', 'là ')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(text)

final_fix('frontend/src/pages/EditParkPage.jsx')
final_fix('frontend/src/pages/CreateParkPage.jsx')
print("Final fix done")