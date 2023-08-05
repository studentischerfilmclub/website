#!/bin/python
from typing import Union, List
from fastapi import FastAPI, Request, Response
from fastapi.responses import PlainTextResponse
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

# routes
@app.get("/")
async def read_root():
    return {"Hello": "World32"}

@app.post("/postEvent")
async def writeEvent(event_data: EventData):
    event_data = jsonable_encoder(event_data)
    if db.events.count_documents(event_data) != 0:
        return Response(status_code=201, content="Event already present.")

    db_confirmation = db["events"].insert_one(jsonable_encoder(event_data))
    if db_confirmation.acknowledged:
        return Response(status_code="200", content="Event created.")
    else:
        return Response(status_code=400, content="Error inserting document.")

@app.get("/getAllEvents", response_model=list[Event])
async def getEvents():
    return db.events.find({}).sort("date", pymongo.ASCENDING)

@app.get("/getNextEvents", response_model=list[Event])
async def getEvents() -> Any:
    return db.events.find({"date": {"$gte": datetime.datetime.now()}}, batch_size=20, sort=[("date", pymongo.ASCENDING)])

if __name__ == "__main__":
    port = os.environ.get("PORT", None)
    if port is None:
        logging.critical("No port provided!")
        sys.exit()
    uvicorn.run("main:app", host="0.0.0.0", port=int(port), reload=True, log_level="info")