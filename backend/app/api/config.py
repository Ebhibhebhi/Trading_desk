from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from ..config import load_config, save_config

router = APIRouter()


class Thresholds(BaseModel):
    buy: float
    watch: float


class ConfigUpdate(BaseModel):
    thresholds: Thresholds | None = None
    region: str | None = None
    max_events: int | None = None
    days_ahead: int | None = None


@router.get("/config")
async def get_config():
    return load_config()


@router.put("/config")
async def update_config(update: ConfigUpdate):
    cfg = load_config()
    if update.thresholds:
        cfg["thresholds"]["buy"] = update.thresholds.buy
        cfg["thresholds"]["watch"] = update.thresholds.watch
    if update.region is not None:
        cfg["region"] = update.region
    if update.max_events is not None:
        cfg["max_events"] = update.max_events
    if update.days_ahead is not None:
        cfg["days_ahead"] = update.days_ahead
    return save_config(cfg)


@router.post("/refresh")
async def trigger_refresh(background_tasks: BackgroundTasks):
    from ..scheduler import run_poll
    background_tasks.add_task(run_poll)
    return {"status": "refresh triggered"}
