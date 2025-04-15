from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Table, Text
from sqlalchemy.orm import relationship
from .database import Base
import datetime

user_downloads = Table(
    'user_downloads',
    Base.metadata,
    Column('user_id', String(255), ForeignKey('users.id'), primary_key=True),
    Column('song_id', String(255), ForeignKey('songs.id'), primary_key=True)
)

class User(Base):
    __tablename__ = 'users'

    id = Column(String(255), primary_key=True, index=True)
    name = Column(String(10), nullable=False)
    image = Column(String(255), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.now())

    uploads = relationship("Song", back_populates="owner")
    downloads = relationship("Song", secondary=user_downloads, back_populates="downloaded_by")

class Song(Base):
    __tablename__ = 'songs'

    id = Column(String(255), primary_key=True, index=True)
    title = Column(String(20), index=True)
    image = Column(String(255), nullable=False)
    file_url = Column(String(255), nullable=False)
    upload_date = Column(DateTime, default=datetime.datetime.now())
    duration = Column(Float, nullable=False)
    download_count = Column(Integer, default=0)
    description = Column(String(20), nullable=False)
    owner_id = Column(String(255), ForeignKey('users.id'))

    owner = relationship("User", back_populates="uploads")
    downloaded_by = relationship("User", secondary=user_downloads, back_populates="downloads")

class Payment(Base):
    __tablename__ = 'payments'

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(String(255), nullable=False, unique=True)
    user_id = Column(String(255), ForeignKey('users.id'), nullable=False)
    song_id = Column(String(255), ForeignKey('songs.id'), nullable=False)
    tid = Column(String(255), nullable=False, unique=True)
    status = Column(String(20), default="READY")
    created_at = Column(DateTime, default=datetime.datetime.now())

    user = relationship("User")
    song = relationship("Song")