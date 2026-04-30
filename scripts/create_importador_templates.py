from pathlib import Path
from xml.sax.saxutils import escape
from zipfile import ZIP_DEFLATED, ZipFile


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DIR = ROOT / "frontend" / "public"
OUTPUT_FILE = PUBLIC_DIR / "plantilla_importador_combinada.xlsx"


def col_letter(index: int) -> str:
    result = ""
    while index > 0:
        index, remainder = divmod(index - 1, 26)
        result = chr(65 + remainder) + result
    return result


def infer_cell(value):
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return f'<c r="{{ref}}"><v>{value}</v></c>'

    text = "" if value is None else str(value)
    return (
        f'<c r="{{ref}}" t="inlineStr"><is><t>{escape(text)}</t></is></c>'
    )


def build_sheet_xml(rows):
    max_cols = max((len(row) for row in rows), default=1)
    dimension = f"A1:{col_letter(max_cols)}{max(len(rows), 1)}"
    sheet_rows = []

    for row_index, row in enumerate(rows, start=1):
      cells = []
      for col_index, value in enumerate(row, start=1):
        ref = f"{col_letter(col_index)}{row_index}"
        cells.append(infer_cell(value).format(ref=ref))
      sheet_rows.append(f'<row r="{row_index}">{"".join(cells)}</row>')

    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        f'<dimension ref="{dimension}"/>'
        '<sheetViews><sheetView workbookViewId="0"/></sheetViews>'
        '<sheetFormatPr defaultRowHeight="15"/>'
        '<sheetData>'
        f'{"".join(sheet_rows)}'
        '</sheetData>'
        '</worksheet>'
    )


PRODUCTS_ROWS = [
    ["SKU", "Titulo", "Descripcion", "TipoProducto", "Nicho", "PrecioMXN", "ImageURLs", "Alias", "Keywords", "Activo"],
    [
        "LOT-001",
        "Lote Residencial Aldea Zama",
        "Lote premium en zona de alta plusvalia en Tulum",
        "real_estate",
        "Residencial",
        2500000,
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200|https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200",
        "Aldea Zama Premium|Lote Zama",
        "inversion|tulum|premium",
        "true",
    ],
]

LEADS_ROWS = [
    [
        "Nombre",
        "Email",
        "Telefono",
        "Fuente",
        "Estado",
        "Prioridad",
        "Presupuesto",
        "InteresTexto",
        "ProductoSKU",
        "ProductoTitulo",
        "Ubicacion",
        "Notas",
    ],
    [
        "Maria Lopez",
        "maria@correo.com",
        "+52 984 555 7788",
        "WhatsApp",
        "nuevo",
        "media",
        2600000,
        "Busca lote en Aldea Zama",
        "LOT-001",
        "Lote Residencial Aldea Zama",
        "Tulum",
        "Quiere opciones con mensualidades",
    ],
]

INSTRUCTIONS_ROWS = [
    ["Plantilla combinada de Importador"],
    ["Hoja", "Uso"],
    ["Productos", "Carga primero tu catalogo de productos o servicios."],
    ["Leads", "Importa leads y vincula cada uno por ProductoSKU o ProductoTitulo."],
    [""],
    ["Reglas de vinculacion"],
    ["1", "Si viene ProductoSKU, se busca coincidencia exacta por SKU."],
    ["2", "Si no hay SKU, se intenta vincular por ProductoTitulo."],
    ["3", "InteresTexto se conserva como respaldo si no hay match automatico."],
]


def build_workbook():
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

    content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>
"""

    root_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
"""

    workbook = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Productos" sheetId="1" r:id="rId1"/>
    <sheet name="Leads" sheetId="2" r:id="rId2"/>
    <sheet name="Instrucciones" sheetId="3" r:id="rId3"/>
  </sheets>
</workbook>
"""

    workbook_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>
"""

    styles = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>
"""

    core = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Plantilla Importador Combinada</dc:title>
  <dc:creator>Codex</dc:creator>
</cp:coreProperties>
"""

    app = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Microsoft Excel</Application>
</Properties>
"""

    with ZipFile(OUTPUT_FILE, "w", ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", content_types)
        archive.writestr("_rels/.rels", root_rels)
        archive.writestr("xl/workbook.xml", workbook)
        archive.writestr("xl/_rels/workbook.xml.rels", workbook_rels)
        archive.writestr("xl/styles.xml", styles)
        archive.writestr("xl/worksheets/sheet1.xml", build_sheet_xml(PRODUCTS_ROWS))
        archive.writestr("xl/worksheets/sheet2.xml", build_sheet_xml(LEADS_ROWS))
        archive.writestr("xl/worksheets/sheet3.xml", build_sheet_xml(INSTRUCTIONS_ROWS))
        archive.writestr("docProps/core.xml", core)
        archive.writestr("docProps/app.xml", app)


if __name__ == "__main__":
    build_workbook()
