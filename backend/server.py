from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import motor.motor_asyncio
from passlib.context import CryptContext
from datetime import datetime
from dotenv import load_dotenv
import os
import google.generativeai as genai

# ✅ Load environment variables
load_dotenv()

# ✅ Initialize FastAPI app
app = FastAPI()

# ✅ CORS configuration
allowed_origins = [
    "http://localhost:3000",
    "https://ar-learn-ten.vercel.app",
    "https://ar-learn-fzzr.onrender.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ MongoDB setup (fixed variable name)
client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv("MONGO_URL"))
db = client.get_database(os.getenv("DB_NAME", "ar_learning_db"))

# ✅ Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ✅ Gemini AI setup
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# ✅ User models
class User(BaseModel):
    username: str
    email: str
    password: str

class Login(BaseModel):
    email: str
    password: str

@app.post("/api/auth/register")
async def register_user(user: User):
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = pwd_context.hash(user.password)
    user_dict = user.dict()
    user_dict["password"] = hashed_password
    user_dict["createdAt"] = datetime.utcnow()

    result = await db.users.insert_one(user_dict)
    return {"message": "User registered successfully", "id": str(result.inserted_id)}

@app.post("/api/auth/login")
async def login_user(login: Login):
    user = await db.users.find_one({"email": login.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not pwd_context.verify(login.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid password")

    return {"message": "Login successful", "username": user["username"], "email": user["email"]}

# ✅ AI Question endpoint
class Question(BaseModel):
    question: str

@app.post("/api/ask")
async def ask_ai(question: Question):
    try:
        model = genai.GenerativeModel("gemini-pro")
        response = model.generate_content(question.question)
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def home():
    return {"message": "✅ AR Learning Backend is running!"}
