import pytest
import json
from pathlib import Path
import os

firebase_key = Path(__file__).parent / "key.json"
os.environ["FIREBASE_SERVICE_ACCOUNT_KEY"] = firebase_key.read_text()

record_ids = ["-ODRWCP95qCGQZM-ODHo", "-ODh6Abeg7ehHC7hF6LE"]
region = "test"
user = "ub4VXoafIhgNybksQ1nht7KiCsD3"
filenames = ["some_english_title_276e6", "some_english_title__copy__041d7"]


@pytest.fixture
def app():
    from app import app

    return app


@pytest.fixture
def waf_url():
    from app import waf_url

    return waf_url


@pytest.fixture
def client(app):
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


local_test_records = list((Path(__file__).parent / "tests" / "data").glob("*.json"))


@pytest.fixture
def local_record():
    with open(local_test_records[0], "r") as f:
        return json.load(f)


@pytest.mark.dependency()
@pytest.mark.skipif(not firebase_key.exists(), reason="key.json file does not exist")
@pytest.mark.parametrize("record_id", record_ids)
def test_record(client, record_id, waf_url):
    response = client.get(f"/record?path={region}/{user}/{record_id}")
    assert response.status_code == 200
    assert response.json["message"]

    generated_file = response.json["message"].split("/")[-1] + ".xml"
    local_xml_files = list(Path("xml").glob("**/*.xml"))
    assert generated_file in [f.name for f in local_xml_files]


@pytest.mark.dependancy(depends=["test_record"])
@pytest.mark.parametrize("record_id,filename", zip(record_ids, filenames))
def test_delete_record(client, record_id, filename):
    response = client.get(f"/recordDelete?filename={filename}")
    assert response.status_code == 200
    assert response.json["message"] == "record deleted"

    local_xml_files = list(Path("xml").glob(f"**/{filename}.xml"))
    assert not local_xml_files
    local_yaml_files = list(Path("xml").glob(f"**/{filename}.yaml"))
    assert not local_yaml_files


def test_record_to_xml(client, local_record):
    response = client.post("/recordToXML", json=local_record)
    assert response.status_code == 200
    assert response.json["message"]["xml"]


def test_record_to_yaml(client, local_record):
    response = client.post("/recordToYAML", json=local_record)
    assert response.status_code == 200
    assert response.json["message"]["record"]
