import asyncio
import logging
import os
from pathlib import Path
from typing import Any

import httpx
from aiogram import Bot, Dispatcher, F
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.filters import CommandStart
from aiogram.types import Message
from dotenv import load_dotenv

_BOT_ROOT = Path(__file__).resolve().parent.parent
# Монорепо: apps/telegram-bot → родитель apps → корень репозитория
_REPO_ROOT = _BOT_ROOT.parent.parent


def _load_dotenv_files() -> None:
    """
    Ищем .env в нескольких типичных местах (Windows/IDE часто кладут не туда).
    Опционально: полный путь через переменную окружения DOTENV_PATH (до запуска бота).
    """
    candidates: list[Path] = []
    explicit = os.environ.get("DOTENV_PATH", "").strip()
    if explicit:
        candidates.append(Path(explicit).expanduser().resolve())
    candidates.extend(
        [
            _BOT_ROOT / ".env",
            _BOT_ROOT / "src" / ".env",
            _REPO_ROOT / ".env",
            Path.cwd() / ".env",
        ]
    )
    seen: set[Path] = set()
    unique = []
    for p in candidates:
        rp = p.resolve()
        if rp not in seen:
            seen.add(rp)
            unique.append(p)

    for path in unique:
        if not path.is_file():
            continue
        # utf-8-sig убирает BOM, который ломает имена переменных после сохранения из блокнота
        ok = load_dotenv(path, encoding="utf-8-sig")
        if ok:
            log.info("Loaded environment from %s", path)
            return
        log.warning("Found %s but load_dotenv returned False (пустой файл или ошибка чтения).", path)

    log.warning(
        "Файл .env не найден или пуст. Ожидались пути: %s. "
        "Создайте %s рядом с каталогом src или задайте DOTENV_PATH= полный путь к .env. "
        "Текущая рабочая директория (cwd): %s",
        ", ".join(str(p) for p in unique),
        _BOT_ROOT / ".env",
        Path.cwd(),
    )


logging.basicConfig(level=logging.INFO)
log = logging.getLogger("autoservice-telegram-bot")
_load_dotenv_files()

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3000/api/v1").rstrip("/")
# Совпадает с NestJS TELEGRAM_BOT_API_KEY; устаревшее имя TELEGRAM_INTERNAL_API_KEY — запасной вариант
TELEGRAM_BOT_API_KEY = os.getenv("TELEGRAM_BOT_API_KEY", "").strip() or os.getenv(
    "TELEGRAM_INTERNAL_API_KEY", ""
).strip()
TELEGRAM_NOTIFY_CHAT_ID_RAW = os.getenv("TELEGRAM_NOTIFY_CHAT_ID", "").strip()
POLL_INTERVAL_SEC = float(os.getenv("TELEGRAM_PENDING_POLL_SECONDS", "10"))
PENDING_LIMIT = int(os.getenv("TELEGRAM_PENDING_LIMIT", "20"))

dp = Dispatcher()


def _telegram_api_session() -> AiohttpSession:
    """
    Исходящие вызовы aiogram → api.telegram.org. Отдельно от httpx к backend
    (localhost): если Telegram только через прокси/VPN, задайте TELEGRAM_PROXY.
    Пример: socks5://127.0.0.1:1080 или http://127.0.0.1:8080
    Требуется пакет aiohttp-socks (см. requirements.txt).
    """
    proxy = os.getenv("TELEGRAM_PROXY", "").strip() or os.getenv("TELEGRAM_PROXY_URL", "").strip()
    if proxy:
        log.info("Telegram Bot API session uses TELEGRAM_PROXY.")
        return AiohttpSession(proxy=proxy)
    log.warning(
        "TELEGRAM_PROXY is not set: connecting to api.telegram.org without proxy. "
        "If TCP to port 443 fails, set TELEGRAM_PROXY to your working proxy URL."
    )
    return AiohttpSession()


def _api_trust_env() -> bool:
    """
    По умолчанию False: не подхватывать HTTP(S)_PROXY / ALL_PROXY из окружения.
    Иначе на Windows при ALL_PROXY=socks5://... httpx пытается SOCKS и падает без socksio,
    даже для запросов на localhost.
    Для API за корпоративным прокси: HTTPX_TRUST_ENV=true
    """
    v = os.getenv("HTTPX_TRUST_ENV", "").strip().lower()
    return v in ("1", "true", "yes", "on")


def _api_http_client(timeout: float) -> httpx.AsyncClient:
    return httpx.AsyncClient(timeout=timeout, trust_env=_api_trust_env())


def _internal_headers() -> dict[str, str]:
    if not TELEGRAM_BOT_API_KEY:
        return {}
    return {"x-telegram-api-key": TELEGRAM_BOT_API_KEY}


def _notify_chat_id() -> int | None:
    if not TELEGRAM_NOTIFY_CHAT_ID_RAW:
        return None
    try:
        return int(TELEGRAM_NOTIFY_CHAT_ID_RAW)
    except ValueError:
        log.error("TELEGRAM_NOTIFY_CHAT_ID must be an integer (Telegram chat id).")
        return None


def format_notification_for_telegram(item: dict[str, Any]) -> str:
    user = item.get("user") or {}
    email = user.get("email")
    first = user.get("firstName")
    last = user.get("lastName")
    name_bits = [p for p in [first, last] if p]
    name = " ".join(name_bits).strip()

    client_line = ""
    if name and email:
        client_line = f"Клиент: {name} ({email})"
    elif email:
        client_line = f"Клиент: {email}"
    elif name:
        client_line = f"Клиент: {name}"

    title = (item.get("title") or "").strip()
    body = (item.get("message") or "").strip()
    blocks = [b for b in [client_line, title, body] if b]
    return "\n\n".join(blocks)


async def api_health(client: httpx.AsyncClient) -> tuple[int, str]:
    url = f"{API_BASE_URL}/integrations/telegram/health"
    response = await client.get(url, headers=_internal_headers())
    if response.is_success:
        return response.status_code, "API (internal Telegram): OK."
    return response.status_code, f"API error: {response.status_code}"


async def fetch_pending(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    url = f"{API_BASE_URL}/integrations/telegram/pending"
    params = {"limit": str(PENDING_LIMIT)}
    response = await client.get(url, headers=_internal_headers(), params=params)
    response.raise_for_status()
    data = response.json()
    if not isinstance(data, list):
        log.warning("Unexpected pending payload (expected list), got %s", type(data))
        return []
    return data


async def mark_delivered(client: httpx.AsyncClient, notification_id: str) -> None:
    url = f"{API_BASE_URL}/integrations/telegram/notifications/{notification_id}/delivered"
    response = await client.patch(url, headers=_internal_headers())
    response.raise_for_status()


async def deliver_pending_batch(bot: Bot, client: httpx.AsyncClient) -> int:
    chat_id = _notify_chat_id()
    if chat_id is None:
        log.debug("Skip delivery: TELEGRAM_NOTIFY_CHAT_ID is not set.")
        return 0

    if not TELEGRAM_BOT_API_KEY:
        log.warning("Skip delivery: TELEGRAM_BOT_API_KEY is not set (internal API cannot be called).")
        return 0

    items = await fetch_pending(client)
    sent = 0
    for item in items:
        nid = item.get("id")
        if not nid:
            log.error("Pending item without id, skipping: %s", item)
            continue
        text = format_notification_for_telegram(item)
        if not text:
            log.error("Empty notification text for id=%s, skipping delivery", nid)
            continue
        try:
            await bot.send_message(chat_id=chat_id, text=text)
        except Exception:
            log.exception("Telegram send failed for notification id=%s (stays PENDING)", nid)
            continue
        try:
            await mark_delivered(client, str(nid))
            sent += 1
        except Exception:
            log.exception(
                "mark-as-delivered failed for id=%s; message was sent but may be retried on next poll",
                nid,
            )
    return sent


async def polling_worker(bot: Bot) -> None:
    while True:
        try:
            async with _api_http_client(30.0) as client:
                if _notify_chat_id() is not None and TELEGRAM_BOT_API_KEY:
                    n = await deliver_pending_batch(bot, client)
                    if n:
                        log.info("Delivered %s notification(s).", n)
        except Exception:
            log.exception("Pending delivery iteration failed (will retry)")
        await asyncio.sleep(POLL_INTERVAL_SEC)


@dp.message(CommandStart())
async def start_handler(message: Message) -> None:
    await message.answer(
        "Бот AutoService: доставка уведомлений только через backend API.\n"
        "Команды: /health, /pull_pending, /my_chat_id"
    )


@dp.message(F.text == "/my_chat_id")
async def my_chat_id_handler(message: Message) -> None:
    cid = message.chat.id
    await message.answer(
        f"Этот чат: <code>{cid}</code>\n\n"
        "Добавьте в apps/telegram-bot/.env строку (одно число, без кавычек):\n"
        f"<pre>TELEGRAM_NOTIFY_CHAT_ID={cid}</pre>\n"
        "Перезапустите бота и снова вызовите /pull_pending.",
        parse_mode="HTML",
    )


@dp.message(F.text == "/health")
async def health_handler(message: Message) -> None:
    if not TELEGRAM_BOT_API_KEY:
        await message.answer("TELEGRAM_BOT_API_KEY не задан — вызов internal API невозможен.")
        return
    async with _api_http_client(10.0) as client:
        code, body = await api_health(client)
        if code < 400:
            await message.answer(body)
        else:
            await message.answer(body)


@dp.message(F.text == "/pull_pending")
async def pull_pending_handler(message: Message) -> None:
    if not TELEGRAM_BOT_API_KEY:
        await message.answer("TELEGRAM_BOT_API_KEY не задан.")
        return
    if _notify_chat_id() is None:
        raw = TELEGRAM_NOTIFY_CHAT_ID_RAW
        if raw:
            await message.answer(
                f"TELEGRAM_NOTIFY_CHAT_ID не парсится как число: «{raw}». "
                "Укажите только цифры (см. /my_chat_id в этом чате)."
            )
        else:
            await message.answer(
                "TELEGRAM_NOTIFY_CHAT_ID не задан — некуда отправлять. "
                "Выполните /my_chat_id и пропишите значение в .env."
            )
        return
    bot = message.bot
    async with _api_http_client(30.0) as client:
        try:
            n = await deliver_pending_batch(bot, client)
        except Exception:
            log.exception("Manual pull_pending failed")
            await message.answer("Ошибка при запросе к API, см. логи бота.")
            return
    await message.answer(f"Обработано: доставлено и помечено как delivered: {n}.")


async def main() -> None:
    if not BOT_TOKEN:
        raise RuntimeError("TELEGRAM_BOT_TOKEN is required.")

    if not TELEGRAM_BOT_API_KEY:
        log.warning("TELEGRAM_BOT_API_KEY is empty: /integrations/telegram/* will return 401.")

    bot = Bot(token=BOT_TOKEN, session=_telegram_api_session())
    asyncio.create_task(polling_worker(bot))
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
