from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)


def test_database_connection():
    with engine.connect():
        print("Database connection successful")


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
