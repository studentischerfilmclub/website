from pydantic import BaseModel, Field
import uuid
import datetime
from bson import ObjectId
from typing import Optional, Dict, Any, List

class EventData(BaseModel):
    name: str
    date: datetime.date
    time: datetime.time
    location: str
    link: Optional[str]

class Event(BaseModel):
    id: ObjectId = Field(alias="_id")
    name: str
    datetime: datetime.datetime
    location: str
    type: str

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "name": "Dune",
                "datetime": "2023-08-15T19:00",
                "location": "Luxor",
            }
        }

class Election(BaseModel):
    id: ObjectId = Field(alias="_id")
    published: datetime.datetime
    candidates: dict[str, int]

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "name": "",
                "datetime": "2023-08-15T19:00",
                "location": "Luxor",
            }
        }

class ElectionData(BaseModel):
    candidates: list[str]
    votes: int

class User(BaseModel):
    username: str
    hashed_password: str
    admin: bool
