# 報平安官方帳號 圖文選單圖片 2500x1686（2 列 × 3 格）
from PIL import Image, ImageDraw, ImageFont
import math, sys
W, H, COLS, ROWS = 2500, 1686, 3, 2
BG, INK, SUB = '#FFF8F2', '#1F1B16', '#6B6157'
RED, GREEN, AMBER, BLUE = '#C62828', '#06A84A', '#E09400', '#2F6FB5'
bold = ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc', 120, index=2)
sub  = ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc', 58, index=2)
im = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(im)

def magnifier(cx, cy, c):
    d.rounded_rectangle([cx-120, cy-95, cx+70, cy+40], radius=34, fill=c)          # 訊息泡泡
    d.polygon([(cx-90, cy+30), (cx-105, cy+85), (cx-45, cy+38)], fill=c)
    for k in range(3): d.ellipse([cx-85+k*55-14, cy-42, cx-85+k*55+14, cy-14], fill='white')
    d.ellipse([cx+20, cy-5, cx+130, cy+105], outline=INK, width=22, fill='#FFF3D6')  # 放大鏡
    d.line([cx+115, cy+92, cx+160, cy+137], fill=INK, width=30)
def phone(cx, cy, c):
    d.rounded_rectangle([cx-70, cy-120, cx+70, cy+120], radius=28, fill=c)
    d.rounded_rectangle([cx-52, cy-90, cx+52, cy+70], radius=8, fill='white')
    d.ellipse([cx-14, cy+82, cx+14, cy+110], fill='white')
    d.text((cx, cy-10), '?', font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc', 120, index=2), fill=c, anchor='mm')
def call165(cx, cy, c):
    d.ellipse([cx-125, cy-125, cx+125, cy+125], fill=c)
    d.text((cx, cy-4), '165', font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc', 104, index=2), fill='white', anchor='mm')
def wave(cx, cy, c):
    d.ellipse([cx-125, cy-125, cx+125, cy+125], fill=c)
    d.line([cx-62, cy+4, cx-14, cy+52, cx+70, cy-48], fill='white', width=34, joint='curve')
def status(cx, cy, c):
    d.rounded_rectangle([cx-105, cy-125, cx+105, cy+125], radius=24, fill=c)
    d.rounded_rectangle([cx-45, cy-142, cx+45, cy-100], radius=12, fill=INK)
    for k in range(3):
        y = cy-55+k*62
        d.ellipse([cx-70, y-16, cx-38, y+16], fill='white')
        d.rounded_rectangle([cx-20, y-12, cx+75, y+12], radius=12, fill='white')
def shield(cx, cy, c):
    pts = [(cx, cy-135), (cx+115, cy-90), (cx+115, cy+5)]
    for k in range(0, 101, 5):
        t = k/100; pts.append((cx+115*(1-t), cy+5+(130*math.sin(t*math.pi/2))))
    pts += [(cx-115*(1-t), cy+5+130*math.sin(t*math.pi/2)) for t in [k/100 for k in range(100, -1, -5)]]
    pts += [(cx-115, cy-90)]
    d.polygon(pts, fill=c)
    d.line([cx-50, cy, cx-12, cy+40, cx+58, cy-40], fill='white', width=28, joint='curve')

cells = [
    (magnifier, RED,   '查可疑訊息', '轉傳或截圖給我'),
    (phone,     AMBER, '查電話',     '傳號碼給我'),
    (call165,   RED,   '撥打 165',   '反詐騙專線'),
    (wave,      GREEN, '我要報平安', '開啟報平安'),
    (status,    BLUE,  '平安狀態',   '家人今天報了嗎'),
    (shield,    RED,   '防詐 App',   '更多功能'),
]
CW, RH = W / COLS, H / ROWS
for i, (icon, col, title, s2) in enumerate(cells):
    c, r = i % COLS, i // COLS
    x0, y0 = round(c*CW), round(r*RH); x1, y1 = round((c+1)*CW), round((r+1)*RH)
    d.rounded_rectangle([x0+18, y0+18, x1-18, y1-18], radius=48, fill='white', outline='#EADFD3', width=6)
    cx = (x0+x1)//2
    icon(cx, y0+290, col)
    d.text((cx, y0+545), title, font=bold, fill=INK, anchor='mm')
    d.text((cx, y0+680), s2, font=sub, fill=SUB, anchor='mm')
im.save(sys.argv[1] if len(sys.argv) > 1 else 'richmenu.png', optimize=True)
