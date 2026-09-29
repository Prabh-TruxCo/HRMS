from sqlalchemy.orm import Session

from app.models.organization_configuration import OrganizationConfiguration


def get_organization_configuration(
    db: Session,
    company_id: int,
) -> OrganizationConfiguration:

    configuration = (
        db.query(OrganizationConfiguration)
        .filter(
            OrganizationConfiguration.company_id == company_id,
        )
        .first()
    )

    if not configuration:
        configuration = OrganizationConfiguration(
            company_id=company_id,
            branches_enabled=False,
            departments_enabled=True,
            teams_enabled=True,
            designations_enabled=True,
            clients_enabled=False,
            sites_enabled=False,
            posts_enabled=False,
        )

        db.add(configuration)
        db.commit()
        db.refresh(configuration)

    return configuration


def update_organization_configuration(
    db: Session,
    company_id: int,
    branches_enabled: bool,
    departments_enabled: bool,
    teams_enabled: bool,
    designations_enabled: bool,
    clients_enabled: bool,
    sites_enabled: bool,
    posts_enabled: bool,
) -> OrganizationConfiguration:

    configuration = get_organization_configuration(
        db,
        company_id,
    )

    configuration.branches_enabled = branches_enabled
    configuration.departments_enabled = departments_enabled
    configuration.teams_enabled = teams_enabled
    configuration.designations_enabled = designations_enabled
    configuration.clients_enabled = clients_enabled
    configuration.sites_enabled = sites_enabled
    configuration.posts_enabled = posts_enabled

    db.commit()
    db.refresh(configuration)

    return configuration
