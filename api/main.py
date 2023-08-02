#!/bin/python
from typing import Union
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import logging
import sys

app = FastAPI()

origins = [
    "http://localhost:3000",
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

if __name__ == "__main__":
    port = os.environ.get("PORT", None)
    if port is None:
        logging.critical("No port provided!")
        sys.exit()
    uvicorn.run("main:app", host="0.0.0.0", port=int(port), reload=True, log_level="info")
