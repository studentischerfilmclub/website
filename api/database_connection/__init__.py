import pymongo
import os

connection = os.environ.get("DATABASE_CONNECTION", "stud-db")
db_client  = pymongo.MongoClient(host=connection)
db         = db_client.filmclub

