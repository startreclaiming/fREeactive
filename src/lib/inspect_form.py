from pypdf import PdfReader
from pathlib import Path

# Use the exact filename you specified
filename = "sc100_2.pdf"

# This looks for the file in the SAME directory as the script
script_dir = Path(__file__).resolve().parent
pdf_path = script_dir / filename

if not pdf_path.exists():
    print(f"ERROR: Could not find '{filename}' at {pdf_path}")
    print("Please move 'sc100_2.pdf' into the 'src/lib/' folder.")
else:
    reader = PdfReader(pdf_path)
    fields = reader.get_fields()
    if fields:
        print(f"\n--- FIELDS IN {filename} ---")
        for field_name in fields:
            print(field_name)
    else:
        print("No fillable fields found.")