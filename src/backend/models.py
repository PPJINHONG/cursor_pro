from sqlalchemy import Column, Integer, String, DateTime
from database import Base

class LogEntry(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, nullable=False)
    method = Column(String, nullable=False)
    path = Column(String, nullable=False)
    status = Column(Integer, nullable=False)
    latency_ms = Column(Integer, nullable=False)
    client_ip = Column(String, nullable=False)
