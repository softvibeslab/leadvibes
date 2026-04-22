"""
Script para generar el documento Word de la guía de branding de Rovi
"""
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn

def add_heading(doc, text, level=1):
    """Añade un heading con formato específico"""
    heading = doc.add_heading(text, level=level)
    heading.alignment = WD_ALIGN_PARAGRAPH.LEFT
    return heading

def add_paragraph(doc, text, style=None):
    """Añade un párrafo con texto"""
    para = doc.add_paragraph(text, style=style)
    return para

def add_color_paragraph(doc, text, hex_color):
    """Añade un párrafo con texto coloreado"""
    para = doc.add_paragraph()
    run = para.add_run(text)
    # Convertir HEX a RGB
    hex_color = hex_color.lstrip('#')
    r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    run.font.color.rgb = RGBColor(r, g, b)
    return para

def add_table(doc, headers, rows):
    """Añade una tabla con los datos especificados"""
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = 'Light Grid Accent 1'

    # Header row
    hdr_cells = table.rows[0].cells
    for i, header in enumerate(headers):
        hdr_cells[i].text = header
        hdr_cells[i].paragraphs[0].runs[0].font.bold = True

    # Data rows
    for row_data in rows:
        row_cells = table.add_row().cells
        for i, cell_data in enumerate(row_data):
            row_cells[i].text = str(cell_data)

    return table

def create_rovi_brand_guide():
    """Crea el documento completo de la guía de branding"""
    doc = Document()

    # Título del documento
    title = doc.add_heading('Guía de Identidad de Marca - Rovi CRM', 0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # Metadatos
    doc.add_paragraph('Version: 1.0')
    doc.add_paragraph('Fecha: Abril 2026')
    doc.add_paragraph('Estado: Oficial - Implementación Activa')
    doc.add_paragraph()

    # Indice
    doc.add_heading('Indice', 1)
    index_items = [
        '1. Brief de Branding',
        '2. Paleta Principal - Rovi AI Tech Palette',
        '3. Sistema de Gradientes',
        '4. Tipografía',
        '5. Aplicación en UI',
        '6. Dark Mode',
        '7. Paletas Alternativas',
        '8. Ejemplos de Código',
        '9. Guía de Uso por Componente',
        '10. Assets y Recursos'
    ]
    for item in index_items:
        doc.add_paragraph(item)

    doc.add_page_break()

    # 1. Brief de Branding
    doc.add_heading('Brief de Branding', 1)

    doc.add_heading('Posicionamiento', 2)
    doc.add_paragraph(
        'Rovi es un CRM con IA extremadamente avanzada que automatiza la generación de leads '
        'de alta calidad desde Instagram. Su identidad visual debe transmitir:'
    )
    positioning = [
        '✅ Confianza y profesionalismo del sector inmobiliario',
        '✅ Innovación y futurismo de una IA muy avanzada',
        '✅ Eficiencia, velocidad y automatización',
        '✅ Sensación premium, sofisticada y moderna',
        '✅ Aspecto tecnológico y aspiracional (nivel Follow Up Boss + OpenAI + Figma)'
    ]
    for point in positioning:
        doc.add_paragraph(point)

    doc.add_heading('Dirección Estratégica 2026', 2)
    doc.add_paragraph('De: "Eco-luxury Tulum" → A: "AI-powered Real Estate Tech"')
    doc.add_paragraph('De: Naturaleza y tierra → A: Futuro digital y automatización inteligente')
    doc.add_paragraph('De: Calidez orgánica → A: Sofisticación tecnológica con personalidad')

    doc.add_page_break()

    # 2. Paleta Principal
    doc.add_heading('Paleta Principal - Rovi AI Tech Palette', 1)
    doc.add_heading('Colores Primarios', 2)

    # Tabla de colores primarios
    primary_colors = [
        ('Primary', 'Deep Velocity Blue', '#0A4DAF', 'rgb(10, 77, 175)', 'hsl(217, 89%, 36%)', 'Botones principales, links, branding, headers'),
        ('Primary Dark', 'Midnight Forge', '#062B5F', 'rgb(6, 43, 95)', 'hsl(217, 89%, 20%)', 'Headers, sidebar, estados hover'),
        ('Accent', 'Electric Cyan ⚡', '#00D9FF', 'rgb(0, 217, 255)', 'hsl(187, 100%, 50%)', 'CTAs, notificaciones, AI indicators'),
        ('Secondary', 'Neural Violet 🟣', '#7C3AED', 'rgb(124, 58, 237)', 'hsl(262, 75%, 50%)', 'Badges de IA, features avanzadas')
    ]

    add_table(doc, ['Rol', 'Nombre', 'HEX', 'RGB', 'HSL', 'Uso'], primary_colors)

    doc.add_heading('Colores Funcionales', 2)
    functional_colors = [
        ('Success', 'Growth Mint', '#10B981', 'Estados positivos, conversión, exito'),
        ('Warning', 'Solar Amber', '#F59E0B', 'Alertas, estados intermedios'),
        ('Error', 'Crimson Edge', '#EF4444', 'Errores, destructive, estados criticos')
    ]

    add_table(doc, ['Rol', 'Nombre', 'HEX', 'Uso'], functional_colors)

    doc.add_page_break()

    # 3. Sistema de Gradientes
    doc.add_heading('Sistema de Gradientes', 1)

    gradients = [
        ('Velocity', 'linear-gradient(135deg, #0F172A 0%, #062B5F 40%, #0A4DAF 100%)', 'Hero sections, backgrounds principales'),
        ('Neural', 'linear-gradient(135deg, #7C3AED 0%, #00D9FF 100%)', 'Features de IA, badges "Powered by AI"'),
        ('Primary', 'linear-gradient(135deg, #0A4DAF 0%, #062B5F 100%)', 'Botones primarios, cards importantes'),
        ('Growth', 'linear-gradient(135deg, #10B981 0%, #059669 100%)', 'Success states, métricas positivas')
    ]

    for grad_name, grad_css, grad_use in gradients:
        doc.add_heading(f'Gradient: {grad_name}', 2)
        doc.add_paragraph(f'CSS: {grad_css}')
        doc.add_paragraph(f'Uso: {grad_use}')

    doc.add_page_break()

    # 4. Tipografia
    doc.add_heading('Tipografia', 1)

    doc.add_heading('Font Families', 2)
    doc.add_paragraph('Primary Font: Outfit', style='Intense Quote')
    doc.add_paragraph('Uso: Headings (h1-h6), títulos, elementos destacados')
    doc.add_paragraph('Weights: 300, 400, 500, 600, 700, 800')

    doc.add_paragraph('Secondary Font: Plus Jakarta Sans', style='Intense Quote')
    doc.add_paragraph('Uso: Body text, párrafos, UI elements')
    doc.add_paragraph('Weights: 300, 400, 500, 600, 700')

    doc.add_page_break()

    # 5. Aplicacion en UI
    doc.add_heading('Aplicacion en UI', 1)

    doc.add_heading('Botones', 2)
    doc.add_paragraph('Primary Button:', style='Intense Quote')
    doc.add_paragraph('background: linear-gradient(135deg, #0A4DAF 0%, #062B5F 100%)')
    doc.add_paragraph('color: white')
    doc.add_paragraph('hover: brightness(1.1) + shadow: 0 8px 24px rgba(10, 77, 175, 0.4)')

    doc.add_paragraph('Accent CTA Button:', style='Intense Quote')
    doc.add_paragraph('background: #00D9FF')
    doc.add_paragraph('color: #0F172A')
    doc.add_paragraph('hover: background: #33E1FF + shadow: 0 8px 24px rgba(0, 217, 255, 0.5)')

    doc.add_page_break()

    # 6. Dark Mode
    doc.add_heading('Dark Mode', 1)

    dark_mode_colors = [
        ('Background', '#0F172A', 'Obsidian Base'),
        ('Surface', '#1E293B', 'Deep Slate'),
        ('Surface Elevated', '#334155', 'Light Slate')
    ]

    add_table(doc, ['Elemento', 'HEX', 'Nombre'], dark_mode_colors)

    doc.add_page_break()

    # 7. Paletas Alternativas
    doc.add_heading('Paletas Alternativas', 1)

    doc.add_heading('ALTERNATIVA 1: "Corporate Premium Azul"', 2)
    doc.add_paragraph('Vibe: Más conservadora, enterprise B2B, confianza máxima')

    alt1_colors = [
        ('Primary', '#0F62FE', 'IBM Electric Blue'),
        ('Primary Dark', '#052B85', 'Navy Enterprise'),
        ('Accent', '#4589FF', 'Sky Azure'),
        ('Secondary', '#0043CE', 'Royal Blue'),
        ('Neutral', '#161616', 'Carbon Black')
    ]

    add_table(doc, ['Rol', 'HEX', 'Nombre'], alt1_colors)

    doc.add_heading('ALTERNATIVA 2: "Futurista Cyber-Teal/Purple"', 2)
    doc.add_paragraph('Vibe: Maximal futurismo, cyberpunk 2026, IA agresiva')

    alt2_colors = [
        ('Primary', '#06B6D4', 'Cyber Teal'),
        ('Primary Dark', '#0E7490', 'Deep Teal'),
        ('Accent', '#A855F7', 'Electric Purple'),
        ('Secondary', '#EC4899', 'Hot Pink'),
        ('Neutral', '#030712', 'Void Black')
    ]

    add_table(doc, ['Rol', 'HEX', 'Nombre'], alt2_colors)

    doc.add_page_break()

    # 8. Ejemplos de Codigo
    doc.add_heading('Ejemplos de Codigo', 1)

    doc.add_heading('React con Tailwind CSS', 2)
    doc.add_paragraph('Button Primary:', style='Intense Quote')

    code_primary = '''const ButtonPrimary = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="px-8 py-4 rounded-xl font-semibold text-white
      bg-gradient-to-r from-[#0A4DAF] to-[#062B5F]
      hover:from-[#0D5FD4] hover:to-[#08367A]
      shadow-[0_8px_24px_rgba(10,77,175,0.4)]
      hover:shadow-[0_12px_32px_rgba(10,77,175,0.5)]
      transform hover:-translate-y-0.5
      transition-all duration-300"
  >
    {children}
  </button>
);'''
    doc.add_paragraph(code_primary)

    doc.add_page_break()

    # 9. Guia de Uso por Componente
    doc.add_heading('Guia de Uso por Componente', 1)

    doc.add_heading('Landing Page (/for-brokers)', 2)

    components_usage = [
        ('Hero Section', 'gradient-velocity', 'Cyan y Violeta con blur'),
        ('Features Section', '8 módulos con gradient tecnológicos', 'Cada módulo con su color específico'),
        ('Benefits Section', 'Gradient primary', 'Iconos blancos'),
        ('Launch Form', 'Gradient primary → cyan → violeta', 'Progress bar cyan-violeta'),
        ('Testimonials', 'Avatares cyan-blue', 'Gradient tecnológicos')
    ]

    add_table(doc, ['Componente', 'Gradiente/Color', 'Detalles'], components_usage)

    doc.add_page_break()

    # 10. Assets y Recursos
    doc.add_heading('Assets y Recursos', 1)

    assets = [
        ('Favicon', 'ICO, PNG', '16x16, 32x32, 48x48, 256x256'),
        ('Logo', 'SVG, PNG', 'Principal, Dark, Light, Icon Only'),
        ('Open Graph', '1200x630px', 'Facebook, LinkedIn'),
        ('Twitter Card', '1600x900px', 'Twitter/X'),
        ('Illustrations', 'SVG', 'Futurista, tech, cyan y violeta')
    ]

    add_table(doc, ['Asset', 'Formato', 'Tamaños/Variante'], assets)

    # Footer
    doc.add_page_break()
    doc.add_paragraph()
    doc.add_paragraph('© 2026 Rovi CRM. Todos los derechos reservados.', style='Intense Quote')
    doc.add_paragraph()
    doc.add_paragraph('Este documento es la fuente oficial de verdad para la identidad de marca de Rovi CRM.')
    doc.add_paragraph('Cualquier cambio debe ser aprobado por el equipo de diseño y actualizado aquí primero.')

    return doc

if __name__ == '__main__':
    print('Creando documento Word de la guia de branding de Rovi...')
    doc = create_rovi_brand_guide()

    output_path = 'ROVI_BRAND_GUIDE.docx'
    doc.save(output_path)
    print(f'Documento creado exitosamente: {output_path}')
    print(f'Ubicacion: {output_path}')
