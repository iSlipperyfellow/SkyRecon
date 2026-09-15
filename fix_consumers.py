import sys

file_path = r'D:\Skyrecon_Final\Skyrecon\backend\core\consumers.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """                    if resp.status == 200:
                        results = await resp.json()
                        await self.send(text_data=json.dumps(results))"""

replacement = """                    if resp.status == 200:
                        results = await resp.json()
                        await self.send(text_data=json.dumps(results))
                        
                        payload = {
                            "type": "live_update",
                            "frame": frame_b64,
                            "detections": results.get("detections", []),
                            "timestamp": results.get("timestamp", "")
                        }
                        
                        await self.channel_layer.group_send(
                            "live_feed",
                            {
                                "type": "live_update",
                                "payload": payload
                            }
                        )"""

# normalize line endings for target and content to safely replace
target = target.replace('\r\n', '\n')
content = content.replace('\r\n', '\n')

if target in content:
    content = content.replace(target, replacement)
    with open(file_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)
    print('Replaced successfully')
else:
    print('Target not found')
