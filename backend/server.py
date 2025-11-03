from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import motor.motor_asyncio
from passlib.context import CryptContext
from bson import ObjectId
from datetime import datetime
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
import os
from dotenv import load_dotenv
import google.generativeai as genai

# ✅ Load environment variables
load_dotenv()

# ✅ Initialize FastAPI app
app = FastAPI()

# ✅ Correct CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local React
        "https://ar-learn-ten.vercel.app",  # Your frontend on Vercel
        "https://ar-learn-fzzr.onrender.com"  # Your backend on Render
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ MongoDB setup
client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv("MONGODB_URL"))
db = client.get_database("arlearn")

# ✅ Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ✅ Gemini AI setup
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

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
    return {"message": "AR Learning Backend is running!"}

