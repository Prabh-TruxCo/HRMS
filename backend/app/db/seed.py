from sqlalchemy import select

from app.core.permissions import PERMISSIONS
from app.db.session import SessionLocal
from app.models.permission import Permission


def seed_permissions() -> None:
    db = SessionLocal()

    try:
        for permission_data in PERMISSIONS:
            existing_permission = db.scalar(
                select(Permission).where(Permission.code == permission_data["code"])
            )

            if existing_permission:
                existing_permission.name = permission_data["name"]
                existing_permission.description = permission_data["description"]
                existing_permission.module = permission_data["module"]
                continue

            permission = Permission(
                code=permission_data["code"],
                name=permission_data["name"],
                description=permission_data["description"],
                module=permission_data["module"],
            )

            db.add(permission)

        db.commit()

    finally:
        db.close()


if __name__ == "__main__":
    seed_permissions()
    print("Permissions seeded successfully.")
