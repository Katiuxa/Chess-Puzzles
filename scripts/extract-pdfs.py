import fitz
import os

base = r"C:\Users\carlo\Desktop\Sherzod\_pdfs"
out = r"C:\Users\carlo\Desktop\Sherzod\_pdf_pages"
txt_out = r"C:\Users\carlo\Desktop\Sherzod\_pdf_pages\_text"
os.makedirs(out, exist_ok=True)
os.makedirs(txt_out, exist_ok=True)

for fn in sorted(os.listdir(base)):
    if not fn.lower().endswith(".pdf"):
        continue
    path = os.path.join(base, fn)
    doc = fitz.open(path)
    if "4 Square" in fn or "Four" in fn:
        slug = "four_square"
    elif "Queen" in fn:
        slug = "queen_moves"
    elif "Black Pawn" in fn:
        slug = "black_pawn"
    elif "Rook" in fn:
        slug = "rook_sacrifice"
    else:
        slug = "other"
    print(f"\n=== {slug} pages={doc.page_count} ===")
    all_text = []
    for i, page in enumerate(doc):
        text = page.get_text("text")
        pix = page.get_pixmap(matrix=fitz.Matrix(2.2, 2.2), alpha=False)
        outp = os.path.join(out, f"{slug}_p{i+1:02d}.png")
        pix.save(outp)
        lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
        all_text.append(f"===== PAGE {i+1} =====\n" + "\n".join(lines))
        print(f"-- page {i+1} --")
        for ln in lines[:50]:
            print(ln)
        if len(lines) > 50:
            print(f"... (+{len(lines)-50} more)")
    with open(os.path.join(txt_out, f"{slug}.txt"), "w", encoding="utf-8") as f:
        f.write("\n\n".join(all_text))
