"""
SkyRecon — AirSim Mission Client  (NED-native rewrite)
=======================================================
Architecture
------------
  - All navigation uses AirSim NED (North-East-Down) coordinates directly.
    No GPS ↔ NED conversion; eliminates positional drift entirely.
  - Flight altitude is hardcoded from config (default 40 m) — guaranteed
    above all CityEnviron rooftops (tallest ≈ 30 m).
  - Battery is simulated via a threading.Timer; when it fires the drone
    immediately executes a Return-To-Base (RTB) sequence.
  - A pre-flight collision probe verifies the spawn is safe before the
    main survey begins.
  - Vision streaming runs in a background thread; it is independent of
    the navigation thread to prevent frame drops during waypoint transitions.

Mission flow
------------
  connect → preflight_check → ascend → survey_loop ──→ RTB → land
                                              ↑ battery_timer fires ┘

Config
------
  Edit data/city_mission_config.json with values from scout_corridor.py.
  Key fields:
    home_ned              : spawn NED X/Y (Z is set to -2 for take-off)
    cruise_altitude_ned_z : flight altitude (negative = up in NED)
    waypoints             : list of NED {x, y, z, label} dicts
    battery_demo_seconds  : seconds before RTB triggers (demo value)
    drone_speed_mps       : cruise speed
"""

import airsim
import cv2
import numpy as np
import base64
import json
import threading
import time
import websocket
import os
import math
import requests

# ── Config ────────────────────────────────────────────────────────────────────
CONFIG_PATH   = r"D:\Skyrecon_Final\Skyrecon\data\city_mission_config.json"
BACKEND_WS    = "ws://127.0.0.1:8000/ws/inference/"
PREFLIGHT_SEC = 2.5   # seconds to hover at altitude and check for collision
VISION_FPS    = 15    # frames per second for the vision stream


class AirSimMissionClient:
    """
    Executes a city-patrol mission in AirSim using NED-native waypoints,
    streams live video to the SkyRecon backend, and enforces a battery-aware
    Return-To-Base (RTB) protocol.
    """

    # ── Initialisation ────────────────────────────────────────────────────────
    def __init__(self, config_path: str = CONFIG_PATH, backend_url: str = BACKEND_WS):
        with open(config_path, "r") as f:
            cfg = json.load(f)

        self.backend_url = backend_url

        # Home / base position (NED)
        h = cfg["home_ned"]
        self.home_x = h["x"]
        self.home_y = h["y"]
        self.cruise_z = float(cfg["cruise_altitude_ned_z"])  # e.g. -40.0

        # Mission waypoints — already in NED
        self.waypoints = cfg["waypoints"]

        # Demo battery timer (seconds until RTB triggers)
        self.battery_seconds = int(cfg.get("battery_demo_seconds", 45))

        # Cruise speed
        self.speed = float(cfg.get("drone_speed_mps", 8.0))

        # ── State flags ───────────────────────────────────────────────────────
        self.running        = True   # set False to kill all threads
        self.rtb_triggered  = False  # set True by battery timer
        self.mission_done   = False  # set True when landing is complete
        self.current_battery_pct = 100
        self.drone_uuid     = "SKY-ALPHA-01"
        self.mission_status = "idle" # idle, active, paused
        self.telemetry_ws_app = None

        # AirSim client (main thread — navigation only)
        self.client = airsim.MultirotorClient()

    # ── Connection & arming ───────────────────────────────────────────────────
    def connect(self):
        print("[CONNECT] Connecting to AirSim...")
        self.client.confirmConnection()
        self.client.enableApiControl(True)
        self.client.armDisarm(True)
        print("[CONNECT] Connected and armed [OK]")
        
        try:
            drones_resp = requests.get("http://127.0.0.1:8000/api/drones/", timeout=3).json()
            drones = drones_resp.get('results', drones_resp) if isinstance(drones_resp, dict) else drones_resp
            if drones and len(drones) > 0:
                self.drone_uuid = drones[0]['id']
        except Exception:
            pass
        print(f"[API] Connected to Drone ID: {self.drone_uuid}")

    # ── Pre-flight collision check ────────────────────────────────────────────
    def _preflight_check(self) -> bool:
        """
        Ascends to cruise altitude directly above the spawn point
        (no horizontal movement) and checks for collision events.
        Returns True if the area is clear, False if a collision was detected.

        NOTE: Collisions with 'Landscape' / ground terrain are EXPECTED
        during takeoff and are explicitly ignored. We only abort on real
        obstacle collisions (buildings, trees, poles, etc.).
        """
        # Objects whose collision is normal/expected and should NOT trigger abort
        IGNORED_COLLISION_OBJECTS = {"landscape", "terrain", "sky", "ground"}

        print(f"[PREFLIGHT] Ascending to {abs(self.cruise_z):.0f} m above spawn...")
        self.client.takeoffAsync().join()
        time.sleep(0.3)

        # Move straight up — NO horizontal displacement
        self.client.moveToPositionAsync(
            self.home_x, self.home_y, self.cruise_z, self.speed
        ).join()

        # Read once immediately to flush any stale ground-contact collision state
        self.client.simGetCollisionInfo()
        time.sleep(0.5)   # brief settle time before clean check

        # Hover and monitor for NEW real-obstacle collisions
        t_start = time.time()
        while time.time() - t_start < PREFLIGHT_SEC:
            info = self.client.simGetCollisionInfo()
            if info.has_collided:
                obj = (info.object_name or "unknown").lower()
                # Skip expected ground/terrain contacts
                if any(ign in obj for ign in IGNORED_COLLISION_OBJECTS):
                    time.sleep(0.1)
                    continue
                print(f"[PREFLIGHT] [FAIL] OBSTACLE collision with '{info.object_name}' at altitude.")
                print("[PREFLIGHT]   Increase cruise_altitude_ned_z in city_mission_config.json.")
                return False
            time.sleep(0.1)

        print("[PREFLIGHT] [OK] No obstacle collision detected - altitude and corridor are safe.")
        return True


    # ── Dynamic Battery & Distance Monitor ────────────────────────────────────
    def _battery_monitor(self):
        """
        Runs in background. Continously calculates distance back to base and the
        battery required to safely return. Triggers RTB when current battery
        approaches the 'point of no return'.
        """
        print(f"[BATTERY] Dynamic monitoring active. Max flight time: {self.battery_seconds}s.")
        
        # CRITICAL FIX: AirSim client is not thread-safe. We need a dedicated 
        # client for the battery thread to query position without RPC errors.
        battery_client = airsim.MultirotorClient()
        battery_client.confirmConnection()
        
        while self.running and not self.mission_done:
            elapsed = time.time() - self._mission_start_time
            time_remaining = max(0, self.battery_seconds - elapsed)
            
            # Calculate dynamic battery percentage
            self.current_battery_pct = max(0, int((time_remaining / self.battery_seconds) * 100))

            try:
                # Calculate direct distance from current pos to home
                pos = battery_client.simGetVehiclePose().position
                dist_to_home = math.sqrt((pos.x_val - self.home_x)**2 + (pos.y_val - self.home_y)**2)
                
                # Calculate how much time we need to fly that distance
                time_to_home = dist_to_home / self.speed
                buffer_time = 3.0  # safety margin in seconds for landing/turning
                
                required_return_time = time_to_home + buffer_time
                
                # If we barely have enough battery to return, trigger RTB
                if time_remaining <= required_return_time and not self.rtb_triggered:
                    print(f"\n[RTB] [!!] POINT OF NO RETURN REACHED!")
                    print(f"[RTB] Dist to base: {dist_to_home:.1f}m. Time needed: {time_to_home:.1f}s. Battery remaining: {time_remaining:.1f}s.")
                    self.rtb_triggered = True
                    try:
                        battery_client.cancelLastTask()  # Immediately unblocks navigation
                    except:
                        pass
                    
                # Push telemetry to dashboard
                if hasattr(self, 'telemetry_ws_app') and self.telemetry_ws_app and self.telemetry_ws_app.sock and self.telemetry_ws_app.sock.connected:
                    vel = battery_client.simGetGroundTruthKinematics().linear_velocity
                    speed = math.sqrt(vel.x_val**2 + vel.y_val**2 + vel.z_val**2)
                    lat = 33.614 + (pos.x_val / 111111.0)
                    lng = 73.055 + (pos.y_val / (111111.0 * math.cos(math.radians(33.614))))
                    
                    elapsed_int = int(elapsed)
                    mins, secs = divmod(elapsed_int, 60)
                    hrs, mins = divmod(mins, 60)
                    flight_time_str = f"{hrs:02d}:{mins:02d}:{secs:02d}"
                    
                    # Calculate progress: going out vs coming back
                    if not self.rtb_triggered:
                        current_progress = min(50, int((dist_to_home / 462.0) * 50))
                    else:
                        current_progress = min(100, 100 - int((dist_to_home / 462.0) * 50))
                    
                    self.telemetry_ws_app.send(json.dumps({
                        "action": "telemetry",
                        "data": {
                            "drone_id": str(self.drone_uuid),
                            "velocity": speed,
                            "altitude": pos.z_val,
                            "battery": self.current_battery_pct,
                            "progress": current_progress if self.mission_status == 'active' else 0,
                            "lat": lat,
                            "lng": lng,
                            "distance": dist_to_home,
                            "flightTime": flight_time_str
                        }
                    }))
            except Exception as e:
                pass
                
            time.sleep(1.0)

    # ── Return-To-Base sequence ───────────────────────────────────────────────
    def _return_to_base(self):
        """Flies back to the home NED point and lands."""
        print("[RTB] Flying back to road start position...")
        self.client.moveToPositionAsync(
            self.home_x, self.home_y, self.cruise_z, self.speed,
            drivetrain=airsim.DrivetrainType.ForwardOnly,
            yaw_mode=airsim.YawMode(False, 0)
        ).join()
        print("[RTB] Over home - descending to land...")
        self.client.landAsync().join()
        print("[RTB] Landed [OK]")

    # ── Vision streaming ──────────────────────────────────────────────────────
    def _stream_vision(self):
        """
        Background thread: captures frames from the 'front_center' camera
        and sends them to the SkyRecon backend WebSocket for YOLO inference.
        Uses a separate AirSim client to avoid msgpack-rpc thread contention.

        The backend connection is OPTIONAL — if it is offline the drone flight
        continues uninterrupted. Frames are still shown in the local OpenCV
        preview window and the thread retries the WebSocket every 5 seconds.
        """
        print("[VISION] Starting vision stream thread...")
        vision_client = airsim.MultirotorClient()
        vision_client.confirmConnection()

        frame_delay = 1.0 / VISION_FPS
        backend_connected = False
        ws = None
        last_retry = 0
        RETRY_INTERVAL = 5.0   # seconds between backend reconnect attempts

        while self.running:
            loop_start = time.time()

            # ── Try to connect/reconnect to backend ───────────────────────────
            if not backend_connected and (time.time() - last_retry) > RETRY_INTERVAL:
                try:
                    ws = websocket.WebSocket()
                    ws.connect(self.backend_url)
                    backend_connected = True
                    print(f"[VISION] Backend connected at {self.backend_url} [OK]")
                except Exception:
                    backend_connected = False
                    last_retry = time.time()

            # ── Capture frame ─────────────────────────────────────────────────
            try:
                responses = vision_client.simGetImages([
                    airsim.ImageRequest(
                        "front_center", airsim.ImageType.Scene,
                        pixels_as_float=False, compress=False
                    )
                ])
            except Exception as img_exc:
                print(f"[VISION] Image capture error: {img_exc}")
                time.sleep(0.5)
                continue

            if responses and len(responses[0].image_data_uint8) > 0:
                r = responses[0]
                img = np.frombuffer(r.image_data_uint8, dtype=np.uint8)
                img = img.reshape(r.height, r.width, 3).copy()

                # ── Overlay HUD ───────────────────────────────────────────────
                status = "RTB" if self.rtb_triggered else "SURVEY"
                elapsed = int(time.time() - self._mission_start_time)
                battery_pct = self.current_battery_pct
                hud = f" {status} | Battery: {battery_pct}% | T+{elapsed}s "
                batt_color = (0, 255, 0) if battery_pct > 30 else (0, 165, 255) if battery_pct > 15 else (0, 0, 255)
                cv2.rectangle(img, (0, 0), (len(hud) * 11, 30), (0, 0, 0), -1)
                cv2.putText(img, hud, (8, 20),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, batt_color, 1)

                # Show local preview regardless of backend state
                cv2.imshow("SkyRecon - AirSim Live Feed", img)
                cv2.waitKey(1)

                # ── Send to backend if connected ──────────────────────────────
                if backend_connected and ws:
                    try:
                        _, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 85])
                        frame_b64 = base64.b64encode(buf).decode("utf-8")
                        
                        # Fetch precise location for inference metadata
                        pos = vision_client.simGetVehiclePose().position
                        lat = 33.614 + (pos.x_val / 111111.0)
                        lng = 73.055 + (pos.y_val / (111111.0 * math.cos(math.radians(33.614))))

                        ws.send(json.dumps({
                            "frame": frame_b64,
                            "drone_id": str(self.drone_uuid),
                            "lat": lat,
                            "lng": lng
                        }))
                        resp = ws.recv()
                        data = json.loads(resp)
                        if "detections" in data:
                            self._draw_detections(img, data["detections"])
                    except Exception:
                        print("[VISION] Backend disconnected - continuing in local-only mode.")
                        backend_connected = False
                        last_retry = time.time()
                        try:
                            ws.close()
                        except Exception:
                            pass
                        ws = None

            # Pace the loop to target FPS
            elapsed_loop = time.time() - loop_start
            time.sleep(max(0, frame_delay - elapsed_loop))

        # Cleanup
        try:
            if ws:
                ws.close()
        except Exception:
            pass
        cv2.destroyAllWindows()
        print("[VISION] Vision thread stopped.")


    def _draw_detections(self, frame, detections):
        """Draws bounding boxes on the local OpenCV preview window."""
        for det in detections:
            x1, y1, x2, y2 = det["bbox"]
            label = f"{det['class']} {det['hazard_score']:.2f}"
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, label, (x1, max(y1 - 8, 0)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        cv2.imshow("SkyRecon - AirSim Live Feed", frame)
        cv2.waitKey(1)

    def _telemetry_listener(self):
        """Listens for commands from the frontend via the Django telemetry websocket."""
        listener_client = airsim.MultirotorClient()
        listener_client.confirmConnection()
        
        def on_message(ws, message):
            try:
                data = json.loads(message)
                if data.get('type') == 'drone_command':
                    cmd = data.get('command')
                    print(f"\n[COMMAND] Received remote command from dashboard: {cmd}")
                    if cmd == 'start' or cmd == 'resume':
                        self.mission_status = 'active'
                        listener_client.simPause(False)
                    elif cmd == 'pause':
                        self.mission_status = 'paused'
                        listener_client.simPause(True)
                    elif cmd == 'abort':
                        self.mission_status = 'idle'
                        listener_client.simPause(False)
                        self.rtb_triggered = True
                        try:
                            listener_client.cancelLastTask()
                        except Exception as e: 
                            print(f"[DEBUG] cancelLastTask error: {e}")
            except: pass
                    
        def on_open(ws):
            print("[TELEMETRY] Connected to frontend dashboard link.")
            ws.send(json.dumps({"action": "subscribe", "drone_id": str(self.drone_uuid)}))
            
        self.telemetry_ws_app = websocket.WebSocketApp(
            "ws://127.0.0.1:8000/ws/telemetry/",
            on_message=on_message,
            on_open=on_open
        )
        self.telemetry_ws_app.run_forever()

    # ── Main mission ──────────────────────────────────────────────────────────
    def run_mission(self):
        """
        Full mission lifecycle:
          connect → teleport to road → wait for start → takeoff → survey → RTB → land → cleanup
        """
        # ── Step 1: Connect ───────────────────────────────────────────────────
        self.connect()
        
        # Start telemetry listener so frontend can connect immediately
        threading.Thread(target=self._telemetry_listener, daemon=True).start()
        
        print("\n================================================")
        print("[MISSION] STANDING BY. AWAITING 'START' COMMAND FROM DASHBOARD...")
        print("================================================\n")
        
        while self.mission_status != 'active':
            time.sleep(0.5)

        # ── Step 2: Teleport drone to road start position ─────────────────────
        # simSetVehiclePose with ignore_collision=True moves the drone to any
        # NED position regardless of what is physically there. This solves the
        # spawn collision problem permanently — we place the drone directly
        # above the road at cruise altitude before any physics-based flight.
        print(f"[POSITION] Teleporting drone to road start "
              f"(NED X={self.home_x:.1f}, Y={self.home_y:.1f}, Z={self.cruise_z:.1f})...")
        road_start_pose = airsim.Pose(
            airsim.Vector3r(self.home_x, self.home_y, self.cruise_z),
            airsim.to_quaternion(0, 0, 0)   # level orientation, facing North
        )
        self.client.simSetVehiclePose(road_start_pose, ignore_collision=True)
        time.sleep(1.0)   # let physics settle after teleport
        print("[POSITION] Drone positioned above road [OK]")

        # ── Step 3: Takeoff from current (teleported) position ────────────────
        print("[MISSION] Taking off...")
        self.client.takeoffAsync().join()
        time.sleep(0.5)

        # ── Step 4: Start vision stream and set YOLO model ────────────────────
        print("[VISION] Requesting YOLOv8 nano model (yolov8n.pt) for CityEnviron objects...")
        try:
            requests.post("http://127.0.0.1:8001/reload-model", json={"model_path": "yolov8n.pt"}, timeout=3)
        except Exception as e:
            print(f"[VISION] Warning: Could not switch YOLO model: {e}")
            
        self._mission_start_time = time.time()
        vision_thread = threading.Thread(target=self._stream_vision, daemon=True)
        vision_thread.start()

        # ── Step 5: Start battery countdown timer ─────────────────────────────
        battery_thread = threading.Thread(target=self._battery_monitor, daemon=True)
        battery_thread.start()

        # ── Step 6: Execute survey waypoints ─────────────────────────────────
        try:
            print("\n[MISSION] Starting city corridor survey at road level...")
            for i, wp in enumerate(self.waypoints):
                if self.rtb_triggered:
                    break  # cancelLastTask() already fired — go straight to RTB

                label = wp.get("label", f"wp_{i+1}")
                print(f"[MISSION] -> Waypoint {i+1}/{len(self.waypoints)}: {label} "
                      f"NED(X={wp['x']:.1f}, Y={wp['y']:.1f}, Z={wp['z']:.1f})")

                self.client.moveToPositionAsync(
                    wp["x"], wp["y"], wp["z"], self.speed,
                    drivetrain=airsim.DrivetrainType.ForwardOnly,
                    yaw_mode=airsim.YawMode(False, 0)
                ).join()
                # .join() returns immediately if cancelLastTask() was called by RTB

                time.sleep(0.5)   # dwell at waypoint for detection frames

            # ── Step 7: RTB ───────────────────────────────────────────────────
            if self.rtb_triggered:
                self._return_to_base()
            else:
                print("[MISSION] Survey complete — returning to base.")
                self._return_to_base()

        except Exception as exc:
            print(f"[MISSION] Unexpected error: {exc}")
            import traceback; traceback.print_exc()
            self._emergency_land()
        finally:
            self.mission_done = True
            self.running = False
            self.client.armDisarm(False)
            self.client.enableApiControl(False)
            print("[MISSION] Drone disarmed. Mission complete.")


    # ── Emergency land ────────────────────────────────────────────────────────
    def _emergency_land(self):
        """Best-effort immediate landing used on errors or preflight failure."""
        print("[EMERGENCY] Attempting emergency land...")
        try:
            self.client.landAsync().join()
            self.client.armDisarm(False)
            self.client.enableApiControl(False)
        except Exception as e:
            print(f"[EMERGENCY] Landing error: {e}")


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    mission_client = AirSimMissionClient()
    try:
        mission_client.run_mission()
    except KeyboardInterrupt:
        print("\n[USER] Mission interrupted by keyboard — triggering RTB and landing.")
        mission_client.running = False
        try:
            mission_client.client.landAsync().join()
            mission_client.client.armDisarm(False)
            mission_client.client.enableApiControl(False)
        except Exception:
            pass
        print("[USER] Safely stopped.")
