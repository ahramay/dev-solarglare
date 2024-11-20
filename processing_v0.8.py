import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import matplotlib.patches as mpatches
from shapely.geometry import Polygon, Point as ShapelyPoint
from shapely.geometry import LineString
import pvlib
import matplotlib.colors as mcolors
from scipy.optimize import curve_fit
import datetime
import math
import requests
import os
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import Table, TableStyle, SimpleDocTemplate, Spacer, Paragraph, Image as ReportLabImage, PageBreak
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.pagesizes import A4
from PIL import Image, ImageFilter
import time
import warnings
from reportlab.pdfgen.canvas import Canvas
from shapely.geometry import Point, Polygon, MultiPolygon
from geopy.distance import distance
import geopy
from geopy.distance import geodesic
import json
from pyproj import CRS, Transformer
from multiprocessing import Pool, cpu_count, Value
from tqdm import tqdm

# Unterdrücke alle FutureWarnings
warnings.simplefilter(action='ignore', category=FutureWarning)

# Globale Variablen für das EPSG-Referenzsystem und die Transformer
global_epsg_code = None
global_transformer_to_local = None
global_transformer_to_wgs84 = None

def get_epsg_for_coordinates(latitude, longitude):
    """Bestimmt das passende EPSG-Referenzsystem basierend auf den gegebenen Koordinaten."""
    utm_zone = int((longitude + 180) // 6) + 1
    is_northern = latitude >= 0
    epsg_code = f"326{utm_zone}" if is_northern else f"327{utm_zone}"
    return epsg_code

def initialize_global_transformer(lat, lon):
    global global_transformer_to_local
    
    # Berechne den passenden EPSG-Code für die UTM-Zone
    epsg_code = get_epsg_for_coordinates(lat, lon)
    
    proj_wgs84 = 'epsg:4326'
    proj_local = f'epsg:{epsg_code}'  # Verwende den berechneten EPSG-Code für die lokale Projektion
    global_transformer_to_local = Transformer.from_crs(proj_wgs84, proj_local)

def transform_to_local_coordinates(points):
    if global_transformer_to_local is None:
        raise ValueError("global_transformer_to_local is not initialized")
    
    local_points = []
    for point in points:
        x, y = global_transformer_to_local.transform(point.latitude, point.longitude)
        # Speichern Sie ground_elevation und height_above_ground separat
        local_points.append((x, y, point.ground_elevation, point.height_above_ground))
        #print(point.ground_elevation)
    
    return local_points

def transform_to_wgs84_coordinates(x, y):
    lat, lon = global_transformer_to_wgs84.transform(x, y)
    return lat, lon

def generate_support_points(pv_area, num_points_per_edge):
    new_points = []
    for i in range(len(pv_area.points)):
        p1 = pv_area.points[i]
        p2 = pv_area.points[(i + 1) % len(pv_area.points)]

        line = LineString([(p1.longitude, p1.latitude), (p2.longitude, p2.latitude)])
        for j in range(num_points_per_edge + 1):
            point = line.interpolate(j / num_points_per_edge, normalized=True)
            
            # Übernehme ground_elevation vom ersten Punkt entlang der Kante
            new_point = MyPoint(
                latitude=point.y,
                longitude=point.x,
                ground_elevation=pv_area.points[1].ground_elevation,  # ground_elevation bleibt konstant entlang der Kante
                height_above_ground=0  # height_above_ground wird später berechnet
            )
            #print(pv_area.points[1].ground_elevation)
            new_points.append(new_point)
    return new_points


# Beispiel-Aufruf der Funktion
def preprocess_pv_areas_with_support_points(pv_areas, num_support_points=4):
    num_points_per_edge = num_support_points - 1  # 4 Punkte pro Kante bedeuten 3 zusätzliche Punkte zwischen den Eckpunkten
    for pv_area in pv_areas:
        pv_area.points = generate_support_points(pv_area, num_points_per_edge)
    return pv_areas

class MyPoint:
    def __init__(self, latitude, longitude, ground_elevation, height_above_ground):
        self.latitude = latitude
        self.longitude = longitude
        self.ground_elevation = ground_elevation
        self.height_above_ground = height_above_ground

    def __repr__(self):
        return (f"MyPoint(latitude={self.latitude}, longitude={self.longitude}, "
                f"ground_elevation={self.ground_elevation}, height_above_ground={self.height_above_ground})")


class PVArea:
    def __init__(self, points, azimuth, tilt, name):
        self.points = points
        self.azimuth = azimuth
        self.tilt = tilt
        self.name = name

    def __repr__(self):
        return (f"PVArea(name={self.name}, azimuth={self.azimuth}, tilt={self.tilt}, "
                f"points={self.points})")

class MetaData:
    def __init__(self, user_id, project_id, sim_id, timestamp, utc, project_name):
        self.user_id = user_id
        self.project_id = project_id
        self.sim_id = sim_id
        self.timestamp = timestamp
        self.utc = utc
        self.project_name = project_name

    def __repr__(self):
        return (f"MetaData(user_id={self.user_id}, project_id={self.project_id}, sim_id={self.sim_id}, "
                f"timestamp={self.timestamp}, utc={self.utc}, project_name={self.project_name})")

class SimulationParameter:
    def __init__(self, grid_width, resolution, sun_elevation_threshold, beam_spread, sun_angle, sun_reflection_threshold, zoom_level, intensity_threshold, module_type):
        self.grid_width = grid_width
        self.resolution = resolution
        self.sun_elevation_threshold = sun_elevation_threshold
        self.beam_spread = beam_spread
        self.sun_angle = sun_angle
        self.sun_reflection_threshold = sun_reflection_threshold
        self.zoom_level = zoom_level
        self.intensity_threshold = intensity_threshold  # Neues Feld
        self.module_type = module_type  # Neues Feld

    def __repr__(self):
        return (f"SimulationParameter(grid_width={self.grid_width}, resolution={self.resolution}, "
                f"sun_elevation_threshold={self.sun_elevation_threshold}, beam_spread={self.beam_spread}, "
                f"sun_angle={self.sun_angle}, sun_reflection_threshold={self.sun_reflection_threshold}, "
                f"zoom_level={self.zoom_level}, intensity_threshold={self.intensity_threshold}, "
                f"module_type={self.module_type})")  # Neues Feld in der Darstellung

def subtract_excluded_areas_from_pv_areas(pv_areas, excluded_areas):
    new_pv_areas = []
    for area in pv_areas:
        pv_polygon = Polygon([(point.longitude, point.latitude) for point in area.points])
        excluded_polygons = [Polygon([(point["longitude"], point["latitude"]) for point in excluded]) for excluded in excluded_areas]

        for excluded_polygon in excluded_polygons:
            pv_polygon = pv_polygon.difference(excluded_polygon)

        if isinstance(pv_polygon, MultiPolygon):
            for i, poly in enumerate(pv_polygon.geoms):
                new_points = []
                for lon, lat in poly.exterior.coords:
                    # Finde den nächsten ursprünglichen Punkt basierend auf der Distanz
                    original_point = min(area.points, key=lambda p: haversine(p.latitude, p.longitude, lat, lon))
                    new_points.append(MyPoint(lat, lon, original_point.ground_elevation, original_point.height_above_ground))
                new_pv_areas.append(PVArea(new_points, area.azimuth, area.tilt, f"{area.name}_{i+1}"))
                
                for interior in poly.interiors:
                    new_points = []
                    for lon, lat in interior.coords:
                        original_point = min(area.points, key=lambda p: haversine(p.latitude, p.longitude, lat, lon))
                        new_points.append(MyPoint(lat, lon, original_point.ground_elevation, original_point.height_above_ground))
                    new_pv_areas.append(PVArea(new_points, area.azimuth, area.tilt, f"{area.name}_{i+1} (interior excluded)"))
        elif isinstance(pv_polygon, Polygon):
            new_points = []
            for lon, lat in pv_polygon.exterior.coords:
                original_point = min(area.points, key=lambda p: haversine(p.latitude, p.longitude, lat, lon))
                new_points.append(MyPoint(lat, lon, original_point.ground_elevation, original_point.height_above_ground))
            new_pv_areas.append(PVArea(new_points, area.azimuth, area.tilt, area.name))
            
            for interior in pv_polygon.interiors:
                new_points = []
                for lon, lat in interior.coords:
                    original_point = min(area.points, key=lambda p: haversine(p.latitude, p.longitude, lat, lon))
                    new_points.append(MyPoint(lat, lon, original_point.ground_elevation, original_point.height_above_ground))
                new_pv_areas.append(PVArea(new_points, area.azimuth, area.tilt, f"{area.name} (interior excluded)"))

    return new_pv_areas

def parallelize_lines(p1, p2, p3, p4):
    local_original_points = transform_to_local_coordinates([p1, p2, p3, p4])
    
    x1, y1, _, _ = local_original_points[0]
    x2, y2, _, _ = local_original_points[1]
    x3, y3, _, _ = local_original_points[2]
    x4, y4, _, _ = local_original_points[3]
    
    dir_vec1 = (x2 - x1, y2 - y1)
    dir_vec2 = (x4 - x3, y4 - y3)
    
    cross_product = dir_vec1[0] * dir_vec2[1] - dir_vec1[1] * dir_vec2[0]
    if abs(cross_product) > 1e-6:
        x4 = x3 + dir_vec1[0]
        y4 = y3 + dir_vec1[1]
    
    return (x1, y1), (x2, y2), (x3, y3), (x4, y4)


def distance_between_parallel_lines(p1, p2, p3, p4):
    local_original_points = transform_to_local_coordinates([p1, p2, p3, p4])
    
    x1, y1, _, _ = local_original_points[0]
    x2, y2, _, _ = local_original_points[1]
    x3, y3, _, _ = local_original_points[2]
    x4, y4, _, _ = local_original_points[3]
    
    (x1, y1), (x2, y2), (x3, y3), (x4, y4) = parallelize_lines(p1, p2, p3, p4)
    
    dist = abs((y3 - y1) * (x2 - x1) - (x3 - x1) * (y2 - y1)) / math.sqrt((x2 - x1)**2 + (y2 - y1)**2)
    return dist


def interpolate_z_values_cartesian(original_points, new_points):
    local_original_points = transform_to_local_coordinates(original_points)
    
    # Debugging-Ausgabe, um die Werte zu überprüfen
    #print("Local Original Points after transformation:", local_original_points)
    
    x1, y1, z1_ground, z1_height = local_original_points[0]
    x2, y2, z2_ground, z2_height = local_original_points[1]
    x3, y3, z3_ground, z3_height = local_original_points[2]
    x4, y4, z4_ground, z4_height = local_original_points[3]
    
    d = distance_between_parallel_lines(original_points[0], original_points[1], original_points[2], original_points[3])
    delta_h = abs(z1_height - z3_height)
    
    local_new_points = []
    for point in new_points:
        x, y = global_transformer_to_local.transform(point.latitude, point.longitude)
        # Überprüfen, dass ground_elevation korrekt bleibt
        local_new_points.append((x, y, point.ground_elevation, point.height_above_ground))
        #print(point.ground_elevation)
    
    for i, (x, y, z_ground, z_height) in enumerate(local_new_points):
        pd = abs((y - y1) * (x2 - x1) - (x - x1) * (y2 - y1)) / math.sqrt((x2 - x1)**2 + (y2 - y1)**2)
        new_z_height = z1_height - pd * (delta_h / d)
        
        # Setze height_above_ground ohne ground_elevation zu summieren
        new_points[i].height_above_ground = new_z_height
        new_points[i].ground_elevation = z_ground  # Ground elevation bleibt unverändert
        #print(z_ground)

    return new_points









def interpolate_z_values_linear(original_area, new_area):
    #print(new_area)
    points = original_area.points

    if len(points) != 4:
        raise ValueError("PV areas must be defined by exactly 4 points.")

    heights = [(point.height_above_ground) for point in points]  # Nur Höhe über dem Boden

    pairs = {}
    for i in range(len(points)):
        for j in range(i + 1, len(points)):
            if heights[i] == heights[j]:
                pairs[i] = j

    if len(pairs) != 2:
        raise ValueError("Each pair of points must have the same height.")

    pair_indices = list(pairs.items())
    pair1 = (points[pair_indices[0][0]], points[pair_indices[0][1]])
    pair2 = (points[pair_indices[1][0]], points[pair_indices[1][1]])

    new_area.points = interpolate_z_values_cartesian([pair1[0], pair1[1], pair2[0], pair2[1]], new_area.points)

    return new_area



def preprocess_pv_areas(pv_areas, excluded_areas):
    new_pv_areas = subtract_excluded_areas_from_pv_areas(pv_areas, excluded_areas)
    processed_pv_areas = []
    for original_area in pv_areas:
        for new_area in new_pv_areas:
            if new_area.name == original_area.name or new_area.name.startswith(original_area.name):
                try:
                    processed_area = interpolate_z_values_linear(original_area, new_area)
                    processed_pv_areas.append(processed_area)
                except ValueError as e:
                    print(f"Error processing area {new_area.name}: {e}")
    #print(processed_pv_areas)
    return processed_pv_areas

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000  # Erdradius in Metern
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c

def calculate_azimuth(lat1, lon1, lat2, lon2):
    lat1 = math.radians(lat1)
    lon1 = math.radians(lon1)
    lat2 = math.radians(lat2)
    lon2 = math.radians(lon2)

    delta_lon = lon2 - lon1

    x = math.sin(delta_lon) * math.cos(lat2)
    y = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(delta_lon)

    initial_azimuth = math.atan2(x, y)
    initial_azimuth = math.degrees(initial_azimuth)
    compass_azimuth = (initial_azimuth + 360) % 360

    return compass_azimuth

def calculate_angles_and_distance(op, pv_areas):
    data = []

    for op_index, op_point in enumerate(op, start=1):
        for area in pv_areas:
            for point in area.points:
                distance = haversine(op_point.latitude, op_point.longitude, point.latitude, point.longitude)
                elevation_diff = point.height_above_ground - op_point.height_above_ground  # Nur Höhe über dem Boden
                elevation_angle = math.degrees(math.atan2(elevation_diff, distance))

                azimuth = calculate_azimuth(op_point.latitude, op_point.longitude, point.latitude, point.longitude)

                data.append([op_index, area.name, point.latitude, point.longitude, round(azimuth, 2), round(elevation_angle, 2)])

    return data


def calculate_reflection_direction(azimuth, elevation, panel_azimuth, panel_tilt):
    azimuth_rad = math.radians(azimuth)
    elevation_rad = math.radians(elevation)
    panel_azimuth_rad = math.radians(panel_azimuth)
    panel_tilt_rad = math.radians(panel_tilt)
    
    sun_vector = np.array([
        -math.cos(elevation_rad) * math.sin(azimuth_rad),
        -math.cos(elevation_rad) * math.cos(azimuth_rad),
        -math.sin(elevation_rad)
    ])
    
    panel_normal = np.array([
        math.sin(panel_tilt_rad) * math.sin(panel_azimuth_rad),
        math.sin(panel_tilt_rad) * math.cos(panel_azimuth_rad),
        math.cos(panel_tilt_rad)
    ])
    
    dot_product = np.dot(sun_vector, panel_normal)
    reflection_vector = sun_vector - 2 * dot_product * panel_normal
    
    reflected_elevation = math.asin(reflection_vector[2])
    reflected_azimuth = math.atan2(reflection_vector[0], reflection_vector[1])
    
    reflected_azimuth = math.degrees(reflected_azimuth) % 360
    reflected_elevation = math.degrees(reflected_elevation)
    
    return round(reflected_azimuth, 2), round(reflected_elevation, 2)

def calculate_incidence_angle(azimuth, elevation, panel_azimuth, panel_tilt):
    azimuth_rad = math.radians(azimuth)
    elevation_rad = math.radians(elevation)
    panel_azimuth_rad = math.radians(panel_azimuth)
    panel_tilt_rad = math.radians(panel_tilt)
    
    sun_vector = np.array([
        math.cos(elevation_rad) * math.sin(azimuth_rad),
        math.cos(elevation_rad) * math.cos(azimuth_rad),
        math.sin(elevation_rad)
    ])
    
    panel_normal = np.array([
        math.sin(panel_tilt_rad) * math.sin(panel_azimuth_rad),
        math.sin(panel_tilt_rad) * math.cos(panel_azimuth_rad),
        math.cos(panel_tilt_rad)
    ])
    
    incidence_angle_rad = math.acos(np.dot(sun_vector, panel_normal))
    incidence_angle = math.degrees(incidence_angle_rad)
    
    return round(incidence_angle, 2)

def generate_reflection_df(df_sun, pv_areas):
    pv_area_names = []
    timestamps = []
    sun_azimuths = []
    sun_elevations = []
    reflected_azimuths = []
    reflected_elevations = []
    inverse_azimuths = []
    inverse_elevations = []
    incidence_angles = []
    dnis = []

    sun_azimuth_arr = np.radians(df_sun['azimuth'].values)
    sun_elevation_arr = np.radians(df_sun['elevation'].values)
    dnis_arr = df_sun['dni'].values
    timestamps_arr = df_sun['timestamp'].values

    inv_sun_vectors = np.array([
        -np.cos(sun_elevation_arr) * np.sin(sun_azimuth_arr),
        -np.cos(sun_elevation_arr) * np.cos(sun_azimuth_arr),
        -np.sin(sun_elevation_arr)
    ]).T

    for pv_area in pv_areas:
        panel_azimuth_rad = np.radians(pv_area.azimuth)
        panel_tilt_rad = np.radians(pv_area.tilt)

        panel_normal = np.array([
            np.sin(panel_tilt_rad) * np.sin(panel_azimuth_rad),
            np.sin(panel_tilt_rad) * np.cos(panel_azimuth_rad),
            np.cos(panel_tilt_rad)
        ])

        dot_products = np.dot(inv_sun_vectors, panel_normal)

        reflection_vectors = inv_sun_vectors - 2 * dot_products[:, None] * panel_normal

        reflected_azimuths_arr = np.degrees(np.arctan2(reflection_vectors[:, 0], reflection_vectors[:, 1])) % 360
        reflected_elevations_arr = np.degrees(np.arcsin(reflection_vectors[:, 2]))

        cos_incidence_angles = np.clip(dot_products, -1.0, 1.0)
        incidence_angles_arr = np.degrees(np.arccos(cos_incidence_angles))

        inverse_azimuths_arr = (reflected_azimuths_arr + 180) % 360
        inverse_elevations_arr = -reflected_elevations_arr

        pv_area_names.extend([pv_area.name] * len(df_sun))
        timestamps.extend(timestamps_arr)
        sun_azimuths.extend(np.degrees(sun_azimuth_arr))
        sun_elevations.extend(np.degrees(sun_elevation_arr))
        reflected_azimuths.extend(reflected_azimuths_arr)
        reflected_elevations.extend(reflected_elevations_arr)
        inverse_azimuths.extend(inverse_azimuths_arr)
        inverse_elevations.extend(inverse_elevations_arr)
        incidence_angles.extend(incidence_angles_arr)
        dnis.extend(dnis_arr)

    df_reflection = pd.DataFrame({
        'PV Area Name': pv_area_names,
        'timestamp': timestamps,
        'Sun Azimuth': sun_azimuths,
        'Sun Elevation': sun_elevations,
        'Reflected Azimuth': reflected_azimuths,
        'Reflected Elevation': reflected_elevations,
        'Inverse Azimuth': inverse_azimuths,
        'Inverse Elevation': inverse_elevations,
        'Incidence Angle': incidence_angles,
        'DNI (W/m²)': dnis
    })

    return df_reflection

def calculate_geographical_point(origin, azimuth, distance_m):
    destination = geodesic(meters=distance_m).destination(origin, azimuth)
    return destination.latitude, destination.longitude

def generate_points_within_angles(df, w, excluded_areas, list_of_dps):
    df_calculation_points = pd.DataFrame(columns=['OP Number', 'PV Area Name', 'Azimuth Angle', 'Elevation Angle'])

    excluded_polygons = [Polygon([(point["longitude"], point["latitude"]) for point in area]) for area in excluded_areas]

    for op_number in df['OP Number'].unique():
        for pv_area_name in df['PV Area Name'].unique():
            subset = df[(df['OP Number'] == op_number) & (df['PV Area Name'] == pv_area_name)]
            if subset.empty:
                continue

            op_point = list_of_dps[op_number - 1]
            op_origin = geopy.Point(op_point.latitude, op_point.longitude)

            polygon_points = subset[['Azimuth Angle', 'Elevation Angle']].values
            polygon_points[:, 0] = np.mod(polygon_points[:, 0], 360)

            adjusted_polygon_points = []
            for i in range(len(polygon_points)):
                current_point = polygon_points[i]
                next_point = polygon_points[(i + 1) % len(polygon_points)]

                azimuth_diff = next_point[0] - current_point[0]
                if azimuth_diff > 180:
                    next_point[0] -= 360
                elif azimuth_diff < -180:
                    next_point[0] += 360

                adjusted_polygon_points.append(current_point)

            adjusted_polygon_points = np.array(adjusted_polygon_points)
            polygon = Polygon([(x[0], x[1]) for x in adjusted_polygon_points])

            min_x, min_y, max_x, max_y = polygon.bounds
            x_range = np.arange(min_x, max_x + w, w)
            y_range = np.arange(min_y, max_y + w, w)

            points = []
            for x in x_range:
                for y in y_range:
                    point = ShapelyPoint(x, y)
                    if polygon.contains(point) or polygon.touches(point):
                        points.append((x % 360, y))

            for i in range(len(adjusted_polygon_points)):
                start_point = adjusted_polygon_points[i]
                end_point = adjusted_polygon_points[(i + 1) % len(adjusted_polygon_points)]
                segment_length = np.linalg.norm(end_point - start_point)
                num_points = int(segment_length // w)
                for j in range(1, num_points + 1):
                    new_point = start_point + (end_point - start_point) * (j * w / segment_length)
                    points.append((new_point[0] % 360, new_point[1]))

            new_data = pd.DataFrame(points, columns=['Azimuth Angle', 'Elevation Angle'])

            def is_within_excluded_area(cp_azimuth, cp_elevation):
                for polygon in excluded_polygons:
                    distance = 10
                    lat, lon = calculate_geographical_point(op_origin, cp_azimuth, distance)
                    cp_point = ShapelyPoint(lon, lat)
                    if polygon.contains(cp_point):
                        return True
                return False

            new_data['excluded'] = new_data.apply(lambda row: is_within_excluded_area(row['Azimuth Angle'], row['Elevation Angle']), axis=1)

            new_data = new_data[new_data['excluded'] == False]

            new_data['OP Number'] = op_number
            new_data['PV Area Name'] = pv_area_name

            if not new_data.empty:
                df_calculation_points = pd.concat([df_calculation_points, new_data], ignore_index=True)

    df_calculation_points = df_calculation_points.round(2)
    df_calculation_points['number_of_hits'] = 0
    return df_calculation_points

def generate_sun_df(lat, lon, ground_elevation, timestamp, resolution='1min', sun_elevation_threshold=0):
    dt = datetime.datetime.fromtimestamp(timestamp)
    year = dt.year

    times = pd.date_range(start=f'{year}-01-01', end=f'{year}-12-31 23:59:59', freq=resolution, tz='UTC')

    location = pvlib.location.Location(lat, lon, 'UTC', ground_elevation)
    solpos = location.get_solarposition(times)
    dni = location.get_clearsky(times)['dni']

    df_sun = pd.DataFrame({
        'timestamp': times,
        'azimuth': solpos['azimuth'],
        'elevation': solpos['apparent_elevation'],
        'dni': dni
    })

    df_sun = df_sun[df_sun['elevation'] >= sun_elevation_threshold]
    df_sun.reset_index(drop=True, inplace=True)
    df_sun = df_sun.round(2)

    return df_sun

def calculate_angle_between_vectors(v1, v2):
    """Berechnet den Winkel zwischen zwei Vektoren in Grad."""
    dot_product = np.dot(v1, v2)
    magnitude_v1 = np.linalg.norm(v1)
    magnitude_v2 = np.linalg.norm(v2)
    angle_rad = np.arccos(dot_product / (magnitude_v1 * magnitude_v2))
    return np.degrees(angle_rad)


def process_reflection(i, ref_azimuth, ref_elevation, calc_azimuths, calc_elevations, threshold):
    glare_results = []
    
    # Berechne den Normalvektor der PV-Area
    pv_normal_vector = np.array([
        np.cos(ref_elevation) * np.cos(ref_azimuth),
        np.cos(ref_elevation) * np.sin(ref_azimuth),
        np.sin(ref_elevation)
    ])

    # Berechne den Vektor von CP zu OP für jeden Punkt
    cp_to_op_vectors = np.array([
        np.cos(calc_elevations) * np.cos(calc_azimuths),
        np.cos(calc_elevations) * np.sin(calc_azimuths),
        np.sin(calc_elevations)
    ]).T

    # Berechne den Winkel zwischen dem Vektor und der Flächennormalen
    dot_products = np.dot(cp_to_op_vectors, pv_normal_vector)
    angles_between = np.degrees(np.arccos(np.clip(dot_products, -1.0, 1.0)))

    # Filtere Reflexionen, wenn der Winkel größer als 89° ist
    valid_angles = angles_between <= 89.0

    if np.any(valid_angles):
        valid_indices = np.where(valid_angles)[0]

        # Berechne Differenzwinkel nur für gültige Punkte
        delta_azimuths = np.abs(calc_azimuths[valid_indices] - ref_azimuth)
        delta_azimuths = np.minimum(delta_azimuths, 2 * np.pi - delta_azimuths)
        delta_elevations = np.abs(calc_elevations[valid_indices] - ref_elevation)

        angle_diffs = np.sqrt(delta_azimuths**2 + delta_elevations**2)
        hits = angle_diffs <= threshold

        for calc_idx in valid_indices[hits]:
            glare_results.append((i, calc_idx))

    return glare_results

def generate_glare_results_efficient(df_reflection, df_calculation_points, beam_spread, sun_angle):
    glare_results_data = []

    threshold = np.radians((beam_spread + sun_angle) / 2)

    ref_azimuths = np.radians(df_reflection['Inverse Azimuth'].values)
    ref_elevations = np.radians(df_reflection['Inverse Elevation'].values)
    calc_azimuths = np.radians(df_calculation_points['Azimuth Angle'].values)
    calc_elevations = np.radians(df_calculation_points['Elevation Angle'].values)

    num_reflections = len(ref_azimuths)
    num_calc_points = len(calc_azimuths)

    # Verwende Multiprocessing-Pool
    with Pool(cpu_count()) as pool:
        results = pool.starmap(
            process_reflection, 
            [(i, ref_azimuths[i], ref_elevations[i], calc_azimuths, calc_elevations, threshold) for i in range(num_reflections)]
        )

    for result in results:
        for ref_idx, calc_idx in result:
            reflection_row = df_reflection.iloc[ref_idx]
            calc_row = df_calculation_points.iloc[calc_idx]

            glare_results_data.append([
                calc_row['OP Number'], reflection_row['PV Area Name'], reflection_row['timestamp'],
                reflection_row['DNI (W/m²)'], reflection_row['Incidence Angle'],
                reflection_row['Sun Azimuth'], reflection_row['Sun Elevation'],
                reflection_row['Reflected Azimuth'], reflection_row['Reflected Elevation'],
                reflection_row['Inverse Azimuth'], reflection_row['Inverse Elevation']
            ])
            df_calculation_points.at[calc_idx, 'number_of_hits'] += 1

    df_glare_results = pd.DataFrame(glare_results_data, columns=[
        'OP Number', 'PV Area Name', 'timestamp', 'DNI', 'Incidence Angle', 'Sun Azimuth',
        'Sun Elevation', 'Reflection Azimuth', 'Reflection Elevation', 'Inverse Azimuth', 'Inverse Elevation'
    ])

    df_glare_results = df_glare_results.round(2)
    return df_glare_results, df_calculation_points




def calculate_angle_difference_3d(azimuth1, elevation1, azimuth2, elevation2):
    azimuth1 = np.radians(azimuth1)
    elevation1 = np.radians(elevation1)
    azimuth2 = np.radians(azimuth2)
    elevation2 = np.radians(elevation2)
    
    x1 = np.cos(elevation1) * np.cos(azimuth1)
    y1 = np.cos(elevation1) * np.sin(azimuth1)
    z1 = np.sin(elevation1)
    
    x2 = np.cos(elevation2) * np.cos(azimuth2)
    y2 = np.cos(elevation2) * np.sin(azimuth2)
    z2 = np.sin(elevation2)
    
    dot_product = x1 * x2 + y1 * y2 + z1 * z2
    magnitude1 = np.sqrt(x1**2 + y1**2 + z1**2)
    magnitude2 = np.sqrt(x2**2 + y2**2 + z2**2)
    
    angle = np.arccos(dot_product / (magnitude1 * magnitude2))
    return np.degrees(angle)

def calculate_direct_irradiance_on_plane(dni, sun_elevation, sun_azimuth, panel_tilt, panel_azimuth):
    dni = np.array(dni)
    sun_elevation = np.array(sun_elevation)
    sun_azimuth = np.array(sun_azimuth)
    panel_tilt = np.radians(panel_tilt)
    panel_azimuth = np.radians(panel_azimuth)

    sun_elevation_rad = np.radians(sun_elevation)
    sun_azimuth_rad = np.radians(sun_azimuth)

    cos_incidence = (
        np.sin(sun_elevation_rad) * np.cos(panel_tilt) +
        np.cos(sun_elevation_rad) * np.sin(panel_tilt) * np.cos(sun_azimuth_rad - panel_azimuth)
    )

    di_plane = dni * cos_incidence

    return di_plane

def add_di_plane_to_glare_results(df_glare_results, pv_areas):
    di_plane_list = []

    for index, row in df_glare_results.iterrows():
        pv_area = next(area for area in pv_areas if area.name == row['PV Area Name'])

        di_plane = calculate_direct_irradiance_on_plane(
            row['DNI'], row['Sun Elevation'], row['Sun Azimuth'], pv_area.tilt, pv_area.azimuth
        )

        di_plane_list.append(round(di_plane, 2))

    df_glare_results['di_plane'] = di_plane_list

    return df_glare_results

def load_module_data(filename, module_type=1):
    df = pd.read_csv(filename)
    df_filtered = df[df['ModuleType'] == module_type]
    x = df_filtered['Time'].values
    y = df_filtered['Value'].values
    return x, y

def fit_polynomial(x, y, degree=4):
    coeffs = np.polyfit(x, y, degree)
    poly = np.poly1d(coeffs)
    return poly

def add_luminance_to_glare_results(df_glare_results, poly_func, lf=125):
    luminance_list = []

    for index, row in df_glare_results.iterrows():
        incidence_angle = row['Incidence Angle']
        di_plane = row['di_plane']
        luminance = poly_func(incidence_angle) * (di_plane * lf) / 100000
        luminance_list.append(round(luminance, 2))

    df_glare_results['Luminance'] = luminance_list
    return df_glare_results

def aggregate_glare_results(df_glare_results):
    def calculate_extents(group):
        min_inverse_azimuth = group['Inverse Azimuth'].min()
        max_inverse_azimuth = group['Inverse Azimuth'].max()
        min_inverse_elevation = group['Inverse Elevation'].min()
        max_inverse_elevation = group['Inverse Elevation'].max()
        azimuth_extent = max_inverse_azimuth - min_inverse_azimuth
        elevation_extent = max_inverse_elevation - min_inverse_elevation
        return pd.Series({
            'DNI': group['DNI'].mean(),
            'Incidence Angle': group['Incidence Angle'].mean(),
            'Sun Azimuth': group['Sun Azimuth'].mean(),
            'Sun Elevation': group['Sun Elevation'].mean(),
            'Reflection Azimuth': group['Reflection Azimuth'].mean(),
            'Reflection Elevation': group['Reflection Elevation'].mean(),
            'Inverse Azimuth': group['Inverse Azimuth'].mean(),
            'Inverse Elevation': group['Inverse Elevation'].mean(),
            'di_plane': group['di_plane'].mean(),
            'Luminance': group['Luminance'].mean(),
            'Max Elevation Extent': elevation_extent,
            'Max Azimuth Extent': azimuth_extent
        })

    df_aggregated = df_glare_results.groupby(['OP Number', 'PV Area Name', 'timestamp'], as_index=False).apply(calculate_extents, include_groups=False).reset_index(drop=True)
    return df_aggregated

def check_reflection_angle_threshold(df_glare_results, sun_reflection_threshold):
    df_glare_results['Within_Threshold'] = df_glare_results.apply(
        lambda row: calculate_angle_difference_3d(row['Sun Azimuth'], row['Sun Elevation'], row['Inverse Azimuth'], row['Inverse Elevation']) <= sun_reflection_threshold,
        axis=1
    )

    return df_glare_results

def calculate_center_and_zoom(pv_areas, ops, buffer=0.0005):
    latitudes = [point.latitude for area in pv_areas for point in area.points] + [op.latitude for op in ops]
    longitudes = [point.longitude for area in pv_areas for point in area.points] + [op.longitude for op in ops]

    # Berechne den Mittelpunkt der Karte
    center_lat = sum(latitudes) / len(latitudes)
    center_lng = sum(longitudes) / len(longitudes)

    # Berechne die maximale Differenz der Koordinaten und füge einen kleinen Puffer hinzu
    max_lat_diff = max(latitudes) - min(latitudes) + 2 * buffer
    max_lng_diff = max(longitudes) - min(longitudes) + 2 * buffer
    max_diff = max(max_lat_diff, max_lng_diff)
    
    # Präzisiere die Zoom-Berechnung, um die Karte genau richtig einzustellen
    zoom = (math.floor(8.5 - math.log(max_diff) / math.log(2))) + 1  # Feinerer Zoom-Level
    if zoom > 20:
        zoom = 20

    return center_lat, center_lng, zoom



def generate_static_map_with_polygons(pv_areas, ops, api_key, output_dir, map_type="satellite", image_size="1280x1280", excluded_areas=[]):
    os.makedirs(output_dir, exist_ok=True)

    center_lat, center_lng, zoom = calculate_center_and_zoom(pv_areas, ops)

    base_url = "https://maps.googleapis.com/maps/api/staticmap?"

    markers = []
    for i, op in enumerate(ops, start=1):
        marker = f"color:red|label:{i}|{op.latitude},{op.longitude}"
        markers.append(marker)

    polygons = []
    for pv_area in pv_areas:
        path = "|".join(f"{point.latitude},{point.longitude}" for point in pv_area.points)
        first_point = f"{pv_area.points[0].latitude},{pv_area.points[0].longitude}"
        polygon = f"path=color:0x0000ff|weight:2|fillcolor:0x66b3ff33|{path}|{first_point}"
        polygons.append(polygon)

    for area in excluded_areas:
        path = "|".join(f"{point['latitude']},{point['longitude']}" for point in area)
        first_point = f"{area[0]['latitude']},{area[0]['longitude']}"
        polygon = f"path=color:0xffff00|weight:2|fillcolor:0xffffff00|{path}|{first_point}"
        polygons.append(polygon)

    markers_str = "&".join([f"markers={marker}" for marker in markers])
    polygons_str = "&".join(polygons)

    map_url = (f"{base_url}center={center_lat},{center_lng}&zoom={zoom}&size={image_size}"
               f"&maptype={map_type}&{markers_str}&{polygons_str}&key={api_key}")

    response = requests.get(map_url)
    if response.status_code == 200:
        image_path = os.path.join(output_dir, 'pv_area_map.jpeg')
        with open(image_path, 'wb') as file:
            file.write(response.content)
        #print(f"Map image saved to {image_path}")
    else:
        print(f"Failed to retrieve map image. Status code: {response.status_code}")

def save_image(image, image_path, dpi=300):
    for _ in range(3):
        try:
            if isinstance(image, plt.Figure):
                image.savefig(image_path, dpi=dpi)
            elif isinstance(image, Image.Image):
                if image.mode != "RGB":
                    image = image.convert("RGB")
                image.save(image_path, dpi=(dpi, dpi))
            
            if os.path.exists(image_path):
                with Image.open(image_path) as img:
                    img.verify()
                #print(f"Bild erfolgreich gespeichert unter: {image_path}")
                return True
        except Exception as e:
            print(f"Fehler beim Speichern des Bildes {image_path}: {e}")
    print(f"Konnte das Bild nach 3 Versuchen nicht speichern: {image_path}")
    return False

def resize_image(image_path, max_width=5*inch, max_height=5*inch / (16/10)):
    try:
        with Image.open(image_path) as img:
            aspect_ratio = img.width / img.height
            max_height = max_width / aspect_ratio
            img.thumbnail((max_width, max_height), Image.LANCZOS)
            resized_path = os.path.join(os.path.dirname(image_path), f"resized_{os.path.basename(image_path)}")
            if save_image(img, resized_path):
                return resized_path
            else:
                return None
    except Exception as e:
        print(f"Error resizing image {image_path}: {e}")
        return None

def blur_image(image_path, blur_radius=35):
    for _ in range(3):
        try:
            with Image.open(image_path) as img:
                img.load()
                img_blurred = img.filter(ImageFilter.GaussianBlur(blur_radius))
                blur_path = os.path.join(os.path.dirname(image_path), f"blur_{os.path.basename(image_path)}")
                img_blurred.save(blur_path)
                return blur_path
        except (OSError, IOError, SyntaxError) as e:
            print(f"Error processing image {image_path}: {e}")
    return None

def generate_and_save_plots(df_pv_area_cornerpoints, df_calculation_points_results, output_dir):
    os.makedirs(output_dir, exist_ok=True)

    def adjust_azimuths(points):
        adjusted_points = []
        for i in range(len(points)):
            current_point = points[i]
            next_point = points[(i + 1) % len(points)]
            azimuth_diff = next_point[0] - current_point[0]
            if (next_point[0] - current_point[0]) > 180:
                next_point[0] -= 360
            elif (current_point[0] - next_point[0]) > 180:
                next_point[0] += 360
            adjusted_points.append(current_point)
        return np.array(adjusted_points)
    
    def transform_azimuth(azimuth):
        return (azimuth + 180) % 360 - 180
    
    for dp_number in df_pv_area_cornerpoints['OP Number'].unique():
        fig, ax = plt.subplots(figsize=(16, 9))
        dp_points_results = df_calculation_points_results[
            df_calculation_points_results['OP Number'] == dp_number
        ]
        
        vmin = 0
        vmax = dp_points_results['number_of_hits'].max()
        if vmax <= vmin:
            vmax = vmin + 1

        norm = mcolors.TwoSlopeNorm(vmin=vmin, vcenter=(vmin + vmax) / 2, vmax=vmax)
        cmap = plt.cm.inferno

        for pv_area_name in df_pv_area_cornerpoints['PV Area Name'].unique():
            pv_area_points_dp = df_pv_area_cornerpoints[
                (df_pv_area_cornerpoints['OP Number'] == dp_number) & 
                (df_pv_area_cornerpoints['PV Area Name'] == pv_area_name)
            ]
            if pv_area_points_dp.empty:
                continue
            
            azimuth_angles_dp = pv_area_points_dp['Azimuth Angle'].apply(transform_azimuth).tolist()
            elevation_angles_dp = pv_area_points_dp['Elevation Angle'].tolist()
            
            polygon_points = np.array(list(zip(azimuth_angles_dp, elevation_angles_dp)))
            adjusted_polygon_points = adjust_azimuths(polygon_points)
            
            azimuth_angles_dp = adjusted_polygon_points[:, 0].tolist() + [adjusted_polygon_points[0, 0]]
            elevation_angles_dp = adjusted_polygon_points[:, 1].tolist() + [adjusted_polygon_points[0, 1]]
            
            ax.plot(azimuth_angles_dp, elevation_angles_dp, color='black', linestyle='-', linewidth=3, zorder=1)
            
            # Dynamische Positionierung der Beschriftung
            center_x = np.mean(adjusted_polygon_points[:, 0])
            center_y = np.mean(adjusted_polygon_points[:, 1])
            offset_x = 30 if center_x + 30 < ax.get_xlim()[1] else -30  # Vermeide Überlagerung mit den Plot-Rändern
            offset_y = 30 if center_y + 30 < ax.get_ylim()[1] else -30
            
            ax.annotate(
                pv_area_name, xy=(center_x, center_y), xytext=(center_x + offset_x, center_y + offset_y),
                arrowprops=dict(facecolor='green', arrowstyle='->', linewidth=2), fontsize=16, color='black', 
                bbox=dict(boxstyle="round,pad=0.3", edgecolor="white", facecolor="white", linewidth=0.5),
                zorder=2
            )

        sc = ax.scatter(
            dp_points_results['Azimuth Angle'].apply(transform_azimuth),
            dp_points_results['Elevation Angle'],
            c=dp_points_results['number_of_hits'],
            cmap=cmap,
            norm=norm,
            s=4,
            zorder=3,
            marker='s'
        )
        plt.colorbar(sc, ax=ax, label='Minutes of Glare per Year')
        ax.set_xlim(-180, 180)
        ax.set_ylim(-90, 90)
        ax.set_xticks(np.arange(-180, 181, 30))
        ax.set_xlabel('Azimuth Angle (°) (0° = North, ±180° = South)')
        ax.set_ylabel('Elevation Angle (°)')
        ax.set_title(f'Perspective from DP {dp_number} onto the PV Areas - Including Glare Amount')
        ax.grid(True, linestyle='--', linewidth=0.5, zorder=0)
        
        ax.axvline(x=0, color='k', linestyle='--', linewidth=0.5, zorder=0)
        ax.axvline(x=90, color='k', linestyle='--', linewidth=0.5, zorder=0)
        ax.axvline(x=-90, color='k', linestyle='--', linewidth=0.5, zorder=0)
        ax.text(0, -100, 'North', horizontalalignment='center', verticalalignment='top', zorder=0)
        ax.text(90, -100, 'East', horizontalalignment='center', verticalalignment='top', zorder=0)
        ax.text(-90, -100, 'West', horizontalalignment='center', verticalalignment='top', zorder=0)
        ax.text(180, -100, 'South', horizontalalignment='center', verticalalignment='top', zorder=0)
        ax.text(-180, -100, 'South', horizontalalignment='center', verticalalignment='top', zorder=0)

        ax.xaxis.labelpad = 20
        ax.yaxis.labelpad = 20

        fig.tight_layout()
        
        image_path = os.path.join(output_dir, f'reflecting_pv_area_dp_{dp_number}.png')
        if save_image(fig, image_path):
            blur_image(image_path)
        plt.close()


def plot_glare_data(df_aggregated, output_dir, timestamp, list_of_dps, utc_offset, intensity_threshold):
    os.makedirs(output_dir, exist_ok=True)
    
    year = pd.to_datetime(timestamp, unit='s').year
    df_aggregated['Date'] = pd.to_datetime(df_aggregated['timestamp']).dt.date
    df_aggregated['Time'] = pd.to_datetime(df_aggregated['timestamp']).dt.hour + pd.to_datetime(df_aggregated['timestamp']).dt.minute / 60.0

    utc_offset_str = f"UTC {utc_offset:+d}"

    for index, dp in enumerate(list_of_dps):
        op_number = index + 1
        df_op = df_aggregated[df_aggregated['OP Number'] == op_number].copy()

        fig, ax = plt.subplots(figsize=(16, 10))
        if df_op.empty:
            ax.scatter([], [], color='yellow', label='Glare Occurrence')
            ax.scatter([], [], color='gray', label='Superimposed by Sun and/or Intensity below Threshold')
        else:
            # Hinzufügen einer neuen Spalte, die sowohl Superimposition durch die Sonne als auch geringe Intensität berücksichtigt
            df_op['Superimposed'] = df_op.apply(
                lambda row: row['Within_Threshold'] or row['Luminance'] < intensity_threshold, axis=1)

            # Graue Punkte zuerst zeichnen
            subset_gray = df_op[df_op['Superimposed'] == True]
            ax.scatter(subset_gray['Date'], subset_gray['Time'], color='gray', label='Superimposed by Sun and/or Intensity below Threshold', s=5)

            # Gelbe Punkte danach zeichnen, damit sie immer oben liegen
            subset_yellow = df_op[df_op['Superimposed'] == False]
            ax.scatter(subset_yellow['Date'], subset_yellow['Time'], color='yellow', label='Glare Occurrence', s=5)

        ax.xaxis.set_major_locator(mdates.MonthLocator())
        ax.xaxis.set_major_formatter(mdates.DateFormatter('%b'))
        ax.set_xlim(pd.Timestamp(f'{year}-01-01'), pd.Timestamp(f'{year}-12-31'))
        ax.set_ylim(0, 24)
        ax.set_yticks(np.arange(0, 25, 1))
        ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{int(x):02d}:00'))
        ax.set_xlabel('Date')
        ax.set_ylabel(f'Time of Day (HH:MM in {utc_offset_str})')
        ax.set_title(f'Glare Periods for DP {op_number}')
        
        legend = ax.legend()
        for handle in legend.legendHandles:
            handle._sizes = [30] 

        ax.grid(True, linestyle='--', linewidth=0.5)
        fig.tight_layout()
        image_path = os.path.join(output_dir, f'glare_periods_dp_{op_number}.png')
        if save_image(fig, image_path):
            blur_image(image_path)
        plt.close()

        # Glare Duration Plot
        fig, ax = plt.subplots(figsize=(16, 10))
        if df_op.empty:
            ax.set_ylim(0, 100)
            ax.set_xlabel('Date')
            ax.set_ylabel('Minutes per Day')
            ax.set_title(f'Glare Duration per Day for DP {op_number}')
            ax.xaxis.set_major_locator(mdates.MonthLocator())
            ax.xaxis.set_major_formatter(mdates.DateFormatter('%b'))
            ax.set_xlim(pd.Timestamp(f'{year}-01-01'), pd.Timestamp(f'{year}-12-31'))
            ax.grid(True, linestyle='--', linewidth=0.5)
        else:
            df_op.loc[:, 'Day'] = pd.to_datetime(df_op['timestamp']).dt.date
            glare_duration = df_op.groupby(['Day', 'Superimposed']).size().unstack(fill_value=0)
            superimposed = glare_duration[True] if True in glare_duration.columns else pd.Series(0, index=glare_duration.index)
            glare_occurrence = glare_duration[False] if False in glare_duration.columns else pd.Series(0, index=glare_duration.index)
            ax.bar(glare_duration.index, glare_occurrence, label='Glare Occurrence', color='yellow')
            ax.bar(glare_duration.index, superimposed, bottom=glare_occurrence, label='Superimposed by Sun and/or Intensity below Threshold', color='gray')
            ax.xaxis.set_major_locator(mdates.MonthLocator())
            ax.xaxis.set_major_formatter(mdates.DateFormatter('%b'))
            ax.set_xlim(pd.Timestamp(f'{year}-01-01'), pd.Timestamp(f'{year}-12-31'))
            ax.set_ylim(0, max(glare_duration.sum(axis=1).max(), 100))
            ax.set_xlabel('Date')
            ax.set_ylabel('Minutes per Day')
            ax.legend()
            ax.grid(True, linestyle='--', linewidth=0.5)

        fig.tight_layout()
        ax.set_title(f'Glare Duration per Day for DP {op_number}')
        image_path = os.path.join(output_dir, f'glare_duration_dp_{op_number}.png')
        if save_image(fig, image_path):
            blur_image(image_path)
        plt.close()


def classify_glare_impact(max_glare_per_day, glare_per_year):
    if max_glare_per_day <= 30 and glare_per_year <= 1800:
        return "Green", "No/Minor Glare"
    elif (
        (30 < max_glare_per_day <= 60 and glare_per_year <= 3000) or 
        (60 < max_glare_per_day <= 120 and glare_per_year <= 3000)
    ):
        return "Yellow", "Moderate Glare"
    else:
        return "Red", "Severe Glare"

def generate_summary(df_aggregated, list_of_dps):
    summary_data = []

    df_filtered = df_aggregated[df_aggregated['Within_Threshold'] == False].copy()

    for op in list_of_dps:
        op_number = list_of_dps.index(op) + 1
        df_op = df_filtered[df_filtered['OP Number'] == op_number].copy()

        if df_op.empty:
            max_glare_per_day = 0
            glare_per_year = 0
            days_with_relevant_glare = 0
        else:
            glare_per_year = df_op.shape[0]

            df_op['Day'] = pd.to_datetime(df_op['timestamp']).dt.date
            glare_per_day = df_op.groupby('Day').size()
            max_glare_per_day = glare_per_day.max()

            days_with_relevant_glare = glare_per_day[glare_per_day > 0].count()

        impact_color, impact_level = classify_glare_impact(max_glare_per_day, glare_per_year)

        summary_data.append({
            'OP Number': op_number,
            'Max. Glare per Day': max_glare_per_day,
            'Glare per Year': glare_per_year,
            'Days with Glare': days_with_relevant_glare,
            'Impact Level': impact_level,
            'Impact Color': impact_color
        })

    df_summary = pd.DataFrame(summary_data)
    
    return df_summary

def plot_glare_intensity_with_continuous_colorbar(df_aggregated, output_dir, timestamp, list_of_dps, utc_offset):
    os.makedirs(output_dir, exist_ok=True)

    year = pd.to_datetime(timestamp, unit='s').year
    
    df_aggregated['Date'] = pd.to_datetime(df_aggregated['timestamp']).dt.date
    df_aggregated['Time'] = pd.to_datetime(df_aggregated['timestamp']).dt.hour + pd.to_datetime(df_aggregated['timestamp']).dt.minute / 60.0

    df_max_luminance = df_aggregated.loc[df_aggregated.groupby(['OP Number', 'timestamp'])['Luminance'].idxmax()]

    utc_offset_str = f"UTC {utc_offset:+d}"

    cmap = plt.cm.RdYlGn_r
    norm = plt.Normalize(vmin=0, vmax=100000)

    for index, dp in enumerate(list_of_dps):
        op_number = index + 1
        df_op = df_max_luminance[df_max_luminance['OP Number'] == op_number]

        fig, ax = plt.subplots(figsize=(16, 10))
        sc = None
        if not df_op.empty:
            sc = ax.scatter(df_op['Date'], df_op['Time'], c=df_op['Luminance'], cmap=cmap, norm=norm, s=5)

        ax.xaxis.set_major_locator(mdates.MonthLocator())
        ax.xaxis.set_major_formatter(mdates.DateFormatter('%b'))
        ax.set_xlim(pd.Timestamp(f'{year}-01-01'), pd.Timestamp(f'{year}-12-31'))
        ax.set_ylim(0, 24)
        ax.set_yticks(np.arange(0, 25, 1))
        ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{int(x):02d}:00'))
        ax.set_xlabel('Date')
        ax.set_ylabel(f'Time of Day (HH:MM in {utc_offset_str})')
        ax.set_title(f'Glare Intensity for DP {op_number}')
        if sc is not None:
            cbar = fig.colorbar(sc, ax=ax, label='Luminance (cd/m²)')
            cbar.set_ticks([0, 25000, 50000, 75000, 100000])
            cbar.set_ticklabels(['0', '25.000', '50.000', '75.000', '≥ 100.000'])
        ax.grid(True, linestyle='--', linewidth=0.5)
        fig.tight_layout()
        image_path = os.path.join(output_dir, f'glare_intensity_dp_{op_number}.png')
        if save_image(fig, image_path):
            blur_image(image_path)
        plt.close()

def save_aggregated_to_excel(df_aggregated, output_dir, file_name='aggregated_glare_results.xlsx'):
    os.makedirs(output_dir, exist_ok=True)
    
    for col in df_aggregated.columns:
        if pd.api.types.is_datetime64_any_dtype(df_aggregated[col]):
            if df_aggregated[col].dt.tz is not None:
                df_aggregated[col] = df_aggregated[col].dt.tz_localize(None)
    
    file_path = os.path.join(output_dir, file_name)
    
    df_aggregated.to_excel(file_path, index=False)
    print(f'DataFrame saved to {file_path}')

def add_page_number(canvas, doc):
    page_num = canvas.getPageNumber()
    text = f"Page {page_num}"
    canvas.setFont('Helvetica', 8)
    canvas.drawCentredString(A4[0] / 2.0, 0.5 * inch, text)
    header_text = f"PV-GlareCheck.com | Simulation Report | {canvas.meta_data.project_name}"
    canvas.drawCentredString(A4[0] / 2.0, A4[1] - 0.5 * inch, header_text)

class MyDocTemplate(SimpleDocTemplate):
    def __init__(self, filename, **kwargs):
        self.toc_entries = []
        super().__init__(filename, **kwargs)

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph):
            style_name = flowable.style.name
            if style_name in ["HeadingStyle"]:
                self.notify('TOCEntry', (1, flowable.getPlainText(), self.page))


class MyDocTemplate(SimpleDocTemplate):
    def __init__(self, filename, **kwargs):
        self.toc_entries = []
        super().__init__(filename, **kwargs)

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph):
            style_name = flowable.style.name
            if style_name in ["HeadingStyle"]:
                self.notify('TOCEntry', (1, flowable.getPlainText(), self.page))

class CustomCanvas(Canvas):
    def __init__(self, *args, **kwargs):
        self.meta_data = kwargs.pop('meta_data', None)
        super().__init__(*args, **kwargs)

    def showPage(self):
        self.draw_header_footer()
        super().showPage()

    def save(self):
        self.draw_header_footer()
        super().save()

    def draw_header_footer(self):
        # Draw header
        header_text = f"PV-GlareCheck.com | Simulation Report | {self.meta_data.project_name}"
        self.setFont('Helvetica', 8)
        self.drawCentredString(A4[0] / 2.0, A4[1] - 0.5 * inch, header_text)

        # Draw footer
        page_num = self.getPageNumber()
        footer_text = f"Page {page_num}"
        self.drawCentredString(A4[0] / 2.0, 0.5 * inch, footer_text)

def generate_reports(df_aggregated, output_dir, list_of_dps, meta_data, simulation_parameter, pv_areas):
    styles = getSampleStyleSheet()

    # Style für Blocksatz definieren und hinzufügen
    blockjustify_style = ParagraphStyle(
        name='BlockJustify',
        parent=styles['Normal'],
        alignment=4  # Blocksatz
    )

    # TitleStyle hinzufügen
    styles.add(ParagraphStyle(name='TitleStyle', fontSize=24, leading=28, spaceAfter=20, alignment=TA_CENTER, textColor=colors.darkblue))

    # Weitere notwendige Stile hinzufügen
    styles.add(ParagraphStyle(name='HeadingStyle', fontSize=18, leading=22, spaceAfter=15, alignment=0, textColor=colors.black))
    styles.add(ParagraphStyle(name='SubHeadingStyle', fontSize=14, leading=18, spaceAfter=10, alignment=TA_CENTER, textColor=colors.darkblue))
    styles.add(ParagraphStyle(name='CaptionStyle', fontSize=10, leading=12, spaceAfter=6, alignment=TA_CENTER, textColor=colors.black, italic=True))
    styles.add(blockjustify_style)

    # Bestehenden 'Normal'-Stil anpassen
    normal_style = styles['Normal']
    normal_style.alignment = 0

    styles.add(ParagraphStyle(name='MetaStyle', fontSize=10, leading=12, spaceAfter=10, alignment=0))

    def create_document(report_type):
        doc_name = os.path.join(output_dir, f'{report_type}_report.pdf')
        doc = MyDocTemplate(doc_name, pagesize=A4, rightMargin=inch, leftMargin=inch, topMargin=inch, bottomMargin=inch)

        elements = []

        # Title page
        logo_path = os.path.join('assets', 'logo_v1.png')
        elements.append(Spacer(1, 1 * inch))

        with Image.open(logo_path) as img:
            width, height = img.size
            aspect_ratio = height / width
        max_width = 4 * inch
        img_width = max_width
        img_height = max_width * aspect_ratio

        elements.append(ReportLabImage(logo_path, width=img_width, height=img_height))
        elements.append(Spacer(1, 0.5 * inch))
        elements.append(Paragraph("Glare Simulation Report", styles['TitleStyle']))
        elements.append(Paragraph(meta_data.project_name, styles['TitleStyle']))
        elements.append(Spacer(1, 1 * inch))
        elements.append(Paragraph(f"Full Report: All details are visible" if report_type == 'full' else "Free Report: Some details are not visible - please purchase full report on PV-GlareCheck.com in order to see all details", styles['SubHeadingStyle']))
        elements.append(Spacer(1, 1 * inch))
        elements.append(Paragraph(f"User ID: {meta_data.user_id}", styles['MetaStyle']))
        elements.append(Paragraph(f"Project ID: {meta_data.project_id}", styles['MetaStyle']))
        elements.append(Paragraph(f"Simulation ID: {meta_data.sim_id}", styles['MetaStyle']))
        elements.append(Paragraph(f"Timestamp: {datetime.datetime.fromtimestamp(meta_data.timestamp)}", styles['MetaStyle']))
        elements.append(PageBreak())

        # Kapitel 1: Übersichtskarte
        elements.append(Paragraph("1. Overview Map".title(), styles['HeadingStyle']))
        elements.append(Paragraph("Figure 1: Overview Map Showing PV Areas and Detection Points.".title(), styles['CaptionStyle']))
        map_image_path = os.path.join(output_dir, 'pv_area_map.jpeg')
        elements.append(ReportLabImage(map_image_path, 6 * inch, 6 * inch))
        elements.append(Spacer(1, 12))
        elements.append(PageBreak())
        
        # Kapitel 2: Simulationsparameter
        elements.append(Paragraph("2. Simulation Parameters".title(), styles['HeadingStyle']))
        elements.append(Paragraph("Table 1: Simulation Parameters Used in the Glare Analysis.".title(), styles['CaptionStyle']))

        # Übersetzung des Modultyps
        module_type_description = "Standard Module\nwith ARC" if simulation_parameter.module_type == 1 else f"Custom Module Type ({simulation_parameter.module_type})"

        sim_params_data = [
            ['Parameter', 'Value', 'Description'],
            ['Resolution', simulation_parameter.resolution, 'Time resolution for simulations.'],
            ['Sun Elevation\nThreshold', f"{simulation_parameter.sun_elevation_threshold}°", 'Minimum sun elevation angle for calculating glare.'],
            ['Beam Spread', f"{simulation_parameter.beam_spread}°", 'Spread of the reflected beam.'],
            ['Sun Angle', f"{simulation_parameter.sun_angle}°", 'Describes the visible sun size (diameter).'],
            ['Sun Reflection\nThreshold', f"{simulation_parameter.sun_reflection_threshold}°", 'This parameter defines the limit for the difference angle\nbetween direct sunlight and reflection.\n If the angle is smaller/equal than the threshold, the sun is\nconsidered to superimpose the reflection (glare),\nmaking it irrelevant.'],
            ['Intensity Threshold', f"{simulation_parameter.intensity_threshold} cd/m²", 'Minimum luminance threshold\nfor glare to be considered relevant.'],
            ['Module Type', module_type_description, 'Specifies the type of module used in the simulation,\ndetermining the reflection profile.']  # Hinzufügen des Modultyps
        ]

        sim_params_table = Table(sim_params_data, colWidths=[doc.width * 0.2, doc.width * 0.2, doc.width * 0.6])
        sim_params_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))

        elements.append(sim_params_table)
        elements.append(PageBreak())

        elements.append(Paragraph("3. Evaluation of Results", styles['HeadingStyle']))
        elements.append(Paragraph(
            "In this evaluation, we refer to the German guideline by the Bund/Länder-Arbeitsgemeinschaft für Immissionsschutz (LAI), "
            "the Austrian OVE-Richtlinie R 11-3 (2016), and the Swiss guideline\n'Leitfaden zum Melde- und Bewilligungsverfahren für Solaranlagen' for PV systems by Swissolar. "
            "We introduce a traffic light system to assess the impact of glare effects based on these guidelines. "
            "The guidelines' limits only apply if the respective DP represents a protected area. Protected areas include,\nfor example, living rooms, offices, bedrooms, workspaces, balconies, and terraces. Non-protected areas include,\nfor example, storage halls, garages, gardens (away from terraces), bathrooms, etc.", styles['BlockJustify']))
        elements.append(Spacer(1, 12))

        elements.append(Paragraph(
            "The following table explains the traffic light system:", styles['Normal']))

        traffic_light_data = [
            ['Color', 'Impact Level', 'Description'],
            ['Green', 'No/Minor Glare', 'Complies with LAI and OVE guidelines: \nMax 30 minutes of relevant glare per day,\nand max 30 hours (1800 minutes) per year.\n No action needed.'],
            ['Yellow', 'Moderate Glare', 'Complies with Swissolar guidelines but not with LAI\nand OVE guidelines: \nMax 30 minutes per day on any number of days,\nmax 60 minutes per day on up to 60 days per year,\nand max 120 minutes per day on up to 20 days per year,\nwith a total of up to 50 hours of glare per year.\n Measures may be necessary\ndepending on the applicable regulations.'],
            ['Red', 'Severe Glare', 'Exceeds all guidelines:\nMeasures are definitely recommended.']
        ]

        elements.append(Spacer(1, 12))
        elements.append(Paragraph("Table 2: Traffic Light System for Glare Evaluation.".title(), styles['CaptionStyle']))
        traffic_light_table = Table(traffic_light_data, colWidths=[doc.width * 0.2, doc.width * 0.2, doc.width * 0.6])
        traffic_light_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),       
            ('BACKGROUND', (0, 1), (0, 1), colors.green),
            ('BACKGROUND', (0, 2), (0, 2), colors.yellow),
            ('BACKGROUND', (0, 3), (0, 3), colors.red),
            ('TEXTCOLOR', (1, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            #('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(traffic_light_table)
        elements.append(Spacer(1, 12))
        elements.append(Paragraph(
            "The evaluation is based solely on the relevant glare effects identified during the calculations, "
            "which consider the thresholds set for luminance, sun elevation, and superimposition by the sun.", styles['BlockJustify']))
        elements.append(PageBreak())

        elements.append(Paragraph("4. Summary of Results", styles['HeadingStyle']))
        elements.append(Paragraph(
            "This table summarizes the results for each detection point (DP). "
            "Note that only relevant glare periods are shown, excluding effects "
            "overlaid by the sun, with luminance below the intensity threshold, "
            "or during times when the sun is lower than the sun elevation threshold.", styles['BlockJustify']))
        elements.append(Spacer(1, 12))

        df_filtered = df_aggregated[(df_aggregated['Within_Threshold'] == False) & (df_aggregated['Luminance'] > simulation_parameter.intensity_threshold)].copy()

        summary_data = [
            ['DP Number', 'Max. Glare\nper Day\n[min]', 'Glare per\nYear\n[min]', 'Days\nwith\nGlare', 'Days with\n>30 Min\nGlare', 'Days with\n>60 Min\nGlare', 'Days with\n>120 Min\nGlare']
        ]

        for op in list_of_dps:
            op_number = list_of_dps.index(op) + 1
            df_op = df_filtered[df_filtered['OP Number'] == op_number]

            if df_op.empty:
                max_glare_per_day = 0
                glare_per_year = 0
                days_with_glare = 0
                days_with_30_min = 0
                days_with_60_min = 0
                days_with_120_min = 0
            else:
                glare_per_year = df_op.shape[0]
                df_op['Day'] = pd.to_datetime(df_op['timestamp']).dt.date
                glare_per_day = df_op.groupby('Day').size()
                max_glare_per_day = glare_per_day.max()
                days_with_glare = glare_per_day[glare_per_day > 0].count()
                days_with_30_min = glare_per_day[glare_per_day > 30].count()
                days_with_60_min = glare_per_day[glare_per_day > 60].count()
                days_with_120_min = glare_per_day[glare_per_day > 120].count()

            summary_data.append([
                op_number,
                max_glare_per_day,
                glare_per_year,
                days_with_glare,
                days_with_30_min,
                days_with_60_min,
                days_with_120_min
            ])

        elements.append(Spacer(1, 12))
        elements.append(Paragraph("Table 3: Summary of glare results per detection point.".title(), styles['CaptionStyle']))
        summary_table = Table(summary_data, colWidths=[doc.width / len(summary_data[0])] * len(summary_data[0]))
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(summary_table)
        elements.append(PageBreak())

        elements.append(Paragraph("5. Impact Level Assessment", styles['HeadingStyle']))
        elements.append(Paragraph("Table 4: Impact level assessment for each detection point.".title(), styles['CaptionStyle']))

        impact_level_data = [['DP Number', 'Impact Level']]
        for row in summary_data[1:]:
            dp_number = row[0]
            max_glare_per_day = row[1]
            impact_level = 'No/Minor Glare' if max_glare_per_day <= 30 else 'Moderate Glare' if max_glare_per_day <= 60 else 'Severe Glare'
            impact_level_data.append([dp_number, impact_level])

        impact_level_table = Table(impact_level_data, colWidths=[doc.width / len(impact_level_data[0])] * len(impact_level_data[0]))
        impact_level_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))

        # Applying color coding to the impact level column
        for i, row in enumerate(impact_level_data[1:], start=1):
            if row[1] == 'No/Minor Glare':
                impact_level_table.setStyle(TableStyle([('BACKGROUND', (1, i), (1, i), colors.green)]))
            elif row[1] == 'Moderate Glare':
                impact_level_table.setStyle(TableStyle([('BACKGROUND', (1, i), (1, i), colors.yellow)]))
            else:  # Severe Glare
                impact_level_table.setStyle(TableStyle([('BACKGROUND', (1, i), (1, i), colors.red)]))

        elements.append(impact_level_table)
        elements.append(PageBreak())

        elements.append(Paragraph("6. PV Areas Details", styles['HeadingStyle']))
        elements.append(Paragraph("Table 5: Overview of PV areas with azimuth and tilt.".title(), styles['CaptionStyle']))
        pv_area_overview_data = [['PV Area', 'Azimuth [°]', 'Tilt [°]']]
        for pv_area in pv_areas:
            pv_area_overview_data.append([pv_area.name, pv_area.azimuth, pv_area.tilt])

        pv_area_overview_table = Table(pv_area_overview_data, colWidths=[doc.width / len(pv_area_overview_data[0])] * len(pv_area_overview_data[0]))
        pv_area_overview_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(pv_area_overview_table)

        elements.append(Spacer(1, 12))
        # Zweite Tabelle für die 4 Eckpunkte jeder PV Area (hier werden die Originaldaten verwendet)
        corner_points_data = [['PV Area', 'Latitude', 'Longitude', 'Ground\nElevation [m]', 'Height Above\nGround [m]']]
        for pv_area in pv_areas:
            for point in pv_area.points:  # Verwende direkt die ursprünglichen Punkte ohne Begrenzung auf 4
                corner_points_data.append([
                    pv_area.name,
                    round(point.latitude, 6),
                    round(point.longitude, 6),
                    round(point.ground_elevation, 1),
                    round(point.height_above_ground, 1)
                ])

        corner_points_table = Table(corner_points_data, colWidths=[doc.width / len(corner_points_data[0])] * len(corner_points_data[0]))
        corner_points_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))


        elements.append(Paragraph("Table 6: List of the original corner points of the PV areas (excluded areas are not considered here)".title(), styles['CaptionStyle']))
        elements.append(corner_points_table)
        elements.append(Spacer(1, 12))

        elements.append(PageBreak())

        elements.append(Paragraph("7. Detection Points (DPs) Details", styles['HeadingStyle']))
        elements.append(Paragraph("This table provides details of the detection points (DPs).", styles['Normal']))
        elements.append(Spacer(1, 12))
        elements.append(Paragraph("Table 7: Details of detection points.".title(), styles['CaptionStyle']))
        dps_data = [['DP Number', 'Latitude', 'Longitude', 'Ground\nElevation\n[m]', 'Height\nAbove\nGround[m]']]
        for idx, dp in enumerate(list_of_dps, start=1):
            dps_data.append([idx, round(dp.latitude, 6), round(dp.longitude, 6), round(dp.ground_elevation, 1), round(dp.height_above_ground, 1)])
        dps_table = Table(dps_data, colWidths=[doc.width / len(dps_data[0])] * len(dps_data[0]))
        dps_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(dps_table)
        elements.append(PageBreak())

        width = 6 * inch
        height = 6 * inch
        aspect_ratio_n = 16 / 10
        figure_counter = 1

        for dp_number in range(1, len(list_of_dps) + 1):
            # Kapitel 7.x für DP-Nummern
            elements.append(Paragraph(f"7.{dp_number} Detection Point (DP) {dp_number}", styles['HeadingStyle']))
            
            if report_type == 'full':
                for plot_type in ['glare_periods', 'glare_duration', 'glare_intensity', 'reflecting_pv_area']:
                    figure_counter += 1  # Globale Figurennummer inkrementieren
                    image_path = os.path.join(output_dir, f'{plot_type}_dp_{dp_number}.png')
                    elements.append(Paragraph(f"Figure {figure_counter}: {plot_type.replace('_', ' ').title()} for DP {dp_number}.", styles['CaptionStyle']))
                    elements.append(ReportLabImage(image_path, width, height / aspect_ratio_n))
                    elements.append(Spacer(1, 12))
                    if ((figure_counter-1) % 2) == 0:
                        elements.append(PageBreak())
            else:
                for plot_type in ['blur_glare_periods', 'glare_duration', 'blur_glare_intensity', 'blur_reflecting_pv_area']:
                    figure_counter += 1  # Globale Figurennummer inkrementieren
                    image_path = os.path.join(output_dir, f'{plot_type}_dp_{dp_number}.png')
                    elements.append(Paragraph(f"Figure {figure_counter}: {plot_type.replace('_', ' ').replace('blur ', '').title()} for DP {dp_number}.", styles['CaptionStyle']))
                    elements.append(ReportLabImage(image_path, width, height / aspect_ratio_n))
                    elements.append(Spacer(1, 12))
                    if ((figure_counter-1) % 2) == 0:
                        elements.append(PageBreak())

        elements.append(Paragraph("8. Liability Disclaimer", styles['HeadingStyle']))
        elements.append(Paragraph(
            "The results presented in this report are based on simulations and calculations. "
            "While we strive to ensure the accuracy and reliability of the results, they may differ from real-world conditions. "
            "No liability is assumed for any damages or losses resulting from the use of these results. "
            "It is recommended to conduct further on-site evaluations and consider additional factors that may affect glare impact.",
            styles['BlockJustify']))

        doc.build(elements, canvasmaker=lambda *args, **kwargs: CustomCanvas(*args, meta_data=meta_data, **kwargs))


    create_document('free')
    create_document('full')



def print_duration(step_name, start_time):
    duration = time.time() - start_time
    print(f"{step_name} completed in {duration:.2f} seconds.")

def calculate_glare(_pv_areas, list_of_pv_area_information, list_of_ops, _meta_data, _simulation_parameter, api_key, output_dir, excluded_areas=[]):
    plt.switch_backend('Agg')

    total_start_time = time.time()  # Startzeit für den gesamten Prozess

    start_time = time.time()

    meta_data = MetaData(_meta_data['user_id'], _meta_data['project_id'], _meta_data['sim_id'], _meta_data['timestamp'], _meta_data['utc'], _meta_data['project_name'])
    simulation_parameter = SimulationParameter(
        _simulation_parameter['grid_width'], 
        _simulation_parameter['resolution'], 
        _simulation_parameter['sun_elevation_threshold'], 
        _simulation_parameter['beam_spread'], 
        _simulation_parameter['sun_angle'], 
        _simulation_parameter['sun_reflection_threshold'], 
        _simulation_parameter['zoom_level'],
        _simulation_parameter['intensity_threshold'],  
        _simulation_parameter['module_type']  
    )

    filename = 'assets/module_reflection_profiles.csv'
    module_type = simulation_parameter.module_type  
    x, y = load_module_data(filename, module_type)
    poly_func = fit_polynomial(x, y, degree=4)
    print_duration("Loading module data and fitting polynomial", start_time)
    
    start_time = time.time()
    pv_areas = []
    for i, pvs in enumerate(_pv_areas):
        points = []
        for point in pvs:
            points.append(MyPoint(point['latitude'], point['longitude'], point['ground_elevation'], point['height_above_ground']))
        pv_areas.append(PVArea(points, list_of_pv_area_information[i]['azimuth'], list_of_pv_area_information[i]['tilt'], list_of_pv_area_information[i]['name']))
    
    list_of_dps = []
    for op in list_of_ops:
        list_of_dps.append(MyPoint(op['latitude'], op['longitude'], op['ground_elevation'], op['height_above_ground']))
    
    original_pv_areas = pv_areas
    initialize_global_transformer(list_of_dps[0].latitude, list_of_dps[0].longitude)
    print_duration("Initialization and transformation setup", start_time)

    start_time = time.time()
    processed_pv_areas = preprocess_pv_areas(pv_areas, excluded_areas)
    processed_pv_areas = preprocess_pv_areas_with_support_points(processed_pv_areas, num_support_points=4)
    print_duration("Preprocessing PV areas", start_time)

    start_time = time.time()
    data = []
    for original_area in pv_areas:
        for new_area in processed_pv_areas:
            if new_area.name.startswith(original_area.name):
                processed_area = interpolate_z_values_linear(original_area, new_area)
                data += calculate_angles_and_distance(list_of_dps, [processed_area])

    df_pv_area_cornerpoints = pd.DataFrame(data, columns=['OP Number', 'PV Area Name', 'Latitude', 'Longitude', 'Azimuth Angle', 'Elevation Angle'])
    print_duration("Calculating angles and distances", start_time)

    start_time = time.time()
    df_calculation_points = generate_points_within_angles(df_pv_area_cornerpoints, w=simulation_parameter.grid_width, excluded_areas=excluded_areas, list_of_dps=list_of_dps)
    print_duration("Generating calculation points", start_time)

    start_time = time.time()
    df_sun = generate_sun_df(list_of_dps[0].latitude, list_of_dps[0].longitude, list_of_dps[0].ground_elevation, meta_data.timestamp, simulation_parameter.resolution, simulation_parameter.sun_elevation_threshold)
    print_duration("Generating sun positions", start_time)

    start_time = time.time()
    df_reflection = generate_reflection_df(df_sun, processed_pv_areas)
    print_duration("Calculating reflections", start_time)

    start_time = time.time()
    df_glare_results, df_calculation_points_results = generate_glare_results_efficient(df_reflection, df_calculation_points, simulation_parameter.beam_spread, simulation_parameter.sun_angle)
    print_duration("Generating glare results", start_time)

    start_time = time.time()
    df_glare_results = add_di_plane_to_glare_results(df_glare_results, processed_pv_areas)
    print_duration("Adding direct irradiance to glare results", start_time)

    start_time = time.time()
    df_glare_results = add_luminance_to_glare_results(df_glare_results, poly_func, lf=125)
    print_duration("Adding luminance to glare results", start_time)

    start_time = time.time()
    df_aggregated = aggregate_glare_results(df_glare_results)
    print_duration("Aggregating glare results", start_time)

    start_time = time.time()
    df_aggregated = check_reflection_angle_threshold(df_aggregated, simulation_parameter.sun_reflection_threshold)
    print_duration("Checking reflection angle threshold", start_time)

    start_time = time.time()
    generate_static_map_with_polygons(processed_pv_areas, list_of_dps, api_key, output_dir)
    print_duration("Generating static map with polygons", start_time)

    start_time = time.time()
    generate_and_save_plots(df_pv_area_cornerpoints, df_calculation_points_results, output_dir)
    print_duration("Generating and saving plots", start_time)

    start_time = time.time()
    plot_glare_data(df_aggregated, output_dir, meta_data.timestamp, list_of_dps, meta_data.utc, simulation_parameter.intensity_threshold)
    print_duration("Plotting glare data", start_time)

    start_time = time.time()
    plot_glare_intensity_with_continuous_colorbar(df_aggregated, output_dir, meta_data.timestamp, list_of_dps, meta_data.utc)
    print_duration("Plotting glare intensity", start_time)

    start_time = time.time()
    generate_reports(df_aggregated, output_dir, list_of_dps, meta_data, simulation_parameter, original_pv_areas)
    print_duration("Generating reports", start_time)

    # Gesamtzeit berechnen und ausgeben
    total_duration = time.time() - total_start_time
    print(f"Total time taken for all steps: {total_duration:.2f} seconds.")









def test():
    example_call = """
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
        "sim_id": "1234f56789",
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
    """
    import json
    data = json.loads(example_call)

    script_dir = os.path.dirname(os.path.realpath(__file__))
    output_dir = os.path.join(script_dir, 'test')

    calculate_glare(
        data["pv_areas"],
        data["list_of_pv_area_information"],
        data["list_of_ops"],
        data["meta_data"],
        data["simulation_parameter"],
        'AIzaSyCW9jeMpPtnTfua-thXVAG6rzdqGpfdeSs',
        output_dir,
        data["excluded_areas"],
    )

if __name__ == "__main__":
    test()


# "excluded_areas": [[{"latitude": 48.088578, "longitude": 11.566313}, {"latitude": 48.088514, "longitude": 11.566332}, {"latitude": 48.088587, "longitude": 11.566357}]],