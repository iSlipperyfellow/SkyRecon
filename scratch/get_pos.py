import airsim

client = airsim.MultirotorClient()
client.confirmConnection()
kinematics = client.simGetGroundTruthKinematics()
print("Position:", kinematics.position)
print("Orientation:", kinematics.orientation)
