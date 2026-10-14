"""
Ask a CKAN catalogue to harvest the WAF of a region again, from the form's WAF page.

Settings (Admin page): admin/{region}/waf/ckan/{url, harvestSource}, and the
CKAN API token in wafSecrets/{region}/ckanToken, which only functions can read.
"""

import logging
from urllib.parse import urlsplit

import requests

TIMEOUT_SECONDS = 30


class HarvestError(Exception):
    """The harvest could not be started."""


def valid_ckan_url(url) -> bool:
    if not isinstance(url, str):
        return False
    parts = urlsplit(url)
    return parts.scheme == "https" and bool(parts.hostname)


def ckan_settings(ckan) -> dict | None:
    """{url, harvestSource} from admin/{region}/waf/ckan, None if not set up."""
    ckan = ckan if isinstance(ckan, dict) else {}
    url = ckan.get("url")
    source = ckan.get("harvestSource")
    if not valid_ckan_url(url) or not isinstance(source, str) or not source.strip():
        return None
    return {"url": url.rstrip("/"), "harvestSource": source.strip()}


def _action(session, method, url, action, token, **kwargs):
    try:
        response = session.request(
            method,
            f"{url}/api/3/action/{action}",
            headers={"Authorization": token},
            timeout=TIMEOUT_SECONDS,
            **kwargs,
        )
    except requests.RequestException as error:
        raise HarvestError(f"{action}: {error}") from error
    try:
        body = response.json()
    except ValueError:
        body = {}
    if response.ok and body.get("success"):
        return body.get("result")
    error = body.get("error") or response.text[:200]
    if action == "harvest_job_create" and response.status_code in (409, 500):
        # ckanext-harvest refuses a job while one of the source is new or running
        error = f"{error} (a harvest of this source may already be running)"
    raise HarvestError(f"{action}: HTTP {response.status_code} {error}")


def start_harvest(settings: dict, token: str, session=requests) -> str:
    """Creates and runs a harvest job (ckanext-harvest), returns its id."""
    url = settings["url"]
    # the admin may enter the name of the source, the job needs its id
    source = _action(
        session, "GET", url, "harvest_source_show", token,
        params={"id": settings["harvestSource"]},
    )
    job = _action(
        session, "POST", url, "harvest_job_create", token,
        json={"source_id": source["id"], "run": True},
    )
    logging.info("CKAN harvest job %s started for %s", job.get("id"), url)
    return job.get("id", "")
