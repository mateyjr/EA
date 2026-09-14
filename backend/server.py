from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any, Literal
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.security import HTTPBearer
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict

# ---------- Setup ----------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'change-me')
JWT_ALGO = "HS256"

app = FastAPI(title="Colecle EAMS API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("eams")

# ---------- Auth helpers ----------
def hash_pw(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()

def verify_pw(p: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(p.encode(), h.encode())
    except Exception:
        return False

def make_token(uid: str, email: str, role: str, minutes: int = 60 * 24 * 7) -> str:
    return jwt.encode({
        "sub": uid, "email": email, "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=minutes),
        "type": "access",
    }, JWT_SECRET, algorithm=JWT_ALGO)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        h = request.headers.get("Authorization", "")
        if h.startswith("Bearer "):
            token = h[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def require_role(*roles: str):
    async def dep(user: dict = Depends(get_current_user)):
        if user.get("role") not in roles and "admin" not in [user.get("role")]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return dep

# ---------- Models ----------
class UserPublic(BaseModel):
    id: str
    email: str
    name: str
    role: str

class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "viewer"

class LoginIn(BaseModel):
    email: EmailStr
    password: str

DOMAINS = ["business", "application", "data", "security", "integration", "technology"]

class ArchObject(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    domain: str
    type: str  # e.g. capability, process, application, data_entity, integration, control, technology
    code: Optional[str] = None
    name: str
    description: Optional[str] = ""
    owner: Optional[str] = ""
    status: Optional[str] = "Active"  # Draft/Active/Deprecated/Retired
    lifecycle: Optional[str] = "Production"
    criticality: Optional[str] = "Medium"  # Low/Medium/High/Mission-Critical
    tags: List[str] = []
    attributes: Dict[str, Any] = {}
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    created_by: Optional[str] = None

class ObjectIn(BaseModel):
    domain: str
    type: str
    code: Optional[str] = None
    name: str
    description: Optional[str] = ""
    owner: Optional[str] = ""
    status: Optional[str] = "Active"
    lifecycle: Optional[str] = "Production"
    criticality: Optional[str] = "Medium"
    tags: List[str] = []
    attributes: Dict[str, Any] = {}

class Relationship(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source_id: str
    target_id: str
    rel_type: str = "supports"  # supports/uses/hosts/consumes/produces/protects/depends_on
    description: Optional[str] = ""
    criticality: Optional[str] = "Medium"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class RelationshipIn(BaseModel):
    source_id: str
    target_id: str
    rel_type: str = "supports"
    description: Optional[str] = ""
    criticality: Optional[str] = "Medium"

class ADR(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    number: int
    title: str
    domain: str
    context: str = ""
    problem: str = ""
    options: str = ""
    decision: str = ""
    rationale: str = ""
    consequences: str = ""
    status: str = "Proposed"  # Proposed/Accepted/Superseded/Rejected/Deprecated
    owner: str = ""
    related_objects: List[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ADRIn(BaseModel):
    title: str
    domain: str
    context: str = ""
    problem: str = ""
    options: str = ""
    decision: str = ""
    rationale: str = ""
    consequences: str = ""
    status: str = "Proposed"
    owner: str = ""
    related_objects: List[str] = []

class Standard(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    name: str
    domain: str
    description: str = ""
    mandatory: bool = True
    version: str = "1.0"
    owner: str = ""
    status: str = "Active"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class StandardIn(BaseModel):
    code: str
    name: str
    domain: str
    description: str = ""
    mandatory: bool = True
    version: str = "1.0"
    owner: str = ""
    status: str = "Active"

class Risk(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    title: str
    domain: str
    related_object: Optional[str] = None
    description: str = ""
    likelihood: str = "Medium"
    impact: str = "Medium"
    score: int = 6
    severity: str = "Medium"
    mitigation: str = ""
    owner: str = ""
    target_date: Optional[str] = None
    status: str = "Open"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class RiskIn(BaseModel):
    code: str
    title: str
    domain: str
    related_object: Optional[str] = None
    description: str = ""
    likelihood: str = "Medium"
    impact: str = "Medium"
    score: int = 6
    severity: str = "Medium"
    mitigation: str = ""
    owner: str = ""
    target_date: Optional[str] = None
    status: str = "Open"

class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    title: str
    submitter: str
    summary: str = ""
    domains_impacted: List[str] = []
    related_objects: List[str] = []
    stage: str = "Draft"  # Draft/Submitted/Domain Reviews/EA Review/Committee/Approved/Rejected
    findings: List[Dict[str, Any]] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ReviewIn(BaseModel):
    title: str
    submitter: str
    summary: str = ""
    domains_impacted: List[str] = []
    related_objects: List[str] = []
    stage: str = "Draft"

class BrandSettings(BaseModel):
    name: str = "Colecle"
    subtitle: str = "System EAMS"
    logo_url: Optional[str] = None
    accent: str = "#f59e0b"
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ---------- Auth Endpoints ----------
@api.post("/auth/register")
async def register(body: RegisterIn, response: Response):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    uid = str(uuid.uuid4())
    doc = {
        "id": uid, "email": email, "password_hash": hash_pw(body.password),
        "name": body.name, "role": body.role or "viewer",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    token = make_token(uid, email, doc["role"])
    response.set_cookie("access_token", token, httponly=True, secure=True, samesite="none", max_age=60*60*24*7, path="/")
    return {"id": uid, "email": email, "name": body.name, "role": doc["role"], "token": token}

@api.post("/auth/login")
async def login(body: LoginIn, response: Response):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_pw(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = make_token(user["id"], email, user["role"])
    response.set_cookie("access_token", token, httponly=True, secure=True, samesite="none", max_age=60*60*24*7, path="/")
    return {"id": user["id"], "email": email, "name": user["name"], "role": user["role"], "token": token}

@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]}

# ---------- Brand ----------
@api.get("/brand")
async def get_brand():
    b = await db.brand.find_one({"_id": "singleton"}, {"_id": 0})
    if not b:
        b = BrandSettings().model_dump()
        await db.brand.insert_one({"_id": "singleton", **b})
    return b

@api.put("/brand")
async def update_brand(body: BrandSettings, user: dict = Depends(get_current_user)):
    if user["role"] not in ("admin", "lead_architect"):
        raise HTTPException(status_code=403, detail="Admin only")
    body.updated_at = datetime.now(timezone.utc).isoformat()
    await db.brand.update_one({"_id": "singleton"}, {"$set": body.model_dump()}, upsert=True)
    return body

# ---------- Objects (unified catalog) ----------
@api.get("/objects")
async def list_objects(domain: Optional[str] = None, type: Optional[str] = None, q: Optional[str] = None, user: dict = Depends(get_current_user)):
    query: Dict[str, Any] = {}
    if domain: query["domain"] = domain
    if type: query["type"] = type
    if q:
        query["$or"] = [{"name": {"$regex": q, "$options": "i"}}, {"code": {"$regex": q, "$options": "i"}}, {"description": {"$regex": q, "$options": "i"}}]
    items = await db.objects.find(query, {"_id": 0}).sort("name", 1).to_list(2000)
    return items

@api.get("/objects/{oid}")
async def get_object(oid: str, user: dict = Depends(get_current_user)):
    obj = await db.objects.find_one({"id": oid}, {"_id": 0})
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    # Upstream (things that link INTO this)
    up_rels = await db.relationships.find({"target_id": oid}, {"_id": 0}).to_list(500)
    down_rels = await db.relationships.find({"source_id": oid}, {"_id": 0}).to_list(500)
    up_ids = [r["source_id"] for r in up_rels]
    down_ids = [r["target_id"] for r in down_rels]
    up_objs = await db.objects.find({"id": {"$in": up_ids}}, {"_id": 0}).to_list(500)
    down_objs = await db.objects.find({"id": {"$in": down_ids}}, {"_id": 0}).to_list(500)
    return {"object": obj, "upstream": up_objs, "downstream": down_objs, "upstream_rels": up_rels, "downstream_rels": down_rels}

@api.post("/objects")
async def create_object(body: ObjectIn, user: dict = Depends(get_current_user)):
    if body.domain not in DOMAINS:
        raise HTTPException(status_code=400, detail="Invalid domain")
    obj = ArchObject(**body.model_dump(), created_by=user["id"])
    await db.objects.insert_one(obj.model_dump())
    await audit(user, "create", obj.id, body.domain, None, obj.model_dump())
    return obj.model_dump()

@api.put("/objects/{oid}")
async def update_object(oid: str, body: ObjectIn, user: dict = Depends(get_current_user)):
    existing = await db.objects.find_one({"id": oid}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Not found")
    patch = body.model_dump()
    patch["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.objects.update_one({"id": oid}, {"$set": patch})
    updated = await db.objects.find_one({"id": oid}, {"_id": 0})
    await audit(user, "update", oid, body.domain, existing, updated)
    return updated

@api.delete("/objects/{oid}")
async def delete_object(oid: str, user: dict = Depends(get_current_user)):
    existing = await db.objects.find_one({"id": oid}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Not found")
    await db.objects.delete_one({"id": oid})
    await db.relationships.delete_many({"$or": [{"source_id": oid}, {"target_id": oid}]})
    await audit(user, "delete", oid, existing.get("domain", ""), existing, None)
    return {"ok": True}

# ---------- Relationships ----------
@api.get("/relationships")
async def list_relationships(user: dict = Depends(get_current_user)):
    return await db.relationships.find({}, {"_id": 0}).to_list(5000)

@api.post("/relationships")
async def create_relationship(body: RelationshipIn, user: dict = Depends(get_current_user)):
    rel = Relationship(**body.model_dump())
    await db.relationships.insert_one(rel.model_dump())
    return rel.model_dump()

@api.delete("/relationships/{rid}")
async def delete_relationship(rid: str, user: dict = Depends(get_current_user)):
    await db.relationships.delete_one({"id": rid})
    return {"ok": True}

# ---------- Traceability & Impact ----------
@api.get("/traceability/{oid}")
async def traceability(oid: str, direction: Literal["forward", "reverse", "both"] = "both", depth: int = 4, user: dict = Depends(get_current_user)):
    root = await db.objects.find_one({"id": oid}, {"_id": 0})
    if not root:
        raise HTTPException(status_code=404, detail="Not found")
    all_rels = await db.relationships.find({}, {"_id": 0}).to_list(10000)
    all_objs = await db.objects.find({}, {"_id": 0}).to_list(10000)
    by_id = {o["id"]: o for o in all_objs}

    def walk(start: str, dirn: str):
        visited = {start}
        edges = []
        frontier = [(start, 0)]
        while frontier:
            cur, d = frontier.pop(0)
            if d >= depth: continue
            for r in all_rels:
                nxt = None
                if dirn == "forward" and r["source_id"] == cur:
                    nxt = r["target_id"]
                elif dirn == "reverse" and r["target_id"] == cur:
                    nxt = r["source_id"]
                if nxt:
                    edges.append(r)
                    if nxt not in visited:
                        visited.add(nxt)
                        frontier.append((nxt, d + 1))
        nodes = [by_id[i] for i in visited if i in by_id]
        return nodes, edges

    nodes_set = {oid: root}
    edges_all = []
    if direction in ("forward", "both"):
        n, e = walk(oid, "forward")
        for nn in n: nodes_set[nn["id"]] = nn
        edges_all.extend(e)
    if direction in ("reverse", "both"):
        n, e = walk(oid, "reverse")
        for nn in n: nodes_set[nn["id"]] = nn
        edges_all.extend(e)
    # de-dup edges
    seen = set()
    edges_dedup = []
    for r in edges_all:
        if r["id"] not in seen:
            seen.add(r["id"])
            edges_dedup.append(r)
    return {"root": root, "nodes": list(nodes_set.values()), "edges": edges_dedup}

@api.get("/impact/{oid}")
async def impact(oid: str, user: dict = Depends(get_current_user)):
    """Reverse impact: what gets broken if this object fails."""
    trace = await traceability(oid, direction="reverse", depth=8, user=user)
    by_domain: Dict[str, List[Dict[str, Any]]] = {d: [] for d in DOMAINS}
    for n in trace["nodes"]:
        if n["id"] == oid: continue
        by_domain.setdefault(n["domain"], []).append(n)
    return {"root": trace["root"], "affected_by_domain": by_domain, "total_affected": sum(len(v) for v in by_domain.values())}

# ---------- Search ----------
@api.get("/search")
async def global_search(q: str, user: dict = Depends(get_current_user)):
    if not q or len(q) < 2:
        return {"results": []}
    regex = {"$regex": q, "$options": "i"}
    objs = await db.objects.find({"$or": [{"name": regex}, {"code": regex}, {"description": regex}]}, {"_id": 0}).limit(30).to_list(30)
    adrs = await db.adrs.find({"$or": [{"title": regex}, {"decision": regex}]}, {"_id": 0}).limit(10).to_list(10)
    stds = await db.standards.find({"$or": [{"name": regex}, {"code": regex}]}, {"_id": 0}).limit(10).to_list(10)
    risks = await db.risks.find({"$or": [{"title": regex}, {"code": regex}]}, {"_id": 0}).limit(10).to_list(10)
    return {"objects": objs, "adrs": adrs, "standards": stds, "risks": risks}

# ---------- ADRs ----------
@api.get("/adrs")
async def list_adrs(user: dict = Depends(get_current_user)):
    return await db.adrs.find({}, {"_id": 0}).sort("number", -1).to_list(500)

@api.post("/adrs")
async def create_adr(body: ADRIn, user: dict = Depends(get_current_user)):
    count = await db.adrs.count_documents({})
    adr = ADR(number=count + 1, **body.model_dump())
    await db.adrs.insert_one(adr.model_dump())
    return adr.model_dump()

@api.put("/adrs/{aid}")
async def update_adr(aid: str, body: ADRIn, user: dict = Depends(get_current_user)):
    await db.adrs.update_one({"id": aid}, {"$set": body.model_dump()})
    return await db.adrs.find_one({"id": aid}, {"_id": 0})

@api.delete("/adrs/{aid}")
async def delete_adr(aid: str, user: dict = Depends(get_current_user)):
    await db.adrs.delete_one({"id": aid})
    return {"ok": True}

# ---------- Standards ----------
@api.get("/standards")
async def list_standards(user: dict = Depends(get_current_user)):
    return await db.standards.find({}, {"_id": 0}).sort("code", 1).to_list(500)

@api.post("/standards")
async def create_standard(body: StandardIn, user: dict = Depends(get_current_user)):
    s = Standard(**body.model_dump())
    await db.standards.insert_one(s.model_dump())
    return s.model_dump()

@api.put("/standards/{sid}")
async def update_standard(sid: str, body: StandardIn, user: dict = Depends(get_current_user)):
    await db.standards.update_one({"id": sid}, {"$set": body.model_dump()})
    return await db.standards.find_one({"id": sid}, {"_id": 0})

@api.delete("/standards/{sid}")
async def delete_standard(sid: str, user: dict = Depends(get_current_user)):
    await db.standards.delete_one({"id": sid})
    return {"ok": True}

# ---------- Risks ----------
@api.get("/risks")
async def list_risks(user: dict = Depends(get_current_user)):
    return await db.risks.find({}, {"_id": 0}).sort("code", 1).to_list(500)

@api.post("/risks")
async def create_risk(body: RiskIn, user: dict = Depends(get_current_user)):
    r = Risk(**body.model_dump())
    await db.risks.insert_one(r.model_dump())
    return r.model_dump()

@api.put("/risks/{rid}")
async def update_risk(rid: str, body: RiskIn, user: dict = Depends(get_current_user)):
    await db.risks.update_one({"id": rid}, {"$set": body.model_dump()})
    return await db.risks.find_one({"id": rid}, {"_id": 0})

@api.delete("/risks/{rid}")
async def delete_risk(rid: str, user: dict = Depends(get_current_user)):
    await db.risks.delete_one({"id": rid})
    return {"ok": True}

# ---------- Reviews ----------
@api.get("/reviews")
async def list_reviews(user: dict = Depends(get_current_user)):
    return await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)

@api.post("/reviews")
async def create_review(body: ReviewIn, user: dict = Depends(get_current_user)):
    count = await db.reviews.count_documents({})
    r = Review(code=f"AR-{1000 + count + 1}", **body.model_dump())
    await db.reviews.insert_one(r.model_dump())
    return r.model_dump()

@api.put("/reviews/{rid}/stage")
async def update_review_stage(rid: str, stage: str, user: dict = Depends(get_current_user)):
    valid = ["Draft", "Submitted", "Domain Reviews", "EA Review", "Committee", "Approved", "Rejected"]
    if stage not in valid:
        raise HTTPException(status_code=400, detail="Invalid stage")
    await db.reviews.update_one({"id": rid}, {"$set": {"stage": stage}})
    return await db.reviews.find_one({"id": rid}, {"_id": 0})

@api.delete("/reviews/{rid}")
async def delete_review(rid: str, user: dict = Depends(get_current_user)):
    await db.reviews.delete_one({"id": rid})
    return {"ok": True}

# ---------- Dashboard KPIs ----------
@api.get("/kpis")
async def kpis(user: dict = Depends(get_current_user)):
    async def cnt(**q):
        return await db.objects.count_documents(q)
    return {
        "total_capabilities": await cnt(domain="business", type="capability"),
        "total_processes": await cnt(domain="business", type="process"),
        "critical_processes": await cnt(domain="business", type="process", criticality={"$in": ["High", "Mission-Critical"]}),
        "total_applications": await cnt(domain="application"),
        "mission_critical_apps": await cnt(domain="application", criticality="Mission-Critical"),
        "total_data_entities": await cnt(domain="data"),
        "total_integrations": await cnt(domain="integration"),
        "critical_integrations": await cnt(domain="integration", criticality={"$in": ["High", "Mission-Critical"]}),
        "total_security_controls": await cnt(domain="security"),
        "total_technologies": await cnt(domain="technology"),
        "eol_technologies": await cnt(domain="technology", status="Deprecated"),
        "open_risks": await db.risks.count_documents({"status": "Open"}),
        "pending_reviews": await db.reviews.count_documents({"stage": {"$in": ["Submitted", "Domain Reviews", "EA Review", "Committee"]}}),
        "total_adrs": await db.adrs.count_documents({}),
        "domain_counts": {d: await cnt(domain=d) for d in DOMAINS},
    }

# ---------- Audit ----------
async def audit(user: dict, action: str, obj_id: str, domain: str, before: Any, after: Any):
    await db.audit.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user.get("id"),
        "user_email": user.get("email"),
        "action": action,
        "object_id": obj_id,
        "domain": domain,
        "before": before,
        "after": after,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

@api.get("/audit")
async def list_audit(user: dict = Depends(get_current_user)):
    return await db.audit.find({}, {"_id": 0}).sort("timestamp", -1).limit(200).to_list(200)

# ---------- Health ----------
@api.get("/")
async def root():
    return {"service": "Colecle EAMS", "status": "ok"}

# ---------- Seed ----------
async def seed_admin_and_data():
    await db.users.create_index("email", unique=True)
    await db.objects.create_index("id", unique=True)
    await db.objects.create_index([("domain", 1), ("type", 1)])
    await db.relationships.create_index("id", unique=True)

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com").lower()
    admin_pw = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        uid = str(uuid.uuid4())
        await db.users.insert_one({
            "id": uid, "email": admin_email, "password_hash": hash_pw(admin_pw),
            "name": "Chief Architect", "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Seeded admin {admin_email}")
    elif not verify_pw(admin_pw, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_pw(admin_pw)}})

    # Brand default
    if not await db.brand.find_one({"_id": "singleton"}):
        await db.brand.insert_one({"_id": "singleton", **BrandSettings().model_dump()})

    # Seed sample only if empty
    if await db.objects.count_documents({}) > 0:
        return

    def mk(domain, type, code, name, description="", **kw):
        obj = ArchObject(domain=domain, type=type, code=code, name=name, description=description, **kw).model_dump()
        return obj

    seed_objects = [
        # Business
        mk("business", "unit", "BU-01", "Payments Business Unit", "Owns payment products and services.", owner="COO", criticality="Mission-Critical"),
        mk("business", "capability", "CAP-01", "Payments", "Core capability enabling payment services.", owner="Head of Payments", criticality="Mission-Critical", attributes={"maturity": "L3", "strategic": "High"}),
        mk("business", "capability", "CAP-02", "Payment Processing", "Sub-capability under Payments.", owner="Head of Payments", criticality="Mission-Critical", attributes={"maturity": "L2", "strategic": "High"}),
        mk("business", "capability", "CAP-03", "Instant Payment Processing", "Real-time payment execution.", owner="Payments Ops", criticality="Mission-Critical", attributes={"maturity": "L2"}),
        mk("business", "process", "BP-01", "Instant Payment Execution", "End-to-end instant payment flow.", owner="Ops Lead", criticality="Mission-Critical", attributes={"rto": "5m", "rpo": "0s"}),
        mk("business", "process_step", "PS-01", "Receive Payment Request", "Accepts inbound payment instruction.", owner="Ops"),
        mk("business", "process_step", "PS-02", "Validate Participant", "Validates payer/payee.", owner="Ops"),
        mk("business", "process_step", "PS-03", "Process Transaction", "Executes debit/credit legs.", owner="Ops"),
        mk("business", "process_step", "PS-04", "Persist Transaction", "Persists to system of record.", owner="Ops"),
        mk("business", "process_step", "PS-05", "Send Response", "Responds to participant.", owner="Ops"),
        # Applications
        mk("application", "application", "APP-01", "Payment Gateway", "Public-facing gateway.", owner="App Team A", criticality="Mission-Critical", lifecycle="Production", attributes={"vendor": "Internal", "tech": "Java/Spring"}),
        mk("application", "application", "APP-02", "Core Payment Engine", "Executes payment logic.", owner="App Team A", criticality="Mission-Critical", lifecycle="Production", attributes={"tech": "Java/Spring"}),
        mk("application", "application", "APP-03", "Participant Master", "Master data for participants.", owner="MDM Team", criticality="High", lifecycle="Production"),
        # Data
        mk("data", "data_entity", "DE-01", "Payment Instruction", "Inbound instruction payload.", owner="Data Steward A", criticality="High", attributes={"classification": "Confidential"}),
        mk("data", "data_entity", "DE-02", "Participant Master Data", "Participant reference data.", owner="Data Steward B", criticality="High", attributes={"classification": "Internal"}),
        mk("data", "data_entity", "DE-03", "Payment Transaction", "System of record transaction.", owner="Data Steward A", criticality="Mission-Critical", attributes={"classification": "Restricted"}),
        mk("data", "data_store", "DS-01", "Payments Database", "Primary transactional DB.", owner="DBA", criticality="Mission-Critical", attributes={"engine": "PostgreSQL 15"}),
        # Integration
        mk("integration", "integration", "INT-01", "Public Payment REST API", "External inbound REST API.", owner="Int Team", criticality="Mission-Critical", attributes={"protocol": "REST/HTTPS"}),
        mk("integration", "integration", "INT-02", "Internal Participant API", "Internal service API.", owner="Int Team", criticality="High", attributes={"protocol": "REST"}),
        mk("integration", "integration", "INT-03", "API Gateway", "Central API gateway.", owner="Platform", criticality="Mission-Critical"),
        # Security
        mk("security", "control", "SEC-01", "TLS 1.3 In Transit", "Transport encryption.", owner="Security Team", criticality="Mission-Critical"),
        mk("security", "control", "SEC-02", "OAuth2 Authentication", "Authentication layer.", owner="Security Team", criticality="High"),
        mk("security", "control", "SEC-03", "RBAC Authorization", "Fine-grained authorization.", owner="Security Team", criticality="High"),
        # Technology
        mk("technology", "technology", "TECH-01", "API Gateway (Kong)", "Kong Gateway platform.", owner="Platform", criticality="Mission-Critical", attributes={"vendor": "Kong", "eol": "2027-06-01"}),
        mk("technology", "technology", "TECH-02", "Kubernetes Cluster", "OpenShift cluster.", owner="Platform", criticality="Mission-Critical", attributes={"vendor": "Red Hat"}),
        mk("technology", "technology", "TECH-03", "PostgreSQL 15", "Relational database engine.", owner="DBA", criticality="Mission-Critical", attributes={"vendor": "PostgreSQL"}),
        mk("technology", "infrastructure", "INF-01", "Primary Data Centre", "DC-A active site.", owner="Infra", criticality="Mission-Critical"),
    ]
    await db.objects.insert_many(seed_objects)

    # relationship helper by code
    by_code = {o["code"]: o["id"] for o in seed_objects}
    def rel(src, tgt, t="supports", crit="High"):
        return Relationship(source_id=by_code[src], target_id=by_code[tgt], rel_type=t, criticality=crit).model_dump()

    seed_rels = [
        # Business hierarchy
        rel("BU-01", "CAP-01", "owns"),
        rel("CAP-01", "CAP-02", "parent_of"),
        rel("CAP-02", "CAP-03", "parent_of"),
        rel("CAP-03", "BP-01", "realized_by", "Mission-Critical"),
        # Process steps
        rel("BP-01", "PS-01", "has_step"),
        rel("BP-01", "PS-02", "has_step"),
        rel("BP-01", "PS-03", "has_step"),
        rel("BP-01", "PS-04", "has_step"),
        rel("BP-01", "PS-05", "has_step"),
        # Steps -> Apps
        rel("PS-01", "APP-01", "uses_application"),
        rel("PS-02", "APP-03", "uses_application"),
        rel("PS-03", "APP-02", "uses_application"),
        rel("PS-04", "APP-02", "uses_application"),
        rel("PS-05", "APP-01", "uses_application"),
        # Apps -> Data
        rel("APP-01", "DE-01", "consumes_data"),
        rel("APP-03", "DE-02", "produces_data"),
        rel("APP-02", "DE-03", "produces_data", "Mission-Critical"),
        rel("DE-03", "DS-01", "stored_in", "Mission-Critical"),
        # Apps -> Integrations
        rel("APP-01", "INT-01", "exposes"),
        rel("APP-01", "INT-03", "routed_via"),
        rel("APP-03", "INT-02", "exposes"),
        # Integrations -> Security
        rel("INT-01", "SEC-01", "protected_by", "Mission-Critical"),
        rel("INT-01", "SEC-02", "protected_by"),
        rel("INT-02", "SEC-03", "protected_by"),
        # Apps -> Technology
        rel("APP-01", "TECH-01", "hosted_on"),
        rel("APP-02", "TECH-02", "hosted_on", "Mission-Critical"),
        rel("APP-03", "TECH-02", "hosted_on"),
        rel("DS-01", "TECH-03", "runs_on", "Mission-Critical"),
        rel("TECH-01", "INF-01", "hosted_in"),
        rel("TECH-02", "INF-01", "hosted_in"),
        rel("TECH-03", "INF-01", "hosted_in", "Mission-Critical"),
    ]
    await db.relationships.insert_many(seed_rels)

    # Standards
    await db.standards.insert_many([
        Standard(code="STD-001", name="TLS 1.3 for all external endpoints", domain="security", mandatory=True, owner="Security Team").model_dump(),
        Standard(code="STD-002", name="OpenAPI 3.1 for REST APIs", domain="integration", mandatory=True, owner="Integration Team").model_dump(),
        Standard(code="STD-003", name="PostgreSQL as preferred RDBMS", domain="data", mandatory=False, owner="Data Team").model_dump(),
        Standard(code="STD-004", name="Container-first deployment (Kubernetes)", domain="technology", mandatory=True, owner="Platform").model_dump(),
    ])

    # ADRs
    await db.adrs.insert_many([
        ADR(number=1, title="Adopt Kong as API Gateway", domain="integration", context="Need central API gateway for payment services.", decision="Adopt Kong Gateway on OpenShift.", rationale="Mature OSS + enterprise support.", status="Accepted", owner="Chief Architect").model_dump(),
        ADR(number=2, title="Standardize on PostgreSQL 15", domain="data", context="Consolidate database engines.", decision="Standardize on PostgreSQL 15.", rationale="Feature parity + open source.", status="Accepted", owner="Data Architect").model_dump(),
    ])

    # Risks
    await db.risks.insert_many([
        Risk(code="RISK-001", title="Kong Gateway single point of failure", domain="integration", description="No multi-region failover configured.", likelihood="Medium", impact="High", score=12, severity="High", status="Open", owner="Platform").model_dump(),
        Risk(code="RISK-002", title="Legacy TLS versions on internal APIs", domain="security", description="Some internal APIs still support TLS 1.2.", likelihood="Low", impact="Medium", score=4, severity="Low", status="Open", owner="Security Team").model_dump(),
    ])

    # Reviews
    await db.reviews.insert_many([
        Review(code="AR-1001", title="Instant Payment Engine v2 - Architecture Review", submitter="Lead Architect", summary="Introduce v2 engine with real-time features.", domains_impacted=["application", "data", "integration", "security"], stage="EA Review").model_dump(),
    ])

    logger.info("Seeded EAMS sample data")

    # Write test creds
    try:
        mem_dir = Path("/app/memory")
        mem_dir.mkdir(exist_ok=True)
        (mem_dir / "test_credentials.md").write_text(
            f"# Test Credentials\n\n## Admin\n- Email: {admin_email}\n- Password: {admin_pw}\n- Role: admin\n\n## Endpoints\n- POST /api/auth/login\n- GET /api/auth/me\n- POST /api/auth/logout\n"
        )
    except Exception as e:
        logger.warning(f"Failed to write test_credentials.md: {e}")

@app.on_event("startup")
async def startup():
    await seed_admin_and_data()

app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown():
    client.close()
