import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import settings
from backend.app.database import engine, Base, SessionLocal
from backend.app.models import Shipment
from backend.app.seed_data import seed_database
from backend.app.websocket_manager import ws_manager

# Import Routers
from backend.app.routers import (
    dashboard,
    shipments,
    events,
    alerts,
    inventory,
    risk,
    recommendations,
    audit,
    system,
    demo,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist and seed if empty
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        count = db.query(Shipment).count()
        if count == 0:
            print("[Startup] Database is empty. Running initial seed...")
            seed_database()
        else:
            print(f"[Startup] Database online with {count} active shipments.")
    finally:
        db.close()
    yield
    # Shutdown clean up
    print("[Shutdown] Cleaning up resources...")

app = FastAPI(
    title=settings.APP_TITLE,
    description=(
        "Z-Rescue: Real-Time AI for Critical Supply-Chain Decisions. "
        "Built for IBM Z Datathon 2026 (SSF2026) by Team UNI MIND."
    ),
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(system.router)
app.include_router(dashboard.router)
app.include_router(shipments.router)
app.include_router(events.router)
app.include_router(alerts.router)
app.include_router(inventory.router)
app.include_router(risk.router)
app.include_router(recommendations.router)
app.include_router(audit.router)
app.include_router(demo.router)

# WebSocket Endpoint for live event broadcasts
@app.websocket("/ws/events")
async def websocket_events_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection open and accept optional client heartbeat/pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text('{"type": "pong"}')
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)
