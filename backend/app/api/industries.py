from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.industry import Industry
from app.schemas.industry import IndustryResponse


router = APIRouter(
    prefix="/industries",
    tags=["Industries"],
)


@router.get("", response_model=list[IndustryResponse])
def get_industries(
    db: Session = Depends(get_db),
):
    industries = db.scalars(
        select(Industry)
        .where(Industry.is_active.is_(True))
        .order_by(Industry.name)
    ).all()

    return industries