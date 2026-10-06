from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.client import Client
from app.repositories.client_repository import ClientRepository
from app.schemas.client import ClientCreateRequest, ClientResponse, ClientUpdateRequest
from app.services.audit_log_service import AuditLogService


class ClientService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = ClientRepository(db)
        self.audit_service = AuditLogService(db)

    def _get_account_id(self, company_id: int) -> int | None:
        from app.models.company import Company

        company = self.db.get(Company, company_id)

        if company is None:
            return None

        return company.account_id

    def get_clients(
        self,
        company_id: int,
    ) -> list[ClientResponse]:
        clients = self.repository.get_all(company_id)

        return [
            ClientResponse.model_validate(client)
            for client in clients
        ]

    def get_client(
        self,
        company_id: int,
        client_id: int,
    ) -> ClientResponse:
        client = self.repository.get_by_id(
            company_id,
            client_id,
        )

        if client is None:
            raise ValueError("Client not found.")

        return ClientResponse.model_validate(client)

    def create_client(
        self,
        company_id: int,
        user_id: int,
        data: ClientCreateRequest,
    ) -> ClientResponse:
        client = Client(
            company_id=company_id,
            name=data.name.strip(),
            code=data.code.strip() if data.code else None,
            contact_person=(
                data.contact_person.strip()
                if data.contact_person
                else None
            ),
            phone=data.phone.strip() if data.phone else None,
            email=data.email.strip() if data.email else None,
            address=data.address.strip() if data.address else None,
            city=data.city.strip() if data.city else None,
            state=data.state.strip() if data.state else None,
            country=data.country.strip(),
            description=(
                data.description.strip()
                if data.description
                else None
            ),
            is_active=data.is_active,
        )

        try:
            self.repository.create(client)
            self.db.flush()
        except IntegrityError:
            self.db.rollback()
            raise ValueError(
                "A client with this name already exists."
            )

        account_id = self._get_account_id(company_id)

        self.audit_service.log(
            user_id=user_id,
            account_id=account_id,
            company_id=company_id,
            module="ORGANIZATION",
            entity_type="CLIENT",
            entity_id=client.id,
            action="CREATED",
            description=f"Created client '{client.name}'.",
            old_values=None,
            new_values={
                "name": client.name,
                "code": client.code,
                "contact_person": client.contact_person,
                "phone": client.phone,
                "email": client.email,
                "address": client.address,
                "city": client.city,
                "state": client.state,
                "country": client.country,
                "description": client.description,
                "is_active": client.is_active,
            },
        )

        return ClientResponse.model_validate(client)

    def update_client(
        self,
        company_id: int,
        client_id: int,
        user_id: int,
        data: ClientUpdateRequest,
    ) -> ClientResponse:
        client = self.repository.get_by_id(
            company_id,
            client_id,
        )

        if client is None:
            raise ValueError("Client not found.")

        old_values = {
            "name": client.name,
            "code": client.code,
            "contact_person": client.contact_person,
            "phone": client.phone,
            "email": client.email,
            "address": client.address,
            "city": client.city,
            "state": client.state,
            "country": client.country,
            "description": client.description,
            "is_active": client.is_active,
        }

        client.name = data.name.strip()
        client.code = (
            data.code.strip()
            if data.code
            else None
        )
        client.contact_person = (
            data.contact_person.strip()
            if data.contact_person
            else None
        )
        client.phone = (
            data.phone.strip()
            if data.phone
            else None
        )
        client.email = (
            data.email.strip()
            if data.email
            else None
        )
        client.address = (
            data.address.strip()
            if data.address
            else None
        )
        client.city = (
            data.city.strip()
            if data.city
            else None
        )
        client.state = (
            data.state.strip()
            if data.state
            else None
        )
        client.country = data.country.strip()
        client.description = (
            data.description.strip()
            if data.description
            else None
        )

        try:
            self.repository.update(client)
            self.db.flush()
        except IntegrityError:
            self.db.rollback()
            raise ValueError(
                "A client with this name already exists."
            )

        new_values = {
            "name": client.name,
            "code": client.code,
            "contact_person": client.contact_person,
            "phone": client.phone,
            "email": client.email,
            "address": client.address,
            "city": client.city,
            "state": client.state,
            "country": client.country,
            "description": client.description,
            "is_active": client.is_active,
        }

        if old_values != new_values:
            account_id = self._get_account_id(company_id)

            self.audit_service.log(
                user_id=user_id,
                account_id=account_id,
                company_id=company_id,
                module="ORGANIZATION",
                entity_type="CLIENT",
                entity_id=client.id,
                action="UPDATED",
                description=f"Updated client '{client.name}'.",
                old_values=old_values,
                new_values=new_values,
            )

        return ClientResponse.model_validate(client)

    def update_client_status(
        self,
        company_id: int,
        client_id: int,
        user_id: int,
        is_active: bool,
    ) -> ClientResponse:
        client = self.repository.get_by_id(
            company_id,
            client_id,
        )

        if client is None:
            raise ValueError("Client not found.")

        if client.is_active == is_active:
            return ClientResponse.model_validate(client)

        old_status = client.is_active
        client.is_active = is_active

        self.repository.update(client)
        self.db.flush()

        account_id = self._get_account_id(company_id)

        action = "ENABLED" if is_active else "DISABLED"

        self.audit_service.log(
            user_id=user_id,
            account_id=account_id,
            company_id=company_id,
            module="ORGANIZATION",
            entity_type="CLIENT",
            entity_id=client.id,
            action=action,
            description=(
                f"{'Enabled' if is_active else 'Disabled'} "
                f"client '{client.name}'."
            ),
            old_values={
                "is_active": old_status,
            },
            new_values={
                "is_active": is_active,
            },
        )

        return ClientResponse.model_validate(client)