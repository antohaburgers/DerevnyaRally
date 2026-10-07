# v0.28 — Controller Mode 2.0

- Полностью удалены режим Восьмёрки, его маршрут, плоская арена, survival/elimination/anti-camping и специальные rendering branches. Обычные гонки и общие системы сохранены.
- Активный input контроллера включает отдельный CSS layout. Touch/keyboard возвращает мобильный HUD; disconnect сбрасывает всё, включая camera look. Повторное подключение с удерживаемым стиком корректно активирует ввод.
- Правый стик подаёт аналоговый ввод в существующую camera orbit, deadzone 0.12, горизонтальный обзор/ограниченный вертикальный угол, плавный возврат. Поддержаны CHASE и HOOD.
- Для контроллера добавлен analog input в физику: устранён legacy порог 8%, LT напрямую масштабирует тормоз и reverse. Touch/AI используют прежний путь.
- Приборы снизу по центру и две reusable input gauges справа. Touch-педали остаются в DOM. Layout сохраняется на result/retry.
- Endless принудительно начинает с CHASE и не проходит cinematic branch; 10 секунд lock, RPM, музыка и countdown сохранены. Остальные race cinematics сохранены.
- Service worker / модули / меню обновлены до 028. Музыкальные файлы не включены.

Проверки: stage28 проверяет actual vehicle brake/reverse и input lifecycle; scene включает hot swap, правый стик до старта/в HOOD, gauges, result/retry, отклонение удалённого режима и кинематографию обычных гонок. Мобильный FPS и Bluetooth hardware здесь не измерены.
