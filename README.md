## To Run Locally

**Download the project**

**Navigate to the frontend folder**

```bash
cd autism-screening-app/frontend
npm install
npm run dev
```
**Setup and Run Backend**
```bash
cd autism-screening-app/backend
python -m venv venv
```
```bash
.\venv\Scripts\activate   # On Windows
```
**Or:**
```bash
source venv/bin/activate  # On macOS/Linux
```
```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

## 🧠 Autism Screening App
The Autism Screening App is a web-based tool designed to support early detection of Autism Spectrum Disorder (ASD) in children through behavioral and physiological cues. It leverages gaze tracking and pupillometry—analyzing pupil size and eye movement—combined with emotional stimuli, to gather useful screening data that can aid in clinical assessments.
![Screenshot 2025-05-23 214647](https://github.com/user-attachments/assets/d30c07e1-bc8b-4c91-9753-82fbb5349bbe)

![Screenshot 2025-05-23 214717](https://github.com/user-attachments/assets/8879ebe2-0558-4b9b-8163-2241e586f15d)

***Features***
**1. Emotion-Based Screening**
Presents a sequence of seven emotional expressions:
Happy, Cry, Surprised, Angry, Fear, Love, Neutral

Each emotion is shown for a fixed time while the system records eye movement and pupil size.

**2. Custom Stimuli Support**
Upload your own GIFs or videos for each emotion through the Upload Media page.

Choose which media to use (default or custom) in the Manage Stimuli dashboard.

**3. Real-Time Face and Pupil Tracking**
Uses MediaPipe FaceMesh to detect face landmarks and pupils.

Tracks gaze direction and pupil size live using the webcam.

**4. WebSocket-Powered Data Streaming**
Continuously sends frame data from each session to the backend for processing.

Data includes gaze direction and pupil metrics for each stimulus shown.

**5. ASD Detection Logic**
Analyzes user responses across all stimuli.

Uses simple rule-based logic to suggest:

Signs of ASD detected

No concerning signs detected

No data available

**6. Session Report**
Automatically redirects to a Reports page at the end of a screening.

Shows detailed results with metrics for each emotion shown.

**7. User Account System**
Register, verify email, log in securely using JWT tokens.

Forgot password and email verification workflows included.

## 👨‍🔬 How to Use
Start a Session

Navigate to /start-session from the dashboard.

Read the pre-screening instructions, then click “Start Screening”.

Complete the Screening

Keep the child centered and in good lighting.

The system automatically switches emotions every few seconds.

View Your Report

At the end of the screening, you’re redirected to /reports.

Review gaze patterns, pupil size, and suggested outcome.

Customize the Experience

Go to Upload Media to add your own GIFs or MP4s for any emotion.

Visit Manage Stimuli to choose which media is used for screening.


