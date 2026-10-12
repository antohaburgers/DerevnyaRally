# Бесконечная Нива: 3D — v0.45 / Suspension shop

## Suspension height — 3 options
- Stock / 0 mm: unchanged v0.44 mechanical behavior with standard damping.
- Trophy / +40 mm lift: actual +0.040 m settled body ride height, extra front/rear droop and compression travel.
- Extreme / +60 mm lift: +0.060 m settled ride height and more extension travel for cross-axle terrain.
- Taller body raises the physical center of mass in world space. Wheels keep their existing radius, drivetrain and tyre physics remain untouched.
- Suspension rest height adjusts dynamically, not using cosmetic-only model scaling.

## Spring / damping — 3 independent options
- Soft: 0.86x coil rates, 0.82x damping, 0.60x anti-roll stiffness, extra travel.
- Standard: original rates, damping, roll bars and original suspension travel.
- Hard: 1.25x spring rate, 1.22x damping, 1.48x anti-roll, modest travel reduction.
- Matched spring-preload correction ensures each named lift adds precisely its rated static body height, independent of stiffness.
- Nine working combinations.

## Garage and gameplay
- Six new buttons in existing 3D garage, with immediate ride-height visualization and configuration specs.
- Auto-saving selections using original v1 garage key, no migration or record loss.
- Chosen physics gets applied before each solo run. Cup racing continues to use stock physics.
- 3D Niva, cosmetics, gamepad, damage, engine, PWA architecture unchanged.

## QA
- Tested 9 configurations on a physically simulated flat-ground Niva for 5 seconds each: four tyre contacts, no invalid positions, body height 0 / +40 / +60 mm relative to stock.
- Exact original CAR_CONFIG object reused for stock+standard (no new tuning properties).
- Verified build normalization from old saves and independent persistence.
- Static JS syntax and PWA version/dependency checks.
- Actual on-device driving/handling and performance still require playtest.
