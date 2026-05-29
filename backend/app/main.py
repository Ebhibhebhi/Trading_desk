from dotenv import load_dotenv
load_dotenv()

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db
from .scheduler import start_scheduler, stop_scheduler, run_poll
from .api import events, config


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    start_scheduler(interval_hours=1)
    asyncio.create_task(run_poll())  # immediate first poll on startup
    yield
    stop_scheduler()


app = FastAPI(title="Sky Strike", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events.router, prefix="/api")
app.include_router(config.router, prefix="/api")
