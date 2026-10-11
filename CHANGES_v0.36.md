# v0.36 — Drift Polish 2.0

- AE86-only: 5-speed ratios [3.32, 2.12, 1.55, 1.12, .86], final drive 4.35.
- Torque curve now pulls steadily from 2800–6500 rpm; no redline change (9000).
- Earlier throttle-dependent upshifts (3500–6600 rpm), downshift threshold 2350 rpm.
- Drift hold on gears 2–4 from 2250 road-rpm at angle >0.10 rad. One-gear low-rpm recovery; upshifts cross-check vehicle speed to reject wheelspin.
- Gentle drift-only clutch slip blend limits free-spinning-rear RPM spikes; smoother pedal and shift torque coupling.
- Rebuilt hand-crafted Trueno-inspired hatch panels, glazing, mirrors, lights, fascia and bumper details in color batches.
- FIX: AE86 tyre/rim cylinder axes were degenerate (flattened wheels). Four corrected rotating 3D tyres with alloys.
- PWA bumped to 0.36 for fresh caches. Niva/Cup physics, music and road generation unchanged.

QA: Static code checks only; play-test on iPhone/controller still recommended for mid-range drift and FPS.