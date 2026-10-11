# Бесконечная Нива: 3D — v0.41 / FRONT LOCK

## Hardware drivetrain simulation
- Optional front axle differential locker: FRONT LOCK in 4x4 transmission menu, independent from CENTER and REAR.
- Front left/right axle torque is apportioned by tire traction with the locker, rather than 50/50 to individual wheels when open.
- Front shaft speed coupling mirrors rear locker, with fixed wheel inertia reaction.
- Engage when under about 18 km/h, low throttle and low wheel RPM discrepancy; display WAIT when not yet engaged; disengage immediately.
- Added high-grip steering penalty for a locked front axle; unlock to regain normal turning radius.
- Original symmetrical center differential 50/50 and damage behavior preserved.

## Controls
- Standard gamepad D-pad UP=HIGH/LOW; LEFT=CENTER LOCK; RIGHT=REAR LOCK; DOWN=FRONT LOCK.
- D-pad DOWN works on a key-press edge, not continually while held; menu navigation unaffected.
- UI: FRONT LOCK button and F lamp beside existing C/R indicators.
- Debug overlay includes F LOCK state.
- Run/reset starts FRONT LOCK disengaged.

## Checks
- JS static parsing, cache integrity and physics scenarios (flat 50/50; lifted wheel traction; damaged front prop; detached front wheel; controller binding).
- No change to sound, modes, records or garage; PWA version 0.41.
- Real-device gamepad, WebGL and FPS still need testing.
