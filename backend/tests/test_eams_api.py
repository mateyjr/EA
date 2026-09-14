"""EAMS API backend tests - auth, brand, objects, relationships, traceability, impact, search, ADR/Standard/Risk/Review CRUD, KPIs."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://company-portal-cms.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"
ADMIN_EMAIL = "matey.willy@gmail.com"
ADMIN_PW = "Colecle123!"


@pytest.fixture(scope="session")
def token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PW}, timeout=15)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data.get("token")
    assert data.get("email") == ADMIN_EMAIL
    assert data.get("role") == "admin"
    return data["token"]


@pytest.fixture(scope="session")
def client(token):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    return s


# --- Auth ---
def test_login_invalid():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=10)
    assert r.status_code == 401

def test_me(client):
    r = client.get(f"{API}/auth/me")
    assert r.status_code == 200
    assert r.json()["email"] == ADMIN_EMAIL

def test_me_no_auth():
    r = requests.get(f"{API}/auth/me", timeout=10)
    assert r.status_code == 401


# --- Brand ---
def test_brand_get_and_update(client):
    r = client.get(f"{API}/brand")
    assert r.status_code == 200
    data = r.json()
    assert "name" in data and "accent" in data
    original = {"name": data["name"], "subtitle": data.get("subtitle", "System EAMS"), "logo_url": data.get("logo_url"), "accent": data["accent"]}
    upd = client.put(f"{API}/brand", json={**original, "accent": "#123456"})
    assert upd.status_code == 200
    assert upd.json()["accent"] == "#123456"
    # revert
    client.put(f"{API}/brand", json=original)


# --- KPIs ---
def test_kpis(client):
    r = client.get(f"{API}/kpis")
    assert r.status_code == 200
    data = r.json()
    dc = data.get("domain_counts", {})
    for d in ["business", "application", "data", "security", "integration", "technology"]:
        assert d in dc


# --- Objects ---
def test_objects_seeded(client):
    r = client.get(f"{API}/objects")
    assert r.status_code == 200
    objs = r.json()
    assert len(objs) >= 27, f"Expected >=27 seeded, got {len(objs)}"

def test_objects_filter_business(client):
    r = client.get(f"{API}/objects", params={"domain": "business"})
    assert r.status_code == 200
    biz = r.json()
    assert len(biz) == 10, f"Expected 10 business objects, got {len(biz)}"
    assert all(o["domain"] == "business" for o in biz)

def test_object_crud_and_cascade(client):
    # create
    payload = {"domain": "application", "type": "application", "code": "TEST-APP-01", "name": "TEST_App_Cascade", "description": "test"}
    r = client.post(f"{API}/objects", json=payload)
    assert r.status_code == 200
    oid = r.json()["id"]
    # get another object to relate
    biz = client.get(f"{API}/objects", params={"domain": "business"}).json()
    other_id = biz[0]["id"]
    # create relationship
    rr = client.post(f"{API}/relationships", json={"source_id": other_id, "target_id": oid, "rel_type": "supports"})
    assert rr.status_code == 200
    rel_id = rr.json()["id"]
    # update
    r2 = client.put(f"{API}/objects/{oid}", json={**payload, "name": "TEST_App_Cascade_upd"})
    assert r2.status_code == 200
    assert r2.json()["name"] == "TEST_App_Cascade_upd"
    # get with relationships
    g = client.get(f"{API}/objects/{oid}")
    assert g.status_code == 200
    body = g.json()
    assert body["object"]["id"] == oid
    assert any(r["id"] == rel_id for r in body["upstream_rels"])
    # delete cascade
    d = client.delete(f"{API}/objects/{oid}")
    assert d.status_code == 200
    # verify relationship deleted
    all_rels = client.get(f"{API}/relationships").json()
    assert not any(r["id"] == rel_id for r in all_rels)
    # verify object gone
    g2 = client.get(f"{API}/objects/{oid}")
    assert g2.status_code == 404


# --- Traceability & Impact ---
def _find_by_code(client, code):
    objs = client.get(f"{API}/objects").json()
    for o in objs:
        if o.get("code") == code:
            return o
    return None

def test_traceability_forward_from_cap01(client):
    cap = _find_by_code(client, "CAP-01")
    assert cap, "CAP-01 not seeded"
    r = client.get(f"{API}/traceability/{cap['id']}", params={"direction": "forward", "depth": 8})
    assert r.status_code == 200
    data = r.json()
    domains = {n["domain"] for n in data["nodes"]}
    # Forward from CAP-01 should touch application, data, integration/tech domains eventually
    assert "application" in domains
    assert "data" in domains
    assert "technology" in domains

def test_impact_grouping(client):
    tech = _find_by_code(client, "TECH-03")
    assert tech
    r = client.get(f"{API}/impact/{tech['id']}")
    assert r.status_code == 200
    data = r.json()
    assert "affected_by_domain" in data
    for d in ["business", "application", "data", "security", "integration", "technology"]:
        assert d in data["affected_by_domain"]


# --- Search ---
def test_search(client):
    r = client.get(f"{API}/search", params={"q": "payment"})
    assert r.status_code == 200
    data = r.json()
    assert "objects" in data and "adrs" in data and "standards" in data and "risks" in data
    assert len(data["objects"]) > 0


# --- ADRs / Standards / Risks / Reviews CRUD ---
def test_adr_crud(client):
    r = client.post(f"{API}/adrs", json={"title": "TEST_ADR", "domain": "application", "decision": "test"})
    assert r.status_code == 200
    adr = r.json()
    assert adr["number"] >= 1
    aid = adr["id"]
    lst = client.get(f"{API}/adrs").json()
    assert any(a["id"] == aid for a in lst)
    d = client.delete(f"{API}/adrs/{aid}")
    assert d.status_code == 200

def test_standard_crud(client):
    r = client.post(f"{API}/standards", json={"code": "TEST-STD", "name": "TEST_std", "domain": "security", "mandatory": True})
    assert r.status_code == 200
    sid = r.json()["id"]
    lst = client.get(f"{API}/standards").json()
    assert any(s["id"] == sid for s in lst)
    client.delete(f"{API}/standards/{sid}")

def test_risk_crud(client):
    r = client.post(f"{API}/risks", json={"code": "TEST-RISK", "title": "TEST_risk", "domain": "security"})
    assert r.status_code == 200
    rid = r.json()["id"]
    lst = client.get(f"{API}/risks").json()
    assert any(x["id"] == rid for x in lst)
    client.delete(f"{API}/risks/{rid}")

def test_review_crud_and_stage(client):
    r = client.post(f"{API}/reviews", json={"title": "TEST_review", "submitter": "tester"})
    assert r.status_code == 200
    rid = r.json()["id"]
    assert r.json()["stage"] == "Draft"
    # advance stage
    s = client.put(f"{API}/reviews/{rid}/stage", params={"stage": "Submitted"})
    assert s.status_code == 200
    assert s.json()["stage"] == "Submitted"
    # invalid stage
    bad = client.put(f"{API}/reviews/{rid}/stage", params={"stage": "InvalidStage"})
    assert bad.status_code == 400
    client.delete(f"{API}/reviews/{rid}")
