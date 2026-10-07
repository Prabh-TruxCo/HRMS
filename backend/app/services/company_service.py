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
from app.models.organization_configuration import OrganizationConfiguration
from app.models.workforce_configuration import WorkforceConfiguration
from app.models.company_industry import CompanyIndustry
from app.models.industry import Industry


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
            industry_codes = list(
                dict.fromkeys(
                    code.strip().upper() for code in data.industry_codes if code.strip()
                )
            )

            if not industry_codes:
                raise ValueError(
                    f"At least one industry is required for company '{data.name}'."
                )

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
                    f"Invalid or inactive industry code(s) for "
                    f"company '{data.name}': {', '.join(missing_codes)}"
                )

            company = Company(
                account_id=account.id,
                name=data.name.strip(),
                code=data.code.strip().upper(),
                employee_size=data.employee_size,
                country=data.country.strip(),
                color=data.color,
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


def _get_company_industry_codes(
    db: Session,
    company_id: int,
) -> list[str]:
    return list(
        db.scalars(
            select(Industry.code)
            .join(
                CompanyIndustry,
                CompanyIndustry.industry_id == Industry.id,
            )
            .where(
                CompanyIndustry.company_id == company_id,
            )
            .order_by(
                CompanyIndustry.is_primary.desc(),
                Industry.name,
            )
        ).all()
    )


def get_user_companies(
    db: Session,
    current_user: User,
) -> list[dict]:
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

    return [
        {
            "id": company.id,
            "account_id": company.account_id,
            "name": company.name,
            "code": company.code,
            "industry_codes": _get_company_industry_codes(
                db,
                company.id,
            ),
            "employee_size": company.employee_size,
            "country": company.country,
            "color": company.color,
            "logo": company.logo,
            "is_active": company.is_active,
        }
        for company in companies
    ]


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


def get_company_detail(
    db: Session,
    user_id: int,
    company_id: int,
) -> dict:
    company = get_company_for_user(
        db=db,
        user_id=user_id,
        company_id=company_id,
    )

    industry_codes = _get_company_industry_codes(
        db,
        company.id,
    )

    return {
        "id": company.id,
        "account_id": company.account_id,
        "name": company.name,
        "legal_name": company.legal_name,
        "code": company.code,
        "industry_codes": list(industry_codes),
        "employee_size": company.employee_size,
        "country": company.country,
        "timezone": company.timezone,
        "color": company.color,
        "logo": company.logo,
        "is_active": company.is_active,
    }


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

    missing_codes = [code for code in industry_codes if code not in industry_by_code]

    if missing_codes:
        raise ValueError(
            f"Invalid or inactive industry code(s): " f"{', '.join(missing_codes)}"
        )

    company.name = data.name.strip()
    company.legal_name = data.legal_name.strip() if data.legal_name else None

    company.employee_size = data.employee_size
    company.country = data.country.strip()
    company.timezone = data.timezone.strip()
    company.color = data.color
    company.logo = data.logo

    # Replace company-industry mappings.
    existing_industries = db.scalars(
        select(CompanyIndustry).where(CompanyIndustry.company_id == company.id)
    ).all()

    for company_industry in existing_industries:
        db.delete(company_industry)

    db.flush()

    for index, code in enumerate(industry_codes):
        db.add(
            CompanyIndustry(
                company_id=company.id,
                industry_id=industry_by_code[code].id,
                is_primary=index == 0,
            )
        )

    db.commit()
    db.refresh(company)

    return company


def get_company_setup_status(
    db: Session,
    user: User,
    company_id: int,
) -> dict:
    company = get_company_for_user(
        db=db,
        user_id=user.id,
        company_id=company_id,
    )

    # ---------------------------------------------------------
    # 1. Company Profile
    # ---------------------------------------------------------
    has_industry = (
        db.scalar(
            select(CompanyIndustry.id)
            .where(CompanyIndustry.company_id == company.id)
            .limit(1)
        )
        is not None
    )

    profile = bool(
        company.name
        and company.code
        and has_industry
        and company.employee_size
        and company.country
        and company.timezone
    )

    # ---------------------------------------------------------
    # 2. Company Branding
    # ---------------------------------------------------------
    branding = bool(company.logo or company.color)

    # ---------------------------------------------------------
    # 3. Organization Setup
    # ---------------------------------------------------------
    organization_configuration = (
        db.query(OrganizationConfiguration)
        .filter(OrganizationConfiguration.company_id == company.id)
        .first()
    )

    organization = organization_configuration is not None

    # ---------------------------------------------------------
    # 4. Workforce Setup
    # ---------------------------------------------------------
    workforce_configuration = (
        db.query(WorkforceConfiguration)
        .filter(WorkforceConfiguration.company_id == company.id)
        .first()
    )

    workforce = workforce_configuration is not None

    # ---------------------------------------------------------
    # Calculate Setup Progress
    # ---------------------------------------------------------
    sections = [
        profile,
        branding,
        organization,
        workforce,
    ]

    completed_sections = sum(sections)
    total_sections = len(sections)

    percentage = round((completed_sections / total_sections) * 100)

    return {
        "profile": profile,
        "branding": branding,
        "organization": organization,
        "workforce": workforce,
        "completed_sections": completed_sections,
        "total_sections": total_sections,
        "percentage": percentage,
    }
