# CIOOS Metadata — mobile app

A mobile-first Expo / React Native client for the CIOOS metadata entry form,
built for field use: collecting and editing records on boats and at remote
coastal sites, frequently offline for days.

It is a separate client, not a port of the web SPA. The two share one API and
one core (`@cioos/shared`) but no UI.

## Running it

From the repository root — the workspace install is not run from here:

```sh
npm install
npm start --workspace @cioos/mobile
```

Then `i` for iOS or `a` for Android. `npm run typecheck --workspace @cioos/mobile`
and `npm test --workspace @cioos/mobile` also exist.

## Layout

```
src/
  app/            expo-router routes; (tabs)/ is the shell
  components/     shared UI
  i18n/           en/fr catalogues and i18next setup
  theme/          design tokens and the theme provider
```

## Pointing the app at a server

`EXPO_PUBLIC_API_BASE_URL` in `mobile/.env` sets the address at build time. On
a device that is often the wrong answer — a laptop's LAN address changes — so
**More → Development → Servers and regions** overrides it at runtime, and also
lets you type a region name the picker does not list yet (a freshly created
tenant, say `test`). Changing the server signs you out: tokens are issued per
server.

That screen appears in a development build automatically. A QA build is a
release build, so set `EXPO_PUBLIC_ENABLE_DEV_MENU=1` to keep it; production
builds leave it unset and the screen is absent.

## Landscape and tablets

The app rotates freely by default and **More → Rotation** locks it to portrait.
Rotation is allowed because an iPad is a plausible review device; the lock
exists because a phone at a rail should not turn because the boat did.

Content sits in a capped, centred column (`@/theme/layout`) rather than
stretching. On a phone the cap is never reached; on a tablet it is the
difference between a form and a spreadsheet. Anything new that scrolls should
use `contentColumn` too.

## Things worth knowing before changing anything

**The accent colour is computed, not configured.** Each region ships its own
brand colour and half of them are illegible used raw — St-Laurent's `#00adef`
sits at 2.42:1 against the light surface, Test's `#fcba03` at 1.63:1. The brand
colour is treated as a hue reference and tone-mapped into a contrast-checked
ramp by `@cioos/shared/theme/accent.js`. Don't reach for
`region.colors.primary` directly.

**Night mode is a third theme, not a darker dark.** It suppresses the blue
channel to preserve dark adaptation on a bridge at night, so semantic colours
collapse to a warm pair there. Never hard-code green for "complete".

**Bilingual en/fr is non-negotiable.** UI strings live in `src/i18n/locales`,
and a test fails if the two catalogues drift apart. Controlled-vocabulary text —
EOV labels, platform types, role codes — is *not* in those catalogues. It stays
as data in `@cioos/shared` and is read through `localized()`, which handles the
three incompatible key conventions the vocabularies grew.

**UI language is not `record.language`.** The latter is the dataset's own
primary language and part of the record's content.

**Validation lives in `@cioos/shared`**, is network-free, and runs offline
unchanged. The server does not validate metadata records at all, so this is the
only gate. `shared/src/__tests__/blankRecord.test.js` pins the submit gate —
read it before changing the record shape, because `blankRecord` is spread over
every record on save and several validators are bare truthiness checks, which
makes an innocent-looking default (`taxa: []`) able to let an empty record pass.
