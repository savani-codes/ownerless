from ownerless import datahub
from ownerless.config import DataHubConfig

CFG = DataHubConfig(gms_url="http://gms:8080", ui_url="http://ui:9002", token="t")
PRODUCTS = "urn:li:dataset:(urn:li:dataPlatform:postgres,retail_demo.raw.products,PROD)"


def test_dataset_urn_accepts_short_and_full_names():
    assert datahub.dataset_urn(CFG, "raw.products") == PRODUCTS
    assert datahub.dataset_urn(CFG, "retail_demo.raw.products") == PRODUCTS
    assert datahub.dataset_urn(CFG, PRODUCTS) == PRODUCTS


def test_summarize_reports_governance_gaps():
    summary = datahub.summarize(CFG, {"urn": PRODUCTS, "name": "retail_demo.raw.products"})
    assert summary["governance_gaps"] == ["no owner", "no description", "no tags"]
    assert summary["url"].startswith("http://ui:9002/dataset/urn%3Ali%3Adataset")


def test_summarize_reads_group_owners():
    entity = {
        "urn": PRODUCTS,
        "name": "x",
        "ownership": {
            "owners": [
                {
                    "owner": {
                        "urn": "urn:li:corpGroup:retail_demo_data_platform",
                        "properties": {"displayName": "Data Platform"},
                    }
                }
            ]
        },
    }
    owners = datahub.summarize(CFG, entity)["owners"]
    assert owners == [{"name": "Data Platform", "urn": "urn:li:corpGroup:retail_demo_data_platform"}]


def test_set_owner_sends_technical_owner_for_the_group(fake_session):
    session = fake_session(
        {
            ("POST", "/api/graphql"): (
                200,
                {"data": {"addOwner": True, "entity": {"urn": PRODUCTS, "name": "p"}}},
            )
        }
    )
    datahub.set_owner(
        datahub.DataHubClient(CFG, session=session), "raw.products", "retail_demo_data_platform"
    )
    mutation = session.calls[0][2]["json"]["variables"]["input"]
    assert mutation["resourceUrn"] == PRODUCTS
    assert mutation["ownerUrn"] == "urn:li:corpGroup:retail_demo_data_platform"
    assert mutation["ownershipTypeUrn"] == datahub.TECHNICAL_OWNER
