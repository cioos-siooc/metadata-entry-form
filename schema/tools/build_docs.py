"""Builds the browsable documentation for the CIOOS metadata record schema.

Run via `npm run schema:docs` (which shells out to `uv run` in schema/).

Output goes to schema/docs/build/ and is COMMITTED. That is deliberate: the
GitHub Pages deploy runs `npm ci && npm run build` with no Python available, so
the docs cannot be generated at deploy time. scripts/copySchemaAssets.mjs — pure
Node — copies this directory into public/schema/ during prebuild, and Vite
copies public/ verbatim into build/.

Everything here must be deterministic. A timestamp in the output would mean a
diff on every regeneration, so footer_show_time is off in jsfh-config.json.

Known limitation: json-schema-for-humans has no localization. The French page
carries French titles and descriptions, but the generator's own chrome
("Type", "Must be", "Required") stays English. Localizing that would mean
forking its templates, which is not worth it yet.
"""

import json
import re
import shutil
from pathlib import Path

import markdown2
from json_schema_for_humans.generate import generate_from_filename
from json_schema_for_humans.generation_configuration import GenerationConfiguration

SCHEMA_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = SCHEMA_DIR.parent
V1 = SCHEMA_DIR / "v1"
DOCS = SCHEMA_DIR / "docs"
BUILD = DOCS / "build"

LANGUAGES = ("en", "fr")

STRINGS = {
    "en": {
        "lang": "en",
        "title": "CIOOS Metadata Record Schema",
        "intro": (
            "The schema describing a CIOOS metadata record, as produced by the "
            "CIOOS Metadata Entry Form."
        ),
        "fields": "Field reference",
        "fields_desc": "Every field, its type, and its controlled vocabulary.",
        "rules": "Conditional requirements",
        "rules_desc": (
            "Rules that span more than one field — when a field becomes "
            "required because of another field's value."
        ),
        "files": "Schema files",
        "files_desc": "The machine-readable schema itself.",
        "structural": "Structural schema — what a record is",
        "submission": "Submission schema — what a record must be to be submitted",
        "markdown": "Field reference (Markdown)",
        "other_lang": "Français",
        "version": "Version",
        "back": "Back to index",
    },
    "fr": {
        "lang": "fr",
        "title": "Schéma des enregistrements de métadonnées du SIOOC",
        "intro": (
            "Le schéma décrivant un enregistrement de métadonnées du SIOOC, tel "
            "que produit par le formulaire de saisie de métadonnées du SIOOC."
        ),
        "fields": "Référence des champs",
        "fields_desc": "Chaque champ, son type et son vocabulaire contrôlé.",
        "rules": "Exigences conditionnelles",
        "rules_desc": (
            "Règles portant sur plusieurs champs — lorsqu'un champ devient "
            "obligatoire en raison de la valeur d'un autre."
        ),
        "files": "Fichiers du schéma",
        "files_desc": "Le schéma lui-même, lisible par machine.",
        "structural": "Schéma structurel — ce qu'est un enregistrement",
        "submission": "Schéma de soumission — ce qu'un enregistrement doit être pour être soumis",
        "markdown": "Référence des champs (Markdown)",
        "other_lang": "English",
        "version": "Version",
        "back": "Retour à l'index",
    },
}

PAGE_CSS = """
:root { color-scheme: light dark; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.6; max-width: 52rem; margin: 0 auto; padding: 2rem 1.25rem 4rem;
  color: #1b1b1b; background: #fff;
}
@media (prefers-color-scheme: dark) {
  body { color: #e6e6e6; background: #16191c; }
  a { color: #6db3f2; }
  code { background: #23272b; }
  table { border-color: #3a4046; }
  th, td { border-color: #3a4046; }
  thead th { background: #23272b; }
  .card { border-color: #3a4046; }
  .muted { color: #9aa4ad; }
}
h1 { font-size: 1.9rem; margin-bottom: .25rem; }
h2 { margin-top: 2.5rem; font-size: 1.3rem; }
h3 { margin-top: 2rem; font-size: 1.05rem; }
a { color: #006e90; }
code {
  background: #f2f4f6; padding: .12em .35em; border-radius: 3px;
  font-size: .9em; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
pre { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; margin: 1rem 0; display: block; overflow-x: auto; }
th, td { border: 1px solid #d6dbe0; padding: .5rem .7rem; text-align: left; vertical-align: top; }
thead th { background: #f2f4f6; }
blockquote {
  margin: 1.2rem 0; padding: .6rem 1rem; border-left: 4px solid #ffc857;
  background: rgba(255, 200, 87, .09);
}
.card { border: 1px solid #d6dbe0; border-radius: 8px; padding: 1rem 1.2rem; margin: .9rem 0; }
.card h3 { margin-top: 0; }
.muted { color: #5c666f; font-size: .92rem; }
.topbar { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; flex-wrap: wrap; }
"""


def read_version() -> str:
    schema = json.loads((V1 / "record.schema.json").read_text(encoding="utf-8"))
    return schema["x-cioos-schema-version"]


def config(template_name: str) -> GenerationConfiguration:
    options = json.loads((DOCS / "jsfh-config.json").read_text(encoding="utf-8"))
    return GenerationConfiguration(template_name=template_name, **options)


def html_page(strings: dict, title: str, body: str, back: bool = False) -> str:
    """Wraps rendered content in the shared shell."""
    nav = (
        f'<p><a href="../index.html">&larr; {strings["back"]}</a></p>' if back else ""
    )
    return (
        f'<!doctype html>\n<html lang="{strings["lang"]}">\n<head>\n'
        f'<meta charset="utf-8">\n'
        f'<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        f"<title>{title}</title>\n<style>{PAGE_CSS}</style>\n</head>\n<body>\n"
        f"{nav}{body}\n</body>\n</html>\n"
    )


def render_markdown(path: Path) -> str:
    return markdown2.markdown(
        path.read_text(encoding="utf-8"),
        extras=["tables", "fenced-code-blocks", "header-ids", "cuddled-lists"],
    )


def build_language(language: str, version: str) -> None:
    strings = STRINGS[language]
    out = BUILD / language
    out.mkdir(parents=True, exist_ok=True)

    schema_file = V1 / f"record.{language}.schema.json"

    generate_from_filename(
        str(schema_file), str(out / "fields.html"), config=config("js_offline")
    )
    generate_from_filename(
        str(schema_file), str(out / "fields.md"), config=config("md")
    )

    rules_md = DOCS / f"conditional-requirements.{language}.md"
    (out / "conditional-requirements.html").write_text(
        html_page(strings, strings["rules"], render_markdown(rules_md), back=True),
        encoding="utf-8",
    )
    shutil.copyfile(rules_md, out / "conditional-requirements.md")

    other = "fr" if language == "en" else "en"
    body = f"""
<div class="topbar">
  <h1>{strings["title"]}</h1>
  <p><a href="../{other}/index.html">{strings["other_lang"]}</a></p>
</div>
<p>{strings["intro"]}</p>
<p class="muted">{strings["version"]} {version}</p>

<div class="card">
  <h3><a href="fields.html">{strings["fields"]}</a></h3>
  <p>{strings["fields_desc"]}</p>
  <p class="muted"><a href="fields.md">{strings["markdown"]}</a></p>
</div>

<div class="card">
  <h3><a href="conditional-requirements.html">{strings["rules"]}</a></h3>
  <p>{strings["rules_desc"]}</p>
</div>

<div class="card">
  <h3>{strings["files"]}</h3>
  <p>{strings["files_desc"]}</p>
  <ul>
    <li><a href="../record.schema.json"><code>record.schema.json</code></a>
        &mdash; {strings["structural"]}</li>
    <li><a href="../record.submission.schema.json"><code>record.submission.schema.json</code></a>
        &mdash; {strings["submission"]}</li>
  </ul>
</div>
"""
    (out / "index.html").write_text(
        html_page(strings, strings["title"], body), encoding="utf-8"
    )


ASSET_DIRS = ("css", "js", "font")

# json-schema-for-humans' js_offline template emits a <script> for a FontAwesome
# kit but never vendors the file, so the published page 404s on it. Nothing in
# the output actually uses a fa-* class, so the tag is dropped.
DANGLING_SCRIPT = re.compile(r'\s*<script src="js/[0-9a-f]{8,}\.js"></script>')


def share_assets() -> None:
    """Hoists the vendored css/js/font out of each language directory.

    js_offline writes a full copy of bootstrap, jQuery, and the Overpass fonts
    beside every generated page — byte-identical between en/ and fr/, and about
    460 KB each. These files get committed, so the duplicate is worth removing.

    css/ and font/ stay siblings under assets/, which keeps the ../font/ URLs
    inside the stylesheets resolving.
    """
    assets = BUILD / "assets"
    assets.mkdir(exist_ok=True)

    for language in LANGUAGES:
        for name in ASSET_DIRS:
            source = BUILD / language / name
            if not source.exists():
                continue
            target = assets / name
            if target.exists():
                shutil.rmtree(source)
            else:
                shutil.move(str(source), str(target))

        page = BUILD / language / "fields.html"
        html = page.read_text(encoding="utf-8")
        html = DANGLING_SCRIPT.sub("", html)
        for name in ASSET_DIRS:
            html = html.replace(f'"{name}/', f'"../assets/{name}/')
        page.write_text(html, encoding="utf-8")


def build_root(version: str) -> None:
    """A language-picker at the root, so /schema/ resolves to something useful."""
    body = f"""
<h1>CIOOS Metadata Record Schema</h1>
<p class="muted">Version {version}</p>
<div class="card">
  <h3><a href="en/index.html">English</a></h3>
  <p>Field reference, conditional requirements, and the schema files.</p>
</div>
<div class="card">
  <h3><a href="fr/index.html">Français</a></h3>
  <p>Référence des champs, exigences conditionnelles et fichiers du schéma.</p>
</div>
"""
    (BUILD / "index.html").write_text(
        html_page(STRINGS["en"], "CIOOS Metadata Record Schema", body),
        encoding="utf-8",
    )


def main() -> None:
    version = read_version()

    if BUILD.exists():
        shutil.rmtree(BUILD)
    BUILD.mkdir(parents=True)

    for language in LANGUAGES:
        build_language(language, version)
    share_assets()
    build_root(version)

    # Read by src/schema/__tests__/docs.test.js. Regenerating the docs is a
    # Python job, so the JS suite cannot rebuild them to check freshness — it
    # compares this stamp instead.
    (BUILD / "SCHEMA_VERSION").write_text(f"{version}\n", encoding="utf-8")

    written = sorted(p.relative_to(REPO_ROOT) for p in BUILD.rglob("*") if p.is_file())
    for path in written:
        print(f"wrote {path}")
    print(f"\n{len(written)} files, schema version {version}")


if __name__ == "__main__":
    main()
