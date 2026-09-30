"""Bundle scene.src.html and its fonts into one file, nothing-broke.html, that opens by double-click."""
import base64, pathlib, re

here = pathlib.Path(__file__).parent
src = (here / "scene.src.html").read_text()

def inline(match):
    data = (here / match.group(1)).read_bytes()
    return "url(data:font/woff2;base64," + base64.b64encode(data).decode() + ")"

out = re.sub(r"url\((fonts/[^)]+\.woff2)\)", inline, src)
(here / "nothing-broke.html").write_text(out)
print("wrote nothing-broke.html,", len(out) // 1024, "KB")
