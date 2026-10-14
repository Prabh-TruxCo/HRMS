from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.company import Company
from app.models.post import Post
from app.models.site import Site
from app.services.audit_log_service import AuditLogService


def _get_account_id(db: Session, company_id: int) -> int:
    company = db.get(Company, company_id)

    if company is None:
        raise ValueError("Company not found.")

    return company.account_id


def _validate_site(
    db: Session,
    company_id: int,
    site_id: int,
) -> Site:
    site = (
        db.query(Site)
        .filter(
            Site.id == site_id,
            Site.company_id == company_id,
        )
        .first()
    )

    if site is None:
        raise ValueError(
            "The selected site does not belong to this company."
        )

    if not site.is_active:
        raise ValueError("The selected site is inactive.")

    return site


def list_posts(
    db: Session,
    company_id: int,
    *,
    page: int = 1,
    page_size: int = 10,
    search: str | None = None,
) -> tuple[list[Post], int]:
    query = (
        db.query(Post)
        .outerjoin(Site, Post.site_id == Site.id)
        .filter(Post.company_id == company_id)
    )

    if search and search.strip():
        term = f"%{search.strip()}%"

        query = query.filter(
            or_(
                Post.name.ilike(term),
                Post.code.ilike(term),
                Post.description.ilike(term),
                Site.name.ilike(term),
            )
        )

    total = query.count()

    posts = (
        query.order_by(Post.name.asc(), Post.id.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return posts, total


def get_post(
    db: Session,
    company_id: int,
    post_id: int,
) -> Post | None:
    return (
        db.query(Post)
        .filter(
            Post.id == post_id,
            Post.company_id == company_id,
        )
        .first()
    )



def _audit_values(post: Post) -> dict:
    return {
        "site_id": post.site_id,
        "name": post.name,
        "code": post.code,
        "description": post.description,
        "latitude": post.latitude,
        "longitude": post.longitude,
        "geofence_radius": post.geofence_radius,
        "is_geofence_enabled": post.is_geofence_enabled,
        "is_active": post.is_active,
    }



def create_post(
    db: Session,
    company_id: int,
    *,
    user_id: int,
    site_id: int,
    name: str,
    code: str | None = None,
    description: str | None = None,
    is_active: bool = True,
    latitude: float | None = None,
longitude: float | None = None,
geofence_radius: int | None = None,
is_geofence_enabled: bool = False,
) -> Post:
    _validate_site(db, company_id, site_id)

    post = Post(
        company_id=company_id,
        site_id=site_id,
        name=name.strip(),
        code=code.strip() if code and code.strip() else None,
        description=(
            description.strip()
            if description and description.strip()
            else None
        ),
        is_active=is_active,
        latitude=latitude,
longitude=longitude,
geofence_radius=geofence_radius,
is_geofence_enabled=is_geofence_enabled,
    )

    db.add(post)

    try:
        db.flush()

        account_id = _get_account_id(db, company_id)

        AuditLogService(db).log(
            user_id=user_id,
            account_id=account_id,
            company_id=company_id,
            module="ORGANIZATION",
            entity_type="POST",
            entity_id=post.id,
            action="CREATED",
            description=f"Post '{post.name}' was created.",
            new_values=_audit_values(post),
        )

        db.commit()
        db.refresh(post)

    except IntegrityError as exc:
        db.rollback()
        raise ValueError(
            "A post with this name already exists at this site."
        ) from exc
    except Exception:
        db.rollback()
        raise

    return post


def update_post(
    db: Session,
    post: Post,
    *,
    user_id: int,
    site_id: int,
    name: str,
    code: str | None = None,
    description: str | None = None,
    latitude: float | None = None,
longitude: float | None = None,
geofence_radius: int | None = None,
is_geofence_enabled: bool = False,
    is_active: bool,
) -> Post:
    _validate_site(db, post.company_id, site_id)

    old_values = _audit_values(post)

    post.site_id = site_id
    post.name = name.strip()
    post.code = code.strip() if code and code.strip() else None
    post.description = (
        description.strip()
        if description and description.strip()
        else None
    )
    post.latitude = latitude
    post.longitude = longitude
    post.geofence_radius = geofence_radius
    post.is_geofence_enabled = is_geofence_enabled
    post.is_active = is_active

    new_values = _audit_values(post)

    try:
        db.flush()

        account_id = _get_account_id(db, post.company_id)

        if old_values != new_values:
            if old_values["is_active"] != post.is_active:
                action = "ENABLED" if post.is_active else "DISABLED"
            else:
                action = "UPDATED"

            AuditLogService(db).log(
                user_id=user_id,
                account_id=account_id,
                company_id=post.company_id,
                module="ORGANIZATION",
                entity_type="POST",
                entity_id=post.id,
                action=action,
                description=f"Post '{post.name}' was {action.lower()}.",
                old_values=old_values,
                new_values=new_values,
            )

        db.commit()
        db.refresh(post)

    except IntegrityError as exc:
        db.rollback()
        raise ValueError(
            "A post with this name already exists at this site."
        ) from exc
    except Exception:
        db.rollback()
        raise

    return post


def update_post_status(
    db: Session,
    post: Post,
    *,
    user_id: int,
    is_active: bool,
) -> Post:
    if post.is_active == is_active:
        return post

    old_values = _audit_values(post)
    post.is_active = is_active
    new_values = _audit_values(post)

    try:
        account_id = _get_account_id(db, post.company_id)

        action = "ENABLED" if is_active else "DISABLED"
        description = (
            f"Post '{post.name}' was enabled."
            if is_active
            else f"Post '{post.name}' was disabled."
        )

        AuditLogService(db).log(
            user_id=user_id,
            account_id=account_id,
            company_id=post.company_id,
            module="ORGANIZATION",
            entity_type="POST",
            entity_id=post.id,
            action=action,
            description=description,
            old_values=old_values,
            new_values=new_values,
        )

        db.commit()
        db.refresh(post)

    except Exception:
        db.rollback()
        raise

    return post