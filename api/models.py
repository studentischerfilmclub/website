from pydantic import BaseModel, Field
import uuid
import datetime
from bson import ObjectId
from typing import Optional, Dict, Any

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

