from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.api.organization_access import validate_organization_module_access
from app.schemas.post import (
    PostCreateRequest,
    PostListResponse,
    PostResponse,
    PostUpdateRequest,
)
from app.services.post_service import (
    create_post,
    get_post,
    list_posts,
    update_post,
    update_post_status,
)

router = APIRouter(
    prefix="/companies/{company_id}/posts",
    tags=["Posts"],
)


@router.get("", response_model=PostListResponse)
def get_posts(
    company_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = Query(None, max_length=150),
    site_id: int | None = Query(None, ge=1),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_organization_module_access(
        db,
        company_id,
        current_user,
        "posts_enabled",
    )

    posts, total = list_posts(
        db,
        company_id,
        page=page,
        page_size=page_size,
        search=search,
        site_id=site_id,
    )

    return {
        "posts": posts,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": ceil(total / page_size) if total else 0,
    }


@router.get("/{post_id}", response_model=PostResponse)
def get_post_detail(
    company_id: int,
    post_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    validate_organization_module_access(
        db,
        company_id,
        current_user,
        "posts_enabled",
    )

    post = get_post(db, company_id, post_id)

    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found.",
        )

    return post


@router.post(
    "",
    response_model=PostResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_post_endpoint(
    company_id: int,
    payload: PostCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_organization_module_access(
        db,
        company_id,
        current_user,
        "posts_enabled",
    )

    try:
        return create_post(
            db,
            company_id,
            user_id=current_user.id,
            **payload.model_dump(),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.put("/{post_id}", response_model=PostResponse)
def update_post_endpoint(
    company_id: int,
    post_id: int,
    payload: PostUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_organization_module_access(
        db,
        company_id,
        current_user,
        "posts_enabled",
    )

    post = get_post(db, company_id, post_id)

    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found.",
        )

    try:
        return update_post(
            db,
            post,
            user_id=current_user.id,
            **payload.model_dump(),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.patch("/{post_id}/status", response_model=PostResponse)
def update_post_status_endpoint(
    company_id: int,
    post_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_organization_module_access(
        db,
        company_id,
        current_user,
        "posts_enabled",
    )

    post = get_post(db, company_id, post_id)

    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found.",
        )

    return update_post_status(
        db,
        post,
        user_id=current_user.id,
        is_active=is_active,
    )
