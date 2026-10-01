from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.permission import Permission


router = APIRouter(
    prefix="/permissions",
    tags=["Permissions"],
)


@router.get("")
def get_permissions(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    permissions = (
        db.query(Permission)
        .order_by(
            Permission.module.asc(),
            Permission.code.asc(),
        )
        .all()
    )

    return {
        "permissions": [
            {
                "id": permission.id,
                "code": permission.code,
                "name": permission.name,
                "description": permission.description,
                "module": permission.module,
            }
            for permission in permissions
        ]
    }