import os
import smtplib
import random
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from fastapi import FastAPI, Depends, HTTPException, status, Form, WebSocket, APIRouter, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, Column, Integer, String, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.sql import sqltypes
from dotenv import load_dotenv
from typing import List, Literal, Optional
import numpy as np
from collections import defaultdict
import base64
import cv2

# Load environment variables
load_dotenv()

# Environment config
DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
FROM_EMAIL = os.getenv("FROM_EMAIL")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
FROM_NAME = os.getenv("FROM_NAME")

# DB setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# FastAPI app
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth2 for token validation
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app.mount("/stimuli", StaticFiles(directory="uploads"), name="stimuli")

# JWT token generator
def create_access_token(data: dict, expires_delta: timedelta = timedelta(minutes=30)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Email sender
def send_email(recipient: str, subject: str, body: str):
    msg = MIMEMultipart()
    msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg["To"] = recipient
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(FROM_EMAIL, EMAIL_PASSWORD)
        server.send_message(msg)

# DB model
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String)
    is_verified = Column(Boolean, default=False)
    verification_code = Column(String, nullable=True)

# ScreeningSession DB Model
class ScreeningSession(Base):
    __tablename__ = "screening_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    timestamp = Column(DateTime(timezone=True))  # <-- Add timezone=True
    stimulus = Column(String)
    gaze_direction = Column(String)
    left_pupil_size = Column(Float)
    right_pupil_size = Column(Float)
    asd_flag = Column(String)


class StimulusMedia(Base):
    __tablename__ = "stimulus_media"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String)
    mood = Column(String)
    media_type = Column(String)  # e.g., 'video' or 'gif'
    uploaded_at = Column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(bind=engine)

# Pydantic models
class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None

class EmailRequest(BaseModel):
    email: EmailStr

class ScreeningPayload(BaseModel):
    timestamp: str  # ISO format datetime string
    stimulus: str
    frame: str  # base64-encoded JPEG


class ScreeningSessionOut(BaseModel):
    timestamp: datetime
    stimulus: str
    gaze_direction: str
    left_pupil_size: float
    right_pupil_size: float
    asd_flag: str

    class Config:
        orm_mode = True


class ScreeningDecisionOut(BaseModel):
    sessions: List[ScreeningSessionOut]
    decision: Literal[
        "Signs of ASD detected",
        "No concerning signs detected",
        "No data available"  # ✅ Add this line
    ]


class CustomStimulusUpload(BaseModel):
    mood: str
    file_url: str  # frontend will upload to S3/cloud and send the URL here


class StimulusMediaOut(BaseModel):
    id: int
    filename: str
    mood: str
    media_type: str
    uploaded_at: datetime

    class Config:
        orm_mode = True

class CustomStimulusOut(BaseModel):
    id: int
    user_id: int
    filename: str
    mood: str
    media_type: str
    uploaded_at: datetime

    class Config:
        from_attributes = True  # use this instead of orm_mode in Pydantic v2




# DB session dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Token authentication dependency
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user

# OpenCV pupil analysis (no numpy)
def analyze_pupils(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_array = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_array is None:
        return "unknown", 0.0, 0.0

    gray = cv2.cvtColor(img_array, cv2.COLOR_BGR2GRAY)
    gray = cv2.medianBlur(gray, 5)
    _, thresh = cv2.threshold(gray, 30, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    pupil_sizes = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if 30 < area < 300:
            (x, y), radius = cv2.minEnclosingCircle(cnt)
            pupil_sizes.append(radius * 2)

    if len(pupil_sizes) >= 2:
        left, right = pupil_sizes[0], pupil_sizes[1]
    elif len(pupil_sizes) == 1:
        left = right = pupil_sizes[0]
    else:
        left = right = 0.0

    gaze = "center" if abs(left - right) < 2 else ("left" if left > right else "right")
    return gaze, left, right

# Endpoints
@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = pwd_context.hash(user.password)
    code = str(random.randint(1000, 9999))

    db_user = User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        hashed_password=hashed_password,
        role=user.role,
        verification_code=code,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    send_email(user.email, "Verify your email", f"Your NeuroLook verification code is: {code}")
    return {"message": "User created. Please verify your email."}

@app.post("/send-reset-code")
def send_reset_code(email: EmailStr, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    code = str(random.randint(1000, 9999))
    user.verification_code = code
    db.commit()

    send_email(email, "Reset Your Password", f"Your password reset code is: {code}")
    return {"message": "Reset code sent."}

@app.post("/reset-password")
def reset_password(
    email: EmailStr = Form(...),
    code: str = Form(...),
    new_password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == email, User.verification_code == code).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid code or email")

    user.hashed_password = pwd_context.hash(new_password)
    user.verification_code = None
    db.commit()
    return {"message": "Password updated successfully."}

@app.post("/verify-email")
def verify_email(email: EmailStr = Form(...), code: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email, User.verification_code == code).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    user.is_verified = True
    user.verification_code = None
    db.commit()
    return {"message": "Email verified successfully."}

@app.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    print("🔑 Login attempt:", form_data.username)

    user = db.query(User).filter(User.email == form_data.username).first()

    if not user:
        print("❌ User not found")
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not pwd_context.verify(form_data.password, user.hashed_password):
        print("❌ Password mismatch")
        print("🔍 Input password:", form_data.password)
        print("🔐 Stored hash:", user.hashed_password)
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not user.is_verified:
        print("⚠️ Email not verified")
        raise HTTPException(status_code=400, detail="Email not verified")

    print("✅ User verified, issuing token")

    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/me")
def read_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "email": current_user.email,
        "role": current_user.role,
        "is_verified": current_user.is_verified
    }

@app.post("/verify-reset-code")
def verify_reset_code(email: EmailStr = Form(...), code: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email, User.verification_code == code).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid reset code.")
    return {"message": "Code verified. Proceed to reset password."}


@app.post("/api/send-reset-code")
def send_reset_code_json(request: EmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    reset_code = str(random.randint(1000, 9999))
    user.verification_code = reset_code
    db.commit()
    send_email(user.email, "Reset Your Password", f"Your password reset code is: {reset_code}")
    return {"message": "Reset code sent."}


@app.websocket("/ws/screening")
async def screening_ws(websocket: WebSocket):
    await websocket.accept()
    db = None

    try:
        auth_msg = await websocket.receive_json()
        token = auth_msg.get("token")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")

        db = SessionLocal()
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise ValueError("User not found")
        user_id = user.id

        buffer = defaultdict(list)
        current_stimulus = None

        while True:
            raw = await websocket.receive_json()
            data = ScreeningPayload(**raw)
            image_data = base64.b64decode(data.frame)
            gaze, left, right = analyze_pupils(image_data)

            if current_stimulus and data.stimulus != current_stimulus:
                # Calculate and store average of previous stimulus
                records = buffer[current_stimulus]
                if records:
                    avg_left = sum(r[1] for r in records) / len(records)
                    avg_right = sum(r[2] for r in records) / len(records)
                    common_gaze = max(set(r[0] for r in records), key=lambda g: sum(1 for x in records if x[0] == g))
                    asd = "high" if avg_left < 2 and avg_right < 2 else "low"

                    db.add(ScreeningSession(
                        user_id=user_id,
                        timestamp=datetime.fromisoformat(data.timestamp),
                        stimulus=current_stimulus,
                        gaze_direction=common_gaze,
                        left_pupil_size=avg_left,
                        right_pupil_size=avg_right,
                        asd_flag=asd
                    ))
                    db.commit()

                buffer.pop(current_stimulus, None)

            current_stimulus = data.stimulus
            buffer[data.stimulus].append((gaze, left, right))

            await websocket.send_json({"status": "ok", "gaze": gaze, "asd": "..."})

    except Exception as e:
        print("WebSocket error:", e)
        try:
            await websocket.close()
        except RuntimeError:
            pass
    finally:
        if db:
            db.close()




@app.get("/screening-sessions", response_model=ScreeningDecisionOut)
def get_user_screening_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(ScreeningSession)\
        .filter(ScreeningSession.user_id == current_user.id)\
        .order_by(ScreeningSession.timestamp.desc())\
        .all()

    if not sessions:
        return {"sessions": [], "decision": "No data available"}

    # --- Analysis ---
    avg_pupil_sizes = [
        (s.left_pupil_size + s.right_pupil_size) / 2
        for s in sessions
        if s.left_pupil_size is not None and s.right_pupil_size is not None
    ]
    average_pupil = sum(avg_pupil_sizes) / len(avg_pupil_sizes) if avg_pupil_sizes else 0.0

    gaze_values = [s.gaze_direction for s in sessions]
    center_gaze_count = gaze_values.count("center")
    gaze_consistency_ratio = center_gaze_count / len(gaze_values) if gaze_values else 0.0

    # --- Rule-based Decision ---
    if average_pupil < 2.0 and gaze_consistency_ratio < 0.6:
        decision = "Signs of ASD detected"
    else:
        decision = "No concerning signs detected"

    return {"sessions": sessions, "decision": decision}


@app.post("/upload-stimulus")
async def upload_stimulus(
    mood: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contents = await file.read()

    # Generate a filename
    filename = f"{datetime.utcnow().isoformat().replace(':', '-')}_{file.filename}"
    save_path = os.path.join("uploads", filename)

    # Save to disk
    os.makedirs("uploads", exist_ok=True)
    with open(save_path, "wb") as f:
        f.write(contents)

    # Save reference to DB
    media = StimulusMedia(
        user_id=current_user.id,
        filename=filename,
        mood=mood,
        media_type="video" if file.content_type.startswith("video") else "gif"
    )
    db.add(media)
    db.commit()
    db.refresh(media)

    return {
        "message": "Upload successful",
        "mood": mood,
        "filename": filename,
        "media_type": media.media_type
    }

# ✅ 6. Optional: Get all user's custom stimuli
@app.get("/my-stimuli", response_model=List[CustomStimulusOut])
def get_my_stimuli(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    records = db.query(StimulusMedia).filter(StimulusMedia.user_id == current_user.id).all()
    return records



@app.get("/")
def root():
    return {"message": "Backend is running"}
