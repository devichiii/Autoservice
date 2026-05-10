import asyncio
import os

import httpx
from aiogram import Bot, Dispatcher, F
from aiogram.filters import CommandStart
from aiogram.types import Message
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3000/api/v1")
API_BOT_TOKEN = os.getenv("API_BOT_TOKEN", "")

dp = Dispatcher()


@dp.message(CommandStart())
async def start_handler(message: Message) -> None:
    await message.answer(
        "AutoService bot online. I work only through backend API."
    )


@dp.message(F.text == "/health")
async def health_handler(message: Message) -> None:
    headers = {"Authorization": f"Bearer {API_BOT_TOKEN}"} if API_BOT_TOKEN else {}
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(f"{API_BASE_URL}/auth/health", headers=headers)
        if response.is_success:
            await message.answer("API reachable.")
        else:
            await message.answer(f"API error: {response.status_code}")


async def main() -> None:
    if not BOT_TOKEN:
        raise RuntimeError("TELEGRAM_BOT_TOKEN is required.")

    bot = Bot(token=BOT_TOKEN)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
