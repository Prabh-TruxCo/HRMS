from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.industry import Industry


INDUSTRIES = [
    {
        "code": "SECURITY",
        "name": "Security Services",
        "description": "Security guarding, surveillance, patrol, and related workforce operations.",
    },
    {
        "code": "IT",
        "name": "IT / Technology",
        "description": "Software, technology, IT services, and digital workforce operations.",
    },
    {
        "code": "BPO",
        "name": "BPO / Back Office",
        "description": "Business process outsourcing, customer support, and back-office operations.",
    },
    {
        "code": "HOSPITALITY",
        "name": "Hospitality",
        "description": "Hotels, restaurants, resorts, and hospitality workforce operations.",
    },
    {
        "code": "RETAIL",
        "name": "Retail",
        "description": "Retail stores, outlets, sales, and retail workforce operations.",
    },
    {
        "code": "MANUFACTURING",
        "name": "Manufacturing",
        "description": "Factories, plants, production, and manufacturing workforce operations.",
    },
    {
        "code": "HEALTHCARE",
        "name": "Healthcare",
        "description": "Hospitals, clinics, healthcare facilities, and healthcare workforce operations.",
    },
    {
        "code": "EDUCATION",
        "name": "Education",
        "description": "Schools, colleges, universities, and education workforce operations.",
    },
    {
        "code": "LOGISTICS",
        "name": "Logistics",
        "description": "Transportation, warehousing, delivery, and logistics workforce operations.",
    },
    {
        "code": "FACILITY_MANAGEMENT",
        "name": "Facility Management",
        "description": "Housekeeping, maintenance, facility operations, and support services.",
    },
    {
        "code": "STAFFING",
        "name": "Staffing / Manpower",
        "description": "Staffing agencies, manpower supply, and workforce deployment operations.",
    },
    {
        "code": "OTHER",
        "name": "Other",
        "description": "Organizations that do not fit the available industry categories.",
    },
]


def seed_industries() -> None:
    db = SessionLocal()

    try:
        for industry_data in INDUSTRIES:
            existing_industry = db.scalar(
                select(Industry).where(
                    Industry.code == industry_data["code"]
                )
            )

            if existing_industry:
                existing_industry.name = industry_data["name"]
                existing_industry.description = industry_data["description"]
                existing_industry.is_active = True
                continue

            industry = Industry(
                code=industry_data["code"],
                name=industry_data["name"],
                description=industry_data["description"],
                is_active=True,
            )

            db.add(industry)

        db.commit()

    finally:
        db.close()


if __name__ == "__main__":
    seed_industries()
    print("Industries seeded successfully.")