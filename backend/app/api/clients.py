from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.company_membership import CompanyMembership
from app.schemas.client import (
    ClientCreateRequest,
    ClientListResponse,
    ClientResponse,
    ClientUpdateRequest,
)
from app.services.client_service import (
    create_client,
    get_client,
    list_clients,
    update_client,
    update_client_status,
)

router = APIRouter(
    prefix="/companies/{company_id}/clients",
    tags=["Clients"],
)


def validate_company_membership(
    db: Session,
    company_id: int,
    current_user,
) -> None:
    membership = (
        db.query(CompanyMembership)
        .filter(
            CompanyMembership.company_id == company_id,
            CompanyMembership.user_id == current_user.id,
            CompanyMembership.is_active.is_(True),
        )
        .first()
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this company.",
        )


@router.get(
    "",
    response_model=ClientListResponse,
)
def get_clients(
    company_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_company_membership(
        db,
        company_id,
        current_user,
    )

    return {
        "clients": list_clients(
            db,
            company_id,
        )
    }


@router.get(
    "/{client_id}",
    response_model=ClientResponse,
)
def get_client_detail(
    company_id: int,
    client_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_company_membership(
        db,
        company_id,
        current_user,
    )

    client = get_client(
        db,
        company_id,
        client_id,
    )

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found.",
        )

    return client


@router.post(
    "",
    response_model=ClientResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_client_endpoint(
    company_id: int,
    payload: ClientCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_company_membership(
        db,
        company_id,
        current_user,
    )

    try:
        return create_client(
            db,
            company_id,
            user_id=current_user.id,
            name=payload.name,
            code=payload.code,
            contact_person=payload.contact_person,
            phone=payload.phone,
            email=payload.email,
            address=payload.address,
            city=payload.city,
            state=payload.state,
            country=payload.country,
            description=payload.description,
            is_active=payload.is_active,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.put(
    "/{client_id}",
    response_model=ClientResponse,
)
def update_client_endpoint(
    company_id: int,
    client_id: int,
    payload: ClientUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_company_membership(
        db,
        company_id,
        current_user,
    )

    client = get_client(
        db,
        company_id,
        client_id,
    )

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found.",
        )

    try:
        return update_client(
            db,
            client,
            user_id=current_user.id,
            name=payload.name,
            code=payload.code,
            contact_person=payload.contact_person,
            phone=payload.phone,
            email=payload.email,
            address=payload.address,
            city=payload.city,
            state=payload.state,
            country=payload.country,
            description=payload.description,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.patch(
    "/{client_id}/status",
    response_model=ClientResponse,
)
def update_client_status_endpoint(
    company_id: int,
    client_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_company_membership(
        db,
        company_id,
        current_user,
    )

    client = get_client(
        db,
        company_id,
        client_id,
    )

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found.",
        )

    try:
        return update_client_status(
            db,
            client,
            user_id=current_user.id,
            is_active=is_active,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc