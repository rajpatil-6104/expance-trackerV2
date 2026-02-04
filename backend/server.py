from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    email: str
    created_at: str

class TokenResponse(BaseModel):
    token: str
    user: User

class ExpenseCreate(BaseModel):
    amount: float
    category: str
    description: str
    date: str

class Expense(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    amount: float
    category: str
    description: str
    date: str
    created_at: str

class BudgetCreate(BaseModel):
    category: str
    monthly_limit: float
    month: int
    year: int

class Budget(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    category: str
    monthly_limit: float
    month: int
    year: int

class CategorySummary(BaseModel):
    category: str
    total: float
    count: int

class AnalyticsSummary(BaseModel):
    total_expenses: float
    expense_count: int
    categories: List[CategorySummary]
    monthly_trend: List[dict]

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication failed")

# Auth Routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": user_data.name,
        "email": user_data.email,
        "password_hash": get_password_hash(user_data.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Create token
    token = create_access_token({"sub": user_id})
    user = User(id=user_id, name=user_data.name, email=user_data.email, created_at=user_doc["created_at"])
    return TokenResponse(token=token, user=user)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc or not verify_password(credentials.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": user_doc["id"]})
    user = User(
        id=user_doc["id"],
        name=user_doc["name"],
        email=user_doc["email"],
        created_at=user_doc["created_at"]
    )
    return TokenResponse(token=token, user=user)

# Expense Routes
@api_router.post("/expenses", response_model=Expense, status_code=status.HTTP_201_CREATED)
async def create_expense(expense_data: ExpenseCreate, user_id: str = Depends(get_current_user)):
    expense_id = str(uuid.uuid4())
    expense_doc = {
        "id": expense_id,
        "user_id": user_id,
        "amount": expense_data.amount,
        "category": expense_data.category,
        "description": expense_data.description,
        "date": expense_data.date,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.expenses.insert_one(expense_doc)
    return Expense(**expense_doc)

@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses(
    user_id: str = Depends(get_current_user),
    category: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    query = {"user_id": user_id}
    if category:
        query["category"] = category
    if start_date:
        query.setdefault("date", {})["$gte"] = start_date
    if end_date:
        query.setdefault("date", {})["$lte"] = end_date
    
    expenses = await db.expenses.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    return [Expense(**exp) for exp in expenses]

@api_router.get("/expenses/{expense_id}", response_model=Expense)
async def get_expense(expense_id: str, user_id: str = Depends(get_current_user)):
    expense = await db.expenses.find_one({"id": expense_id, "user_id": user_id}, {"_id": 0})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return Expense(**expense)

@api_router.put("/expenses/{expense_id}", response_model=Expense)
async def update_expense(expense_id: str, expense_data: ExpenseCreate, user_id: str = Depends(get_current_user)):
    result = await db.expenses.update_one(
        {"id": expense_id, "user_id": user_id},
        {"$set": expense_data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    updated_expense = await db.expenses.find_one({"id": expense_id}, {"_id": 0})
    return Expense(**updated_expense)

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, user_id: str = Depends(get_current_user)):
    result = await db.expenses.delete_one({"id": expense_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted successfully"}

# Analytics Routes
@api_router.get("/analytics/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(
    user_id: str = Depends(get_current_user),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    query = {"user_id": user_id}
    if start_date:
        query.setdefault("date", {})["$gte"] = start_date
    if end_date:
        query.setdefault("date", {})["$lte"] = end_date
    
    expenses = await db.expenses.find(query, {"_id": 0}).to_list(10000)
    
    total_expenses = sum(exp["amount"] for exp in expenses)
    expense_count = len(expenses)
    
    # Group by category
    category_map = {}
    for exp in expenses:
        cat = exp["category"]
        if cat not in category_map:
            category_map[cat] = {"category": cat, "total": 0, "count": 0}
        category_map[cat]["total"] += exp["amount"]
        category_map[cat]["count"] += 1
    
    categories = [CategorySummary(**cat) for cat in category_map.values()]
    
    # Monthly trend (last 6 months)
    monthly_map = {}
    for exp in expenses:
        month_key = exp["date"][:7]  # YYYY-MM
        if month_key not in monthly_map:
            monthly_map[month_key] = 0
        monthly_map[month_key] += exp["amount"]
    
    monthly_trend = [{"month": k, "amount": v} for k, v in sorted(monthly_map.items())]
    
    return AnalyticsSummary(
        total_expenses=total_expenses,
        expense_count=expense_count,
        categories=categories,
        monthly_trend=monthly_trend
    )

# Budget Routes
@api_router.post("/budget", response_model=Budget)
async def create_budget(budget_data: BudgetCreate, user_id: str = Depends(get_current_user)):
    # Check if budget already exists
    existing = await db.budgets.find_one({
        "user_id": user_id,
        "category": budget_data.category,
        "month": budget_data.month,
        "year": budget_data.year
    }, {"_id": 0})
    
    if existing:
        # Update existing budget
        await db.budgets.update_one(
            {"id": existing["id"]},
            {"$set": {"monthly_limit": budget_data.monthly_limit}}
        )
        existing["monthly_limit"] = budget_data.monthly_limit
        return Budget(**existing)
    
    # Create new budget
    budget_id = str(uuid.uuid4())
    budget_doc = {
        "id": budget_id,
        "user_id": user_id,
        "category": budget_data.category,
        "monthly_limit": budget_data.monthly_limit,
        "month": budget_data.month,
        "year": budget_data.year
    }
    await db.budgets.insert_one(budget_doc)
    return Budget(**budget_doc)

@api_router.get("/budget", response_model=List[Budget])
async def get_budgets(user_id: str = Depends(get_current_user)):
    budgets = await db.budgets.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    return [Budget(**b) for b in budgets]

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