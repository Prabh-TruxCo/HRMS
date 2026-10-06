from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.company_membership import CompanyMembership
from app.schemas.team import (
    TeamCreate,
    TeamResponse,
    TeamUpdate,
)
from app.services.team_service import (
    create_team,
    get_team,
    list_teams,
    update_team,
)

router = APIRouter(
    prefix="/companies/{company_id}/teams",
    tags=["Teams"],
)


def validate_company_membership(
    db: Session,
    user_id: int,
    company_id: int,
) -> None:
    membership = (
        db.query(CompanyMembership)
        .filter(
            CompanyMembership.user_id == user_id,
            CompanyMembership.company_id == company_id,
            CompanyMembership.is_active.is_(True),
        )
        .first()
    )

    if membership is None:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this company.",
        )


@router.get(
    "",
    response_model=list[TeamResponse],
)
def get_teams(
    company_id: int,
    department_id: int | None = Query(
        default=None,
    ),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_company_membership(
        db,
        current_user.id,
        company_id,
    )

    return list_teams(
        db,
        company_id,
        department_id,
    )


@router.get(
    "/{team_id}",
    response_model=TeamResponse,
)
def get_team_by_id(
    company_id: int,
    team_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_company_membership(
        db,
        current_user.id,
        company_id,
    )

    team = get_team(
        db,
        company_id,
        team_id,
    )

    if team is None:
        raise HTTPException(
            status_code=404,
            detail="Team not found.",
        )

    return team


@router.post(
    "",
    response_model=TeamResponse,
    status_code=201,
)
def create_team_endpoint(
    company_id: int,
    payload: TeamCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_company_membership(
        db,
        current_user.id,
        company_id,
    )

    try:
        return create_team(
            db,
            company_id,
            user_id=current_user.id,
            department_id=payload.department_id,
            name=payload.name,
            code=payload.code,
            description=payload.description,
            is_active=payload.is_active,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


@router.put(
    "/{team_id}",
    response_model=TeamResponse,
)
def update_team_endpoint(
    company_id: int,
    team_id: int,
    payload: TeamUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_company_membership(
        db,
        current_user.id,
        company_id,
    )

    team = get_team(
        db,
        company_id,
        team_id,
    )

    if team is None:
        raise HTTPException(
            status_code=404,
            detail="Team not found.",
        )

    try:
        return update_team(
            db,
            team,
            user_id=current_user.id,
            company_id=company_id,
            department_id=payload.department_id,
            name=payload.name,
            code=payload.code,
            description=payload.description,
            is_active=payload.is_active,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )
