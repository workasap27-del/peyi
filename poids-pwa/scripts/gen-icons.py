from PIL import Image, ImageDraw, ImageFont
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "public")
os.makedirs(OUT, exist_ok=True)

BG = (15, 23, 42)  # slate-900
ACCENT = (56, 189, 248)  # sky-400


def draw_mark(size, padding_ratio=0.18):
    img = Image.new("RGBA", (size, size), BG + (255,))
    d = ImageDraw.Draw(img)
    pad = int(size * padding_ratio)
    # downward trending arrow/curve as the "weight loss" mark
    stroke = max(4, size // 18)
    pts = [
        (pad, size * 0.32),
        (size * 0.42, size * 0.55),
        (size * 0.58, size * 0.42),
        (size - pad, size * 0.72),
    ]
    d.line(pts, fill=ACCENT, width=stroke, joint="curve")
    r = stroke * 1.1
    x, y = pts[-1]
    d.ellipse([x - r, y - r, x + r, y + r], fill=ACCENT)
    return img


for size, name in [(192, "pwa-192.png"), (512, "pwa-512.png")]:
    draw_mark(size).save(os.path.join(OUT, name))

# maskable: keep mark within safe zone (extra padding)
draw_mark(512, padding_ratio=0.28).save(os.path.join(OUT, "pwa-512-maskable.png"))

# apple touch icon (no transparency, 180x180)
apple = draw_mark(180, padding_ratio=0.2).convert("RGB")
apple.save(os.path.join(OUT, "apple-touch-icon.png"))

# favicon.ico (multi-size)
icon32 = draw_mark(32, padding_ratio=0.12)
icon32.save(os.path.join(OUT, "favicon.ico"), sizes=[(32, 32), (16, 16)])

print("icons generated")
