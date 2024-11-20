import time
from typing import Union
import requests
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import os, glob
from typing import Any
from fastapi import Body, FastAPI, BackgroundTasks
from starlette.responses import FileResponse, JSONResponse
import json
from model.model import Point, GlareRequestModel
from model.userModel import User, Token, UserInDB
from addlogoTopdf import addLogogo
from firebase_crud import uploadFileReturnUrl, addUrlTodocument, update_status
from tasks.tasks import generate_reports_task
# from test_api_v2 import sendRequestBackend
from test_api_v2 import runScriptLocally
from passlib.context import CryptContext
from pathlib import Path
import threading
import queue
import traceback

from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from datetime import datetime, timedelta
from auth.accessToken import create_access_token

origins = [
    "http://localhost.tiangolo.com",
    "https://localhost.tiangolo.com",
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:3000",
    "http://127.0.0.1:8086",
    "https://solar-glare-web.vercel.app",
    "http://solar-glare-web.vercel.app",
    "http://solar-glare-web.vercel.app",
    "https://app.pv-glarecheck.com",
    "http://app.pv-glarecheck.com",
    "http://13.49.18.177/"
]

# -*- coding: utf-8 -*-
"""
Created on Fri Dec 22 00:41:56 2023

@author: mathi
"""

import math


#
# class ReqDataStructure(BaseModel):
#     identifier:int
#     # pv_areas:list[list:BaseModel]]
#     list_of_pv_area_information:list[PV_area_information()]
#     list_of_ops:list[Point(BaseModel)]
#     utc:int
#
#     # def toJson(self):
#     #     return {
#     #         "identifier": self.identifier,  # Hier den Identifier einfügen
#     #         "pv_areas": self.pv_areas.dict()
#     #
#     #         [
#     #             [
#     #                 {"latitude": 48.931985, "longitude": 9.520857, "ground_elevation": 298.75, "height_above_ground": 8.00},
#     #                 {"latitude": 48.932009 	, "longitude": 9.520952, "ground_elevation": 298.75, "height_above_ground": 4.10},
#     #                 {"latitude": 48.932090, "longitude": 9.520873, "ground_elevation": 298.75, "height_above_ground": 4.10},
#     #                 {"latitude": 48.932063, "longitude": 9.520780, "ground_elevation": 298.75, "height_above_ground": 8.00}
#     #             ]
#     #         ],
#     #         "list_of_pv_area_information": [
#     #             {"azimuth": 59, "tilt": 38, "name": "Dachanlage 1"}
#     #         ],
#     #         "list_of_ops": [
#     #             {"latitude": 48.932100, "longitude": 9.521008, "ground_elevation": 301.00, "height_above_ground": 1.50}
#     #         ],
#     #         "utc": 1
#     #     }
#
#     # tag:str ||"tag": "string"
#     # tag: str =  Field(examples=["upper_edge","lower_edge"])
#


# Function to calculate azimuth angle between two coordinates
def calculate_azimuth(lat1, lon1, lat2, lon2):
    lat1 = math.radians(lat1)
    lat2 = math.radians(lat2)
    lon1 = math.radians(lon1)
    lon2 = math.radians(lon2)

    d_lon = lon2 - lon1

    x = math.sin(d_lon) * math.cos(lat2)
    y = math.cos(lat1) * math.sin(lat2) - (math.sin(lat1) * math.cos(lat2) * math.cos(d_lon))

    azimuth = math.atan2(x, y)
    azimuth = math.degrees(azimuth)
    azimuth = (azimuth + 360) % 360

    return azimuth


# Function to calculate the PV azimuth
def calculate_pv_azimuth(points):
    # Find points with the tag "upper_edge"
    upper_edges = [p for p in points if p.tag == "upper_edge"]

    # Ensure exactly two "upper_edge" points exist
    if len(upper_edges) != 2:
        raise ValueError("There must be exactly two points with the tag 'upper_edge'. and two with 'lower_edge' ")

    # Calculate the azimuth angle between the two "upper_edge" points
    edge_orientation = calculate_azimuth(upper_edges[0].lat, upper_edges[0].lon,
                                         upper_edges[1].lat, upper_edges[1].lon)

    # Calculate azimuths to the other points
    azimuths_to_other_points = []
    for point in points:
        if point.tag != "upper_edge":
            azimuth = calculate_azimuth(upper_edges[0].lat, upper_edges[0].lon, point.lat, point.lon)
            azimuths_to_other_points.append(azimuth)

    # Check if both azimuths are within the range of edge_orientation - 90°
    # (in code it is 95 to have a bit error tolerance if we dont have perfect 90° angles)
    # here it is important that the user is only allowed to draw rectangles (or lines)
    for azimuth in azimuths_to_other_points:
        diff = (azimuth - (edge_orientation - 95)) % 360
        if not (0 <= diff <= 180):
            return (edge_orientation + 90) % 360

    return (edge_orientation - 90) % 360


def remove_folder(folder_name):
    ''''''
    for file in glob.glob(folder_name + "/*"):
        os.remove(file)
    q = Path(folder_name)
    q.rmdir()

    # file_path = os.getcwd() + "/assets/" + file_name + '.pdf'
    # os.remove(file_path)
    # for ctr in range(0,len(list_of_ops)):
    #     file_path = os.getcwd() + '/assets/'+file_name+f'barchart{ctr+1}.png'
    #     os.remove(file_path)


# Example coordinates forming a rectangle

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"Solar": "Glare V 3.1"}


# @app.put("/items/{item_id}")
# async def update_item(item_id: int, item: Item, user: User):
#     results = {"item_id": item_id, "item": item, "user": user}
#     return results

@app.put("/azimuth/")
async def update_item(point1: Point, point2: Point, point3: Point, point4: Point):
    # point1 = Point(53.61591272, 9.98706581, 0, 0, "upper_edge")
    # point2 = Point(53.61589630, 9.98716121, 0, 0, "upper_edge")
    # point3 = Point(53.61583476, 9.98712882, 0, 0, "lower_edge")
    # point4 = Point(53.61585252, 9.98703871, 0, 0, "lower_edge")

    points = [point1, point2, point3, point4]

    # Calculate the PV Azimuth with the provided points
    try:
        pv_azimuth = calculate_pv_azimuth(points)
    except  Exception as e:
        print(e)
        return {"error": str(e), }

    return {"aziumth": pv_azimuth, }


@app.get("/elevation/")
async def update_item(lat: float, long: float):
    api_key = "AIzaSyCTXnohcGL0e0EIUr2v4jpEOOoDMKewEaM"  # os.environ.get("API_KEY", )

    reqUrl = "https://maps.googleapis.com/maps/api/elevation/json?locations=" + str(lat) + "%2C" + str(
        long) + "&key=" + api_key
    print(reqUrl)
    response = requests.get(reqUrl)

    # Calculate the PV Azimuth with the provided points

    return response.json(),


@app.post('/getPDFV1')
async def getPDF(payload: Any = Body(None)):
    """
    Create an item with all the information:

    - **name**: each item must have a name
    - **description**: a long description
    - **price**: required
    - **tax**: if the item doesn't have tax, you can omit this

    Example:

    ```
    {

        "identifier":"docId",
         "pv_areas": [
             [
                 {"latitude": 48.931985, "longitude": 9.520857, "ground_elevation": 298.75, "height_above_ground": 8.00},
                 {"latitude": 48.932009 	, "longitude": 9.520952, "ground_elevation": 298.75, "height_above_ground": 4.10},
                 {"latitude": 48.932090, "longitude": 9.520873, "ground_elevation": 298.75, "height_above_ground": 4.10},
                 {"latitude": 48.932063, "longitude": 9.520780, "ground_elevation": 298.75, "height_above_ground": 8.00}
             ]
         ],
         "list_of_pv_area_information": [
             {"azimuth": 59, "tilt": 38, "name": "Dachanlage 1"}
         ],
         "list_of_ops": [
             {"latitude": 48.932100, "longitude": 9.521008, "ground_elevation": 301.00, "height_above_ground": 1.50}
         ],
         "utc": 1
     }
    ```

    """

    glareFound = runScriptLocally(payload)

    if glareFound == False:
        return {"glareFound": False, "reportUrl": ""}

    file_name = (payload['identifier'])
    utc = str(payload['utc'])
    file_path = os.getcwd() + "/assets/" + file_name + '.pdf'

    addLogogo(file_path, file_name, len(payload['list_of_ops']))

    print(payload)

    string = uploadFileReturnUrl(file_name + '.pdf')
    # os.remove(file_path)
    remove_folder(file_name, payload['list_of_ops'])
    # return string
    return {"glareFound": True, "reportUrl": string}

    # return FileResponse(file_path, media_type='application/octet-stream', filename=file_name + '.pdf')


@app.post('/getPDF')
def getPDF(payload: GlareRequestModel):
    """
    Create an item with all the information:

    - **name**: each item must have a name
    - **description**: a long description
    - **price**: required
    - **tax**: if the item doesn't have tax, you can omit this

    Example:

    ```
  {
    "identifier": "cub175",
    "pv_areas": [
        [
        {"latitude": 53.665805, "longitude": 9.677020, "ground_elevation": 7, "height_above_ground": 15},
        {"latitude": 53.665645, "longitude": 9.677482, "ground_elevation": 7, "height_above_ground": 15},
        {"latitude": 53.665582, "longitude": 9.677417, "ground_elevation": 7, "height_above_ground": 10},
        {"latitude": 53.665741, "longitude": 9.676962, "ground_elevation": 7, "height_above_ground": 10}
        ]
    ],
    "list_of_pv_area_information": [
        {"azimuth": 208, "tilt": 20, "name": "PV Area 1"}
    ],
    "list_of_ops": [
        {"latitude": 53.666066, "longitude": 9.674732, "ground_elevation": 7, "height_above_ground": 2},
        {"latitude": 53.665756, "longitude": 9.675799, "ground_elevation": 7, "height_above_ground": 2}
    ],
    "excluded_areas": [],
    "meta_data": {
        "user_id": "123456789",
        "project_id": "123456789",
        "sim_id": "ZROTOWO57393",
        "timestamp": 1717787690,
        "utc": 1,
        "project_name": "Seitzinger"
    },
    "simulation_parameter": {
        "grid_width": 1,
        "resolution": "1min",
        "sun_elevation_threshold": 4,
        "beam_spread": 5,
        "sun_angle": 0.5,
        "sun_reflection_threshold": 10.5,
        "zoom_level": 20,
        "intensity_threshold": 30000,
        "module_type": 1
    }
    }
    ```

    """
    free_report_url = ""
    full_report_url = ""
    try:
        update_status(0.11, payload.meta_data.sim_id)
        timestamp = runScriptLocally(payload)

        free_report_file_path = os.getcwd() + "/assets/" + timestamp + f'/free_report.pdf'
        full_report_file_path = os.getcwd() + "/assets/" + timestamp + f'/full_report.pdf'

        thread_list = []

        free_report_file_path_firebase = queue.Queue()
        full_report_file_path_firebase = queue.Queue()
        update_status(0.83, payload.meta_data.sim_id)

        thread = threading.Thread(target=uploadFileReturnUrl,
                                  args=(payload, 'free', free_report_file_path, free_report_file_path_firebase))
        thread2 = threading.Thread(target=uploadFileReturnUrl,
                                   args=(payload, 'paid', full_report_file_path, full_report_file_path_firebase))

        thread_list.append(thread)
        thread.start()
        update_status(0.85, payload.meta_data.sim_id)
        thread_list.append(thread2)
        res = thread2.start()
        update_status(0.90, payload.meta_data.sim_id)
        thread.join()

        free_report_url = free_report_file_path_firebase.get()
        full_report_url = full_report_file_path_firebase.get()

        addUrlTodocument("paidReportUrl", payload.meta_data.sim_id, full_report_url)

        addUrlTodocument("reportUrl", payload.meta_data.sim_id, free_report_url)

        remove_folder(os.getcwd() + "/assets/" + timestamp)
        update_status(1.0, payload.meta_data.sim_id)

    except Exception:
        print(traceback.format_exc())

        update_status(-1.0, payload.meta_data.sim_id)

    return {"glareFound": True, "reportUrl": free_report_url, "paidReportUrl": full_report_url}


@app.post("/generate_reports")
async def generate_reports(payload: GlareRequestModel, background_tasks: BackgroundTasks):
    background_tasks.add_task(generate_reports_task, payload)
    return {"message": "Report generation started", "status": "Processing in background"}


@app.get("/check-pdf-processing")
async def check_if_pdf_processed(identifier: str):
    data = get_document_if_exists(document_id=identifier)
    if not data:
        return JSONResponse({
            "message": "Not Found.",
        }, 404)
    payload = {
        "glareFound": True,
        "reportUrl": data.get("fileUrl", {}).get("reportUrl"),
        "paidReportUrl": data.get("fileUrl", {}).get("paidReportUrl"),
    }
    return JSONResponse(payload)


def authenticate_user(db, username: str, password: str):
    ''''''
    # user = get_user(db, username)
    # if not user:
    #     return False
    # if not verify_password(password, user.hashed_password):
    #     return False
    #
    # return user


@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Incorrect username or password", headers={"WWW-Authenticate": "Bearer"})
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}


SECRET_KEY = "83daa0256a2289b0fb23693bf1f6034d44396675749244721a2b20e896e11662"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


async def get_current_user(token: str = Depends(oauth2_scheme)):
    return user


async def get_current_active_user(current_user: UserInDB = Depends(get_current_user)):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")

    return current_user



@app.get("/users/me/", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user
