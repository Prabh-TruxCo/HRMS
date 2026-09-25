import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.models.account import Account
from app.models.company import Company
from app.models.company_membership import CompanyMembership
from app.models.membership_role import MembershipRole
from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.models.user import User
from app.schemas.auth import RegisterRequest


def generate_company_code(company_name: str) -> str:
    """
    Convert a company name into a simple company code.

    Example:
    "Truxco Technologies" -> "TRUXCO-TECHNOLOGIES"
    """
    code = re.sub(r"[^A-Za-z0-9]+", "-", company_name)
    code = code.strip("-").upper()

    return code[:50]


def register_customer(
    db: Session,
    data: RegisterRequest,
):
    email = str(data.email).strip().lower()

    # 1. Check whether the email is already registered.
    existing_user = db.scalar(select(User).where(User.email == email))

    if existing_user:
        raise ValueError("An account with this email already exists.")

    try:
        # 2. Create user
        user = User(
            email=email,
            password_hash=hash_password(data.password),
            first_name=data.first_name.strip(),
            last_name=data.last_name.strip() if data.last_name else None,
        )

        db.add(user)
        db.flush()

        # 3. Create customer account
        account = Account(
            name=data.account_name.strip(),
            contact_email=email,
        )

        db.add(account)
        db.flush()

        # 4. Create first company
        company = Company(
            account_id=account.id,
            name=data.company_name.strip(),
            code=generate_company_code(data.company_name),
            industry_type=data.industry_type.strip(),
            employee_size=data.employee_size,
            country=data.country.strip(),
        )

        db.add(company)
        db.flush()

        # 5. Give the user access to the company
        membership = CompanyMembership(
            user_id=user.id,
            company_id=company.id,
        )

        db.add(membership)
        db.flush()

        # 6. Create the initial Owner role
        owner_role = Role(
            company_id=company.id,
            name="Owner",
            description="Full administrative access to the company.",
        )

        db.add(owner_role)
        db.flush()

        # 7. Connect membership to Owner role
        membership_role = MembershipRole(
            membership_id=membership.id,
            role_id=owner_role.id,
        )

        db.add(membership_role)

        # 8. Give Owner all currently available permissions
        permissions = db.scalars(select(Permission)).all()

        for permission in permissions:
            db.add(
                RolePermission(
                    role_id=owner_role.id,
                    permission_id=permission.id,
                    scope="COMPANY",
                )
            )

        # 9. Commit everything together
        db.commit()

        # 10. Refresh created records
        db.refresh(user)
        db.refresh(account)
        db.refresh(company)

        # 11. Create JWT
        access_token = create_access_token(user.id)

        return {
            "message": "Account created successfully.",
            "user_id": user.id,
            "account_id": account.id,
            "company_id": company.id,
            "access_token": access_token,
        }

    except Exception:
        db.rollback()
        raise
