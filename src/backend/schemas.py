from pydantic import BaseModel
from datetime import datetime

class LogCreate(BaseModel):
    timestamp: datetime
    method: str
    url: str
    status: int
    latency_ms: int
