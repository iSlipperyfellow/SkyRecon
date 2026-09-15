"""
Reads the exact position of the spectator camera in ComputerVision mode.
"""
import airsim

client = airsim.VehicleClient()
client.confirmConnection()

try:
    v_pose = client.simGetVehiclePose()
    vp = v_pose.position
    print("==================================================")
    print("  ROAD NED COORDINATES (Use these!)")
    print("==================================================")
    print(f"  X = {vp.x_val:.2f}")
    print(f"  Y = {vp.y_val:.2f}")
    print(f"  Z = {vp.z_val:.2f}  (negative = above ground)")
    print("==================================================")
except Exception as e:
    print(f"Error: {e}")

print("Move the camera and run again to get the next point.")
