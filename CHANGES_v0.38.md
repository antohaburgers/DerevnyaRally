# v0.38 — 4x4 Drivetrain + Technical Offroad

## Realistic distribution
- Symmetric 50/50 from the unlocked center differential, limited by the axle with the least traction.
- Locked center starts balanced and transfers unused torque to the axle with greater grip.
- Rear differential locking changes rear wheel coupling, not front/rear axle torque bias.
- Failed axle driveshaft requires CENTER LOCK before surviving axle can provide drive.
- Detached wheel no longer becomes a magically fully driven open-differential axle.
- SPLIT debug monitor reflects post-lock-reaction front/rear torque.

## New Endless Offroad hazards
- CROSS_AXLE: paired opposite-wheel diagonal lift and dip.
- ROCK_STEPS: paired staggered rock shelves with a bypass.
- SIDE_SLOPE: sustained banked sidehill traverse.
- RUT_MAZE: changing, winding deep two-track mud ruts.
- EROSION_GULLY: successive transverse V-shaped channels.
- Terrain severity builds gradually from the starting kilometres; tracks retain a viable line.
- Brief entrance warnings for new difficult technical sections.
- Segment-aware rut geometry sampling to avoid unnecessary geometry on mobile.
- Heightfield sample path no longer allocates a merged obstacle array.

## Release
- v0.38, PWA cache bumped and asset versions include obstacle profiles.
- Other game modes, music and vehicle settings unchanged.

QA: differential behavior tests, three-seed route smoke tests, terrain shape checks, syntax and module URL checks passed. Browser/gamepad driving and FPS should be checked on an actual device.
