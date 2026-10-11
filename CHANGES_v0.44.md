# v0.44 — 3D Showroom Garage
- Reuses the exact same Niva WebGL model, colors, live livery textures, offroad tires, arches, rack, snorkel, bumpers, and auxiliary lights as in game.
- Reparents the *existing* WebGL canvas into garage, and back out on exit; no duplicate WebGL context or copied fake model.
- Dark showroom with raised display stand and custom lighting, slow automatic rotation.
- Rotate by dragging/touching model; drag vertically or mouse wheel to zoom. Right stick of standard gamepad rotates and zooms.
- Garage UI adjusted for large preview alongside tuning controls.
- GPU workload limited to car/showroom while garage is open; resolution capped on mobile.
- Saves prior garage data unchanged, vehicle physics and gameplay modes unchanged.
- Suspension lift kits and spring presets will be separate: not yet implemented.
- JS syntax, offline cache, UI wiring, right stick behavior statically checked; on-device GPU rendering and FPS need testing.