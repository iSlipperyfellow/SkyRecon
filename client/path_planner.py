import json
import math
import os

class PathPlanner:
    """
    Generates battery-aware drone flight paths for runway inspections.
    """

    # Earth radius in meters
    R = 6378137

    def __init__(self, config_file):
        """
        Loads the airport layout from a JSON config file.
        """
        if not os.path.exists(config_file):
            raise FileNotFoundError(f"Config file not found: {config_file}")
            
        with open(config_file, 'r') as f:
            self.config = json.load(f)
            
        self.base_station = self.config['base_station']
        
    @staticmethod
    def haversine_distance(p1, p2):
        """
        Calculate straight-line distance in meters between two GPS points.
        p1 and p2 should be dictionaries with 'lat' and 'lng' keys.
        """
        lat1, lon1 = math.radians(p1['lat']), math.radians(p1['lng'])
        lat2, lon2 = math.radians(p2['lat']), math.radians(p2['lng'])
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return PathPlanner.R * c

    @staticmethod
    def create_waypoint(lat, lng, alt=15, type="scan"):
        """Helper to unify waypoint format"""
        return {"lat": lat, "lng": lng, "alt": alt, "type": type}

    def _generate_runway_sweep(self, runway, fov_width_meters=20):
        """
        Generates a basic "lawnmower" pattern over a single runway's bounding box.
        This provides a starting set of waypoints before battery limitations are applied.
        For simplicity, we interpolate back and forth along the length of the runway.
        """
        waypoints = []
        width = runway['width_meters']
        start_pt = runway['start']
        end_pt = runway['end']
        
        # Number of parallel sweeps needed
        num_sweeps = max(1, math.ceil(width / fov_width_meters))
        
        # Calculate runway bearing and orthogonal vector (simplified flat-earth approximation)
        lat_diff = end_pt['lat'] - start_pt['lat']
        lng_diff = end_pt['lng'] - start_pt['lng']
        
        # Perpendicular direction to shift between sweeps
        # We roughly translate meters to lat/lng degrees (approx 1 deg = 111km)
        degrees_per_meter_lat = 1 / 111320
        degrees_per_meter_lng = 1 / (40075000 * math.cos(math.radians(start_pt['lat'])) / 360)

        orth_lat = -lng_diff * degrees_per_meter_lat * fov_width_meters
        orth_lng = lat_diff * degrees_per_meter_lng * fov_width_meters
        
        current_side = 'start'
        
        # Generate the back-and-forth pattern
        for i in range(num_sweeps):
            # Shift starting and ending points perpendicularly for this sweep lane
            shift_lat = orth_lat * i
            shift_lng = orth_lng * i
            
            p1 = {"lat": start_pt['lat'] + shift_lat, "lng": start_pt['lng'] + shift_lng}
            p2 = {"lat": end_pt['lat'] + shift_lat, "lng": end_pt['lng'] + shift_lng}
            
            if current_side == 'start':
                waypoints.append(self.create_waypoint(p1['lat'], p1['lng']))
                waypoints.append(self.create_waypoint(p2['lat'], p2['lng']))
                current_side = 'end'
            else:
                waypoints.append(self.create_waypoint(p2['lat'], p2['lng']))
                waypoints.append(self.create_waypoint(p1['lat'], p1['lng']))
                current_side = 'start'
                
        return waypoints

    def generate_battery_aware_mission(self, drone_specs, fov_width_meters=20):
        """
        Generates a master mission plan, breaking it down into multiple "Sorties"
        if the drone cannot complete the entire inspection on a single battery charge.
        """
        max_dist_meters = drone_specs['max_flight_time_seconds'] * drone_specs['cruising_speed_m_s']
        # 15% safety buffer for wind, takeoff/landing, etc.
        safe_range = max_dist_meters * 0.85 
        
        print(f"Drone Max Range: {max_dist_meters}m | Safe Operating Range: {safe_range}m")
        
        # First, generate the raw theoretical path for ALL runways continuously
        raw_waypoints = []
        for runway in self.config['runways']:
            raw_waypoints.extend(self._generate_runway_sweep(runway, fov_width_meters))
            
        sorties = []
        current_sortie = []
        current_distance_flown = 0
        
        # Always start at base
        last_point = self.base_station
        current_sortie.append(self.create_waypoint(last_point['lat'], last_point['lng'], 0, "takeoff"))

        for wp in raw_waypoints:
            # 1. Calculate distance from last point to this new point
            dist_to_next = self.haversine_distance(last_point, wp)
            
            # 2. Calculate distance from new point BACK to base station (Return To Base)
            dist_to_base = self.haversine_distance(wp, self.base_station)
            
            # 3. Check battery constraint
            projected_total_distance = current_distance_flown + dist_to_next + dist_to_base
            
            if projected_total_distance > safe_range:
                # Adding this waypoint would beach the drone. 
                # We must Return To Base NOW.
                current_sortie.append(self.create_waypoint(self.base_station['lat'], self.base_station['lng'], 0, "land_RTB"))
                sorties.append(current_sortie)
                
                # Start a new sortie 
                current_sortie = []
                current_distance_flown = 0
                last_point = self.base_station
                current_sortie.append(self.create_waypoint(last_point['lat'], last_point['lng'], 0, "takeoff"))
                
                # Recalculate distance to this waypoint from base station for the new sortie
                dist_to_next = self.haversine_distance(last_point, wp)
            
            # Safe to add waypoint to current sortie
            current_sortie.append(wp)
            current_distance_flown += dist_to_next
            last_point = wp
            
        # Finish the final sortie with a landing at base
        if current_sortie:
            current_sortie.append(self.create_waypoint(self.base_station['lat'], self.base_station['lng'], 0, "land_complete"))
            sorties.append(current_sortie)
            
        return sorties


if __name__ == "__main__":
    print("Initializing Path Planner...")
    
    config_path = r"D:\Skyrecon_Final\Skyrecon\data\airport_config.json"
    planner = PathPlanner(config_path)
    
    # 1. Test with a drone that has a large battery (can do it in 1 go)
    drone_good = {
        "max_flight_time_seconds": 1800, # 30 mins
        "cruising_speed_m_s": 15
    }
    
    # 2. Test with a drone that has a tiny battery (will require multiple trips)
    drone_weak = {
        "max_flight_time_seconds": 300,  # 5 mins
        "cruising_speed_m_s": 10
    }
    
    print("\n--- Testing Large Battery Drone ---")
    sorties_good = planner.generate_battery_aware_mission(drone_good)
    print(f"Total Sorties Required: {len(sorties_good)}")
    
    print("\n--- Testing Small Battery Drone ---")
    sorties_weak = planner.generate_battery_aware_mission(drone_weak)
    print(f"Total Sorties Required: {len(sorties_weak)}")
    for i, sortie in enumerate(sorties_weak):
        print(f"  Sortie {i+1}: {len(sortie)} waypoints")
        print(f"    Start: {sortie[0]['type']} | End: {sortie[-1]['type']}")
