# Conditional requirements

The generated field reference describes **what each field is**. This page
describes **the rules that span more than one field** — the cases where whether
a field is required depends on the value of another.

These are expressed in `record.submission.schema.json`, which a record must
satisfy to be submitted. They are deliberately *not* in
`record.schema.json`: an incomplete draft is still structurally a record.

---

## Spatial extent

A record must describe where the data comes from, in one of three ways:

| Topic category | Accepted |
|---|---|
| Biota (`biota`, or legacy `biological`) | A bounding box, **or** a polygon, **or** a text description |
| Anything else | A bounding box **or** a polygon. A description alone is not enough. |

A bounding box counts only when all four edges are present and numeric.
Additional constraints that JSON Schema cannot express, checked separately:

- `north` must be greater than or equal to `south`, and `east` greater than or
  equal to `west`
- latitudes must fall between -90 and 90; longitudes between -360 and 360
- a polygon must have at least two points, and its first point must equal its
  last (it must be closed)

## Fields that can be waived

Three checkboxes turn off an otherwise-required section. Each is a real boolean
stored on the record.

| Set this | …and these stop being required |
|---|---|
| `noVerticalExtent` | `verticalExtentMin`, `verticalExtentMax`, `verticalExtentDirection` |
| `noTaxa` | `taxa` |
| `noPlatform` | `platforms` |

## Platforms and instruments

A record satisfies the platform requirement if **any** of the following holds:

- `noPlatform` is set, **or**
- every entry in `platforms` has both a `type` and an `id`, **or**
- the record has no `metadataScope`, **or** its `metadataScopeIso` is `model`
  (a model has no collection platform)

Instruments have their own rule, and it is conditional on how many platforms
exist:

- every instrument always needs an `id`
- once **two or more** platforms are defined, every instrument must also name
  the `platform` it belongs to — with a single platform the association is
  unambiguous, so it is not required

## Contacts

Each contact individually must have at least one `role`, and at least one of
`orgName`, `givenNames`, or `lastName`.

The contact list *as a whole* must additionally contain:

- at least one contact with the **Metadata Custodian** (`custodian`) role
- at least one contact with the **Data Owner** (`owner`) role
- at least one contact with `inCitation` set

One contact can satisfy several of these at once.

## Lineage

For each lineage step:

- every entry in `processingStep` needs a `title` and a `description`
- every entry in `source` needs a `title` and a `description`
- a step whose `scopeIso` is `collectionSession` also needs a `statement` in
  both English and French

> **Known discrepancy.** The form's own validator checks `scope` rather than
> `scopeIso` for this last rule. Because `scope` stores a scope *key*
> (`DataCollectionSampling`) while `collectionSession` is that key's ISO value,
> the two never match and the rule has never actually blocked a submission. The
> schema encodes the intended rule. See README §11.

## Related works

Every entry in `associated_resources` needs all four of: a `title` in both
languages, an `authority`, a `code`, and an `association_type`.

## Resources

At least one entry in `distribution` must have both a `name` and a valid `url`.
Other entries may be incomplete.

## Essential Ocean Variables

At least one EOV is required. EOVs that have been **deprecated** upstream in
`cioos-commons` remain structurally valid — existing records still carry them —
but block submission until they are replaced.

## Bilingual text

`title` and `abstract` require **both** English and French.

`keywords` requires at least one keyword in **either** language.

Geographic descriptions require at least one language.
