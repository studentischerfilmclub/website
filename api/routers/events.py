import logging
from typing import Annotated

from ..dependencies import is_member
from ..models import *
from ..database_connection import db

from fastapi import APIRouter, HTTPException, Depends
from fastapi.encoders import jsonable_encoder

import pymongo
from bson import ObjectId

router = APIRouter(
    prefix="/events",
    tags=["events"]
)

@router.post("/add_person")
async def write_event(data: PersonData):
    event = db.events.find_one({"_id": ObjectId(data.event_id)})
    if event is None:
        raise HTTPException(status_code=500, detail=f"Invalid event_id {data.event_id}")

    if "people" in event and event["people"] != None:
        result = db.events.update_one({"_id": ObjectId(data.event_id)}, {"$push": {"people": data.name}})
    else:
        result = db.events.update_one({"_id": ObjectId(data.event_id)}, {"$set": {"people": [data.name]}})

@router.post("/post")
async def write_event(event_data: EventData, user: Annotated[User, Depends(is_member)]):
    event = jsonable_encoder(event_data)
    event["datetime"] = datetime.datetime.fromisoformat(event["date"] + "T" + event["time"])
    del event["date"]
    del event["time"]
    if not event["link"]:
        del event["link"]
    
    # check if document is inserted
    if db.events.count_documents(event) != 0:
        logging.info(f"Event already present: {event}")
        return

    # inset document
    db_confirmation = db["events"].insert_one(event)

    # logging and error handling
    if db_confirmation.acknowledged:
        logging.info(f"Inserted event: {event}")
        return
    else:
        logging.error(f"NOT Inserted event: {event}")
        raise HTTPException(status_code=500, detail="Error inserting document.")

@router.get("/all", response_model=list[Event])
async def get_all_events() -> list[dict]:
    return list(
        db.events.find({})
        .sort("datetime", pymongo.ASCENDING)
    )

@router.get("/next", response_model=list[Event])
async def get_next_events() -> list[dict]:
    return list(
        db.events.find({"datetime": {"$gte": datetime.datetime.now()}})
        .sort("datetime", pymongo.ASCENDING)
    )

