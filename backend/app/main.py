import logging
import sqlite3
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.database.session import engine, SessionLocal
from app.database.base import Base
import app.models  # Ensures all SQLAlchemy models are registered
from app.api import (
    auth_router, farmers_router, conversations_router,
    chat_router, voice_router, knowledge_router, simulator_router,
    translate_router, work_listings_router, women_entrepreneurship_router
)
from app.knowledge.retrieval.knowledge_service import initialize_knowledge_base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("krishi_ai")


def run_db_migrations():
    """Migrates existing SQLite database schema to add Phase 2 columns and work listing tables if missing."""
    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Check users table
        user_cols = [c[1] for c in cursor.execute("PRAGMA table_info(users)").fetchall()]
        if "uuid" not in user_cols:
            cursor.execute("ALTER TABLE users ADD COLUMN uuid VARCHAR(64)")

        # Check farmer_profiles table
        farmer_cols = [c[1] for c in cursor.execute("PRAGMA table_info(farmer_profiles)").fetchall()]
        if "age" not in farmer_cols:
            cursor.execute("ALTER TABLE farmer_profiles ADD COLUMN age INTEGER")
        if "voice_response_enabled" not in farmer_cols:
            cursor.execute("ALTER TABLE farmer_profiles ADD COLUMN voice_response_enabled BOOLEAN DEFAULT 0")

        # Check messages table
        msg_cols = [c[1] for c in cursor.execute("PRAGMA table_info(messages)").fetchall()]
        if "language" not in msg_cols:
            cursor.execute("ALTER TABLE messages ADD COLUMN language VARCHAR(20)")
        if "image_url" not in msg_cols:
            cursor.execute("ALTER TABLE messages ADD COLUMN image_url TEXT")
        if "sources_json" not in msg_cols:
            cursor.execute("ALTER TABLE messages ADD COLUMN sources_json TEXT")

        # Check work_listings table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS work_listings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title VARCHAR(200) NOT NULL,
                description TEXT NOT NULL,
                category VARCHAR(100) NOT NULL,
                location VARCHAR(200) NOT NULL,
                payment VARCHAR(100) NOT NULL,
                work_type VARCHAR(50) DEFAULT 'Daily Wage',
                urgency VARCHAR(50) DEFAULT 'Immediate',
                contact_name VARCHAR(100) NOT NULL,
                contact_phone VARCHAR(50) NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'published',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_work_listings_user_id ON work_listings(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_work_listings_status ON work_listings(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_work_listings_category ON work_listings(category)")

        # Check work_requests table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS work_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                listing_id INTEGER NOT NULL,
                seeker_user_id INTEGER,
                seeker_name VARCHAR(100) NOT NULL,
                seeker_phone VARCHAR(50) NOT NULL,
                message TEXT,
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (listing_id) REFERENCES work_listings (id) ON DELETE CASCADE,
                FOREIGN KEY (seeker_user_id) REFERENCES users (id) ON DELETE SET NULL
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_work_requests_listing_id ON work_requests(listing_id)")

        # Seed initial work listings if table is empty
        count = cursor.execute("SELECT count(*) FROM work_listings").fetchone()[0]
        first_user_id = cursor.execute("SELECT id FROM users LIMIT 1").fetchone()
        uid = first_user_id[0] if first_user_id else 1

        if count == 0:
            seed_listings = [
                (
                    uid,
                    "Paddy Harvesting & Threshing Labor Needed / వరి కోత కూలీలు కావాలి",
                    "Require 6 to 8 experienced farm laborers for paddy harvesting and manual bundling across 4 acres. Lunch and tea provided.",
                    "Harvesting",
                    "Tenali, Guntur District",
                    "₹750 / Day",
                    "Daily Wage",
                    "Immediate",
                    "Koteswara Rao (కోటేశ్వరరావు)",
                    "9848123456",
                    "published"
                ),
                (
                    uid,
                    "Tractor & Rotavator for Field Preparation / రోటవేటర్ & ట్రాక్టర్ పని",
                    "Need 45HP+ tractor with rotavator for dry land ploughing and seed bed preparation. Immediate booking for 3 days.",
                    "Tractor & Machinery",
                    "Vijayawada Rural, Krishna District",
                    "₹1,200 / Hour",
                    "Contract",
                    "Immediate",
                    "Subba Reddy (సుబ్బారెడ్డి)",
                    "9440654321",
                    "published"
                ),
                (
                    uid,
                    "Cotton Picking Workers / పత్తి ఏరడానికి కూలీలు కావాలి",
                    "Urgent requirement for 10 workers for second-round cotton picking. Immediate daily wage payment at the end of each work day.",
                    "Harvesting",
                    "Adilabad / Warangal",
                    "₹12 / Kg picked",
                    "Daily Wage",
                    "Immediate",
                    "Raju Naidu (రాజు నాయుడు)",
                    "9988776655",
                    "published"
                ),
                (
                    uid,
                    "Neem & Organic Spraying for Chilli Crop / మిర్చి తోటలో మందు పిచికారీ",
                    "Looking for 2 skilled workers with battery sprayers for bio-pesticide and micronutrient spray in chilli field.",
                    "Spraying",
                    "Khammam Rural",
                    "₹800 / Day",
                    "Daily Wage",
                    "Within 2-3 Days",
                    "Venkatesh (వెంకటేష్)",
                    "9876501234",
                    "published"
                ),
                (
                    uid,
                    "Farm Carpenter for Wooden Cattle Shed & Cart Repairs / వడ్రంగి పని",
                    "Need skilled carpenter for repairing wooden bullock carts, tool handles (spades, plows), and cattle shed wooden rafters.",
                    "Carpenter",
                    "Bapatla, Bapatla District",
                    "₹900 / Day",
                    "Daily Wage",
                    "Within 2-3 Days",
                    "Satyanarayana Chary (సత్యనారాయణ)",
                    "9848998877",
                    "published"
                ),
                (
                    uid,
                    "Tailoring for Crop Tarpaulin & Gunny Bags Stitching / టార్పాలిన్ & సంచుల కుట్టుపని",
                    "Experienced tailor needed for heavy cloth stitching, crop drying tarpaulins repair, shade net stitching, and packaging bags.",
                    "Tailoring",
                    "Miryalaguda, Nalgonda District",
                    "₹600 / Day",
                    "Daily Wage",
                    "Immediate",
                    "Lakshmi Devi (లక్ష్మీ దేవి)",
                    "9701122334",
                    "published"
                ),
                (
                    uid,
                    "Delivery & Transport Vehicle for Paddy to Mandi / వ్యవసాయ సరుకు రవాణా",
                    "Need mini truck / pickup / tractor trolley with driver to transport 45 bags of harvested grain from farm gate to market yard.",
                    "Delivery (Transportation)",
                    "Tenali, Guntur District",
                    "₹1,800 / Trip",
                    "Contract",
                    "Immediate",
                    "Narayana (నారాయణ)",
                    "9849554433",
                    "published"
                )
            ]
            cursor.executemany("""
                INSERT INTO work_listings (user_id, title, description, category, location, payment, work_type, urgency, contact_name, contact_phone, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, seed_listings)
        else:
            # Ensure new feature categories (Carpenter, Tailoring, Delivery) exist in existing DB
            existing_categories = set(r[0] for r in cursor.execute("SELECT category FROM work_listings").fetchall())
            additional_listings = []
            if "Carpenter" not in existing_categories:
                additional_listings.append((
                    uid,
                    "Farm Carpenter for Wooden Cattle Shed & Cart Repairs / వడ్రంగి పని",
                    "Need skilled carpenter for repairing wooden bullock carts, tool handles (spades, plows), and cattle shed wooden rafters.",
                    "Carpenter",
                    "Bapatla, Bapatla District",
                    "₹900 / Day",
                    "Daily Wage",
                    "Within 2-3 Days",
                    "Satyanarayana Chary (సత్యనారాయణ)",
                    "9848998877",
                    "published"
                ))
            if "Tailoring" not in existing_categories:
                additional_listings.append((
                    uid,
                    "Tailoring for Crop Tarpaulin & Gunny Bags Stitching / టార్పాలిన్ & సంచుల కుట్టుపని",
                    "Experienced tailor needed for heavy cloth stitching, crop drying tarpaulins repair, shade net stitching, and packaging bags.",
                    "Tailoring",
                    "Miryalaguda, Nalgonda District",
                    "₹600 / Day",
                    "Daily Wage",
                    "Immediate",
                    "Lakshmi Devi (లక్ష్మీ దేవి)",
                    "9701122334",
                    "published"
                ))
            if "Delivery (Transportation)" not in existing_categories and "Transport" not in existing_categories:
                additional_listings.append((
                    uid,
                    "Delivery & Transport Vehicle for Paddy to Mandi / వ్యవసాయ సరుకు రవాణా",
                    "Need mini truck / pickup / tractor trolley with driver to transport 45 bags of harvested grain from farm gate to market yard.",
                    "Delivery (Transportation)",
                    "Tenali, Guntur District",
                    "₹1,800 / Trip",
                    "Contract",
                    "Immediate",
                    "Narayana (నారాయణ)",
                    "9849554433",
                    "published"
                ))
            if additional_listings:
                cursor.executemany("""
                    INSERT INTO work_listings (user_id, title, description, category, location, payment, work_type, urgency, contact_name, contact_phone, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, additional_listings)

        # Check women_enterprises table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS women_enterprises (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                business_name VARCHAR(200) NOT NULL,
                title VARCHAR(250) NOT NULL,
                category VARCHAR(100) NOT NULL,
                description TEXT NOT NULL,
                shg_group_name VARCHAR(150),
                products_offered TEXT NOT NULL,
                price_range VARCHAR(100) NOT NULL,
                production_capacity VARCHAR(100) NOT NULL,
                location VARCHAR(200) NOT NULL,
                district VARCHAR(100),
                contact_name VARCHAR(100) NOT NULL,
                contact_phone VARCHAR(50) NOT NULL,
                government_scheme_availed VARCHAR(200),
                certifications VARCHAR(200),
                status VARCHAR(20) NOT NULL DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_women_enterprises_user_id ON women_enterprises(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_women_enterprises_status ON women_enterprises(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_women_enterprises_category ON women_enterprises(category)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_women_enterprises_location ON women_enterprises(location)")

        # Check women_enterprise_inquiries table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS women_enterprise_inquiries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                enterprise_id INTEGER NOT NULL,
                buyer_user_id INTEGER,
                buyer_name VARCHAR(100) NOT NULL,
                buyer_phone VARCHAR(50) NOT NULL,
                inquiry_type VARCHAR(50) NOT NULL DEFAULT 'Purchase Order',
                message TEXT,
                quantity_needed VARCHAR(100),
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (enterprise_id) REFERENCES women_enterprises (id) ON DELETE CASCADE,
                FOREIGN KEY (buyer_user_id) REFERENCES users (id) ON DELETE SET NULL
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_women_enterprise_inquiries_enterprise_id ON women_enterprise_inquiries(enterprise_id)")

        # Seed initial women enterprises if empty
        we_count = cursor.execute("SELECT count(*) FROM women_enterprises").fetchone()[0]
        if we_count == 0:
            seed_enterprises = [
                (
                    uid,
                    "Bhavani Bio-Cold Pressed Oils (భవానీ గానుగ నూనెలు)",
                    "Traditional Wooden Cold-Pressed Groundnut & Sesame Oil / స్వచ్ఛమైన గానుగ నూనెలు",
                    "Cold-Pressed Oils & Value Addition",
                    "Pure traditional wooden cold-pressed groundnut oil, sesame (gingelly) oil, and safflower oil made by Bhavani SHG. 100% unrefined, zero chemical preservatives, stone filtered.",
                    "Bhavani Mahila Mandali (10 Members)",
                    "Cold-Pressed Groundnut Oil (వేరుశనగ నూనె), Cold-Pressed Sesame Oil (నువ్వుల నూనె)",
                    "₹280 - ₹360 / Litre",
                    "450 Litres / Month",
                    "Madanapalle Rural, Chittoor / Annamayya",
                    "Annamayya",
                    "Smt. Mangamma (మంగమ్మ)",
                    "9848234567",
                    "PM FME 35% Capital Subsidy + Stree Nidhi Credit Linkage",
                    "FSSAI Certified, Lakhpati Didi Benchmark",
                    "active"
                ),
                (
                    uid,
                    "Annapurna Bio-Enriched Vermicompost & Jeevamrutham (అన్నపూర్ణ వర్మీకంపోస్ట్)",
                    "High-Grade Vermicompost & Concentrated Liquid Jeevamrutham / సేంద్రీయ ఎరువులు",
                    "Vermicompost & Bio-Fertilizers",
                    "High-grade earthworm-cast vermicompost enriched with Trichoderma and neem cake, plus concentrated 5L Jeevamrutham cans for natural pest immunity and soil microbe revitalization.",
                    "Annapurna Organic Mahila SHG (12 Members)",
                    "Screened Vermicompost (వర్మీకంపోస్ట్), Jeevamrutham (జీవామృతం), Neemastra",
                    "₹8 / Kg (₹400 / 50Kg Bag), Jeevamrutham ₹40 / Litre",
                    "15 Metric Tons / Month",
                    "Miryalaguda Rural, Nalgonda",
                    "Nalgonda",
                    "Smt. Lakshmi Devi (లక్ష్మీ దేవి)",
                    "9701122334",
                    "DAY-NRLM Community Investment Fund + DWCRA Pavala Vaddi",
                    "NPOP Organic Compliant, District Best SHG Award",
                    "active"
                ),
                (
                    uid,
                    "Pragati Kisan Drone Spraying Services (ప్రగతి కిసాన్ డ్రోన్ స్ప్రేయింగ్)",
                    "DGCA-Certified Women Drone Pilot Crop Spraying Team / డ్రోన్ స్ప్రేయింగ్ సేవలు",
                    "Drone & Agri-Tech Services",
                    "DGCA-certified woman drone pilot team providing precision crop spraying for paddy, cotton, and chilli. Sprays 1 acre in just 7 minutes with 90% water saving and uniform droplet penetration.",
                    "Pragati DWCRA Drone Didi Team (6 Members)",
                    "Nano Urea, Micronutrient & Bio-Pesticide Aerial Spraying (ఎకరాకు స్ప్రేయింగ్)",
                    "₹380 - ₹450 / Acre",
                    "25 - 30 Acres / Day",
                    "Tenali / Bapatla, Guntur Region",
                    "Guntur",
                    "Smt. Padmavathi (పద్మావతి) - Certified Drone Pilot",
                    "9988112233",
                    "Namo Drone Didi Scheme (80% Central Subsidy) + AIF Loan",
                    "DGCA Remote Pilot License (RPL), Agri Drone Certified",
                    "active"
                ),
                (
                    uid,
                    "Suvarna Traditional Millet Food Processing (సువర్ణ చిరుధాన్యాల ఆహార ఉత్పత్తులు)",
                    "Sprouted Ragi Flour, Millet Health Mix & Roasted Jowar Snacks / చిరుధాన్యాల పిండి",
                    "Millet & Food Processing",
                    "Hygienically stone-ground Ragi (Finger Millet) flour, sprouted malt mix, Jowar flakes, roasted Foxtail millet snacks, and ready-to-cook multigrain porridge rich in dietary fiber and calcium.",
                    "Suvarna Mahila Guild (8 Members)",
                    "Sprouted Ragi Flour (రాగి పిండి), Millet Health Mix, Jowar Flakes (జొన్న అటుకులు)",
                    "₹120 - ₹240 / Kg Pack",
                    "800 Kg / Month",
                    "Kadiri Rural, Sri Sathya Sai District",
                    "Sri Sathya Sai",
                    "Smt. Saraswathi (సరస్వతి)",
                    "9440987654",
                    "Lakhpati Didi Mission + PM FME Seed Capital Grant",
                    "FSSAI Registered, Millet Shakti Partner",
                    "active"
                ),
                (
                    uid,
                    "Godavari Farm Tarpaulin & Shade Net Tailoring Unit (గోదావరి టార్పాలిన్ కుట్టు కేంద్రం)",
                    "Waterproof Crop Tarpaulins, Gunny Sacks & Agro Shade Nets / టార్పాలిన్ & షేడ్ నెట్స్",
                    "Tailoring & Farm Protection",
                    "Heavy-duty waterproof tarpaulins for grain drying, custom-stitched green shade nets, durable gunny packaging bags, and protective canvas covers for tractors and thrashers.",
                    "Godavari Karshaka Mahila Sangham (5 Members)",
                    "Paddy Drying Tarpaulins (టార్పాలిన్లు), Agro Shade Nets, Heavy Gunny Sacks",
                    "₹450 - ₹1,800 depending on size/density",
                    "150 Pieces / Month",
                    "Tanuku, West Godavari District",
                    "West Godavari",
                    "Smt. Satyavathi (సత్యవతి)",
                    "9849776655",
                    "PMMY Mudra Yojana (Shishu & Kishor Loans)",
                    "MSME Udyam Registered",
                    "active"
                ),
                (
                    uid,
                    "Kalyani Pure Desi Ghee & Fresh Dairy Collective (కళ్యాణి దేశీ ఆవు నెయ్యి)",
                    "Bilona-Churned Pure Desi Cow Ghee, Butter & Cattle Care / స్వచ్ఛమైన ఆవు నెయ్యి",
                    "Dairy & Livestock Collective",
                    "Traditional Bilona churned A2 Desi Cow Ghee, natural butter, paneer, and cattle feed mineral mixtures managed by dairy women collective with zero artificial adulteration.",
                    "Kalyani Pashu Samrakshana SHG (14 Members)",
                    "Bilona Desi Cow Ghee (దేశీ ఆవు నెయ్యి), Pure Farm Butter, Paneer",
                    "₹850 - ₹1,200 / Litre Ghee",
                    "120 Litres Ghee / Month",
                    "Vijayawada Rural, Krishna District",
                    "Krishna",
                    "Smt. Anasuya Devi (అనసూయ)",
                    "9490123987",
                    "Stree Nidhi Dairy Linkage + Animal Husbandry Subsidy",
                    "FSSAI Quality Tested",
                    "active"
                )
            ]
            cursor.executemany("""
                INSERT INTO women_enterprises (
                    user_id, business_name, title, category, description, shg_group_name,
                    products_offered, price_range, production_capacity, location, district,
                    contact_name, contact_phone, government_scheme_availed, certifications, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, seed_enterprises)

        conn.commit()
        conn.close()
        logger.info("Database schema migration verified successfully.")
    except Exception as e:
        logger.warning("Database migration note: %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables if missing
    logger.info("Initializing KRISHI AI database tables...")
    Base.metadata.create_all(bind=engine)
    run_db_migrations()
    logger.info("Database tables initialized successfully.")

    # Initialize Knowledge Base (Vector Store)
    try:
        db = SessionLocal()
        initialize_knowledge_base(db)
        db.close()
    except Exception as e:
        logger.error("Failed to initialize knowledge base on startup: %s", e)

    # Pre-load Plant Disease AI Vision Model on startup
    try:
        logger.info("Pre-loading Plant Disease AI Vision Model on startup...")
        from app.services.disease_service import get_disease_detector
        detector = get_disease_detector()
        detector.load_model()
        logger.info("Plant Disease AI Vision Model initialized.")
    except Exception as e:
        logger.warning("Plant Disease Vision Model startup note: %s", e)

    # Pre-initialize Hugging Face model if active provider
    if settings.AI_PROVIDER.lower() == "huggingface":
        try:
            logger.info("Pre-loading Hugging Face model & LoRA adapter on startup...")
            from app.ai.model_manager import HFModelManager
            manager = HFModelManager.get_instance()
            manager.load_model()
        except Exception as e:
            logger.error("Failed to pre-load Hugging Face model on startup: %s", e)

    yield
    # Shutdown logic if any
    logger.info("Shutting down KRISHI AI backend server.")


app = FastAPI(
    title=settings.APP_NAME,
    description="Multilingual Agricultural Intelligence Assistant API",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS Middleware
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router)
app.include_router(farmers_router)
app.include_router(conversations_router)
app.include_router(chat_router)
app.include_router(voice_router)
app.include_router(knowledge_router)
app.include_router(simulator_router)
app.include_router(translate_router)
app.include_router(work_listings_router)
app.include_router(women_entrepreneurship_router)


@app.get("/api/health", tags=["Health"])
def health_check():
    health_info = {
        "status": "online",
        "app": settings.APP_NAME,
        "ai_provider": settings.AI_PROVIDER,
    }
    if settings.AI_PROVIDER.lower() == "huggingface":
        from app.ai.model_manager import HFModelManager
        mgr = HFModelManager.get_instance()
        health_info.update({
            "hf_base_model": settings.HF_BASE_MODEL,
            "adapter_path": settings.KRISHI_ADAPTER_PATH,
            "use_lora": getattr(settings, "USE_LORA", True),
            "has_adapter": mgr.has_adapter,
            "is_loaded": mgr.is_loaded,
            "device": mgr.device
        })
    elif settings.AI_PROVIDER.lower() == "ollama":
        health_info.update({
            "ollama_model": settings.OLLAMA_MODEL,
            "ollama_url": settings.OLLAMA_BASE_URL
        })
    return health_info

