from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

def read_source(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")

def test_client_has_soft_delete_and_active_filters():
    model_source = read_source("src/models/client_model.py")
    schema_source = read_source("src/schemas/client_schema.py")
    repo_source = read_source("src/repositories/client_repo.py")
    service_source = read_source("src/services/client_service.py")

    assert "is_active" in model_source
    assert "is_active: bool" in schema_source
    assert "Client.is_active == True" in repo_source
    assert "def deactivate" in service_source
    assert "return self.deactivate(business_id, client_id)" in service_source

def test_delete_methods_are_soft_delete_for_main_entities():
    expected = {
        "src/services/professional_service.py": "return self.deactivate(business_id, professional_id)",
        "src/services/service_service.py": "return self.deactivate(business_id, service_id)",
        "src/services/user_service.py": "return self.deactivate(business_id, user_id)",
    }

    for relative_path, expected_line in expected.items():
        source = read_source(relative_path)
        assert expected_line in source
        assert ".delete(self.db" not in source[source.index("def delete"):]
