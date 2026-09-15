"""
SkyRecon — AirSim Corridor Scout
=================================
Run this AFTER launching CityEnviron.exe and while AirSim is on the main menu
(before pressing Play, or right after it loads).

What it does:
  1. Connects to AirSim in Multirotor mode.
  2. Takes off vertically to a SAFE altitude (no horizontal movement).
  3. Rotates 360° and captures 4 directional screenshots so you can see
     which direction the road runs.
  4. Prints the exact NED (X, Y, Z) coordinates at each captured point.
  5. Saves the images to scratch/scout_images/ for inspection.
  6. Lands and disarms.

After running:
  - Open the 4 images in scratch/scout_images/.
  - Identify which direction (North +X, South -X, East +Y, West -Y) 
    has a clear straight road.
  - Note the bearing and estimate a 200m corridor length.
  - Paste the start and end NED coords into data/city_mission_config.json.
"""

import airsim
import cv2
import numpy as np
import os
import time
import math

SCOUT_ALTITUDE_M  = 40.0          # metres above ground (NED = negative)
SCOUT_ALTITUDE_NED = -SCOUT_ALTITUDE_M
IMAGE_SAVE_DIR = r"D:\Skyrecon_Final\Skyrecon\scratch\scout_images"
SPEED_MPS = 5.0

def capture_and_save(client, filename, label):
    """Capture a single scene image and save it."""
    responses = client.simGetImages([
        airsim.ImageRequest("front_center", airsim.ImageType.Scene, False, False)
    ])
    if responses and responses[0].image_data_uint8:
        img = np.frombuffer(responses[0].image_data_uint8, dtype=np.uint8)
        img = img.reshape(responses[0].height, responses[0].width, 3).copy()
        # Overlay label
        cv2.putText(img, label, (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 2)
        save_path = os.path.join(IMAGE_SAVE_DIR, filename)
        cv2.imwrite(save_path, img)
        print(f"  [SAVED] {save_path}")
    else:
        print(f"  [WARN] No image data captured for {label}")

def get_ned_position(client):
    """Returns the current drone NED position as (x, y, z)."""
    pose = client.simGetVehiclePose()
    p = pose.position
    return p.x_val, p.y_val, p.z_val

def yaw_to_quaternion(yaw_deg):
    """Convert a yaw angle (degrees) to an AirSim Quaternionr."""
    yaw_rad = math.radians(yaw_deg)
    return airsim.to_quaternion(0, 0, yaw_rad)   # pitch=0, roll=0

def main():
    os.makedirs(IMAGE_SAVE_DIR, exist_ok=True)

    print("=" * 60)
    print("  SkyRecon — AirSim Corridor Scout")
    print("=" * 60)
    print(f"  Scout altitude  : {SCOUT_ALTITUDE_M}m above ground")
    print(f"  Image directory : {IMAGE_SAVE_DIR}")
    print()

    # ── 1. Connect ────────────────────────────────────────────────
    print("[1/6] Connecting to AirSim...")
    client = airsim.MultirotorClient()
    client.confirmConnection()
    client.enableApiControl(True)
    client.armDisarm(True)
    print("  Connected and armed.")

    # ── 2. Capture spawn position ─────────────────────────────────
    sx, sy, sz = get_ned_position(client)
    print(f"\n[2/6] Spawn NED position: X={sx:.2f}, Y={sy:.2f}, Z={sz:.2f}")
    print("  *** COPY THIS — it is your HOME NED for airport_config.json ***\n")

    # ── 3. Vertical ascent (SAFE — no horizontal movement) ────────
    print(f"[3/6] Taking off and ascending to {SCOUT_ALTITUDE_M}m (NED Z={SCOUT_ALTITUDE_NED})...")
    client.takeoffAsync().join()
    time.sleep(0.5)
    client.moveToPositionAsync(sx, sy, SCOUT_ALTITUDE_NED, SPEED_MPS).join()
    print("  Reached scout altitude.")

    # ── 4. Rotate and capture 4 directions ───────────────────────
    print("\n[4/6] Rotating and capturing 4 directional views...")
    directions = [
        (0,   "North_PosX"),
        (90,  "East_PosY"),
        (180, "South_NegX"),
        (270, "West_NegY"),
    ]

    for yaw_deg, label in directions:
        q = yaw_to_quaternion(yaw_deg)
        client.simSetVehiclePose(
            airsim.Pose(airsim.Vector3r(sx, sy, SCOUT_ALTITUDE_NED), q),
            ignore_collision=True
        )
        time.sleep(0.8)   # let the view settle
        x, y, z = get_ned_position(client)
        print(f"  Yaw {yaw_deg:3d}° ({label}): NED X={x:.2f}, Y={y:.2f}, Z={z:.2f}")
        capture_and_save(client, f"scout_{label}.jpg", f"{label} | NED({x:.1f},{y:.1f})")

    # ── 5. Print corridor planning guide ─────────────────────────
    print("\n[5/6] ─── CORRIDOR SELECTION GUIDE ───")
    print("  Open the 4 images in:", IMAGE_SAVE_DIR)
    print("  Look for the direction with the LONGEST straight road beneath you.")
    print("  Then set these values in data/city_mission_config.json:")
    print(f"    home_ned   → {{ \"x\": {sx:.2f}, \"y\": {sy:.2f}, \"z\": -2.0 }}")
    print( "    waypoints  → two NED points along the chosen road at Z=-40.0")
    print()
    print("  Example: if North (+X) has a clear road of ~200m:")
    print(f"    wp1: {{ \"x\": {sx+100:.1f}, \"y\": {sy:.1f}, \"z\": -40.0 }}")
    print(f"    wp2: {{ \"x\": {sx+200:.1f}, \"y\": {sy:.1f}, \"z\": -40.0 }}")

    # ── 6. Return to ground and disarm ───────────────────────────
    print("\n[6/6] Landing...")
    client.moveToPositionAsync(sx, sy, SCOUT_ALTITUDE_NED, SPEED_MPS).join()
    client.landAsync().join()
    client.armDisarm(False)
    client.enableApiControl(False)
    print("  Landed and disarmed. Scout complete.")
    print("=" * 60)

if __name__ == "__main__":
    main()
