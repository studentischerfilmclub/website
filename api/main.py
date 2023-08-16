#!/bin/python
import logging
import os

from .models import *
from .routers import events, elections

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

DEBUG = "DEBUG" in os.environ

# logging
FORMAT = "%(levelname)s:\t %(message)s"
logging.basicConfig(format=FORMAT, level=logging.INFO)

# fast api app
app = FastAPI(debug=DEBUG)

# middle ware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# routers
app.include_router(events.router)
app.include_router(elections.router)

# debug for checking if up
@app.get("/")
async def read_root():
    return {"Hello": "World32"}
