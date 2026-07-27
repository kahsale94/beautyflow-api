from pathlib import Path
from types import SimpleNamespace

from src.schemas import ProfessionalServiceCreate
from src.services.professional_service_link_service import ProfessionalServiceLinkService

ROOT = Path(__file__).resolve().parents[1]

def read_source(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")

def test_professional_service_link_layers_exist():
    expected_files = [
        "src/schemas/professional_service_schema.py",
        "src/repositories/professional_service_repo.py",
        "src/services/professional_service_link_service.py",
        "src/api/v1/professional_service_routes.py",
    ]

    for relative_path in expected_files:
        assert (ROOT / relative_path).exists()

def test_professional_service_link_routes_are_registered():
    source = read_source("src/api/v1/__init__.py")

    assert "professional_service_router" in source
    assert "router.include_router(professional_service_router)" in source

def test_professional_service_link_dependency_is_registered():
    source = read_source("src/dependecies.py")

    assert "ProfessionalServiceLinkServiceDep" in source
    assert "get_professional_service_link_service" in source

def test_professional_service_link_admin_write_permission():
    source = read_source("src/api/v1/professional_service_routes.py")

    assert "admin: AdminDep" in source
    assert "actor: UserOrBusinessIntegrationDep" in source


class RecordingSession:
    def __init__(self, events):
        self.events = events

    def commit(self):
        self.events.append("commit")

    def rollback(self):
        self.events.append("rollback")

    def refresh(self, value):
        self.events.append("refresh")


class EntityRepositoryStub:
    def __init__(self, entity, event, events):
        self.entity = entity
        self.event = event
        self.events = events

    def get_by_id(self, db, business_id, entity_id):
        self.events.append(self.event)
        return self.entity


class LinkRepositoryStub:
    def __init__(self, events, link=None):
        self.events = events
        self.link = link

    def add(self, db, link):
        self.events.append("add-link")
        self.link = link

    def get_by_ids(self, db, professional_id, service_id):
        self.events.append("get-link")
        return self.link

    def delete(self, db, link):
        self.events.append("delete-link")
        self.link = None


class CacheInvalidatorSpy:
    def __init__(self, events):
        self.events = events

    def invalidate_professional_context(self, professional_id):
        self.events.append(f"invalidate-professional:{professional_id}")

    def invalidate_service_context(self):
        self.events.append("invalidate-service")


def link_service_for(events, link=None):
    professional = SimpleNamespace(id=7, business_id=3, is_active=True)
    service = SimpleNamespace(id=11, business_id=3, is_active=True)
    link_repository = LinkRepositoryStub(events, link)
    return (
        ProfessionalServiceLinkService(
            RecordingSession(events),
            EntityRepositoryStub(professional, "get-professional", events),
            EntityRepositoryStub(service, "get-service", events),
            link_repository,
            CacheInvalidatorSpy(events),
        ),
        link_repository,
    )


def test_professional_service_link_create_invalidates_target_before_refresh():
    events = []
    service, _repository = link_service_for(events)

    result = service.create(3, ProfessionalServiceCreate(professional_id=7, service_id=11))

    assert result.professional_id == 7
    assert result.service_id == 11
    assert events == [
        "get-professional",
        "get-service",
        "add-link",
        "commit",
        "invalidate-professional:7",
        "invalidate-service",
        "refresh",
    ]


def test_professional_service_link_delete_invalidates_target_after_commit():
    events = []
    link = SimpleNamespace(professional_id=7, service_id=11)
    service, repository = link_service_for(events, link)

    service.delete(3, 7, 11)

    assert repository.link is None
    assert events == [
        "get-professional",
        "get-service",
        "get-link",
        "delete-link",
        "commit",
        "invalidate-professional:7",
        "invalidate-service",
    ]
