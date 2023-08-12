from fastapi import Request, HTTPException

async def ip_address(request: Request) -> str:
    if request.client is None:
        raise HTTPException(status_code=400, detail="ip adress of client is opaque")
    return request.client.host

