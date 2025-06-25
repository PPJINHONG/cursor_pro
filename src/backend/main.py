from fastapi import FastAPI
from routers import ingest, dashboard   
from database import init_db
import logging
logger = logging.getLogger(__name__)

app = FastAPI()

app.include_router(ingest.router, prefix="/log")
app.include_router(dashboard.router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    try:
        await init_db()
        logger.info("✅ Database initialized successfully.")
    except Exception as e:
        logger.error(f"❌ Failed to initialize DB: {e}")
        raise