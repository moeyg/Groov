from pydantic import BaseModel
from typing import List, Optional, Literal
import datetime

# Song schema

class SongBase(BaseModel):
    title: str
    description: str

class SongCreate(SongBase):
    image: str
    file_url: str
    duration: float

class Song(SongBase):
    id: str
    image: str
    file_url: str
    upload_date: datetime.datetime
    duration: float
    download_count: int
    owner_id: str

    class Config:
        from_attributes = True


# User schema

class UserBase(BaseModel):
    name: str
    email: str

class UserCreate(UserBase):
    password: str
    image: Optional[str] = None

class User(UserBase):
    id: str
    image: Optional[str] = None
    created_at: datetime.datetime
    uploads: List[Song] = []
    downloads: List[Song] = []

    class Config:
        from_attributes = True


# Payment schema

class Payment(BaseModel):
    user_id: str
    order_id: str
    song_id: str
    tid: str
    status: str

class PaymentRequest(BaseModel):
    order_id: str
    user_id: str
    item_name: str
    quantity: Literal[1] = 1
    total_amount: Literal[200] = 200

class PaymentApproveRequest(BaseModel):
    order_id: str
    song_id: str
    tid: str
    pg_token: str
