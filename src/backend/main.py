from fastapi import FastAPI
from routers import ingest, dashboard   
from database import init_db

app = FastAPI()

app.include_router(ingest.router, prefix="/log")
app.include_router(dashboard.router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    await init_db()
