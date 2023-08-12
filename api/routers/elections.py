import datetime
import random
import uuid
import logging
from typing import Annotated

from ..database_connection import db
from ..dependencies import ip_address
from ..models import Election
from ..websocket_manager import websocket_manager

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketException
)

import pymongo

router = APIRouter(
    prefix="/elections",
    tags=["elections"],
)

websocket_id_salt = random.getrandbits(128)

@router.post("/post")
async def post_election(candidates: list[str]):
    if db.elections.count_documents({"live": True}) >= 1:
        raise HTTPException(status_code=400, detail="A live election already exists.")

    election = dict()
    election["live"] = True
    election["published"] = datetime.datetime.now()
    election["candidates"] = dict([(candidate, 0) for candidate in candidates])
    confirmation = db.elections.insert_one(election)

    if confirmation.acknowledged:
        await websocket_manager.broadcast({"live": True})
    else:
        raise HTTPException(status_code=500, 
                            detail="Couldn't insert vote into database.")

@router.post("/vote")
async def vote_in_election(vote: list[str], ip: Annotated[str, Depends(ip_address)]):
    live_election = db.elections.find_one({"live": True})
    if live_election is None:
        raise HTTPException(status_code=400, detail="no live election")
    election_id = live_election["_id"]
    confirmation = db.ballots.update_one(
        filter={"client_id": ip, "election_id": election_id},
        update={"$set": {"vote": vote}},
        upsert=True
    )
    if confirmation.acknowledged is not True:
        raise HTTPException(status_code=500, detail="error updating vote")


@router.get("/close")
async def close_election() -> Election:
    live_elections = list(db.elections.find({"live": True}))

    if len(live_elections) < 1:
        raise HTTPException(status_code=400, detail="No live election to close.")
    if len(live_elections) > 1:
        # should never happen
        raise HTTPException(status_code=500, detail="Multiple live election.")

    # only one live vote
    election, = live_elections

    # close election
    del election["live"]
    db.elections.update_one({"live": True}, {"$set": {"live": False}})
    await websocket_manager.broadcast({"live": False})

    # count ballots
    ballots = list(db.elections.find({"election_id": election["_id"]}))
    for ballot in ballots:
        for candidate in ballot["vote"]:
            election["candidates"][candidate] += 1

    return election

@router.get("/past", response_model=list[Election])
async def get_past_elections() -> list[dict]:
    return list(db.elections.find({"live": False}).sort("published", pymongo.DESCENDING))

@router.get("/live")
async def get_live_candidates() -> list[str]:
    live_election = db.elections.find_one({"live": True})
    if live_election is None:
        raise HTTPException(status_code=400, detail="no live election")
    if "candidates" not in live_election:
        raise HTTPException(status_code=500, detail="live election malformed")
    return live_election["candidates"].keys()

@router.get("/websocket_id")
async def get_elections_websocket_id(ip: Annotated[str, Depends(ip_address)]) -> str:
    id_number = hash(ip) + websocket_id_salt
    return str(uuid.UUID(int=id_number))

@router.websocket("/websocket/{client_id}")
async def voteWS(websocket: WebSocket, client_id: str):
    # use client_ip as identification
    await websocket_manager.connect(websocket, client_id)
    live_vote = db.elections.find_one({"live": True})
    await websocket.send_json({"live": (live_vote is not None)})

    async for data in websocket.iter_json():
        if "vote" in data:
            live_election = db.elections.find_one({"live": True})
            if live_election is None:
                raise WebSocketException(code=1000, reason="No live election")
            election_id = live_election["_id"]

            ballots_cast = db.ballots.count_documents({"_id": client_id})
            if ballots_cast > 1:
                # sohuld never happen
                raise WebSocketException(code=1000, reason=f"Multiple ballots cast for voter {client_id}")
            if ballots_cast < 1:
                await websocket_manager.broadcast({"new_voter": 1})

            db.ballots.find_one_and_update(
                filter={"_id": client_id, "election_id": election_id}, 
                update={"$set": {"vote": data["vote"]}},
                upsert=True,
            )

        if "vote_status" in data:
            live_election = db.elections.find_one({"live": True})
            if live_election is None:
                await websocket.send_json({"vote": {}})
                continue
            
            election_id = live_election["_id"]
            ballots_cast = list(db.ballots.find({"_id": client_id, "election_id": election_id}))
            if len(ballots_cast) > 1:
                # sohuld never happen
                raise WebSocketException(code=1000, reason=f"Multiple ballots cast for voter {client_id}")
            if len(ballots_cast) == 1:
                await websocket.send_json({"vote": ballots_cast[0]})
            if len(ballots_cast) < 1:
                await websocket.send_json({"vote": {}})
        
        if set(data.keys()).intersection(set(["vote", "vote_status"])):
            logging.warn(f"Unexpected websocket message: {data}")
            raise WebSocketException(code=1000, reason="Unexpected websocket message")

    websocket_manager.disconnect(client_id)

