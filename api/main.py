#!/bin/python
from fastapi import FastAPI, Request, Response, WebSocket, WebSocketException
from fastapi.responses import PlainTextResponse, JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import logging
import sys
import pymongo
import traceback
import datetime
from models import *
import uuid
import random

FORMAT = "%(levelname)s:\t %(message)s"
logging.basicConfig(format=FORMAT, level=logging.INFO)

# FastAPI config
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.exception_handler(Exception)
async def exception_handler(request: Request, exception: Exception):
    return PlainTextResponse(status_code=500, content=traceback.format_exc())

# pymongo config
dbClient = pymongo.MongoClient(host="db")
db = dbClient.filmclub

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        if client_id in self.active_connections:
            logging.warn("Client {client_id} already connected when requesting to connect")
        await websocket.accept()
        logging.info(f"Accepted connection with id {client_id}")
        self.active_connections[client_id] = websocket
    
    def disconnect(self, client_id: int):
        if client_id not in self.active_connections:
            logging.warn("Client {client_id} not in active_connections when requesting to disconnect")
        else:
            del self.active_connections[client_id]
    
    async def broadcast(self, content: dict):
        for connection in self.active_connections.values():
            await connection.send_json(content)
    
    async def send_json(self, client_id: str, content: dict):
        await self.active_connections[client_id].send_json(content)
    
manager = ConnectionManager()

# routes
@app.get("/")
async def read_root():
    return {"Hello": "World32"}

@app.post("/postEvent")
async def writeEvent(event_data: EventData):
    event_data = jsonable_encoder(event_data)
    event_data["datetime"] = datetime.datetime.fromisoformat(event_data["date"] + "T" + event_data["time"])
    del event_data["date"]
    del event_data["time"]
    if not event_data["link"]:
        del event_data["link"]
    if db.events.count_documents(event_data) != 0:
        return JSONResponse(status_code=201, content={"msg": "Event already present."})

    db_confirmation = db["events"].insert_one(event_data)
    if db_confirmation.acknowledged:
        logging.info(f"Inserted event: {event_data}")
        return JSONResponse(status_code=200, content={"msg": "Event created."})
    else:
        logging.error(f"NOT Inserted event: {event_data}")
        return JSONResponse(status_code=400, content={"msg": "Error inserting document."})

@app.get("/getAllEvents", response_model=list[Event])
async def getAllEvents():
    return list(db.events.find({}).sort("datetime", pymongo.ASCENDING))

@app.get("/getNextEvents", response_model=list[Event])
async def getNextEvents() -> Any:
    return list(db.events.find({"datetime": {"$gte": datetime.datetime.now()}}).sort("datetime", pymongo.ASCENDING))

@app.post("/postElection")
async def postElection(candidates: list[str]):
    if db.elections.count_documents({"live": True}) >= 1:
        return PlainTextResponse(status_code=400, content="A live election already exists.")

    election = dict()
    election["live"] = True
    election["published"] = datetime.datetime.now()
    election["candidates"] = dict([(candidate, 0) for candidate in candidates])
    confirmation = db.elections.insert_one(election)

    if confirmation.acknowledged:
        await manager.broadcast({"is_live": True})
        return PlainTextResponse(status_code=200,
                            content="Vote created.")
    else:
        return PlainTextResponse(status_code=500, 
                            content="Couldn't insert vote into database.")

@app.get("/closeElection")
async def closeElection() -> dict:
    live_elections = list(db.elections.find({"live": True}))

    if len(live_elections) < 1:
        return Response(status_code=400, content="No live election to close.")
    if len(live_elections) > 1:
        # should never happen
        return Response(status_code=500, content="Multiple live election.")

    # only one live vote
    election, = live_elections

    # close election
    del election["live"]
    db.elections.update_one({"live": True}, {"$set": {"live": False}})
    manager.broadcast({"is_live": False})

    # count ballots
    ballots = list(db.elections.find({"election_id": election["_id"]}))
    for ballot in ballots:
        for candidate in ballot["vote"]:
            election["candidates"][candidate] += 1

    return election

salt = random.getrandbits(128)

@app.get("/getVoteWebSocketId")
async def getVoteWebSocketId(request: Request):
    return str(uuid.UUID(int=hash(request.client.host) + salt))

@app.websocket("/voteWebSocket/{client_id}")
async def voteWS(websocket: WebSocket, client_id: str):
    # use client_ip as identification
    await manager.connect(websocket, client_id)
    live_vote = db.votes.find_one({"live": True})
    await websocket.send_json({"is_live": (live_vote is not None)})

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
                await manager.broadcast({"new_voter": 1})

            db.ballots.find_one_and_update(
                filter={"_id": client_id, "election_id": election_id}, 
                update={"$set": {"vote": data["vote"]}},
                upsert=True,
            )

        if "vote_status" in data:
            live_election = db.elections.find_one({"live": True})
            if live_election is None:
                await websocket.send_json({"vote": {}})
            
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

    manager.disconnect(client_id)

if __name__ == "__main__":
    port = os.environ.get("PORT", None)
    if port is None:
        logging.critical("No port provided!")
        sys.exit()

    config = {
        "host":          "0.0.0.0",
        "port":          int(port),
        "reload":        True,
        "log_level":     "info",
        "proxy_headers": True,
    }
    uvicorn.run("main:app", **config)