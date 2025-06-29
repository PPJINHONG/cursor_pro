from pydantic import BaseModel, Extra
from datetime import datetime

class LogCreate(BaseModel):
    timestamp: datetime
    method: str
    path: str
    status: int
    latency_ms: int
    client_ip: str

    class Config:
        # Fluent Bit가 붙여오는 extra 필드(date 등)를 무시
        extra = Extra.ignore
