"""Create a portable, allowlisted Part 2 submission and verify its extraction."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
from zipfile import ZipFile, ZIP_DEFLATED
import argparse
import hashlib
import json
import re
import tempfile

ROOT = Path(__file__).resolve().parents[1]
PAGES = sorted(("index event reserve confirmation my-bookings login register "
                "forgot-password reset-password profile dashboard create-event "
                "attendees admin help").split())
EXPECTED = {name + ".html" for name in PAGES}

class HTMLReferences(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []
        self.ids = set()
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            self.ids.add(attrs["id"])
        for key in ("href", "src", "action"):
            if attrs.get(key):
                self.references.append(attrs[key])

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def validate_runtime(root):
    assert {p.name for p in root.glob("*.html")} == EXPECTED, "Page inventory differs"
    parsed = {}
    for path in root.glob("*.html"):
        parser = HTMLReferences()
        parser.feed(path.read_text())
        parsed[path.resolve()] = parser
    checked = 0
    def resolve(source, ref):
        nonlocal checked
        url = urlsplit(ref)
        assert not url.scheme and not url.netloc, (source.name, "nonlocal runtime reference", ref)
        assert not url.path.startswith("/"), (source.name, "root-absolute path", ref)
        target = (source.parent / unquote(url.path)).resolve() if url.path else source.resolve()
        assert target.is_relative_to(root.resolve()) and target.is_file(), (source.name, ref)
        if url.fragment and target in parsed:
            assert unquote(url.fragment) in parsed[target].ids, (source.name, "missing fragment", ref)
        checked += 1
    for path, parser in parsed.items():
        for ref in parser.references:
            resolve(path, ref)
    for path in root.glob("css/*.css"):
        for ref in re.findall(r'url\([\s\'"]*([^\)\'"\s]+)', path.read_text()):
            resolve(path, ref)
    for path in root.glob("js/*.js"):
        for ref in re.findall(r'from\s+[\'"]([^\'"]+)', path.read_text()):
            resolve(path, ref)
    for path in [*root.glob("*.html"), *root.glob("css/*.css"), *root.glob("js/*.js")]:
        assert not re.search(r"file://|/Users/|/Applications/|https?://localhost", path.read_text()), path.name
    return checked

def package(output):
    if output.exists():
        raise FileExistsError("Refusing to overwrite an existing submission ZIP. Choose a new versioned filename.")
    assert {p.name for p in ROOT.glob("*.html")} == EXPECTED
    files = [*ROOT.glob("*.html")]
    for folder in ("css", "js", "assets"):
        files.extend(p for p in (ROOT / folder).rglob("*") if p.is_file() and not p.name.startswith("."))
    files.extend(ROOT / name for name in ("README.md", "PAGE_INDEX.md", "FINAL_PART2_AUDIT.md", "TEST_REPORT.md", "FUNCTIONAL_IMPROVEMENTS.md", "CHANGED_FILES.md", "INSTRUCTOR_TESTING_GUIDE.md"))
    files.extend(p for p in (ROOT / "tests").iterdir() if p.suffix in (".mjs", ".py"))
    files.append(ROOT / "scripts/package_submission.py")
    files.extend(p for p in (ROOT / "qa/improvements").glob("*.json") if not p.name.startswith("release-candidate-"))
    files.extend((ROOT / "qa/instructor" / name) for name in ("baseline.json", "results.json", "layout-regression.json", "source-preservation.json"))
    files = sorted(set(files))
    assert all(p.is_file() and not p.is_symlink() for p in files)
    hashes = {str(p.relative_to(ROOT)): digest(p) for p in files}
    manifest = {"project": "SessionSpot COMP 3540 Part 2", "date": "2026-11-23", "pages": sorted(EXPECTED),
                "note": "SHA-256 values cover every packaged file except this manifest itself.", "sha256": hashes}
    output.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(output, "w", ZIP_DEFLATED) as archive:
        for p in files:
            archive.write(p, "SessionSpot-Part2/" + str(p.relative_to(ROOT)))
        archive.writestr("SessionSpot-Part2/SUBMISSION_MANIFEST.json", json.dumps(manifest, indent=2) + "\n")
    extraction = Path(tempfile.mkdtemp(prefix="sessionspot-part2-verify-", dir="/private/tmp"))
    with ZipFile(output) as archive:
        assert archive.testzip() is None, "ZIP CRC failure"
        names = archive.namelist()
        assert len(names) == len(set(names)) == len(files) + 1
        assert all(n.startswith("SessionSpot-Part2/") and ".." not in Path(n).parts for n in names)
        assert {n.removeprefix("SessionSpot-Part2/") for n in names} == set(hashes) | {"SUBMISSION_MANIFEST.json"}
        assert not any(part in {"backups", ".git", "node_modules", "__pycache__", "design-reference", ".DS_Store"} for n in names for part in Path(n).parts)
        assert not any(Path(n).suffix.lower() in {".jpg", ".jpeg", ".png", ".zip"} for n in names)
        archive.extractall(extraction)
    extracted = extraction / "SessionSpot-Part2"
    # A different folder name also verifies that resource resolution is relative.
    renamed = extraction / "Renamed SessionSpot"
    extracted.rename(renamed)
    for relative, expected in hashes.items():
        assert digest(renamed / relative) == expected, relative
    references = validate_runtime(renamed)
    runtime = {k: v for k, v in hashes.items() if k.endswith(".html") or k.startswith(("css/", "js/", "assets/"))}
    result = {"pass": True, "zip": str(output), "zipSha256": digest(output), "bytes": output.stat().st_size,
              "files": len(names), "htmlPages": 15, "resolvedRuntimeReferences": references,
              "extractedProject": str(renamed), "extractionParent": str(extraction),
              "runtimeSha256": hashlib.sha256(json.dumps(runtime, sort_keys=True).encode()).hexdigest(),
              "checks": ["explicit inventory", "allowlist", "no backups/caches/screenshots", "unique safe ZIP entries",
                         "CRC", "extraction", "all file hashes", "renamed-directory relative references", "no machine-specific runtime paths"]}
    report = output.with_name(output.stem + "-verification.json")
    report.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "submission/SessionSpot-Part2-Functional-v2.zip")
    package(parser.parse_args().output.resolve())
