from src.repositories import ScheduleBlockRepository
from src.services.availability_service import get_availability_service
from src.services.integration_service import IntegrationService


class IntegrationRepositoryStub:
    def get_by_name(self, db, name):
        return ["first", "second"]

def test_availability_factory_injects_schedule_block_repository():
    service = get_availability_service(None)

    assert isinstance(service.schedule_block_repo, ScheduleBlockRepository)

def test_integration_name_search_preserves_repository_list_contract():
    service = IntegrationService(None, IntegrationRepositoryStub())

    assert service.get_by_name("automation") == ["first", "second"]
