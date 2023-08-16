import logging
from typing import Annotated
import secrets

from .database_connection import db

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from pyargon2 import hash as secure_hash

security = HTTPBasic()

# logging
FORMAT = "%(levelname)s:\t %(message)s"
logging.basicConfig(format=FORMAT, level=logging.INFO)

# read salt if present, otherwise create new salt file
salt_path = "api/salt.txt"
try:
    with open(salt_path, "r") as file:
        password_salt = file.read()
except FileNotFoundError as err:
    logging.error("No salt file found! Please insert users first.")

async def ip_address(request: Request) -> str:
    if request.client is None:
        raise HTTPException(status_code=400, detail="ip adress of client is opaque")
    return request.client.host

async def is_member(credentials: Annotated[HTTPBasicCredentials, Depends(security)]):
    user = db.users.find_one({
        "username": credentials.username,
        "password": secure_hash(credentials.password, password_salt),
    })

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )

    return user

async def is_admin(credentials: Annotated[HTTPBasicCredentials, Depends(security)]):
    user = db.users.find_one({
        "username": credentials.username,
        "password": secure_hash(credentials.password, password_salt),
        "admin": True,
    })

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )

    return user
