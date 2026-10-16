"""
Submitted and published records served like a Web Accessible Folder (WAF).

Files are rendered from the database on request, so a saved record is
available right away and nothing has to be rebuilt. Below /api/:

    <region>/[<owner>/]<name><suffix>               published records
    unpublished/<region>/[<owner>/]<name><suffix>   submitted records

A region also lists the records of other regions whose `alsoPublishTo` names
it; their home region still reviews and publishes them.

Directories are listed like an nginx autoindex (HTML, or nginx's JSON with
?format=json), which is what catalogue WAF harvesters crawl. The region root
also answers ?format=records with every record and its files, for the form's
WAF page.

Each region is restricted to (settings in admin/{region}, set on the Admin page):
- a WAF token, as `Authorization: Bearer waf_...` or as the password of HTTP
  Basic auth, which harvesters keep across the relative links of the listings.
  Only the sha256 of a token is stored, in admin/{region}/waf/tokens;
- a Firebase ID token of an admin or reviewer of the region.
"""

import base64
import binascii
import hashlib
import hmac
import html
import json
import logging
import re
import time
import unicodedata
from datetime import UTC, datetime
from email.utils import format_datetime, parsedate_to_datetime
from urllib.parse import quote

from cioos_metadata_conversion.record import Record

# format key (admin/{region}/waf/formats) -> converter output, suffix, content type
FORMATS = {
    "xml": ("iso19115-3_xml", ".xml", "application/xml"),
    "yaml": ("yaml", ".yaml", "text/plain"),
    "json": ("json", ".json", "application/json"),
    "erddap": ("erddap", "_erddap.xml", "application/xml"),
    "datacite_json": ("datacite_json", "_dataCite.json", "application/json"),
    "datacite_xml": ("datacite_xml", "_dataCite.xml", "application/xml"),
    "cff": ("cff", "_citation.cff", "text/plain"),
}
DEFAULT_FORMATS = ["xml", "yaml"]

# record status -> folder above the region
STATUS_FOLDERS = {"published": "", "submitted": "unpublished"}

TOKEN_PREFIX = "waf_"
REGION_PATTERN = re.compile(r"^[a-z0-9_-]+$")
EPOCH = datetime.fromtimestamp(0, UTC)

COMMON_HEADERS = {
    "X-Robots-Tag": "noindex, nofollow",
    # private: never kept by the Hosting CDN, revalidated with Last-Modified
    "Cache-Control": "private, no-cache",
}


class TTLCache:
    """Values computed by `load(key)` and kept for `ttl` seconds."""

    def __init__(self, load, ttl=60):
        self.load = load
        self.ttl = ttl
        self._values = {}

    def get(self, key):
        now = time.monotonic()
        cached = self._values.get(key)
        if cached and cached[0] > now:
            return cached[1]
        value = self.load(key)
        if len(self._values) > 1000:
            # ID tokens rotate hourly, drop the expired ones
            self._values = {k: v for k, v in self._values.items() if v[0] > now}
        self._values[key] = (now + self.ttl, value)
        return value


# --- authorization -----------------------------------------------------------


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def parse_authorization(header):
    """("waf", token), ("firebase", id_token) or None."""
    if not header:
        return None
    scheme, _, value = header.strip().partition(" ")
    value = value.strip()
    scheme = scheme.lower()
    if scheme == "basic":
        try:
            decoded = base64.b64decode(value, validate=True).decode("utf-8")
        except (binascii.Error, UnicodeDecodeError):
            return None
        password = decoded.partition(":")[2]
        return ("waf", password) if password.startswith(TOKEN_PREFIX) else None
    if scheme == "bearer" and value:
        if value.startswith(TOKEN_PREFIX):
            return ("waf", value)
        return ("firebase", value)
    return None


def token_allowed(token: str, region_admin: dict) -> bool:
    tokens = ((region_admin.get("waf") or {}).get("tokens")) or {}
    token_hash = hash_token(token)
    # compare against every token so timing does not reveal a partial match
    return any(
        [
            hmac.compare_digest(token_hash, entry.get("hash", ""))
            for entry in tokens.values()
            if isinstance(entry, dict)
        ]
    )


def user_allowed(email, region_admin: dict) -> bool:
    if not email:
        return False
    permissions = region_admin.get("permissions") or {}
    allowed = {
        address.strip().lower()
        for role in ("admins", "reviewers")
        for address in (permissions.get(role) or "").split(",")
        if address.strip()
    }
    return email.lower() in allowed


# --- records to files --------------------------------------------------------


def waf_settings(region_admin: dict) -> dict:
    waf = region_admin.get("waf") or {}
    formats = [f for f in (waf.get("formats") or DEFAULT_FORMATS) if f in FORMATS]
    return {"formats": formats, "splitByOwner": bool(waf.get("splitByOwner"))}


def _slug(value: str) -> str:
    """Accents removed, lower case, non alphanumeric characters as single '-'."""
    normalized = unicodedata.normalize("NFKD", value)
    ascii_only = "".join(c for c in normalized if not unicodedata.combining(c))
    return re.sub(r"[^a-zA-Z0-9]+", "-", ascii_only).strip("-").lower()


def record_owner(record: dict) -> str:
    """Slug of the organization of the first owner contact, '' if none."""
    for contact in record.get("contacts") or []:
        if "owner" in (contact.get("role") or []) and contact.get("orgName"):
            return _slug(contact["orgName"])
    return ""


def record_basename(record: dict) -> str:
    """Saved filename, else first 30 characters of the title and 5 of the identifier."""
    if record.get("filename"):
        name = record["filename"]
    else:
        title = (record.get("title") or {}).get(record.get("language"), "") or ""
        name = f"{title[:30]}_{(record.get('identifier') or '')[:5]}"
    return "".join(c if c.isalnum() else "_" for c in name.strip().lower())


def record_modified(record: dict) -> datetime:
    """Last save of the record (the form rewrites `created` on every save)."""
    try:
        modified = datetime.fromisoformat(record["created"])
    except (KeyError, AttributeError, ValueError):
        return EPOCH
    if modified.tzinfo is None:
        modified = modified.replace(tzinfo=UTC)
    return modified.replace(microsecond=0)


def records_published_to(region: str, index: dict, load_record) -> list:
    """Records of other regions that also publish to `region`.

    `index` is {region}/publishedFrom ({home: {user: {record: true}}}), kept by
    the updatesRecordPublishRegions function. A record is only included while
    its `alsoPublishTo` still names the region.
    """
    records = []
    for home, users in (index or {}).items():
        if home == region or not REGION_PATTERN.match(home) or not isinstance(users, dict):
            continue
        for user_id, record_ids in users.items():
            if not isinstance(record_ids, dict):
                continue
            for record_id in record_ids:
                record = load_record(f"{home}/users/{user_id}/records/{record_id}")
                if not isinstance(record, dict):
                    continue
                targets = record.get("alsoPublishTo") or []
                if isinstance(targets, dict):
                    targets = targets.values()
                if region in targets:
                    records.append(record)
    return records


def region_files(region: str, records: list, settings: dict) -> dict:
    """{path below /api/: (record, format key)} of a region's records."""
    files = {}
    for record in records:
        status_folder = STATUS_FOLDERS.get(record.get("status"))
        if status_folder is None or not record.get("title"):
            continue
        folders = [f for f in (status_folder, region) if f]
        if settings["splitByOwner"] and record_owner(record):
            folders.append(record_owner(record))
        basename = record_basename(record)
        for output_format in settings["formats"]:
            path = "/".join(folders + [basename + FORMATS[output_format][1]])
            files[path] = (record, output_format)
    return files


def directory_entries(files: dict, directory: str) -> list:
    """[(name, is_directory, modified)] directly in `directory` ('a/b/'), sorted."""
    entries = {}
    for path, (record, _) in files.items():
        if not path.startswith(directory):
            continue
        name, separator, _ = path[len(directory):].partition("/")
        is_directory = bool(separator)
        modified = record_modified(record)
        previous = entries.get((name, is_directory))
        entries[(name, is_directory)] = max(previous or modified, modified)
    return sorted(
        ((name, is_dir, modified) for (name, is_dir), modified in entries.items()),
        key=lambda entry: (not entry[1], entry[0]),
    )


def records_index(files: dict) -> dict:
    """Records of a region with their file per format, for the form's WAF page."""
    index = {"published": {}, "unpublished": {}}
    for path, (record, output_format) in sorted(files.items()):
        group = "unpublished" if path.startswith("unpublished/") else "published"
        folders = path.split("/")[(2 if group == "unpublished" else 1):-1]
        basename = record_basename(record)
        entry = index[group].setdefault(
            (record.get("recordID"), basename),
            {
                "owner": "/".join(folders),
                "basename": basename,
                "title": record.get("title"),
                "files": {},
                "modified": int(record_modified(record).timestamp()),
            },
        )
        entry["files"][output_format] = path
    return {group: list(records.values()) for group, records in index.items()}


def render(record: dict, output_format: str) -> str:
    converted = (
        Record(record, schema="firebase")
        .load()
        .convert_to_cioos_schema()
        .convert_to(FORMATS[output_format][0])
    )
    if isinstance(converted, str):
        return converted
    return json.dumps(converted, indent=2, ensure_ascii=False)


# --- listings ----------------------------------------------------------------


def listing_html(url_path: str, entries: list) -> str:
    """Directory listing in the layout of an nginx autoindex."""
    title = html.escape(f"Index of {url_path}")
    lines = ['<a href="../">../</a>']
    for name, is_directory, modified in entries:
        label = name + ("/" if is_directory else "")
        shown = label if len(label) <= 50 else label[:47] + "..>"
        href = quote(name) + ("/" if is_directory else "")
        lines.append(
            f'<a href="{href}">{html.escape(shown)}</a>'
            + " " * (51 - len(shown))
            + modified.strftime("%d-%b-%Y %H:%M")
            + f"{'-':>20}"
        )
    return (
        f"<html>\n<head><title>{title}</title></head>\n<body>\n"
        f"<h1>{title}</h1><hr><pre>" + "\n".join(lines) + "\n</pre><hr></body>\n</html>\n"
    )


def listing_json(entries: list) -> str:
    """Directory listing like nginx `autoindex_format json`."""
    return json.dumps(
        [
            {
                "name": name,
                "type": "directory" if is_directory else "file",
                "mtime": format_datetime(modified, usegmt=True),
            }
            for name, is_directory, modified in entries
        ]
    )


# --- requests ----------------------------------------------------------------


class FormsApi:
    """Answers GET/HEAD requests below /api/, as (status, headers, body).

    load_region_admin(region) -> admin/{region} node
    load_region_records(region) -> the records of all users of the region
    verify_id_token(id_token) -> email of a valid Firebase ID token, or None
    """

    def __init__(self, load_region_admin, load_region_records, verify_id_token, ttl=60):
        # harvesters fetch every file of a listing, keep the region briefly
        self.region_admin = TTLCache(load_region_admin, ttl)
        self.region_records = TTLCache(load_region_records, ttl)
        self.id_token_email = TTLCache(verify_id_token, ttl)

    def handle(self, method, path, args, headers):
        if method not in ("GET", "HEAD"):
            return self._error(405, "Method not allowed")

        parts = [part for part in path.split("/") if part]
        if parts[:1] == ["api"]:
            parts = parts[1:]
        if ".." in parts or "." in parts:
            return self._error(404, "Not found")
        region_index = 1 if parts[:1] == ["unpublished"] else 0
        if len(parts) <= region_index:
            return self._error(403, "Choose a region")
        region = parts[region_index]
        if not REGION_PATTERN.match(region):
            return self._error(404, "Not found")

        region_admin = self.region_admin.get(region) or {}
        if not self._authorized(headers.get("Authorization"), region_admin):
            return self._error(
                401,
                "Unauthorized",
                {"WWW-Authenticate": 'Basic realm="CIOOS metadata forms"'},
            )

        files = region_files(
            region, self.region_records.get(region) or [], waf_settings(region_admin)
        )
        relative = "/".join(parts)
        url_path = "/api/" + relative

        if relative in files:
            return self._file(*files[relative], headers)

        directory = relative + "/"
        is_region_root = len(parts) == region_index + 1
        if not is_region_root and not any(p.startswith(directory) for p in files):
            return self._error(404, "Not found")
        if not path.endswith("/"):
            # listings use relative links, which need the trailing slash
            return 301, {**COMMON_HEADERS, "Location": url_path + "/"}, ""

        entries = directory_entries(files, directory)
        output = args.get("format")
        if output == "records" and is_region_root and region_index == 0:
            return self._json(records_index(files))
        if output == "json":
            return 200, {**COMMON_HEADERS, "Content-Type": "application/json"}, listing_json(entries)
        return (
            200,
            {**COMMON_HEADERS, "Content-Type": "text/html; charset=utf-8"},
            listing_html(url_path + "/", entries),
        )

    def _authorized(self, header, region_admin):
        credentials = parse_authorization(header)
        if not credentials:
            return False
        kind, value = credentials
        if kind == "waf":
            return token_allowed(value, region_admin)
        return user_allowed(self.id_token_email.get(value), region_admin)

    def _file(self, record, output_format, headers):
        modified = record_modified(record)
        file_headers = {
            **COMMON_HEADERS,
            "Last-Modified": format_datetime(modified, usegmt=True),
        }
        since = headers.get("If-Modified-Since")
        if since:
            try:
                if modified <= parsedate_to_datetime(since):
                    return 304, file_headers, ""
            except (TypeError, ValueError):
                pass
        try:
            body = render(record, output_format)
        except Exception:  # pylint: disable=broad-except
            logging.exception(
                "Failed to render %s as %s", record.get("recordID"), output_format
            )
            return self._error(500, "Failed to render the record")
        content_type = FORMATS[output_format][2] + "; charset=utf-8"
        return 200, {**file_headers, "Content-Type": content_type}, body

    @staticmethod
    def _json(data, status=200, extra_headers=None):
        return (
            status,
            {**COMMON_HEADERS, "Content-Type": "application/json", **(extra_headers or {})},
            json.dumps(data, ensure_ascii=False),
        )

    def _error(self, status, message, extra_headers=None):
        return self._json({"error": message}, status, extra_headers)
