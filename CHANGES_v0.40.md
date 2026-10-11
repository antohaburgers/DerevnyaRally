# Бесконечная Нива: 3D — v0.40

## Stylized rocks
- New lightweight shader for stone and bedrock with broad low-poly facets, dark seams and touches of olive moss, matching the stylized forest palette.
- Shifted ROCK and HAZARD_ROCK from flat sandy beige to muted slate/olive hues, respecting lighting and weather.
- Rock shader only applies to rock terrain batches; retains existing PWA/WebGL performance architecture.

## Tougher offroad frequency and combined sections
- Six more weighted OFFROAD_GROUPS focus on SIDE_SLOPE, CROSS_AXLE, EROSION_GULLY and MUD_CLIMB.
- Side slopes contain two angled muddy gullies and raised erosion lips.
- Mud hill climbs contain two muddy cross-axle gullies and sometimes a sustained side bank.
- Around 60% of CROSS_AXLE and EROSION_GULLY sections have a real uphill road grade.
- Some ROCK_CRAWL sections also receive side banks and an angled muddy rut.
- Maintains a traversable geometry rather than introducing a simple collision barrier.

## Fords
- About 70% of forest river sections get 4–6 offset rocks physically integrated into the heightfield; others stay muddy.
- Many crossings also get a deeper muddy exit patch and uneven earth lip.
- Submerged stones remain WATER in tire physics so splash/wading effects still work.
- Visible river plane compensates for submerged stone height and doesn't rise over individual boulders.

## Verification
- Seven seeded test worlds, 763 sections sampled: SIDE_SLOPE 70, EROSION_GULLY 62, CROSS_AXLE 46 (~23% combined), MUD_CLIMB 55, FOREST_FORD 57.
- Of 57 fords: 41 rocky and 16 muddy; physics surface remains WATER at underwater stone positions.
- No nonfinite or extreme local height profiles in test sample. JS static syntax and offline import coverage passed.
- Actual driving, shader compilation on target GPU, and on-device 60 FPS still require real-device testing.

## No changes
- Niva transmission 50/50, differential locks, LOW, music, controller, garages, rally and cup modes.
- Save/records preserved. PWA code cache version 0.40.
