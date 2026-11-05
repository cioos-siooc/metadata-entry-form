"""
Automated metadata review (cioos-metadata-reviewer) for the CIOOS metadata form.

Separate codebase from python-functions: the reviewer needs jsonschema>=4.20 (via mcp), while
cioos-metadata-conversion's cffconvert pins jsonschema<4, so they can't share an environment.
This also keeps the reviewer's LLM deps off convert_metadata's cold starts.
"""

from firebase_functions import https_fn, options
from firebase_functions.params import SecretParam
from firebase_admin import db, initialize_app

initialize_app()

import review  # pylint: disable=wrong-import-position  # needs the initialized app

COHERE_API_KEY = SecretParam("COHERE_API_KEY")


def _region_arg(req: https_fn.CallableRequest) -> str:
    region = (req.data or {}).get("region")
    if not isinstance(region, str) or not region or "/" in region:
        raise https_fn.HttpsError(https_fn.FunctionsErrorCode.INVALID_ARGUMENT, "region is required")
    return region


@https_fn.on_call(timeout_sec=540, memory=options.MemoryOption.GB_1, secrets=[COHERE_API_KEY])
def review_record(req: https_fn.CallableRequest):
    """Review one form record. data: {region, userID, recordID, force?}. Returns its qa node."""
    region = _region_arg(req)
    review.require_role(region, req.auth)
    uid, rid = req.data.get("userID"), req.data.get("recordID")
    if not all(isinstance(x, str) and x and "/" not in x for x in (uid, rid)):
        raise https_fn.HttpsError(
            https_fn.FunctionsErrorCode.INVALID_ARGUMENT, "userID and recordID are required"
        )
    rec = db.reference(f"{region}/users/{uid}/records/{rid}").get()
    if not rec:
        raise https_fn.HttpsError(https_fn.FunctionsErrorCode.NOT_FOUND, "record not found")
    force = bool(req.data.get("force"))
    if force:
        review.require_role(region, req.auth, admin_only=True)
    return review.review_one(region, uid, rid, rec, force)


@https_fn.on_call(timeout_sec=3600, memory=options.MemoryOption.GB_1, secrets=[COHERE_API_KEY])
def review_region(req: https_fn.CallableRequest):
    """Review all submitted/published records of a region. data: {region, force?, dryRun?}.

    dryRun returns {total, toReview} for the confirm dialog without reviewing anything.
    Progress: {region}/qaRuns/active.runId -> {region}/qaRuns/{runId}; afterwards qaRuns/last.
    ponytail: one long call; move to a task queue if a region outgrows 1h.
    """
    region = _region_arg(req)
    force = bool(req.data.get("force"))
    email = review.require_role(region, req.auth, admin_only=force)
    if req.data.get("dryRun"):
        return review.count_region(region, force)
    return {"runId": review.review_region(region, email, force)}
