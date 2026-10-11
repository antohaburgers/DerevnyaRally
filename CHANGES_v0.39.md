# Бесконечная Нива: 3D — v0.39 / Extreme Mountain Offroad

## Full-length rock crawls
- ROCK_CRAWL: 118–156 m technical mountain climb with a sustained 19–22 degree grade.
- Entire road is bedrock with continuous noise-based uneven terrain shared by visual mesh and wheel physics.
- Seven alternate rock ledges and nine protruding boulders, staggered left/right; occasional workable line between peaks.
- ROCK_STEPS also has a complete rocky bed, stronger ledges and boulders.
- The first rock crawl follows two gentle introduction sections. Later groups alternate boulders, mud, and other obstacles.

## Real cross-axle terrain and mud
- CROSS_AXLE has three high stones paired with diagonally offset muddy drops one wheelbase behind.
- EROSION_GULLY has three full-width oblique channels, about 0.6–0.9m deep at the center, opposed higher lips and slick mud.
- RUT_MAZE is significantly deeper with diagonal washouts and uneven soft banks.
- Under-wheel height and surface grip are sampled from the identical heightfield that renders on screen.

## Stability and verification
- Four seeded worlds passed terrain generation and finite geometry validation.
- Tested angled trenches and confirmed cross-track vertical differences as much as 1.4m rocky / 1.2m eroded, across different points.
- Performance-conscious deterministic rock relief, limited feature counts and adaptive mesh sampling.
- Niva, permanent AWD 50/50, LOW, lockers, garage, music, controller, Rally and Village Cup unchanged.
- PWA/offline cache updated to v0.39; persistent records untouched.
- Driving difficulty and on-device FPS still need hands-on verification.
