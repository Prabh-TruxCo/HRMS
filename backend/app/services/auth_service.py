from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.account import Account
from app.models.company import Company
from app.models.company_industry import CompanyIndustry
from app.models.company_membership import CompanyMembership
from app.models.industry import Industry
from app.models.membership_role import MembershipRole
from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.models.user import User
from app.schemas.auth import RegisterRequest


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

        industry_codes = list(
            dict.fromkeys(
                code.strip().upper() for code in data.industry_codes if code.strip()
            )
        )

        if not industry_codes:
            raise ValueError("At least one industry is required.")

        industries = db.scalars(
            select(Industry).where(
                Industry.code.in_(industry_codes),
                Industry.is_active.is_(True),
            )
        ).all()

        industry_by_code = {industry.code: industry for industry in industries}

        missing_codes = [
            code for code in industry_codes if code not in industry_by_code
        ]

        if missing_codes:
            raise ValueError(
                f"Invalid or inactive industry code(s): {', '.join(missing_codes)}"
            )

        # 4. Create first company
        # 4. Create first company
        company = Company(
            account_id=account.id,
            name=data.company_name.strip(),
            code=data.company_code.strip().upper(),
            employee_size=data.employee_size,
            country=data.country.strip(),
            color=data.color,
            logo=data.logo,
        )

        db.add(company)
        db.flush()

        for index, code in enumerate(industry_codes):
            db.add(
                CompanyIndustry(
                    company_id=company.id,
                    industry_id=industry_by_code[code].id,
                    is_primary=index == 0,
                )
            )

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


def login_user(
    db: Session,
    email: str,
    password: str,
) -> dict:
    user = db.scalar(select(User).where(User.email == email.strip().lower()))

    if not user:
        raise ValueError("Invalid email or password.")

    if not user.is_active:
        raise ValueError("Your account is inactive.")

    if not verify_password(
        password,
        user.password_hash,
    ):
        raise ValueError("Invalid email or password.")

    access_token = create_access_token(
        user_id=user.id,
    )

    return {
        "user": user,
        "access_token": access_token,
    }
