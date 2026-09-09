from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from pypdf import PdfReader, PdfWriter
import io
from pathlib import Path

# Setup
script_dir = Path(__file__).resolve().parent
template_path = script_dir / "sc100_2.pdf"
output_path = script_dir / "ready_to_file_sc100_2.pdf"

# 1. Create a "Packet" to draw our text onto
packet = io.BytesIO()
can = canvas.Canvas(packet, pagesize=letter)

# 2. Draw text at (x, y) coordinates
# These are placeholder coordinates (measured from bottom-left)
# We will tweak these after you check the first output
can.drawString(100, 680, "Jennifer Lynn DonGilli")
can.drawString(112, 660, "9756 Greensboro Cir, Sacramento, CA 95827")
can.setFont("Helvetica", 8)
for x in range(0, 600, 50):
    for y in range(0, 800, 50):
        can.drawString(x, y, f"{x},{y}")
can.save()

# 3. Merge the text packet with the existing PDF
packet.seek(0)
new_pdf = PdfReader(packet)
existing_pdf = PdfReader(open(template_path, "rb"))
output = PdfWriter()

# Merge page 2 (where your data fields are)
page = existing_pdf.pages[1] 
page.merge_page(new_pdf.pages[0])
output.add_page(page)

# 4. Save the result
with open(output_path, "wb") as f:
    output.write(f)

print(f"Overlay generated: {output_path}")