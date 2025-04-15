import os
import uuid
import requests
import urllib.parse
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Request, Response, APIRouter, Query
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from pathlib import Path
from dotenv import load_dotenv
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from sqlalchemy import delete
from sqlalchemy.orm import Session
from mutagen.mp3 import MP3

from app.database.models import User, Song, Payment, user_downloads
from app.database.schemas import User as UserSchema, Song as SongSchema, PaymentRequest, PaymentApproveRequest
from app.database.database import engine, Base, get_db

app = FastAPI()

load_dotenv()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 구글 로그인 환경 변수
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

# JWT 환경 변수
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_REFRESH_SECRET_KEY = os.getenv("JWT_REFRESH_SECRET_KEY")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7

# 카카오페이 환경 변수
CID = os.getenv("CID")
KAKAO_DEV_KEY = os.getenv("KAKAO_DEV_KEY")
REDIRECT_BASE_URL = os.getenv("REDIRECT_BASE_URL")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

Base.metadata.create_all(bind=engine)

BASE_DIR = Path(__file__).resolve().parent
MEDIA_DIR = BASE_DIR / "media"
AUDIO_DIR = MEDIA_DIR / "audio"
IMAGE_DIR = MEDIA_DIR / "image"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)
IMAGE_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
    response.headers['Cross-Origin-Opener-Policy'] = 'same-origin-allow-popups'
    response.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
    return response

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_REFRESH_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")

        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        return user

    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

# 구글 로그인
@app.post("/user")
async def google_auth(request: Request, response: Response, db: Session = Depends(get_db)):
    try:
        data = await request.json()
        token = data.get("token")
        id_info = id_token.verify_oauth2_token(
            token,
            google_requests.Request(), GOOGLE_CLIENT_ID, clock_skew_in_seconds=10
        )
        user_data = {
            "id": id_info["sub"],
            "name": id_info["name"],
            "email": id_info["email"],
            "image": id_info["picture"],
        }
        user = db.query(User).filter(User.email == user_data["email"]).first()
        if not user:
            new_user = User(
                id=user_data["id"],
                name=user_data["name"],
                image=user_data["image"],
                email=user_data["email"],
                created_at=datetime.now()
            )
            try:
                db.add(new_user)
                db.commit()
                db.refresh(new_user)
            except Exception as e:
                db.rollback()
                raise HTTPException(status_code=500, detail=f"DB Error: {str(e)}")

        current_time = datetime.now(timezone.utc)
        access_token = create_access_token(
            data={"sub": user_data["id"]},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        refresh_token = create_refresh_token(
            data={"sub": user_data["id"], "iat": current_time.timestamp()},
            expires_delta=timedelta(days=7)
        )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=False,
            samesite="Lax",
        )

        return {
            "user": {
                "id": user_data["id"],
                "name": user_data["name"],
                "image": user_data["image"]
            },
            "token": access_token
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid Token: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server Error: {e}")

# 유저 업로드 리스트 조회
@app.get("/profile")
async def get_user_profile(user: User = Depends(verify_token), db: Session = Depends(get_db)):
    user_data = db.query(User).filter(User.id == user.id).first()
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    user_uploads = db.query(Song).filter(Song.owner_id == user.id).all()

    return {
        "user": {
            "id": user_data.id,
            "name": user_data.name,
            "image": user_data.image,
            "createDate": user_data.created_at.strftime("%Y-%m-%d")
        },
        "uploads": user_uploads
    }

# 유저 탈퇴
@app.delete("/delete")
async def delete_user(user: User = Depends(verify_token), db: Session = Depends(get_db)):
    try:
        db_user = db.query(User).filter(User.id == user.id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")
        db.query(Song).filter(Song.owner_id == user.id).delete()
        db.delete(db_user)
        db.commit()

        return {"message": "User deleted successfully."}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")

# 전체 음원 데이터 조회
@app.get("/songs")
async def get_songs(db: Session = Depends(get_db)):
    songs = db.query(Song).all()
    db_songs = []
    for song in songs:
        db_songs.append({
            "id": song.id,
            "title": song.title,
            "image": f"{song.image}",
            "fileUrl": f"{song.file_url}",
            "description": song.description,
            "duration": song.duration,
            "uploadDate": song.upload_date.strftime("%Y-%m-%d"),
            "downloadCount": song.download_count,
        })

    return {"data": db_songs}

# 음원 검색
@app.get("/song")
async def search_songs(
    search: str = Query(None, min_length=1, max_length=50),
    db: Session = Depends(get_db)
):
    try:
        if search:
            results = (
                db.query(Song)
                .filter(Song.title.ilike(f"%{search}%"))
                .all()
            )
        else:
            results = db.query(Song).all()
        if not results: return {"data": []}

        songs = [
            {
                "id": song.id,
                "title": song.title,
                "image": song.image,
                "description": song.description,
                "duration": song.duration,
                "uploadDate": song.upload_date.strftime("%Y-%m-%d"),
                "downloadCount": song.download_count,
                #"fileUrl": song.file_url,
            }
            for song in results
        ]

        return {"data": songs}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")

# 음원 파일 업로드
@app.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_song(
    title: str = Form(...),
    audio_file: UploadFile = File(...),
    image_file: UploadFile = File(...),
    user: User = Depends(verify_token),
    db: Session = Depends(get_db),
):
    try:
        file_ext = os.path.splitext(audio_file.filename)[1]
        image_ext = os.path.splitext(image_file.filename)[1]
        unique_id = str(uuid.uuid4().hex)[:8]

        audio_filename = f"{title}_{unique_id}{file_ext}"
        image_filename = f"{title}_{unique_id}{image_ext}"
        audio_path = AUDIO_DIR / audio_filename
        image_path = IMAGE_DIR / image_filename

        with audio_path.open("wb") as buffer:
            buffer.write(await audio_file.read())
        with image_path.open("wb") as buffer:
            buffer.write(await image_file.read())

        try:
            audio = MP3(str(audio_path))
            duration = audio.info.length
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"MP3 처리 오류: {str(e)}")

        new_song = Song(
            id=unique_id,
            title=title,
            image=f"/media/image/{image_filename}",
            file_url=f"/media/audio/{audio_filename}",
            upload_date=datetime.now(),
            duration=duration,
            download_count=0,
            description=user.name,
            owner_id=user.id,
        )
        db.add(new_song)
        db.commit()
        db.refresh(new_song)

        return {"song_id": new_song.id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"업로드 실패: {str(e)}")
    
# 음원 파일 수정
@app.put("/song/{song_id}")
async def edit_song(
    song_id: str,
    title: str = Form(...),
    image_file: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    song = db.query(Song).filter(Song.id == song_id).first()
    if not song:
        raise HTTPException(status_code=404, detail="음원을 찾을 수 없습니다.")

    song.title = title
    if image_file:
        old_image_path = Path(song.image)
        if old_image_path.exists(): os.remove(old_image_path)

        image_ext = os.path.splitext(image_file.filename)[1]
        unique_id = str(uuid.uuid4().hex)[:8]
        image_filename = f"{title}_{unique_id}{image_ext}"
        image_path = IMAGE_DIR / image_filename

        with image_path.open("wb") as buffer:
            buffer.write(await image_file.read())

        song.image = f"/media/image/{image_filename}"

    song.upload_date = datetime.now()
    db.commit()
    db.refresh(song)

    return {"song_id": song.id}

# 음원 파일 삭제
@app.delete("/song/{song_id}")
async def delete_song(
    song_id: str,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db),
):
    song = db.query(Song).filter(Song.id == song_id, Song.owner_id == user.id).first()
    if not song:
        raise HTTPException(status_code=404, detail="노래를 찾을 수 없습니다.")

    audio_path = AUDIO_DIR / Path(song.file_url).name
    image_path = IMAGE_DIR / Path(song.image).name

    if audio_path.exists(): os.remove(audio_path)
    if image_path.exists(): os.remove(image_path)

    db.execute(delete(user_downloads).where(user_downloads.c.song_id == song_id))

    db.delete(song)
    db.commit()

    return {"detail": "음원이 삭제되었습니다."}

# 카카오페이 결제 준비 요청
@app.post("/payment/ready")
async def payment_ready(
    request: PaymentRequest,
    user: User = Depends(verify_token), 
    db: Session = Depends(get_db)
):
    headers = {
        "Authorization": f"SECRET_KEY {KAKAO_DEV_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "cid": CID,
        "partner_order_id": request.order_id,
        "partner_user_id": user.id,
        "item_name": request.item_name,
        "quantity": "1",
        "total_amount": "200",
        "tax_free_amount": "0",
        "approval_url": f"{REDIRECT_BASE_URL}/payment/success",
        "cancel_url": f"{REDIRECT_BASE_URL}/payment/cancel",
        "fail_url": f"{REDIRECT_BASE_URL}/payment/fail",
    }

    try:
        response = requests.post(
            "https://open-api.kakaopay.com/online/v1/payment/ready",
            headers=headers,
            json=data,
        )
        result = response.json()
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail=result)
        
        payment = Payment(
            order_id=request.order_id,
            user_id=user.id,
            song_id=request.order_id.split("_")[1],
            tid=result["tid"],
            status="READY"
        )
        db.add(payment)
        db.commit()

        return {
            "tid": result["tid"],
            "next_redirect_pc_url": result["next_redirect_pc_url"],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 카카오페이 결제 승인 요청
@app.post("/payment/approve")
async def payment_approve(
    request: PaymentApproveRequest, 
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    headers = {
        "Authorization": f"SECRET_KEY {KAKAO_DEV_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "cid": CID,
        "tid": request.tid,
        "partner_order_id": request.order_id,
        "partner_user_id": user.id,
        "pg_token": request.pg_token,
    }

    try:
        payment = db.query(Payment).filter(Payment.tid == request.tid).first()
        if not payment:
            raise HTTPException(status_code=404, detail="결제 정보를 찾을 수 없습니다.")

        if payment.status == "COMPLETED":
            return {"data": "payment_success"}

        response = requests.post(
            "https://open-api.kakaopay.com/online/v1/payment/approve",
            headers=headers,
            json=data,
        )
        result = response.json()
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail=result)

        payment.status = "COMPLETED"
        db.commit()

        db_user = db.query(User).filter(User.id == user.id).first()
        song = db.query(Song).filter(Song.id == request.song_id).first()
        if not song:
            raise HTTPException(status_code=404, detail="음원을 찾을 수 없습니다.")

        db_user.downloads.append(song)
        db.commit()

        return {"data": "payment_success"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 음원 다운로드
@app.get("/downloading/{song_id}")
async def download_song(
    song_id: str,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    if not song_id or song_id == "null":
        raise HTTPException(status_code=400, detail="잘못된 요청입니다.")

    song = db.query(Song).filter(Song.id == song_id).first()
    if not song:
        raise HTTPException(status_code=404, detail="음원을 찾을 수 없습니다.")

    if song_id not in [download.id for download in user.downloads]:
        raise HTTPException(status_code=403, detail="결제가 필요합니다.")

    file_path = f"{AUDIO_DIR}/{Path(song.file_url).name}"

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"파일을 찾을 수 없습니다: {file_path}")

    encoded_filename = urllib.parse.quote(f"{song.title}.mp3")

    return FileResponse(
        file_path,
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"
        }
    )

# 유저 다운로드 리스트 조회
@app.get("/downloads/{user_id}")
async def get_user_downloads(
    user_id: str,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    if user.id != user_id:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")

    db_user = db.query(User).filter(User.id == user.id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    return db_user.downloads