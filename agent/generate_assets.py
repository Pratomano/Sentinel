import base64
import os
from PIL import Image, ImageDraw, ImageFilter

def draw_sentinel_image(size=512):
    # Trabalhamos com supersampling 4x para anti-aliasing perfeito
    scale = 4
    canvas_size = size * scale
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    def s(val):
        return val * (canvas_size / 100.0)

    def poly(points):
        return [(s(x), s(y)) for x, y in points]

    # Cores Sentinel Marvel
    c_armor_top = (232, 121, 249, 255)      # #e879f9
    c_armor_light = (245, 208, 254, 180)    # #f5d0fe
    c_armor_main = (139, 92, 246, 255)      # #8b5cf6
    c_armor_shadow = (59, 7, 100, 200)      # #3b0764
    c_face_dark = (22, 13, 38, 255)         # #160d26
    c_cheek = (217, 70, 239, 220)           # #d946ef
    c_eye_core = (255, 46, 126, 255)        # #ff2e7e
    c_eye_glow = (251, 191, 36, 255)        # #fbbf24
    c_outline = (192, 132, 252, 255)        # #c084fc
    c_mouth = (168, 85, 247, 255)           # #a855f7

    # 1. Crista Superior do Capacete
    draw.polygon(poly([(36, 8), (64, 8), (68, 18), (32, 18)]), fill=c_armor_top)
    draw.polygon(poly([(44, 8), (56, 8), (54, 16), (46, 16)]), fill=c_armor_light)

    # 2. Placa Frontal / Testa
    draw.polygon(poly([(30, 20), (70, 20), (76, 34), (24, 34)]), fill=c_armor_main)
    draw.line(poly([(30, 20), (70, 20)]), fill=c_armor_light, width=int(s(0.8)))

    # 3. Protetores Auriculares
    draw.polygon(poly([(22, 24), (10, 38), (14, 60), (24, 62), (23, 38)]), fill=c_armor_main)
    draw.polygon(poly([(12, 40), (14, 56), (21, 58), (19, 40)]), fill=c_armor_shadow)

    draw.polygon(poly([(78, 24), (90, 38), (86, 60), (76, 62), (77, 38)]), fill=c_armor_main)
    draw.polygon(poly([(88, 40), (86, 56), (79, 58), (81, 40)]), fill=c_armor_shadow)

    # 4. Base Facial / Chassi
    draw.polygon(
        poly([(24, 34), (76, 34), (74, 68), (50, 94), (26, 68)]),
        fill=c_face_dark,
        outline=c_armor_main,
        width=int(s(1.6))
    )

    # 5. Placas Angulares das Bochechas
    draw.polygon(poly([(24, 50), (36, 68), (26, 68)]), fill=c_cheek)
    draw.polygon(poly([(76, 50), (64, 68), (74, 68)]), fill=c_cheek)

    # 6. Ponte Central do Visor
    draw.polygon(poly([(48, 34), (52, 34), (53, 49), (47, 49)]), fill=c_mouth)

    # 7. Olhos Cibernéticos (Visor incandescente)
    # Camada de Glow difuso primeiro
    eye_pts_l = poly([(30, 42), (45, 43), (43, 49), (32, 48)])
    eye_pts_r = poly([(70, 42), (55, 43), (57, 49), (68, 48)])
    
    draw.polygon(eye_pts_l, fill=c_eye_core)
    draw.polygon(eye_pts_r, fill=c_eye_core)

    # 8. Respirador
    line_w = int(s(1.6))
    draw.line(poly([(42, 58), (58, 58)]), fill=c_mouth, width=line_w)
    draw.line(poly([(43, 64), (57, 64)]), fill=c_armor_main, width=line_w)
    draw.line(poly([(45, 70), (55, 70)]), fill=c_armor_shadow, width=line_w)

    # 9. Placa do Queixo em formato de Escudo
    draw.polygon(
        poly([(40, 78), (60, 78), (50, 91)]),
        fill=c_armor_main,
        outline=c_outline,
        width=int(s(1.0))
    )

    # Downsample com filtro Lanczos para alta qualidade
    result = img.resize((size, size), Image.Resampling.LANCZOS)
    return result

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Gera imagem 256x256
    img_256 = draw_sentinel_image(256)
    png_path = os.path.join(base_dir, "sentinel.png")
    img_256.save(png_path, "PNG")
    print(f"PNG salvo em: {png_path}")

    # Gera imagem 48x48 para o header do Tkinter
    img_48 = draw_sentinel_image(48)
    png_header_path = os.path.join(base_dir, "sentinel_header.png")
    img_48.save(png_header_path, "PNG")

    # Gera .ICO com múltiplos tamanhos para Windows
    ico_path = os.path.join(base_dir, "sentinel.ico")
    icon_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    img_256.save(ico_path, format="ICO", sizes=icon_sizes)
    print(f"ICO salvo em: {ico_path}")

    # Gera Base64 da imagem 48x48 para embutir no código
    with open(png_header_path, "rb") as f:
        b64_header = base64.b64encode(f.read()).decode("utf-8")

    # Salva o Base64 em um arquivo de texto de suporte
    b64_path = os.path.join(base_dir, "logo_base64.txt")
    with open(b64_path, "w", encoding="utf-8") as f:
        f.write(b64_header)
    print("Base64 gerado com sucesso!")

if __name__ == "__main__":
    main()
