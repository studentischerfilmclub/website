import datetime
import random
import uuid
import logging
from typing import Annotated
from collections import defaultdict

from ..database_connection import db
from ..dependencies import ip_address, is_member
from ..models import Election, ElectionData, User
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
async def post_election(election_data: ElectionData, user: Annotated[User, Depends(is_member)]):
    election = {
        "live": True,
        "published": datetime.datetime.now(),
        "candidates": dict([(candidate, 0) for candidate in election_data.candidates]),
        "votes": election_data.votes
    }
    
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
    votes = live_election["votes"]
    if len(vote) != votes:
        raise HTTPException(status_code=400, detail=f"vote for precisely {votes} candidate(s)!")
    confirmation = db.ballots.update_one(
        filter={"client_id": ip, "election_id": election_id},
        update={"$set": {"vote": vote}},
        upsert=True
    )
    if confirmation.acknowledged is not True:
        raise HTTPException(status_code=500, detail="error updating vote")


@router.get("/close")
async def close_election(user: Annotated[User, Depends(is_member)]):
    # get live elections
    live_elections = list(db.elections.find({"live": True}))

    if len(live_elections) < 1:
        raise HTTPException(status_code=400, detail="No live election to close.")
    if len(live_elections) > 1:
        # should never happen
        raise HTTPException(status_code=500, detail="Multiple live election.")

    # only one live vote
    election, = live_elections

    # count ballots
    ballots = list(db.ballots.find({"election_id": election["_id"]}))
    candidates = election["candidates"]
    for ballot in ballots:
        for candidate in ballot["vote"]:
            candidates[candidate] += 1

    db.elections.update_one(
        filter={"_id": election["_id"]},
        update={"$set": {
            "candidates": candidates,
            "live": False,
        }}
    )

    await websocket_manager.broadcast({"live": False})

@router.get("/past", response_model=list[Election])
async def get_past_elections() -> list[list]:
    # take second element for sort
    def takeSecond(elem):
        return elem[1]
    elections = list()
    election_dict = db.elections.find({"live": False}).sort("published", pymongo.DESCENDING)
    for i in election_dict:
        elections.append([[j, i["candidates"][j]] for j in i["candidates"]])
        elections[-1].sort(key=takeSecond, reverse=True)
    logging.info(elections)
    return elections

@router.get("/live")
async def get_live_candidates() -> Election:
    live_election = db.elections.find_one({"live": True})
    if live_election is None:
        raise HTTPException(status_code=400, detail="no live election")
    if "candidates" not in live_election:
        raise HTTPException(status_code=500, detail="live election malformed")
    return live_election

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

