# World SDK — developer feedback log

Mandatory World-track deliverable: log SDK friction **while** integrating, not from memory
afterwards. One entry per friction point, appended at the moment it happens (copy the
template block). Cover: MiniKit, Selfie Check, Identity Check, Mini App packaging, World App
signing. Wins go in too — "worked first try" is feedback.

Entry template:

```
### <short title>
- when: 2026-07-25 HH:MM
- component: MiniKit | Selfie Check | Identity Check | Mini App packaging | World App signing | docs
- task: <what we were trying to do, one line>
- expected: <what the docs / API surface suggested would happen>
- actual: <what happened — exact error text if any>
- severity: blocker | slowed-us-down | papercut | praise
- workaround: <what we did about it, or "none — still blocked">
- docs gap: <what one sentence in the docs would have saved us, or "n/a">
```

---

## Entries

### (example — replace with the first real entry) APP_ID env naming unclear
- when: 2026-07-25 19:40
- component: MiniKit
- task: boot MiniKit provider in apps/web with our registered APP_ID
- expected: init succeeds with the APP_ID from the Developer Portal
- actual: silent no-op; console shows no error, Selfie Check button renders disabled
- severity: slowed-us-down
- workaround: APP_ID must include the `app_` prefix exactly as shown in the portal
- docs gap: "APP_ID is the full string including app_ prefix" next to the init snippet
