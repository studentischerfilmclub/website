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
    prefix="/movie",
    tags=["movie"]
)

@router.get("/next", response_model=list[Movie])
async def get_next_movie() -> list[dict]:
    return db.movie.find({"datetime": {"$gte": datetime.datetime.now()}}) \
        .sort("datetime", pymongo.ASCENDING) \
        .next()

