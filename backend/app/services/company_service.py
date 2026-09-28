import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.company import Company
from app.models.company_membership import CompanyMembership
from app.models.membership_role import MembershipRole
from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.models.user import User
from app.schemas.company import CompanyCreateRequest, CompanyUpdateRequest


def get_user_account(
    db: Session,
    user: User,
) -> Account:
    membership = db.scalar(
        select(CompanyMembership)
        .join(
            Company,
            Company.id == CompanyMembership.company_id,
        )
        .where(
            CompanyMembership.user_id == user.id,
            CompanyMembership.is_active.is_(True),
        )
        .order_by(CompanyMembership.id)
    )

    if not membership:
        raise ValueError("You do not belong to any company.")

    company = db.get(
        Company,
        membership.company_id,
    )

    if not company:
        raise ValueError("Your company membership is invalid.")

    account = db.get(
        Account,
        company.account_id,
    )

    if not account:
        raise ValueError("Account not found.")

    return account


def create_companies(
    db: Session,
    current_user: User,
    companies_data: list[CompanyCreateRequest],
):
    account = get_user_account(
        db,
        current_user,
    )

    permissions = db.scalars(select(Permission)).all()

    created_companies: list[Company] = []

    try:
        for data in companies_data:
            company = Company(
                account_id=account.id,
                name=data.name.strip(),
                code=data.code.strip().upper(),
                industry_type=data.industry_type.strip(),
                employee_size=data.employee_size,
                country=data.country.strip(),
            )

            db.add(company)
            db.flush()

            membership = CompanyMembership(
                user_id=current_user.id,
                company_id=company.id,
            )

            db.add(membership)
            db.flush()

            owner_role = Role(
                company_id=company.id,
                name="Owner",
                description="Full administrative access to the company.",
            )

            db.add(owner_role)
            db.flush()

            db.add(
                MembershipRole(
                    membership_id=membership.id,
                    role_id=owner_role.id,
                )
            )

            for permission in permissions:
                db.add(
                    RolePermission(
                        role_id=owner_role.id,
                        permission_id=permission.id,
                        scope="COMPANY",
                    )
                )

            created_companies.append(company)

        db.commit()

        for company in created_companies:
            db.refresh(company)

        return created_companies

    except Exception:
        db.rollback()
        raise


def get_user_companies(
    db: Session,
    current_user: User,
) -> list[Company]:
    companies = db.scalars(
        select(Company)
        .join(
            CompanyMembership,
            CompanyMembership.company_id == Company.id,
        )
        .where(
            CompanyMembership.user_id == current_user.id,
            CompanyMembership.is_active.is_(True),
            Company.is_active.is_(True),
        )
        .order_by(Company.name)
    ).all()

    return list(companies)


def get_company_for_user(
    db: Session,
    user_id: int,
    company_id: int,
) -> Company:
    membership = db.scalar(
        select(CompanyMembership).where(
            CompanyMembership.user_id == user_id,
            CompanyMembership.company_id == company_id,
            CompanyMembership.is_active.is_(True),
        )
    )

    if not membership:
        raise ValueError("You do not have access to this company.")

    company = db.get(Company, company_id)

    if not company or not company.is_active:
        raise ValueError("Company does not exist or is inactive.")

    return company


def update_company(
    db: Session,
    user_id: int,
    company_id: int,
    data: CompanyUpdateRequest,
) -> Company:
    company = get_company_for_user(
        db=db,
        user_id=user_id,
        company_id=company_id,
    )

    company.name = data.name.strip()
    company.legal_name = data.legal_name.strip() if data.legal_name else None
    company.industry_type = data.industry_type.strip()
    company.employee_size = data.employee_size
    company.country = data.country.strip()
    company.timezone = data.timezone.strip()

    db.commit()
    db.refresh(company)

    return company
