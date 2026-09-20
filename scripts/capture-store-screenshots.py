"""Capture Play Store phone screenshots (1080×1920) from the local preview."""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "store-assets" / "screenshots"
URL = "http://127.0.0.1:4176/"
W, H = 1080, 1920


async def main() -> None:
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print("Installing playwright...", flush=True)
        import subprocess

        subprocess.check_call([sys.executable, "-m", "pip", "install", "playwright", "-q"])
        subprocess.check_call([sys.executable, "-m", "playwright", "install", "chromium"])
        from playwright.async_api import async_playwright

    OUT.mkdir(parents=True, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(
            viewport={"width": W, "height": H},
            device_scale_factor=1,
            is_mobile=True,
            has_touch=True,
        )
        page = await context.new_page()
        await page.add_init_script("localStorage.setItem('sherzod-lang', 'en');")
        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_timeout(600)

        # a) Home menu
        home = OUT / "01-home-menu.png"
        await page.screenshot(path=str(home), full_page=False)
        print("wrote", home)

        # c) How to play (modal over home)
        how_btn = page.locator("[data-act='how']")
        await how_btn.click()
        await page.wait_for_selector("#how-sheet:not([hidden])", timeout=5000)
        await page.wait_for_timeout(400)
        how = OUT / "03-how-to-play.png"
        await page.screenshot(path=str(how), full_page=False)
        print("wrote", how)

        # Close how sheet
        close = page.locator("[data-close='how-sheet']")
        if await close.count():
            await close.click()
            await page.wait_for_timeout(300)

        # b) Play screen — Rook Sacrifice
        await page.locator("[data-play='rook-sacrifice']").click()
        await page.wait_for_selector("#screen-play", timeout=5000)
        await page.wait_for_timeout(700)
        play = OUT / "02-play-rook-sacrifice.png"
        await page.screenshot(path=str(play), full_page=False)
        print("wrote", play)

        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
