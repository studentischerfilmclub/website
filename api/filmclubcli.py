#!/bin/python
'''
Usage:
    filmclubcli.py insert_users [--salt-path=FILE]
    filmclubcli.py delete_users <username>...

Options:
    -h --help          Show this
    --salt-path=FILE   Path to salt file [default: ./salt.txt]
    --db=STR           Database connection string [default: localhost]
'''

import sys

from pyargon2 import hash as secure_hash
import pwinput
from docopt import docopt
from pymongo import MongoClient

arguments = docopt(__doc__)

salt_path = arguments.get("--salt-path", "./salt.txt")

try:
    with open(salt_path, "r") as file:
        salt = file.read()
except FileNotFoundError as err:
    print(f"Error: could not find {salt_path} file in current working directory!", file=sys.stderr)
    print("Either change into correct directory or provide salt path as argument.", file=sys.stderr)
    print(__doc__, file=sys.stderr)
    raise err
    
db_client = MongoClient(arguments.get("--db", "localhost"))
db = db_client.filmclub

if arguments["insert_users"]:
    while input("Insert new user? [Y/n] ").lower() != "n":
        username = input("username: ")
        while True:
                password = secure_hash(pwinput.pwinput(prompt="password: "), salt)
                if secure_hash(pwinput.pwinput(prompt="repeat password: "), salt) == password:
                    break
                else:
                    print("Error: passwords did not match!")

        conf = db.users.insert_one({
            "username": username,
            "password": password,
            "admin": input("admin (y/n): ") == "y",
        })
        print("ackowledged:", conf.acknowledged)
        print()

if arguments["delete_users"]:
    conf = db.users.delete_many({"username": {"$in": arguments["<username>"]}})
    print("acknowledged:", conf.acknowledged)
    print("deleted count:", conf.deleted_count)