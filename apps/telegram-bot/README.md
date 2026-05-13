# Telegram Bot

Python-бот на aiogram: **не ходит в БД**, только в backend REST API (`/api/v1/integrations/telegram/*`).

## Версия Python

Нужен **CPython 3.11–3.13** (в проекте обычно берут **3.12**). **Python 3.14** с текущими зависимостями часто ломает установку: у `aiogram` тянется `pydantic-core`, для 3.14 колёс под Windows может не быть, и сборка из исходников падает с ошибкой PyO3 («interpreter version … newer than PyO3's maximum»).

Проверка, какой интерпретатор у вас в PATH:

```powershell
python --version
where.exe python
```

Если видите 3.14, не ставьте пакеты «голым» `pip` из системы — создайте виртуальное окружение на **3.12** (лаунчер Windows `py`):

```powershell
cd C:\Desktop\Projects\Autoservice\apps\telegram-bot
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -U pip
pip install -r requirements.txt
python .\src\main.py
```

После активации `.venv` команды `python` и `pip` всегда относятся к 3.12 внутри каталога бота.

Если мешают предупреждения `Cache entry deserialization failed`, можно очистить кэш: `pip cache purge` (необязательно).

## Прокси и запросы к backend

Запросы к `API_BASE_URL` идут через **httpx** с **`trust_env=False` по умолчанию**: переменные `HTTP_PROXY` / `HTTPS_PROXY` / `ALL_PROXY` **не применяются**. Так локальный `http://localhost:3000` не уезжает в корпоративный **SOCKS** (иначе возможна ошибка про `socksio` / `httpx[socks]`).

Если ваш backend доступен **только через системный HTTP(S)-прокси**, задайте:

```text
HTTPX_TRUST_ENV=true
```

Для SOCKS к самому API без смены кода можно установить дополнительно: `pip install "httpx[socks]"` (или `socksio`).

## Доступ к Telegram API

Ошибка вида `Cannot connect to host api.telegram.org:443` / таймаут — сеть, файрвол, блокировки или нужен VPN. К запросам к backend это не относится: проверьте `curl`/`ping` до `api.telegram.org` и настройки прокси/VPN на машине.

Если **Telegram открывается только через прокси** (типичный случай: `Test-NetConnection api.telegram.org -Port 443` → `TcpTestSucceeded : False`, а с прокси/VPN всё ок), задайте в **`apps/telegram-bot/.env`** переменную **`TELEGRAM_PROXY`** с тем же URL, что использует ваш рабочий клиент (например `socks5://127.0.0.1:1080` для локального SOCKS). Бот передаёт её в **aiogram** (`AiohttpSession`); это **не** то же самое, что `HTTPX_TRUST_ENV` для вызовов Nest API на `localhost`. После изменения выполните `pip install -r requirements.txt` (нужен пакет `aiohttp-socks`).

## Поведение

- Фоновый цикл опрашивает `GET /integrations/telegram/pending` с заголовком `x-telegram-api-key`.
- Для каждой записи со статусом `PENDING` в API: отправка текста в чат `TELEGRAM_NOTIFY_CHAT_ID`, затем `PATCH .../notifications/:id/delivered`.
- Если Telegram недоступен или `send_message` падает — уведомление **остаётся** в `PENDING`, в лог пишется ошибка, цикл продолжается.
- Повторная доставка исключена для уже доставленных: после успешного `PATCH` запись не попадает в pending.

## Команды в Telegram

- `/start` — краткая справка.
- `/health` — `GET /integrations/telegram/health` (проверка ключа и доступности internal API).
- `/my_chat_id` — показать числовой id текущего чата, чтобы скопировать в `TELEGRAM_NOTIFY_CHAT_ID` в `.env`.
- `/pull_pending` — одна ручная итерация доставки (удобно для smoke-test).

## Переменные окружения

См. `.env.example`. Обязательны: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_API_KEY` (совпадает с backend `TELEGRAM_BOT_API_KEY`), `TELEGRAM_NOTIFY_CHAT_ID`.

Файл `.env` бот ищет в таком порядке: путь из **`DOTENV_PATH`** (если задан в системе), затем `apps/telegram-bot/.env`, `apps/telegram-bot/src/.env`, **корень монорепозитория** (`Autoservice/.env`), затем `.env` в текущей рабочей директории. При старте в логе будет строка **`Loaded environment from ...`** — если её нет и ключи «пустые», положите `.env` в один из этих путей или укажите `DOTENV_PATH` на полный путь к файлу.

## Запуск

С активированным venv на **3.11–3.13** и установленными зависимостями:

```bash
python src/main.py
```

Из корня монорепозитория (тот же интерпретатор, что в venv):

```bash
python apps/telegram-bot/src/main.py
```

## Безопасность

- Секреты не коммитить; в репозитории только placeholders в `.env.example`.
- Internal routes защищены на backend: без валидного `x-telegram-api-key` ответ `401`.
