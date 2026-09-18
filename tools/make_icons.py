"""アプリアイコン生成（py -3 tools/make_icons.py）。1024px で描いて縮小しアンチエイリアスを得る。"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
BG = (11, 12, 16)
ACCENT = (255, 107, 61)
ACCENT_DARK = (214, 78, 38)
WHITE = (243, 244, 246)

S = 1024
C = S / 2
K = 0.78  # maskable の安全域（中心から半径40%）に収めるための縮尺


def p(x, y):
    """512 中心・縮尺 K で座標変換"""
    return (C + (x - C) * K, C + (y - C) * K + 10)


img = Image.new("RGB", (S, S), BG)
d = ImageDraw.Draw(img)

# 本体（台形）
d.polygon([p(420, 200), p(604, 200), p(780, 800), p(244, 800)], fill=ACCENT)
# 目盛り窓
d.polygon([p(466, 290), p(558, 290), p(640, 650), p(384, 650)], fill=BG)
# 台座
x0, y0 = p(214, 800)
x1, y1 = p(810, 872)
d.rounded_rectangle([x0, y0, x1, y1], radius=22 * K, fill=ACCENT_DARK)
# 振り子
d.line([p(512, 720), p(668, 250)], fill=WHITE, width=int(40 * K))
cx, cy = p(612, 420)
r = 58 * K
d.rounded_rectangle([cx - r, cy - r * 0.7, cx + r, cy + r * 0.7], radius=16 * K, fill=WHITE)
# 支点
px, py = p(512, 720)
d.ellipse([px - 30 * K, py - 30 * K, px + 30 * K, py + 30 * K], fill=WHITE)

for size in (512, 192, 180):
    img.resize((size, size), Image.LANCZOS).save(ROOT / f"icon-{size}.png", optimize=True)
print("ok")
