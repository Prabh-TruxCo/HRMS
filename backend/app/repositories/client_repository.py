from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.client import Client


class ClientRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, company_id: int) -> list[Client]:
        statement = (
            select(Client)
            .where(Client.company_id == company_id)
            .order_by(Client.name.asc())
        )

        return list(self.db.scalars(statement).all())

    def get_by_id(
        self,
        company_id: int,
        client_id: int,
    ) -> Client | None:
        statement = select(Client).where(
            Client.company_id == company_id,
            Client.id == client_id,
        )

        return self.db.scalar(statement)

    def create(self, client: Client) -> Client:
        self.db.add(client)
        self.db.flush()
        self.db.refresh(client)

        return client

    def update(self, client: Client) -> Client:
        self.db.flush()
        self.db.refresh(client)

        return client