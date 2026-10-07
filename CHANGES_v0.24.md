# v0.24 — PERFORMANCE PASS

Основные файлы: performance.js (новый), physics.js, game.js, race.js, race-decor.js, props.js, trees.js, npc-models.js, visual-car.js.

performance.js: adaptive physics helpers, GameplayClock, SpatialGrid, RenderScale, Profiler.
physics.js: AI effective step, reusable previousPose/force/moment и дешёвая эквивалентная quaternion rotation; конфигурация игрока и его 180 Hz сохранены.
game.js: разделение gameplay/weather, throttled mesh sync, сохранение лент при decorOnly rebuild, visual LOD, profiler/DPR и выбор ближайших AI beams.
race.js: реальные 180/90/60 Hz AI, controller LOD, gameplay 30 Hz, actor grid и прогресс 30 Hz.
race-decor.js: grid зрителей; populations сохранены.
props.js / trees.js: общий статический grid всех участников; debris 30 Hz.
npc-models.js / visual-car.js: shared model LOD и переиспользование визуальных объектов/матриц.

index.html, sw.js, package.json и импорты: версия 024, офлайн-кеш нового performance.js. Новые regression/benchmark тесты и baseline-траектория игрока — tests/performance24*. Фикс лент проверяется также tests/scene.test.mjs.

Количество AI, зрителей, животных и окружения не сокращено. CPU-бенчмарк и ограничения реальной мобильной проверки описаны в README.md.
