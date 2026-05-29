from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

scheduler = AsyncIOScheduler()


async def run_poll():
    from .database import AsyncSessionLocal
    from .services.polling import poll_events
    async with AsyncSessionLocal() as db:
        try:
            await poll_events(db)
            print("Poll completed successfully")
        except Exception as e:
            print(f"Poll error: {e}")


def start_scheduler(interval_hours: int = 1):
    scheduler.add_job(
        run_poll,
        IntervalTrigger(hours=interval_hours),
        id="poll_events",
        replace_existing=True,
    )
    scheduler.start()
    print(f"Scheduler started — polling every {interval_hours}h")


def stop_scheduler():
    scheduler.shutdown(wait=False)
