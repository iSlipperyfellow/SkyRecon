# SkyRecon: Project Technologies & Presentation Q&A Guide

This document provides a comprehensive overview of all the tools and technologies used in the SkyRecon project (Frontend, Backend, AI, and DevOps), along with anticipated questions and well-structured answers for your Final Year Project (FYP) presentation.

---

## 1. Complete Technology Stack

### Frontend (User Interface & Dashboard)
* **Core Framework**: **Next.js 14** (React 18) - Provides server-side rendering, routing, and optimized performance.
* **Styling**: **Tailwind CSS** - Utility-first CSS framework for rapid and responsive UI development.
* **Mapping & GIS**: 
  * **Leaflet & React-Leaflet**: Interactive maps for live drone tracking.
  * **Turf.js**: Advanced geospatial analysis directly in the browser (e.g., calculating distances, bounding boxes).
  * **Leaflet-heatmap**: Visualizing density of detected hazards.
* **Data Visualization**: **Chart.js & React-Chartjs-2** - For analytics and historical data representation.
* **Animations & UI UX**: **Framer Motion** (for smooth component transitions), **Lucide React** (icons).
* **Data Fetching & State**: **Axios** for REST API communication.
* **Reporting**: **html2canvas & jsPDF** - For exporting on-the-fly dashboard reports to PDF.

### Backend (API, Real-time Processing & Database)
* **Core Framework**: **Django 4.2 & Django REST Framework (DRF)** - Robust, secure, and rapid API development.
* **Real-Time Communication**: 
  * **Django Channels & Daphne (ASGI)**: Handles WebSockets for live streaming of telemetry and detections to the frontend.
  * **RabbitMQ (channels-rabbitmq)**: Message broker backing Django Channels for scalable broadcasting.
* **IoT/Telemetry**: **Paho-MQTT** - Client for receiving real-time drone telemetry from an MQTT broker (like Mosquitto).
* **Database & Geospatial**:
  * **PostgreSQL** - Primary relational database.
  * **PostGIS** - PostgreSQL extension for advanced spatial queries (calculating drone distance to runway).
  * **DRF-GIS**: Django REST Framework spatial extension for serving GeoJSON.
* **Authentication**: **SimpleJWT** - Role-Based Access Control (RBAC) using JSON Web Tokens.
* **Background Tasks**: **Celery & Redis** - For asynchronous task processing (e.g., report generation).
* **API Documentation**: **DRF Spectacular** - Auto-generated Swagger/OpenAPI documentation.

### AI & Computer Vision (Inference)
* **Object Detection Model**: **YOLOv8 Nano (Ultralytics)** - Extremely fast, state-of-the-art model customized for our dataset.
* **Machine Learning Framework**: **PyTorch** (`torch`, `torchvision`).
* **Image Processing**: **OpenCV (opencv-python-headless)** and **NumPy** for array manipulations and bounding box drawing.
* **Inference Server**: Custom Python microservice (or integrated Django view) handling the YOLOv8 model for real-time inference.

### DevOps & Infrastructure
* **Containerization**: **Docker & Docker Compose** - For packaging the backend, database, MQTT broker, and frontend into reproducible environments.
* **Testing**: **Pytest** (Backend), **Jest & React Testing Library** (Frontend).

---

## 2. Anticipated Presentation Questions & Good Answers

### Q1: Why did you choose Next.js for the frontend instead of standard React?
**Answer:** We chose Next.js because it provides built-in routing, which makes navigating between the dashboard, alerts, and report pages seamless. Additionally, Next.js offers performance optimizations like Image optimization and Server-Side Rendering (SSR), which makes initial page loads faster and improves the overall responsiveness of our real-time mission control dashboard.

### Q2: Why use Django and Python for the backend instead of Node.js?
**Answer:** Python is the industry standard for Artificial Intelligence and Machine Learning. Since our core value proposition relies heavily on YOLOv8 computer vision and geospatial analysis, using Django allowed us to seamlessly integrate our AI pipeline (PyTorch/YOLO) and GIS tools (PostGIS) within the same ecosystem. Django also provides a highly secure and fast way to build APIs out-of-the-box compared to writing everything from scratch in Node.js.

### Q3: How does the system achieve "Real-Time" tracking and what is the latency?
**Answer:** The real-time capability is achieved through a dual-protocol architecture:
1. The drone sends its fast, lightweight telemetry via **MQTT** to our backend broker.
2. The Django backend consumes this MQTT feed and immediately broadcasts it to the Next.js frontend via **WebSockets** (using Django Channels).
Our end-to-end latency from the drone to the dashboard updating its Leaflet map marker is typically under **200 milliseconds**, making it virtually instantaneous for the human operator.

### Q4: Why did you choose YOLOv8 Nano specifically?
**Answer:** For a drone-based application, processing speed and edge-deployment capabilities are critical. We chose the "Nano" version of YOLOv8 because it is incredibly lightweight (around 5-6 MB) and offers very fast inference times (often 5-10ms on a GPU, or highly acceptable speeds on a CPU). This allows us to process video frames in real-time without building up a lag queue, which is essential for immediate hazard detection on a runway.

### Q5: How does the Hazard Scoring algorithm work?
**Answer:** Our hazard scoring algorithm dynamically evaluates the risk of a detected object based on three main factors:
1. **Confidence Score:** The YOLOv8 model's certainty of the detection.
2. **Material Type Weight:** Metal carries the highest weight (1.0) because it can cause catastrophic damage, followed by plastic (0.7), and organic material (0.5).
3. **Runway Proximity:** Using PostGIS, we calculate the exact distance of the debris from the runway. If the object is on or very close to the runway, a 1.5x multiplier is applied. 
The final score determines if an alert is Low (Green), Medium (Yellow), or High/Critical (Red).

### Q6: How do you handle security and ensure only authorized personnel can control the drone?
**Answer:** We implemented Role-Based Access Control (RBAC) using JSON Web Tokens (JWT). We have distinct roles like ADMIN, OPERATOR, and ANALYST. Only an authenticated OPERATOR or ADMIN has the system privileges to send command instructions (like Abort or Reroute) to the drone via the API. The token includes the user's role, and our backend endpoints verify this role before executing any critical commands.

### Q7: If we wanted to scale this to 100 drones, what would break first and how would you fix it?
**Answer:** The first bottleneck would likely be the WebSocket broadcasting and AI inference processing. 
* **To fix WebSockets:** We are already using RabbitMQ with Django Channels, so we could horizontally scale our Django Daphne ASGI servers and load-balance across them. 
* **To fix AI Inference:** We would decouple the YOLOv8 inference into its own dedicated microservice running on a GPU cluster. We could queue incoming video frames using Celery or Kafka, allowing the AI service to scale independently from the main web API.

### Q8: What was the biggest technical challenge you faced and how did you overcome it?
*(Note: Tailor this to your actual experience, but here is a strong technical example)*
**Answer:** One of the biggest challenges was synchronizing the asynchronous MQTT drone telemetry with the WebSocket frontend stream while writing to the database without causing huge delays. We solved this by separating the concerns: we used PostgreSQL with PostGIS spatial indexing to ensure database writes were fast, and we utilized Django Channels backed by RabbitMQ to handle the non-blocking WebSocket broadcasts independently of the database write cycle.

### Q9: Why use PostGIS instead of just storing Latitude and Longitude as regular float numbers?
**Answer:** Storing simple floats requires complex, custom mathematical formulas (like the Haversine formula) every time we want to calculate distances or check if a drone is inside a specific geofenced area. By using PostGIS, we leverage highly optimized, built-in spatial queries. For example, querying "which debris is within 50 meters of the runway polygon" becomes a single, incredibly fast database command using PostGIS spatial indexing (R-Trees), rather than a slow, manual iteration over all records.

### Q10: How are you managing different environments (Development vs Production)?
**Answer:** We use Docker and Docker Compose. This containerization ensures that our database, message brokers (MQTT/RabbitMQ), backend, and frontend are packaged in isolated environments. A developer can spin up the entire architecture on their laptop with a single `docker-compose up` command, ensuring that there are no "it works on my machine" issues. This also makes deployment to a cloud provider straightforward.
