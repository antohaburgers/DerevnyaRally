# Бесконечная Нива: 3D — v0.43 / Layered Trophy Combos

## Controller updates (standard Gamepad mapping)
- D-pad UP: FRONT LOCK (button 12).
- D-pad DOWN: REAR LOCK (button 13).
- D-pad LEFT: CENTER LOCK (button 14).
- D-pad RIGHT: HIGH / LOW (button 15).
- L3 press: drink beer (button 10, only if available).
- Edge-triggered once per press; menu navigation, camera, pedals, steering and rescue unchanged.

## Layered offroad combinations
- 14 supported difficult section types with multi-hazard recipes; two or three physical hazards can coexist inside a section.
- PEAT_BOG + BANK + WASHOUT is a supported recipe; optional CHESS articulation can also join.
- Other combinations: ascents + rocks + peat, side slopes + ruts, erosion channels + chess articulation.
- Five additional OFFROAD route group patterns added.
- Combo chance scales from 40% to 91% with route distance.
- Peat has a preserved firmer passing line on the shoulder; maximum feature count capped by recipes.
- Changed peat pool node sampling to 1.15 m for mobile performance.
- New dynamic section-entry messages describe current modifiers.

## Verification
- 10 seeded worlds, 940 generated sections; 494 with layered recipes; 54 peat bogs.
- 48 peat bogs with layered hazards, including 15 bank + washout; all 48 retained their firmer shoulder.
- No invalid sampled terrain heights or surface parameters, max 24 local features, normal rally has zero combos.
- D-pad and L3 press-edge tests passed; menu navigation unchanged.
- Static JS syntax and PWA imported files covered; on-device FPS and gameplay difficulty remain untested.

## Next: suspension and lift-kit tuning
- Stock suspension and selectable 30–40 mm / 50–60 mm lift kits with real clearance, travel, damping and center of mass adjustments.
- Suspension customization is planned, not implemented in v0.43.
