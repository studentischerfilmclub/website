#!/bin/python
from typing import Union
from fastapi import FastAPI
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from datetime import date
import uvicorn
import os
import logging
import sys
import pymongo

app = FastAPI()

dbClient = pymongo.MongoClient(host="db", port=27017)#
db = dbClient["filmclub"]

origins = [
    "http://localhost:3000",
    "db:27017"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"Hello": "World32"}

@app.post("/writeEvent")
def writeEvent(event):
    db["events"].insert_one(event)

@app.get("/readEvent")
def readEvent():
    
    events = list()
    for event in db.events.find({}):
        del event["_id"]
    
        if dateNotPast(event["date"]):
            events.append(event)
        else:
            db.events.delete_one({"name": event["name"]})
    return events

def dateNotPast(givenDate):
    today = date.today()
    if int(givenDate[6:]) < today.year:
        return False
    if int(givenDate[6:]) == today.year and int(givenDate[3:5]) < today.month:
        return False
    if int(givenDate[6:]) == today.year and int(givenDate[3:5]) == today.month and int(givenDate[:2]) < today.day:
        return False
    return True

if __name__ == "__main__":
    port = os.environ.get("PORT", None)
    if port is None:
        logging.critical("No port provided!")
        sys.exit()
    uvicorn.run("main:app", host="0.0.0.0", port=int(port), reload=True, log_level="info")
