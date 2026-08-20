from PIL import Image, ImageDraw
import json
import re

with open('lib/data/countries.js', 'r', encoding='utf-8') as f:
    raw = f.read()

s = raw[raw.find('{'):raw.rfind('}')+1]
s = re.sub(r'([a-zA-Z0-9_]+):', r'"\1":', s)
data = json.loads(s)

img = Image.new('L', (1024, 512), 0)
draw = ImageDraw.Draw(img)

def coord_to_px(lon, lat):
    x = (lon + 180.0) / 360.0 * 1024.0
    y = (90.0 - lat) / 180.0 * 512.0
    return (x, y)

for feature in data.get('features', []):
    geom = feature.get('geometry', {})
    gtype = geom.get('type')
    coords = geom.get('coordinates', [])
    if gtype == 'Polygon':
        for ring in coords:
            poly = [coord_to_px(c[0], c[1]) for c in ring]
            if len(poly) >= 3:
                draw.polygon(poly, fill=255)
    elif gtype == 'MultiPolygon':
        for poly_coords in coords:
            for ring in poly_coords:
                poly = [coord_to_px(c[0], c[1]) for c in ring]
                if len(poly) >= 3:
                    draw.polygon(poly, fill=255)

img.save('public/earth-mask.png', 'PNG')
print('Successfully saved public/earth-mask.png, size:', img.size)
