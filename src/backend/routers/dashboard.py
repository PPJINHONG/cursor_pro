from fastapi import APIRouter

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_summary():
    # 실제론 DB에서 계산된 통계값 반환 예정
    return {
        "total_requests": 15324,
        "top_endpoints": [
            { "url": "/api/user/list", "count": 1200, "avg_latency": 110 },
            { "url": "/api/order/create", "count": 750, "avg_latency": 340 },
        ]
    }
