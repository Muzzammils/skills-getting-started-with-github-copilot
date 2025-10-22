from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities_has_initial_structure():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # pick a known activity
    assert "Chess Club" in data
    assert "participants" in data["Chess Club"]


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    test_email = "test_student@example.com"

    # ensure test email is not present
    if test_email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(test_email)

    # signup
    resp = client.post(f"/activities/{activity}/signup?email={test_email}")
    assert resp.status_code == 200
    assert test_email in activities[activity]["participants"]

    # duplicate signup should return 400
    resp = client.post(f"/activities/{activity}/signup?email={test_email}")
    assert resp.status_code == 400

    # unregister
    resp = client.delete(f"/activities/{activity}/participants?email={test_email}")
    assert resp.status_code == 200
    assert test_email not in activities[activity]["participants"]

    # unregistering again should return 404
    resp = client.delete(f"/activities/{activity}/participants?email={test_email}")
    assert resp.status_code == 404
