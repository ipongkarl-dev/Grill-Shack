from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Grill Shack Management API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ===================== MODELS =====================

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: str
    unit: str = "pcs"
    price: float
    food_cost: float
    packaging_cost: float
    total_cost: float = 0
    cogs_percent: float = 0
    profit_per_order: float = 0
    opening_stock: int = 0
    current_stock: int = 0
    reorder_point: int = 10
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def __init__(self, **data):
        super().__init__(**data)
        self.total_cost = self.food_cost + self.packaging_cost
        if self.price > 0:
            self.cogs_percent = (self.total_cost / self.price) * 100
            self.profit_per_order = self.price - self.total_cost

class ProductCreate(BaseModel):
    name: str
    code: str
    unit: str = "pcs"
    price: float
    food_cost: float
    packaging_cost: float
    opening_stock: int = 0
    reorder_point: int = 10

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    unit: Optional[str] = None
    price: Optional[float] = None
    food_cost: Optional[float] = None
    packaging_cost: Optional[float] = None
    opening_stock: Optional[int] = None
    current_stock: Optional[int] = None
    reorder_point: Optional[int] = None

class Market(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    preset_mix: Dict[str, float] = {}
    is_active: bool = True

class MarketCreate(BaseModel):
    name: str
    preset_mix: Dict[str, float] = {}

class SessionSale(BaseModel):
    product_id: str
    product_name: str
    units_sold: int
    unit_price: float
    sales_value: float = 0
    food_cogs: float = 0
    packaging: float = 0
    total_cogs: float = 0
    gross_profit: float = 0

class Session(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    date: str
    market_id: str
    market_name: str
    cash: float = 0
    eftpos: float = 0
    total_collected: float = 0
    sales: List[SessionSale] = []
    total_units: int = 0
    calculated_sales: float = 0
    variance: float = 0
    status: str = "OK"
    food_cogs: float = 0
    packaging: float = 0
    total_cogs: float = 0
    gross_profit: float = 0
    cogs_percent: float = 0
    opening_float: float = 0
    cash_expenses: float = 0
    expense_notes: str = ""
    notes: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SessionCreate(BaseModel):
    date: str
    market_id: str
    market_name: str
    cash: float = 0
    eftpos: float = 0
    sales: List[Dict[str, Any]]
    opening_float: float = 0
    cash_expenses: float = 0
    expense_notes: str = ""
    notes: str = ""

class AllocationSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "default"
    owner_pay_percent: float = 30
    growth_percent: float = 20
    emergency_percent: float = 10
    buffer_percent: float = 40
    gst_rate: float = 15

class AllocationSettingsUpdate(BaseModel):
    owner_pay_percent: Optional[float] = None
    growth_percent: Optional[float] = None
    emergency_percent: Optional[float] = None
    buffer_percent: Optional[float] = None
    gst_rate: Optional[float] = None

class InventoryEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    product_name: str
    date: str
    packs_in: int = 0
    pieces_per_pack: int = 1
    total_added: int = 0
    used_qty: int = 0
    cost_per_unit: float = 0
    supplier: str = ""
    notes: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InventoryEntryCreate(BaseModel):
    product_id: str
    product_name: str
    date: str
    packs_in: int = 0
    pieces_per_pack: int = 1
    cost_per_unit: float = 0
    supplier: str = ""
    notes: str = ""

class CashflowTarget(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    month: str  # YYYY-MM
    sales_target: float = 0
    actual_sales: float = 0
    growth_saved: float = 0
    emergency_saved: float = 0
    notes: str = ""

class CashflowTargetCreate(BaseModel):
    month: str
    sales_target: float = 0
    growth_saved: float = 0
    emergency_saved: float = 0
    notes: str = ""

class ProductIngredient(BaseModel):
    name: str
    qty_per_order: float = 0
    unit: str = "g"
    cost_per_unit: float = 0
    total_cost: float = 0

class ProductWithIngredients(BaseModel):
    model_config = ConfigDict(extra="ignore")
    product_id: str
    ingredients: List[Dict[str, Any]] = []

class ProductIngredientsUpdate(BaseModel):
    ingredients: List[Dict[str, Any]]

# ===================== HELPER FUNCTIONS =====================

def serialize_doc(doc: dict) -> dict:
    """Remove MongoDB _id and serialize datetime fields"""
    if doc is None:
        return None
    doc.pop('_id', None)
    for key, value in doc.items():
        if isinstance(value, datetime):
            doc[key] = value.isoformat()
    return doc

async def get_next_session_id():
    """Generate next session ID"""
    last_session = await db.sessions.find_one({}, sort=[("session_id", -1)])
    if last_session and "session_id" in last_session:
        try:
            last_num = int(last_session["session_id"])
            return str(last_num + 1)
        except:
            pass
    return "46130"

# ===================== ROUTES =====================

@api_router.get("/")
async def root():
    return {"message": "Grill Shack Management API", "version": "1.0"}

# -------- PRODUCTS --------

@api_router.get("/products", response_model=List[Product])
async def get_products():
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.post("/products", response_model=Product)
async def create_product(input: ProductCreate):
    product = Product(
        name=input.name,
        code=input.code,
        unit=input.unit,
        price=input.price,
        food_cost=input.food_cost,
        packaging_cost=input.packaging_cost,
        opening_stock=input.opening_stock,
        current_stock=input.opening_stock,
        reorder_point=input.reorder_point
    )
    doc = product.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.products.insert_one(doc)
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, input: ProductUpdate):
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    # Recalculate derived fields if cost/price changes
    existing = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    price = update_data.get('price', existing['price'])
    food_cost = update_data.get('food_cost', existing['food_cost'])
    packaging_cost = update_data.get('packaging_cost', existing['packaging_cost'])
    
    update_data['total_cost'] = food_cost + packaging_cost
    if price > 0:
        update_data['cogs_percent'] = (update_data['total_cost'] / price) * 100
        update_data['profit_per_order'] = price - update_data['total_cost']
    
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    return updated

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# -------- MARKETS --------

@api_router.get("/markets", response_model=List[Market])
async def get_markets():
    markets = await db.markets.find({}, {"_id": 0}).to_list(100)
    return markets

@api_router.post("/markets", response_model=Market)
async def create_market(input: MarketCreate):
    market = Market(name=input.name, preset_mix=input.preset_mix)
    await db.markets.insert_one(market.model_dump())
    return market

@api_router.put("/markets/{market_id}")
async def update_market(market_id: str, input: MarketCreate):
    result = await db.markets.update_one(
        {"id": market_id},
        {"$set": {"name": input.name, "preset_mix": input.preset_mix}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Market not found")
    return {"message": "Market updated"}

@api_router.delete("/markets/{market_id}")
async def delete_market(market_id: str):
    result = await db.markets.delete_one({"id": market_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Market not found")
    return {"message": "Market deleted"}

# -------- SESSIONS --------

@api_router.get("/sessions", response_model=List[Session])
async def get_sessions(
    market_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = Query(100, le=500)
):
    query = {}
    if market_id:
        query["market_id"] = market_id
    if start_date:
        query["date"] = {"$gte": start_date}
    if end_date:
        if "date" in query:
            query["date"]["$lte"] = end_date
        else:
            query["date"] = {"$lte": end_date}
    
    sessions = await db.sessions.find(query, {"_id": 0}).sort("date", -1).to_list(limit)
    return sessions

@api_router.get("/sessions/{session_id}", response_model=Session)
async def get_session(session_id: str):
    session = await db.sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@api_router.post("/sessions", response_model=Session)
async def create_session(input: SessionCreate):
    # Get products for COGS calculation
    products_map = {}
    products = await db.products.find({}, {"_id": 0}).to_list(100)
    for p in products:
        products_map[p['id']] = p
    
    # Process sales
    session_sales = []
    total_units = 0
    calculated_sales = 0
    food_cogs = 0
    packaging = 0
    
    for sale in input.sales:
        product_id = sale.get('product_id')
        units = sale.get('units_sold', 0)
        
        if product_id in products_map:
            product = products_map[product_id]
            sales_value = units * product['price']
            item_food_cogs = units * product['food_cost']
            item_packaging = units * product['packaging_cost']
            item_total_cogs = item_food_cogs + item_packaging
            item_profit = sales_value - item_total_cogs
            
            session_sales.append(SessionSale(
                product_id=product_id,
                product_name=product['name'],
                units_sold=units,
                unit_price=product['price'],
                sales_value=sales_value,
                food_cogs=item_food_cogs,
                packaging=item_packaging,
                total_cogs=item_total_cogs,
                gross_profit=item_profit
            ))
            
            total_units += units
            calculated_sales += sales_value
            food_cogs += item_food_cogs
            packaging += item_packaging
            
            # Update product stock
            new_stock = max(0, product['current_stock'] - units)
            await db.products.update_one(
                {"id": product_id},
                {"$set": {"current_stock": new_stock}}
            )
    
    total_cogs = food_cogs + packaging
    gross_profit = calculated_sales - total_cogs
    cogs_percent = (total_cogs / calculated_sales * 100) if calculated_sales > 0 else 0
    total_collected = input.cash + input.eftpos
    variance = calculated_sales - total_collected
    
    # Determine status
    if total_collected == 0 and calculated_sales > 0:
        status = "Missing Payment"
    elif variance > 0.5:
        status = "Under-collected"
    elif variance < -0.5:
        status = "Over-collected"
    else:
        status = "OK"
    
    session_id = await get_next_session_id()
    
    session = Session(
        session_id=session_id,
        date=input.date,
        market_id=input.market_id,
        market_name=input.market_name,
        cash=input.cash,
        eftpos=input.eftpos,
        total_collected=total_collected,
        sales=[s.model_dump() for s in session_sales],
        total_units=total_units,
        calculated_sales=round(calculated_sales, 2),
        variance=round(variance, 2),
        status=status,
        food_cogs=round(food_cogs, 2),
        packaging=round(packaging, 2),
        total_cogs=round(total_cogs, 2),
        gross_profit=round(gross_profit, 2),
        cogs_percent=round(cogs_percent, 2),
        opening_float=input.opening_float,
        cash_expenses=input.cash_expenses,
        expense_notes=input.expense_notes,
        notes=input.notes
    )
    
    doc = session.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.sessions.insert_one(doc)
    
    return session

@api_router.put("/sessions/{session_id}")
async def update_session(session_id: str, input: Dict[str, Any]):
    # Allow updating cash, eftpos, notes, expenses
    allowed_fields = ['cash', 'eftpos', 'opening_float', 'cash_expenses', 'expense_notes', 'notes']
    update_data = {k: v for k, v in input.items() if k in allowed_fields}
    
    if 'cash' in update_data or 'eftpos' in update_data:
        existing = await db.sessions.find_one({"id": session_id}, {"_id": 0})
        if existing:
            cash = update_data.get('cash', existing.get('cash', 0))
            eftpos = update_data.get('eftpos', existing.get('eftpos', 0))
            total_collected = cash + eftpos
            calculated_sales = existing.get('calculated_sales', 0)
            variance = calculated_sales - total_collected
            
            if total_collected == 0 and calculated_sales > 0:
                status = "Missing Payment"
            elif variance > 0.5:
                status = "Under-collected"
            elif variance < -0.5:
                status = "Over-collected"
            else:
                status = "OK"
            
            update_data['total_collected'] = total_collected
            update_data['variance'] = round(variance, 2)
            update_data['status'] = status
    
    result = await db.sessions.update_one({"id": session_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session updated"}

@api_router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    result = await db.sessions.delete_one({"id": session_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted"}

# -------- DASHBOARD & ANALYTICS --------

@api_router.get("/dashboard/kpis")
async def get_dashboard_kpis():
    # Get all sessions
    sessions = await db.sessions.find({}, {"_id": 0}).to_list(1000)
    products = await db.products.find({}, {"_id": 0}).to_list(100)
    
    total_sales = sum(s.get('calculated_sales', 0) for s in sessions)
    total_cogs = sum(s.get('total_cogs', 0) for s in sessions)
    total_profit = sum(s.get('gross_profit', 0) for s in sessions)
    total_units = sum(s.get('total_units', 0) for s in sessions)
    session_count = len(sessions)
    
    avg_cogs_percent = (total_cogs / total_sales * 100) if total_sales > 0 else 0
    
    # Low stock alerts
    low_stock_products = [p for p in products if p.get('current_stock', 0) <= p.get('reorder_point', 10)]
    
    # Recent sessions (last 7)
    recent_sessions = sorted(sessions, key=lambda x: x.get('date', ''), reverse=True)[:7]
    
    # Sales by market
    market_sales = {}
    for s in sessions:
        market = s.get('market_name', 'Unknown')
        if market not in market_sales:
            market_sales[market] = {'sales': 0, 'units': 0, 'sessions': 0}
        market_sales[market]['sales'] += s.get('calculated_sales', 0)
        market_sales[market]['units'] += s.get('total_units', 0)
        market_sales[market]['sessions'] += 1
    
    return {
        "total_sales": round(total_sales, 2),
        "total_cogs": round(total_cogs, 2),
        "total_profit": round(total_profit, 2),
        "total_units": total_units,
        "session_count": session_count,
        "avg_cogs_percent": round(avg_cogs_percent, 2),
        "low_stock_products": low_stock_products,
        "recent_sessions": recent_sessions,
        "market_sales": market_sales
    }

@api_router.get("/dashboard/sales-by-month")
async def get_sales_by_month():
    sessions = await db.sessions.find({}, {"_id": 0}).to_list(1000)
    
    monthly_data = {}
    for s in sessions:
        date_str = s.get('date', '')
        if date_str:
            month = date_str[:7]  # YYYY-MM
            if month not in monthly_data:
                monthly_data[month] = {'sales': 0, 'cogs': 0, 'profit': 0, 'units': 0}
            monthly_data[month]['sales'] += s.get('calculated_sales', 0)
            monthly_data[month]['cogs'] += s.get('total_cogs', 0)
            monthly_data[month]['profit'] += s.get('gross_profit', 0)
            monthly_data[month]['units'] += s.get('total_units', 0)
    
    result = [
        {"month": k, **{key: round(val, 2) for key, val in v.items()}}
        for k, v in sorted(monthly_data.items())
    ]
    return result

@api_router.get("/dashboard/product-performance")
async def get_product_performance():
    sessions = await db.sessions.find({}, {"_id": 0}).to_list(1000)
    products = await db.products.find({}, {"_id": 0}).to_list(100)
    
    product_stats = {}
    for p in products:
        product_stats[p['id']] = {
            'name': p['name'],
            'code': p['code'],
            'price': p['price'],
            'cogs_percent': p.get('cogs_percent', 0),
            'units_sold': 0,
            'revenue': 0,
            'cogs': 0,
            'profit': 0
        }
    
    for session in sessions:
        for sale in session.get('sales', []):
            pid = sale.get('product_id')
            if pid in product_stats:
                product_stats[pid]['units_sold'] += sale.get('units_sold', 0)
                product_stats[pid]['revenue'] += sale.get('sales_value', 0)
                product_stats[pid]['cogs'] += sale.get('total_cogs', 0)
                product_stats[pid]['profit'] += sale.get('gross_profit', 0)
    
    result = list(product_stats.values())
    result.sort(key=lambda x: x['revenue'], reverse=True)
    return result

@api_router.get("/dashboard/margin-watch")
async def get_margin_watch():
    products = await db.products.find({}, {"_id": 0}).to_list(100)
    sessions = await db.sessions.find({}, {"_id": 0}).to_list(1000)
    
    # Calculate lifetime stats per product
    product_stats = {}
    for p in products:
        product_stats[p['id']] = {
            'id': p['id'],
            'name': p['name'],
            'code': p['code'],
            'price': p['price'],
            'unit_cost': p.get('total_cost', 0),
            'cogs_percent': p.get('cogs_percent', 0),
            'profit_per_order': p.get('profit_per_order', 0),
            'current_stock': p.get('current_stock', 0),
            'lifetime_units': 0,
            'lifetime_revenue': 0,
            'lifetime_profit': 0,
            'action': 'KEEP VISIBLE'
        }
    
    for session in sessions:
        for sale in session.get('sales', []):
            pid = sale.get('product_id')
            if pid in product_stats:
                product_stats[pid]['lifetime_units'] += sale.get('units_sold', 0)
                product_stats[pid]['lifetime_revenue'] += sale.get('sales_value', 0)
                product_stats[pid]['lifetime_profit'] += sale.get('gross_profit', 0)
    
    # Determine action recommendations
    for pid, stats in product_stats.items():
        if stats['cogs_percent'] > 35:
            stats['action'] = 'CHECK PRICE'
        elif stats['cogs_percent'] < 25 and stats['lifetime_units'] > 50:
            stats['action'] = 'PUSH HARD'
        elif stats['lifetime_units'] < 10:
            stats['action'] = 'PROMOTE'
    
    result = list(product_stats.values())
    result.sort(key=lambda x: x['lifetime_revenue'], reverse=True)
    return result

# -------- STOCK PLANNER --------

@api_router.get("/stock-planner")
async def get_stock_planner(market_id: Optional[str] = None, target_revenue: float = 1000):
    products = await db.products.find({}, {"_id": 0}).to_list(100)
    sessions = await db.sessions.find({}, {"_id": 0}).to_list(1000)
    
    # Calculate average sales mix from historical data
    product_totals = {}
    total_units = 0
    
    market_sessions = sessions
    if market_id:
        market_sessions = [s for s in sessions if s.get('market_id') == market_id]
    
    for session in market_sessions:
        for sale in session.get('sales', []):
            pid = sale.get('product_id')
            units = sale.get('units_sold', 0)
            if pid not in product_totals:
                product_totals[pid] = 0
            product_totals[pid] += units
            total_units += units
    
    # Build stock plan
    stock_plan = []
    for p in products:
        avg_mix = (product_totals.get(p['id'], 0) / total_units * 100) if total_units > 0 else 10
        estimated_orders = int((target_revenue * (avg_mix / 100)) / p['price']) if p['price'] > 0 else 0
        current_stock = p.get('current_stock', 0)
        gap = max(0, estimated_orders - current_stock)
        
        stock_plan.append({
            'product_id': p['id'],
            'product_name': p['name'],
            'code': p['code'],
            'sales_mix_percent': round(avg_mix, 2),
            'estimated_orders': estimated_orders,
            'current_stock': current_stock,
            'gap_to_buy': gap,
            'status': 'Covered' if gap == 0 else 'Buy/Prep',
            'unit_cost': p.get('total_cost', 0),
            'estimated_cogs': round(estimated_orders * p.get('total_cost', 0), 2),
            'stock_alert': 'LOW' if current_stock <= p.get('reorder_point', 10) else 'OK'
        })
    
    return {
        "target_revenue": target_revenue,
        "market_id": market_id,
        "stock_plan": stock_plan
    }

# -------- ALLOCATION TOOL --------

@api_router.get("/allocation/settings", response_model=AllocationSettings)
async def get_allocation_settings():
    settings = await db.allocation_settings.find_one({"id": "default"}, {"_id": 0})
    if not settings:
        default = AllocationSettings()
        await db.allocation_settings.insert_one(default.model_dump())
        return default
    return settings

@api_router.put("/allocation/settings", response_model=AllocationSettings)
async def update_allocation_settings(input: AllocationSettingsUpdate):
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    await db.allocation_settings.update_one(
        {"id": "default"},
        {"$set": update_data},
        upsert=True
    )
    return await get_allocation_settings()

@api_router.get("/allocation/calculate")
async def calculate_allocation(week_sales: float = 0):
    settings = await get_allocation_settings()
    
    # Calculate GST (inclusive)
    gst_rate = settings.get('gst_rate', 15) / 100
    gst_amount = week_sales * gst_rate / (1 + gst_rate)
    net_sales = week_sales - gst_amount
    
    # Get average COGS % from recent sessions
    sessions = await db.sessions.find({}, {"_id": 0}).sort("date", -1).to_list(10)
    if sessions:
        total_sales = sum(s.get('calculated_sales', 0) for s in sessions)
        total_cogs = sum(s.get('total_cogs', 0) for s in sessions)
        avg_cogs_percent = (total_cogs / total_sales) if total_sales > 0 else 0.25
    else:
        avg_cogs_percent = 0.25
    
    estimated_cogs = net_sales * avg_cogs_percent
    gross_profit = net_sales - estimated_cogs
    
    # Allocations
    owner_pay = gross_profit * (settings.get('owner_pay_percent', 30) / 100)
    growth = gross_profit * (settings.get('growth_percent', 20) / 100)
    emergency = gross_profit * (settings.get('emergency_percent', 10) / 100)
    buffer = gross_profit * (settings.get('buffer_percent', 40) / 100)
    
    return {
        "week_sales": round(week_sales, 2),
        "gst_amount": round(gst_amount, 2),
        "net_sales": round(net_sales, 2),
        "estimated_cogs": round(estimated_cogs, 2),
        "gross_profit": round(gross_profit, 2),
        "allocations": {
            "owner_pay": round(owner_pay, 2),
            "growth": round(growth, 2),
            "emergency": round(emergency, 2),
            "buffer": round(buffer, 2)
        },
        "settings": settings if isinstance(settings, dict) else settings.model_dump()
    }

# -------- INVENTORY --------

@api_router.get("/inventory", response_model=List[InventoryEntry])
async def get_inventory_entries(product_id: Optional[str] = None):
    query = {}
    if product_id:
        query["product_id"] = product_id
    entries = await db.inventory.find(query, {"_id": 0}).sort("date", -1).to_list(500)
    return entries

@api_router.post("/inventory", response_model=InventoryEntry)
async def create_inventory_entry(input: InventoryEntryCreate):
    total_added = input.packs_in * input.pieces_per_pack
    
    entry = InventoryEntry(
        product_id=input.product_id,
        product_name=input.product_name,
        date=input.date,
        packs_in=input.packs_in,
        pieces_per_pack=input.pieces_per_pack,
        total_added=total_added,
        cost_per_unit=input.cost_per_unit,
        supplier=input.supplier,
        notes=input.notes
    )
    
    doc = entry.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.inventory.insert_one(doc)
    
    # Update product stock
    await db.products.update_one(
        {"id": input.product_id},
        {"$inc": {"current_stock": total_added}}
    )
    
    return entry

# -------- CASHFLOW TRACKER --------

@api_router.get("/cashflow")
async def get_cashflow_targets():
    targets = await db.cashflow.find({}, {"_id": 0}).sort("month", 1).to_list(100)
    # Auto-fill actual_sales from sessions
    sessions = await db.sessions.find({}, {"_id": 0}).to_list(1000)
    month_sales = {}
    for s in sessions:
        m = s.get('date', '')[:7]
        month_sales[m] = month_sales.get(m, 0) + s.get('calculated_sales', 0)
    for t in targets:
        t['actual_sales'] = round(month_sales.get(t['month'], 0), 2)
    return targets

@api_router.post("/cashflow")
async def create_cashflow_target(input: CashflowTargetCreate):
    # Check if month already exists
    existing = await db.cashflow.find_one({"month": input.month}, {"_id": 0})
    if existing:
        await db.cashflow.update_one(
            {"month": input.month},
            {"$set": {
                "sales_target": input.sales_target,
                "growth_saved": input.growth_saved,
                "emergency_saved": input.emergency_saved,
                "notes": input.notes
            }}
        )
        updated = await db.cashflow.find_one({"month": input.month}, {"_id": 0})
        return updated
    target = CashflowTarget(
        month=input.month,
        sales_target=input.sales_target,
        growth_saved=input.growth_saved,
        emergency_saved=input.emergency_saved,
        notes=input.notes
    )
    doc = target.model_dump()
    await db.cashflow.insert_one(doc)
    return serialize_doc(doc)

@api_router.delete("/cashflow/{month}")
async def delete_cashflow_target(month: str):
    result = await db.cashflow.delete_one({"month": month})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cashflow target not found")
    return {"message": "Deleted"}

# -------- PRODUCT INGREDIENTS (Calculator) --------

@api_router.get("/products/{product_id}/ingredients")
async def get_product_ingredients(product_id: str):
    doc = await db.product_ingredients.find_one({"product_id": product_id}, {"_id": 0})
    if not doc:
        return {"product_id": product_id, "ingredients": []}
    return doc

@api_router.put("/products/{product_id}/ingredients")
async def update_product_ingredients(product_id: str, input: ProductIngredientsUpdate):
    # Calculate total food cost from ingredients
    total_food_cost = 0
    processed = []
    for ing in input.ingredients:
        qty = float(ing.get('qty_per_order', 0))
        cost = float(ing.get('cost_per_unit', 0))
        total = round(qty * cost, 4)
        total_food_cost += total
        processed.append({
            "name": ing.get('name', ''),
            "qty_per_order": qty,
            "unit": ing.get('unit', 'g'),
            "cost_per_unit": cost,
            "total_cost": total
        })

    await db.product_ingredients.update_one(
        {"product_id": product_id},
        {"$set": {"product_id": product_id, "ingredients": processed}},
        upsert=True
    )

    # Auto-update the product's food_cost and derived fields
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if product:
        total_food_cost = round(total_food_cost, 2)
        packaging_cost = product.get('packaging_cost', 0)
        total_cost = total_food_cost + packaging_cost
        price = product.get('price', 0)
        cogs_pct = (total_cost / price * 100) if price > 0 else 0
        profit = price - total_cost
        await db.products.update_one(
            {"id": product_id},
            {"$set": {
                "food_cost": total_food_cost,
                "total_cost": round(total_cost, 2),
                "cogs_percent": round(cogs_pct, 2),
                "profit_per_order": round(profit, 2)
            }}
        )

    return {"product_id": product_id, "ingredients": processed, "calculated_food_cost": round(total_food_cost, 2)}

# -------- EXPORT --------

@api_router.get("/export/sessions")
async def export_sessions_csv():
    from fastapi.responses import StreamingResponse
    import io, csv
    sessions = await db.sessions.find({}, {"_id": 0}).sort("date", -1).to_list(1000)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Session ID", "Date", "Market", "Total Units", "Calculated Sales", "Cash", "EFTPOS", "Total Collected", "Variance", "Status", "Food COGS", "Packaging", "Total COGS", "Gross Profit", "COGS %"])
    for s in sessions:
        writer.writerow([
            s.get('session_id'), s.get('date'), s.get('market_name'),
            s.get('total_units'), s.get('calculated_sales'), s.get('cash'), s.get('eftpos'),
            s.get('total_collected'), s.get('variance'), s.get('status'),
            s.get('food_cogs'), s.get('packaging'), s.get('total_cogs'),
            s.get('gross_profit'), s.get('cogs_percent')
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sessions_export.csv"}
    )

@api_router.get("/export/products")
async def export_products_csv():
    from fastapi.responses import StreamingResponse
    import io, csv
    products = await db.products.find({}, {"_id": 0}).to_list(100)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "Code", "Unit", "Price (NZD)", "Food Cost", "Packaging Cost", "Total Cost", "COGS %", "Profit/Order", "Current Stock", "Reorder Point"])
    for p in products:
        writer.writerow([
            p.get('name'), p.get('code'), p.get('unit'), p.get('price'),
            p.get('food_cost'), p.get('packaging_cost'), p.get('total_cost'),
            round(p.get('cogs_percent', 0), 2), round(p.get('profit_per_order', 0), 2),
            p.get('current_stock'), p.get('reorder_point')
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=products_export.csv"}
    )

# -------- MARKET COMPARISON --------

@api_router.get("/dashboard/market-comparison")
async def get_market_comparison():
    sessions = await db.sessions.find({}, {"_id": 0}).to_list(1000)
    products = await db.products.find({}, {"_id": 0}).to_list(100)
    products_map = {p['id']: p for p in products}

    market_data = {}
    for s in sessions:
        mname = s.get('market_name', 'Unknown')
        if mname not in market_data:
            market_data[mname] = {
                'market': mname,
                'sessions': 0, 'total_sales': 0, 'total_cogs': 0,
                'total_profit': 0, 'total_units': 0,
                'product_units': {}
            }
        md = market_data[mname]
        md['sessions'] += 1
        md['total_sales'] += s.get('calculated_sales', 0)
        md['total_cogs'] += s.get('total_cogs', 0)
        md['total_profit'] += s.get('gross_profit', 0)
        md['total_units'] += s.get('total_units', 0)
        for sale in s.get('sales', []):
            pname = sale.get('product_name', '')
            md['product_units'][pname] = md['product_units'].get(pname, 0) + sale.get('units_sold', 0)

    result = []
    for mname, md in market_data.items():
        avg_session_rev = md['total_sales'] / md['sessions'] if md['sessions'] > 0 else 0
        cogs_pct = (md['total_cogs'] / md['total_sales'] * 100) if md['total_sales'] > 0 else 0
        profit_margin = (md['total_profit'] / md['total_sales'] * 100) if md['total_sales'] > 0 else 0
        top_products = sorted(md['product_units'].items(), key=lambda x: x[1], reverse=True)[:3]
        result.append({
            'market': mname,
            'sessions': md['sessions'],
            'total_sales': round(md['total_sales'], 2),
            'total_cogs': round(md['total_cogs'], 2),
            'total_profit': round(md['total_profit'], 2),
            'total_units': md['total_units'],
            'avg_session_revenue': round(avg_session_rev, 2),
            'cogs_percent': round(cogs_pct, 2),
            'profit_margin': round(profit_margin, 2),
            'top_products': [{'name': n, 'units': u} for n, u in top_products]
        })
    result.sort(key=lambda x: x['total_profit'], reverse=True)
    return result

# -------- WEEKLY CONTROL --------

@api_router.get("/dashboard/weekly-control")
async def get_weekly_control():
    sessions = await db.sessions.find({}, {"_id": 0}).sort("date", 1).to_list(1000)
    from datetime import date as dt_date
    week_data = {}
    for s in sessions:
        date_str = s.get('date', '')
        if not date_str:
            continue
        try:
            parts = date_str.split('-')
            d = dt_date(int(parts[0]), int(parts[1]), int(parts[2]))
            iso = d.isocalendar()
            week_key = f"{iso[0]}-W{iso[1]:02d}"
        except:
            continue

        if week_key not in week_data:
            week_data[week_key] = {
                'week': week_key, 'start_date': date_str,
                'sessions': 0, 'sales': 0, 'cash': 0, 'eftpos': 0,
                'total_collected': 0, 'total_cogs': 0, 'gross_profit': 0,
                'expenses': 0, 'total_units': 0, 'markets': set()
            }
        wd = week_data[week_key]
        wd['sessions'] += 1
        wd['sales'] += s.get('calculated_sales', 0)
        wd['cash'] += s.get('cash', 0)
        wd['eftpos'] += s.get('eftpos', 0)
        wd['total_collected'] += s.get('total_collected', 0)
        wd['total_cogs'] += s.get('total_cogs', 0)
        wd['gross_profit'] += s.get('gross_profit', 0)
        wd['expenses'] += s.get('cash_expenses', 0)
        wd['total_units'] += s.get('total_units', 0)
        wd['markets'].add(s.get('market_name', ''))
        wd['end_date'] = date_str

    result = []
    for wk, wd in sorted(week_data.items()):
        net_profit = wd['gross_profit'] - wd['expenses']
        result.append({
            'week': wd['week'],
            'start_date': wd['start_date'],
            'end_date': wd.get('end_date', wd['start_date']),
            'sessions': wd['sessions'],
            'markets': list(wd['markets']),
            'sales': round(wd['sales'], 2),
            'cash': round(wd['cash'], 2),
            'eftpos': round(wd['eftpos'], 2),
            'total_collected': round(wd['total_collected'], 2),
            'total_cogs': round(wd['total_cogs'], 2),
            'gross_profit': round(wd['gross_profit'], 2),
            'expenses': round(wd['expenses'], 2),
            'net_profit': round(net_profit, 2),
            'total_units': wd['total_units'],
            'cogs_percent': round((wd['total_cogs'] / wd['sales'] * 100) if wd['sales'] > 0 else 0, 2)
        })
    return result

# -------- REFILL COST TRENDS --------

@api_router.get("/dashboard/refill-trends")
async def get_refill_trends():
    products = await db.products.find({}, {"_id": 0}).to_list(100)
    inventory = await db.inventory.find({}, {"_id": 0}).sort("date", 1).to_list(1000)
    sessions = await db.sessions.find({}, {"_id": 0}).to_list(1000)

    # Aggregate inventory costs over time per product
    product_trends = {}
    for p in products:
        product_trends[p['id']] = {
            'product_id': p['id'], 'name': p['name'], 'code': p['code'],
            'current_cost': p.get('food_cost', 0),
            'cost_history': [], 'total_spent': 0, 'total_units_bought': 0,
            'lifetime_units_sold': 0, 'lifetime_revenue': 0
        }

    for entry in inventory:
        pid = entry.get('product_id')
        if pid in product_trends:
            cost = entry.get('cost_per_unit', 0)
            qty = entry.get('total_added', 0)
            product_trends[pid]['cost_history'].append({
                'date': entry.get('date', ''),
                'cost_per_unit': cost,
                'units_added': qty,
                'supplier': entry.get('supplier', '')
            })
            product_trends[pid]['total_spent'] += cost * qty
            product_trends[pid]['total_units_bought'] += qty

    for s in sessions:
        for sale in s.get('sales', []):
            pid = sale.get('product_id')
            if pid in product_trends:
                product_trends[pid]['lifetime_units_sold'] += sale.get('units_sold', 0)
                product_trends[pid]['lifetime_revenue'] += sale.get('sales_value', 0)

    result = []
    for pid, pt in product_trends.items():
        avg_cost = (pt['total_spent'] / pt['total_units_bought']) if pt['total_units_bought'] > 0 else pt['current_cost']
        cost_trend = 0
        if len(pt['cost_history']) >= 2:
            first = pt['cost_history'][0]['cost_per_unit']
            last = pt['cost_history'][-1]['cost_per_unit']
            cost_trend = ((last - first) / first * 100) if first > 0 else 0
        result.append({
            **pt,
            'avg_cost': round(avg_cost, 4),
            'cost_trend_pct': round(cost_trend, 1)
        })
    result.sort(key=lambda x: x['lifetime_revenue'], reverse=True)
    return result

# -------- SCALE PLANNER --------

@api_router.get("/dashboard/scale-planner")
async def get_scale_planner(
    target_weekly_revenue: float = 3000,
    weeks_horizon: int = 12
):
    sessions = await db.sessions.find({}, {"_id": 0}).to_list(1000)
    products = await db.products.find({}, {"_id": 0}).to_list(100)
    settings_doc = await db.allocation_settings.find_one({"id": "default"}, {"_id": 0})
    gst_rate = (settings_doc.get('gst_rate', 15) if settings_doc else 15) / 100

    # Current performance metrics
    total_sessions = len(sessions)
    total_sales = sum(s.get('calculated_sales', 0) for s in sessions)
    total_cogs = sum(s.get('total_cogs', 0) for s in sessions)
    avg_session_rev = total_sales / total_sessions if total_sessions > 0 else 0
    avg_cogs_pct = (total_cogs / total_sales) if total_sales > 0 else 0.25

    # Determine current weekly average
    from datetime import date as dt_date
    week_set = set()
    for s in sessions:
        try:
            parts = s.get('date', '').split('-')
            d = dt_date(int(parts[0]), int(parts[1]), int(parts[2]))
            week_set.add(d.isocalendar()[:2])
        except:
            pass
    weeks_active = max(len(week_set), 1)
    current_weekly = total_sales / weeks_active

    # Sessions needed per week to hit target
    sessions_per_week_needed = target_weekly_revenue / avg_session_rev if avg_session_rev > 0 else 4
    sessions_per_week_current = total_sessions / weeks_active

    # Financial projections
    projected_gross = target_weekly_revenue * weeks_horizon
    projected_net = projected_gross / (1 + gst_rate)
    projected_cogs = projected_net * avg_cogs_pct
    projected_profit = projected_net - projected_cogs

    # Stock investment needed
    total_stock_value = sum(p.get('current_stock', 0) * p.get('food_cost', 0) for p in products)
    weekly_stock_needed = target_weekly_revenue * avg_cogs_pct

    # Growth gap
    revenue_gap = target_weekly_revenue - current_weekly
    growth_pct = (revenue_gap / current_weekly * 100) if current_weekly > 0 else 0

    return {
        'target_weekly_revenue': target_weekly_revenue,
        'weeks_horizon': weeks_horizon,
        'current_weekly_avg': round(current_weekly, 2),
        'revenue_gap': round(revenue_gap, 2),
        'growth_needed_pct': round(growth_pct, 1),
        'avg_session_revenue': round(avg_session_rev, 2),
        'sessions_per_week_current': round(sessions_per_week_current, 1),
        'sessions_per_week_needed': round(sessions_per_week_needed, 1),
        'avg_cogs_percent': round(avg_cogs_pct * 100, 1),
        'projections': {
            'gross_revenue': round(projected_gross, 2),
            'net_revenue': round(projected_net, 2),
            'total_cogs': round(projected_cogs, 2),
            'total_profit': round(projected_profit, 2),
        },
        'investment': {
            'current_stock_value': round(total_stock_value, 2),
            'weekly_stock_investment': round(weekly_stock_needed, 2),
            'total_stock_investment': round(weekly_stock_needed * weeks_horizon, 2),
        },
        'weeks_active': weeks_active,
        'total_sessions': total_sessions
    }


# -------- DAILY PREP CHECKLIST --------

@api_router.get("/prep-checklist")
async def generate_prep_checklist(market_id: Optional[str] = None, target_revenue: float = 1000):
    products = await db.products.find({}, {"_id": 0}).to_list(100)
    sessions = await db.sessions.find({}, {"_id": 0}).to_list(1000)
    markets = await db.markets.find({}, {"_id": 0}).to_list(100)

    market_name = "All Markets"
    if market_id:
        m = next((mk for mk in markets if mk['id'] == market_id), None)
        if m:
            market_name = m['name']

    product_totals = {}
    total_units = 0
    filtered = [s for s in sessions if not market_id or s.get('market_id') == market_id]
    for s in filtered:
        for sale in s.get('sales', []):
            pid = sale.get('product_id')
            units = sale.get('units_sold', 0)
            product_totals[pid] = product_totals.get(pid, 0) + units
            total_units += units

    checklist = []
    total_est_cost = 0
    for p in products:
        mix = (product_totals.get(p['id'], 0) / total_units * 100) if total_units > 0 else 10
        est_orders = int((target_revenue * (mix / 100)) / p['price']) if p['price'] > 0 else 0
        current = p.get('current_stock', 0)
        gap = max(0, est_orders - current)
        cost = gap * p.get('total_cost', 0)
        total_est_cost += cost
        checklist.append({
            'product_id': p['id'],
            'product_name': p['name'],
            'code': p['code'],
            'estimated_orders': est_orders,
            'current_stock': current,
            'to_prep': gap,
            'unit_cost': p.get('total_cost', 0),
            'estimated_cost': round(cost, 2),
            'status': 'Ready' if gap == 0 else 'Prep Needed',
            'checked': False
        })
    return {
        'date': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
        'market_name': market_name,
        'market_id': market_id,
        'target_revenue': target_revenue,
        'checklist': checklist,
        'total_items_to_prep': sum(1 for c in checklist if c['to_prep'] > 0),
        'total_estimated_cost': round(total_est_cost, 2),
        'markets': [{'id': mk['id'], 'name': mk['name']} for mk in markets]
    }

@api_router.get("/export/prep-checklist")
async def export_prep_checklist_csv(market_id: Optional[str] = None, target_revenue: float = 1000):
    from fastapi.responses import StreamingResponse
    import io, csv
    data = await generate_prep_checklist(market_id, target_revenue)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["GRILL SHACK - Daily Prep Checklist"])
    writer.writerow([f"Market: {data['market_name']}", f"Date: {data['date']}", f"Target: ${data['target_revenue']}"])
    writer.writerow([])
    writer.writerow(["Product", "Code", "Est. Orders", "In Stock", "To Prep", "Unit Cost", "Est. Cost", "Status", "Done?"])
    for item in data['checklist']:
        writer.writerow([item['product_name'], item['code'], item['estimated_orders'], item['current_stock'], item['to_prep'], f"${item['unit_cost']:.2f}", f"${item['estimated_cost']:.2f}", item['status'], "[ ]"])
    writer.writerow([])
    writer.writerow([f"Total items to prep: {data['total_items_to_prep']}", f"Estimated cost: ${data['total_estimated_cost']:.2f}"])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=prep_checklist_{data['date']}.csv"})

# -------- ALERTS --------

@api_router.get("/alerts")
async def get_alerts():
    products = await db.products.find({}, {"_id": 0}).to_list(100)
    sessions = await db.sessions.find({}, {"_id": 0}).sort("date", -1).to_list(20)
    alerts = []
    for p in products:
        if p.get('current_stock', 0) <= p.get('reorder_point', 10):
            severity = 'critical' if p.get('current_stock', 0) == 0 else 'warning'
            alerts.append({'id': f"stock-{p['id']}", 'type': 'stock', 'severity': severity, 'title': f"{p['name']} - {'Out of Stock!' if severity == 'critical' else 'Low Stock'}", 'message': f"Current: {p.get('current_stock', 0)} units, Reorder at: {p.get('reorder_point', 10)}", 'product_id': p['id'], 'product_code': p['code']})
    for s in sessions[:5]:
        if abs(s.get('variance', 0)) > 50:
            alerts.append({'id': f"cash-{s['id']}", 'type': 'cash', 'severity': 'warning', 'title': f"Large variance: Session #{s.get('session_id')}", 'message': f"Variance of ${abs(s.get('variance', 0)):.2f} at {s.get('market_name')} on {s.get('date')}", 'session_id': s['id']})
    for p in products:
        if p.get('cogs_percent', 0) > 40:
            alerts.append({'id': f"cogs-{p['id']}", 'type': 'cogs', 'severity': 'info', 'title': f"High COGS: {p['name']}", 'message': f"COGS at {p.get('cogs_percent', 0):.1f}% - review pricing", 'product_id': p['id']})
    alerts.sort(key=lambda x: {'critical': 0, 'warning': 1, 'info': 2}.get(x['severity'], 3))
    return alerts


# -------- SEED DATA --------

@api_router.post("/seed")
async def seed_data():
    """Seed initial data from the Excel file"""
    
    # Check if data already exists
    existing_products = await db.products.count_documents({})
    if existing_products > 0:
        return {"message": "Data already seeded", "products": existing_products}
    
    # Products from Excel
    products_data = [
        {"name": "Brekkie Buns", "code": "BB", "price": 10.5, "food_cost": 2.49, "packaging_cost": 0.50, "opening_stock": 25},
        {"name": "BBQ Ribs", "code": "BR", "price": 20.5, "food_cost": 5.26, "packaging_cost": 0.50, "opening_stock": 55},
        {"name": "Wagyu Beef Sliders", "code": "WS", "price": 15.5, "food_cost": 2.46, "packaging_cost": 0.50, "opening_stock": 13},
        {"name": "Smokies", "code": "SM", "price": 12.5, "food_cost": 3.88, "packaging_cost": 0.50, "opening_stock": 12},
        {"name": "Pulled Pork", "code": "PP", "price": 15.5, "food_cost": 1.86, "packaging_cost": 0.50, "opening_stock": 3},
        {"name": "Wedges", "code": "WD", "price": 9.5, "food_cost": 1.43, "packaging_cost": 0.50, "opening_stock": 10},
        {"name": "Onion Rings", "code": "OR", "price": 9.5, "food_cost": 2.08, "packaging_cost": 0.50, "opening_stock": 7},
        {"name": "Chicken Lollies", "code": "CP", "price": 8.5, "food_cost": 2.69, "packaging_cost": 0.50, "opening_stock": 20},
        {"name": "Drinks", "code": "DR", "price": 5.0, "food_cost": 0, "packaging_cost": 0, "opening_stock": 47},
        {"name": "Up-sell", "code": "US", "price": 7.0, "food_cost": 1.43, "packaging_cost": 0.50, "opening_stock": 30},
    ]
    
    for p_data in products_data:
        product = Product(
            name=p_data["name"],
            code=p_data["code"],
            price=p_data["price"],
            food_cost=p_data["food_cost"],
            packaging_cost=p_data["packaging_cost"],
            opening_stock=p_data["opening_stock"],
            current_stock=p_data["opening_stock"]
        )
        doc = product.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.products.insert_one(doc)
    
    # Markets
    markets_data = [
        {"name": "Grafton Market", "preset_mix": {"BB": 11.4, "BR": 9.0, "WS": 12.1, "SM": 7.2, "PP": 8.5, "WD": 6.6, "OR": 40.0, "CP": 12.1, "DR": 27.9, "US": 31.6}},
        {"name": "Britomart Market", "preset_mix": {"BB": 11.6, "BR": 10.0, "WS": 10.2, "SM": 6.5, "PP": 13.0, "WD": 18.8, "OR": 10.8, "CP": 7.0, "DR": 6.5, "US": 6.8}},
        {"name": "EventFinda Market", "preset_mix": {"BB": 5.0, "BR": 12.0, "WS": 22.0, "SM": 19.0, "PP": 9.0, "WD": 4.0, "OR": 5.0, "CP": 2.0, "DR": 2.0, "US": 2.0}},
        {"name": "Victoria Park Market", "preset_mix": {"BB": 3.0, "BR": 15.0, "WS": 25.0, "SM": 9.0, "PP": 14.0, "WD": 1.0, "OR": 4.0, "CP": 8.0, "DR": 5.0, "US": 6.0}},
        {"name": "Long Bay Market", "preset_mix": {}},
    ]
    
    markets_map = {}
    for m_data in markets_data:
        market = Market(name=m_data["name"], preset_mix=m_data["preset_mix"])
        await db.markets.insert_one(market.model_dump())
        markets_map[m_data["name"]] = market.id
    
    # Get products map
    products = await db.products.find({}, {"_id": 0}).to_list(100)
    products_map = {p['code']: p['id'] for p in products}
    
    # Historical sessions from Excel
    sessions_data = [
        {"date": "2026-02-15", "market": "Grafton Market", "cash": 300, "eftpos": 294.96, "sales": {"BB": 0, "BR": 15, "WS": 10, "SM": 6, "PP": 4, "WD": 4, "OR": 4, "CP": 9, "DR": 0, "US": 0}},
        {"date": "2026-02-20", "market": "Britomart Market", "cash": 0, "eftpos": 0, "sales": {"BB": 10, "BR": 9, "WS": 21, "SM": 13, "PP": 10, "WD": 4, "OR": 4, "CP": 0, "DR": 0, "US": 0}},
        {"date": "2026-03-05", "market": "EventFinda Market", "cash": 0, "eftpos": 0, "sales": {"BB": 0, "BR": 13, "WS": 24, "SM": 21, "PP": 10, "WD": 4, "OR": 5, "CP": 0, "DR": 0, "US": 0}},
        {"date": "2026-03-08", "market": "Britomart Market", "cash": 0, "eftpos": 0, "sales": {"BB": 18, "BR": 11, "WS": 21, "SM": 15, "PP": 9, "WD": 9, "OR": 3, "CP": 0, "DR": 0, "US": 0}},
        {"date": "2026-03-12", "market": "Britomart Market", "cash": 0, "eftpos": 0, "sales": {"BB": 12, "BR": 6, "WS": 17, "SM": 12, "PP": 7, "WD": 1, "OR": 5, "CP": 8, "DR": 0, "US": 0}},
        {"date": "2026-03-15", "market": "Britomart Market", "cash": 500, "eftpos": 660, "sales": {"BB": 16, "BR": 8, "WS": 21, "SM": 15, "PP": 7, "WD": 5, "OR": 1, "CP": 8, "DR": 11, "US": 6}},
        {"date": "2026-03-18", "market": "Victoria Park Market", "cash": 700, "eftpos": 830.4, "sales": {"BB": 0, "BR": 19, "WS": 32, "SM": 11, "PP": 18, "WD": 1, "OR": 5, "CP": 10, "DR": 7, "US": 8}},
        {"date": "2026-03-22", "market": "Britomart Market", "cash": 600, "eftpos": 876.58, "sales": {"BB": 10, "BR": 18, "WS": 23, "SM": 13, "PP": 8, "WD": 8, "OR": 3, "CP": 2, "DR": 4, "US": 6}},
        {"date": "2026-04-02", "market": "Britomart Market", "cash": 550, "eftpos": 819.81, "sales": {"BB": 19, "BR": 7, "WS": 32, "SM": 15, "PP": 6, "WD": 3, "OR": 3, "CP": 9, "DR": 15, "US": 3}},
        {"date": "2026-04-05", "market": "Grafton Market", "cash": 300, "eftpos": 294.96, "sales": {"BB": 0, "BR": 9, "WS": 11, "SM": 4, "PP": 1, "WD": 0, "OR": 1, "CP": 8, "DR": 11, "US": 6}},
        {"date": "2026-04-08", "market": "Britomart Market", "cash": 450, "eftpos": 620.35, "sales": {"BB": 8, "BR": 12, "WS": 19, "SM": 14, "PP": 6, "WD": 3, "OR": 3, "CP": 3, "DR": 10, "US": 7}},
    ]
    
    session_counter = 46080
    for s_data in sessions_data:
        market_id = markets_map.get(s_data["market"], "")
        sales_list = []
        for code, units in s_data["sales"].items():
            if units > 0 and code in products_map:
                sales_list.append({
                    "product_id": products_map[code],
                    "units_sold": units
                })
        
        session_input = SessionCreate(
            date=s_data["date"],
            market_id=market_id,
            market_name=s_data["market"],
            cash=s_data["cash"],
            eftpos=s_data["eftpos"],
            sales=sales_list
        )
        
        # Create session (this will also update stock)
        await create_session(session_input)
        session_counter += 1
    
    # Create default allocation settings
    await db.allocation_settings.insert_one(AllocationSettings().model_dump())
    
    return {
        "message": "Data seeded successfully",
        "products": len(products_data),
        "markets": len(markets_data),
        "sessions": len(sessions_data)
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
