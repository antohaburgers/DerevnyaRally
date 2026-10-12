# Бесконечная Нива: 3D — v0.47 / Touchscroll fix
## Причина
browser-guard.js previously registered a global non-passive document touchmove/wheel listener that called preventDefault for all events, including inside the garage. CSS overflow:auto alone could never enable scrolling.
## Исправлено
- Exempt touchmove and mouse wheel only when the user begins on the garage tuning panel, which must be visible.
- Preserve preventDefault for in-game gameplay, page gestures and all interactions on the 3D garage preview.
- Override the global html/body touch-action:none only while the garage is visible, including inner tuning controls and button descendants.
- Keep 3D showroom touch-action:none, so touch drag still spins Niva instead of moving the panel.
- Keep bottom sticky garage actions and kinetic Safari scrolling.
- PWA cache/version bumped 0.47; browser-guard cachebusted to ?v=047 to avoid the old blocking version.
- No physics, suspenders, controls, garage settings, records or 3D meshes changed.
## Checks
- Mocked DOM gesture interception: visible menu allows tuning panel swipe and wheel, hidden garage blocks gestures, active 3D preview blocks gestures, pinch gestures blocked.
- JS parsing and offline resource consistency.
- Real-device test still required.
