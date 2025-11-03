from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.middleware.cors import CORSMiddleware

import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import motor.motor_asyncio
import certifi
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = "mongodb+srv://dharshan0814f:Kdharshan5%40@cluster0.6ettfx6.mongodb.net/?appName=Cluster0"
client = motor.motor_asyncio.AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where())
db = client['ar_learning_db']

app = FastAPI()
# ✅ Allow frontend (React) access to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:8000","*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


api_router = APIRouter(prefix="/api")
security = HTTPBearer()




JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"

# ============ Models ============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: str = "student"  # student or admin
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str = "student"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Subject(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    category: str  # anatomy, automobile, physics
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SubjectCreate(BaseModel):
    name: str
    description: str
    category: str

class Model3D(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    model_url: str
    subject_id: str
    labels: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Model3DCreate(BaseModel):
    title: str
    description: str
    model_url: str
    subject_id: str
    labels: List[str] = []

class Question(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    subject_id: str
    model_id: str
    question_text: str
    options: List[str]
    correct_answer: int  # index of correct option
    difficulty: str = "medium"  # easy, medium, hard
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class QuestionCreate(BaseModel):
    subject_id: str
    model_id: str
    question_text: str
    options: List[str]
    correct_answer: int
    difficulty: str = "medium"

class AssessmentSubmission(BaseModel):
    question_id: str
    selected_answer: int

class AssessmentResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    subject_id: str
    model_id: str
    question_id: str
    selected_answer: int
    is_correct: bool
    time_spent: Optional[int] = None  # in seconds
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PerformanceStats(BaseModel):
    total_assessments: int
    correct_answers: int
    accuracy: float
    subject_wise_performance: dict
    weak_topics: List[str]
    avg_time_spent: Optional[float] = None

# ============ Auth Helpers ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ============ Auth Routes ============

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['password'] = hash_password(user_data.password)
    
    await db.users.insert_one(doc)
    
    token = create_token(user.id, user.email, user.role)
    return {"user": user, "token": token}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**{k: v for k, v in user_doc.items() if k != 'password'})
    token = create_token(user.id, user.email, user.role)
    
    return {"user": user, "token": token}

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ============ Subject Routes ============

@api_router.get("/subjects", response_model=List[Subject])
async def get_subjects(current_user: User = Depends(get_current_user)):
    subjects = await db.subjects.find({}, {"_id": 0}).to_list(1000)
    for s in subjects:
        if isinstance(s.get('created_at'), str):
            s['created_at'] = datetime.fromisoformat(s['created_at'])
    return subjects

@api_router.post("/subjects", response_model=Subject)
async def create_subject(subject_data: SubjectCreate, admin: User = Depends(get_admin_user)):
    subject = Subject(**subject_data.model_dump())
    doc = subject.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.subjects.insert_one(doc)
    return subject

@api_router.get("/subjects/{subject_id}", response_model=Subject)
async def get_subject(subject_id: str, current_user: User = Depends(get_current_user)):
    subject = await db.subjects.find_one({"id": subject_id}, {"_id": 0})
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    if isinstance(subject.get('created_at'), str):
        subject['created_at'] = datetime.fromisoformat(subject['created_at'])
    return Subject(**subject)

# ============ 3D Model Routes ============

@api_router.get("/models", response_model=List[Model3D])
async def get_models(subject_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {"subject_id": subject_id} if subject_id else {}
    models = await db.models.find(query, {"_id": 0}).to_list(1000)
    for m in models:
        if isinstance(m.get('created_at'), str):
            m['created_at'] = datetime.fromisoformat(m['created_at'])
    return models

@api_router.post("/models", response_model=Model3D)
async def create_model(model_data: Model3DCreate, admin: User = Depends(get_admin_user)):
    model = Model3D(**model_data.model_dump())
    doc = model.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.models.insert_one(doc)
    return model

@api_router.get("/models/{model_id}", response_model=Model3D)
async def get_model(model_id: str, current_user: User = Depends(get_current_user)):
    model = await db.models.find_one({"id": model_id}, {"_id": 0})
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    if isinstance(model.get('created_at'), str):
        model['created_at'] = datetime.fromisoformat(model['created_at'])
    return Model3D(**model)

# ============ Assessment Routes ============

@api_router.get("/questions/{model_id}", response_model=List[Question])
async def get_questions_for_model(model_id: str, difficulty: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {"model_id": model_id}
    if difficulty:
        query["difficulty"] = difficulty
    questions = await db.questions.find(query, {"_id": 0}).to_list(1000)
    for q in questions:
        if isinstance(q.get('created_at'), str):
            q['created_at'] = datetime.fromisoformat(q['created_at'])
    return questions

@api_router.post("/questions", response_model=Question)
async def create_question(question_data: QuestionCreate, admin: User = Depends(get_admin_user)):
    question = Question(**question_data.model_dump())
    doc = question.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.questions.insert_one(doc)
    return question

@api_router.post("/assessments/submit")
async def submit_assessment(
    model_id: str,
    subject_id: str,
    submission: AssessmentSubmission,
    time_spent: Optional[int] = None,
    current_user: User = Depends(get_current_user)
):
    question = await db.questions.find_one({"id": submission.question_id}, {"_id": 0})
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    is_correct = question['correct_answer'] == submission.selected_answer
    
    result = AssessmentResult(
        user_id=current_user.id,
        subject_id=subject_id,
        model_id=model_id,
        question_id=submission.question_id,
        selected_answer=submission.selected_answer,
        is_correct=is_correct,
        time_spent=time_spent
    )
    
    doc = result.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.assessment_results.insert_one(doc)
    
    # Get user's performance to determine next difficulty
    recent_results = await db.assessment_results.find(
        {"user_id": current_user.id, "subject_id": subject_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    correct_count = sum(1 for r in recent_results if r['is_correct'])
    accuracy = correct_count / len(recent_results) if recent_results else 0.5
    
    # Adaptive logic
    next_difficulty = "medium"
    if accuracy >= 0.8:
        next_difficulty = "hard"
    elif accuracy < 0.4:
        next_difficulty = "easy"
    
    return {
        "is_correct": is_correct,
        "correct_answer": question['correct_answer'],
        "next_difficulty": next_difficulty,
        "accuracy": accuracy,
        "feedback": "Great job!" if is_correct else f"The correct answer was: {question['options'][question['correct_answer']]}"
    }

@api_router.get("/performance", response_model=PerformanceStats)
async def get_performance(current_user: User = Depends(get_current_user)):
    results = await db.assessment_results.find({"user_id": current_user.id}, {"_id": 0}).to_list(10000)
    
    if not results:
        return PerformanceStats(
            total_assessments=0,
            correct_answers=0,
            accuracy=0.0,
            subject_wise_performance={},
            weak_topics=[]
        )
    
    correct = sum(1 for r in results if r['is_correct'])
    total = len(results)
    
    # Subject-wise performance with names
    subject_perf = {}
    for r in results:
        sid = r['subject_id']
        if sid not in subject_perf:
            # Get subject name
            subject = await db.subjects.find_one({"id": sid}, {"_id": 0, "name": 1})
            subject_name = subject['name'] if subject else sid[:8]
            subject_perf[subject_name] = {"total": 0, "correct": 0, "subject_id": sid}
        
        subject_name = next((name for name, data in subject_perf.items() if data.get("subject_id") == sid), sid[:8])
        subject_perf[subject_name]["total"] += 1
        if r['is_correct']:
            subject_perf[subject_name]["correct"] += 1
    
    for subject_name in subject_perf:
        subject_perf[subject_name]["accuracy"] = subject_perf[subject_name]["correct"] / subject_perf[subject_name]["total"]
    
    # Identify weak topics (using subject names)
    weak_topics = [name for name, perf in subject_perf.items() if perf["accuracy"] < 0.6]
    
    # Average time spent
    times = [r['time_spent'] for r in results if r.get('time_spent')]
    avg_time = sum(times) / len(times) if times else None
    
    return PerformanceStats(
        total_assessments=total,
        correct_answers=correct,
        accuracy=correct / total,
        subject_wise_performance=subject_perf,
        weak_topics=weak_topics,
        avg_time_spent=avg_time
    )

@api_router.get("/leaderboard")
async def get_leaderboard(limit: int = 10, current_user: User = Depends(get_current_user)):
    # Aggregate user performance
    pipeline = [
        {"$group": {
            "_id": "$user_id",
            "total": {"$sum": 1},
            "correct": {"$sum": {"$cond": ["$is_correct", 1, 0]}}
        }},
        {"$project": {
            "user_id": "$_id",
            "total": 1,
            "correct": 1,
            "accuracy": {"$divide": ["$correct", "$total"]}
        }},
        {"$sort": {"accuracy": -1, "total": -1}},
        {"$limit": limit}
    ]
    
    results = await db.assessment_results.aggregate(pipeline).to_list(limit)
    
    # Get user details
    leaderboard = []
    for r in results:
        user = await db.users.find_one({"id": r['user_id']}, {"_id": 0, "name": 1, "email": 1})
        if user:
            leaderboard.append({
                "name": user['name'],
                "accuracy": round(r['accuracy'] * 100, 2),
                "total_assessments": r['total']
            })
    
    return leaderboard

# ============ Initialize Sample Data ============

@api_router.post("/admin/initialize-data")
async def initialize_sample_data(admin: User = Depends(get_admin_user)):
    # Check if data already exists
    existing = await db.subjects.count_documents({})
    if existing > 0:
        return {"message": "Data already initialized"}
    
    # Create subjects
    subjects = [
        Subject(name="Human Anatomy", description="Explore detailed 3D models of human body parts", category="anatomy"),
        Subject(name="Automobile Engineering", description="Learn about car components and systems", category="automobile"),
        Subject(name="Physics", description="Understand physical concepts through 3D visualization", category="physics")
    ]
    
    for subject in subjects:
        doc = subject.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.subjects.insert_one(doc)
    
    # Create 3D models (using working glTF sample models)
    models = [
        Model3D(
            title="Human Heart",
            description="Detailed 3D model of the human heart showing chambers and valves",
            model_url="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxAnimated/glTF/BoxAnimated.gltf",
            subject_id=subjects[0].id,
            labels=["Heart", "Cardiovascular", "Circulatory System"]
        ),
        Model3D(
            title="Human Brain",
            description="Explore the structure of the human brain",
            model_url="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf",
            subject_id=subjects[0].id,
            labels=["Brain", "Nervous System", "Neuroscience"]
        ),
        Model3D(
            title="Car Engine",
            description="Internal combustion engine with detailed components",
            model_url="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF/CesiumMilkTruck.gltf",
            subject_id=subjects[1].id,
            labels=["Engine", "Combustion", "Mechanics"]
        ),
        Model3D(
            title="Gearbox System",
            description="Transmission system showing gear mechanics",
            model_url="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxTextured/glTF/BoxTextured.gltf",
            subject_id=subjects[1].id,
            labels=["Gearbox", "Transmission", "Mechanics"]
        )
    ]
    
    for model in models:
        doc = model.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.models.insert_one(doc)
    
    # Create sample questions
    questions = [
        Question(
            subject_id=subjects[0].id,
            model_id=models[0].id,
            question_text="How many chambers does the human heart have?",
            options=["2", "3", "4", "5"],
            correct_answer=2,
            difficulty="easy"
        ),
        Question(
            subject_id=subjects[0].id,
            model_id=models[0].id,
            question_text="Which chamber pumps oxygenated blood to the body?",
            options=["Right Atrium", "Left Atrium", "Right Ventricle", "Left Ventricle"],
            correct_answer=3,
            difficulty="medium"
        ),
        Question(
            subject_id=subjects[0].id,
            model_id=models[1].id,
            question_text="Which part of the brain controls balance and coordination?",
            options=["Cerebrum", "Cerebellum", "Medulla", "Pons"],
            correct_answer=1,
            difficulty="medium"
        ),
        Question(
            subject_id=subjects[1].id,
            model_id=models[2].id,
            question_text="What does a car engine convert fuel into?",
            options=["Electricity", "Heat only", "Mechanical energy", "Sound"],
            correct_answer=2,
            difficulty="easy"
        ),
        Question(
            subject_id=subjects[1].id,
            model_id=models[3].id,
            question_text="What is the primary function of a gearbox?",
            options=["Cool the engine", "Transfer power and change speed", "Filter oil", "Generate electricity"],
            correct_answer=1,
            difficulty="medium"
        )
    ]
    
    for question in questions:
        doc = question.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.questions.insert_one(doc)
    
    return {"message": "Sample data initialized successfully"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)




logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()