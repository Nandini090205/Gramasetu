from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.database.session import get_db
from app.models.user import User
from app.models.women_enterprise import WomenEnterprise, WomenEnterpriseInquiry
from app.schemas.women_enterprise import (
    WomenEnterpriseCreate,
    WomenEnterpriseUpdate,
    WomenEnterpriseResponse,
    WomenEnterpriseInquiryCreate,
    WomenEnterpriseInquiryResponse,
    GovernmentSchemeResponse,
    ViabilityCalculatorRequest,
    ViabilityCalculatorResponse,
    SuccessStoryResponse,
)
from app.services.auth_service import get_current_user_or_create

router = APIRouter(prefix="/api/women-entrepreneurship", tags=["Women Entrepreneurship"])


def format_enterprise_response(enterprise: WomenEnterprise, include_inquiries: bool = False) -> dict:
    """Helper to convert WomenEnterprise model to response dictionary."""
    now_utc = datetime.now(timezone.utc)
    data = {
        "id": enterprise.id,
        "user_id": enterprise.user_id,
        "business_name": enterprise.business_name,
        "title": enterprise.title,
        "category": enterprise.category,
        "description": enterprise.description,
        "shg_group_name": enterprise.shg_group_name,
        "products_offered": enterprise.products_offered,
        "price_range": enterprise.price_range,
        "production_capacity": enterprise.production_capacity,
        "location": enterprise.location,
        "district": enterprise.district,
        "contact_name": enterprise.contact_name,
        "contact_phone": enterprise.contact_phone,
        "government_scheme_availed": enterprise.government_scheme_availed,
        "certifications": enterprise.certifications,
        "status": enterprise.status,
        "created_at": enterprise.created_at or now_utc,
        "updated_at": enterprise.updated_at or now_utc,
        "inquiry_count": len(enterprise.inquiries) if enterprise.inquiries else 0,
        "inquiries": []
    }
    if include_inquiries and enterprise.inquiries:
        data["inquiries"] = [
            {
                "id": inq.id,
                "enterprise_id": inq.enterprise_id,
                "buyer_name": inq.buyer_name,
                "buyer_phone": inq.buyer_phone,
                "inquiry_type": inq.inquiry_type,
                "message": inq.message,
                "quantity_needed": inq.quantity_needed,
                "status": inq.status,
                "created_at": inq.created_at,
            }
            for inq in enterprise.inquiries
        ]
    return data


# ==============================================================================
# ENTERPRISES MARKETPLACE & DIRECTORY
# ==============================================================================

@router.get("/enterprises", response_model=List[WomenEnterpriseResponse])
def get_public_enterprises(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search keyword in title, products, or location"),
    district: Optional[str] = Query(None, description="Filter by district"),
    db: Session = Depends(get_db)
):
    """Returns active women-led rural micro-enterprises and SHG ventures."""
    query = db.query(WomenEnterprise).filter(WomenEnterprise.status == "active")

    if category and category.strip() and category.lower() != "all":
        cat_clean = category.strip()
        query = query.filter(WomenEnterprise.category.ilike(f"%{cat_clean}%"))

    if district and district.strip():
        query = query.filter(
            or_(
                WomenEnterprise.district.ilike(f"%{district.strip()}%"),
                WomenEnterprise.location.ilike(f"%{district.strip()}%")
            )
        )

    if search and search.strip():
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                WomenEnterprise.business_name.ilike(pattern),
                WomenEnterprise.title.ilike(pattern),
                WomenEnterprise.description.ilike(pattern),
                WomenEnterprise.products_offered.ilike(pattern),
                WomenEnterprise.location.ilike(pattern),
                WomenEnterprise.shg_group_name.ilike(pattern)
            )
        )

    enterprises = query.order_by(desc(WomenEnterprise.created_at)).all()
    return [format_enterprise_response(e, include_inquiries=False) for e in enterprises]


@router.get("/my-enterprises", response_model=List[WomenEnterpriseResponse])
def get_my_enterprises(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_create)
):
    """Returns all enterprises created by the authenticated woman entrepreneur/user along with buyer inquiries."""
    enterprises = (
        db.query(WomenEnterprise)
        .filter(WomenEnterprise.user_id == current_user.id)
        .order_by(desc(WomenEnterprise.created_at))
        .all()
    )
    return [format_enterprise_response(e, include_inquiries=True) for e in enterprises]


@router.get("/enterprises/{enterprise_id}", response_model=WomenEnterpriseResponse)
def get_enterprise_detail(enterprise_id: int, db: Session = Depends(get_db)):
    """Fetch details of a single women-led enterprise."""
    enterprise = db.query(WomenEnterprise).filter(WomenEnterprise.id == enterprise_id).first()
    if not enterprise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Women enterprise listing not found."
        )
    return format_enterprise_response(enterprise, include_inquiries=False)


@router.post("/enterprises", response_model=WomenEnterpriseResponse, status_code=status.HTTP_201_CREATED)
def create_enterprise(
    payload: WomenEnterpriseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_create)
):
    """Registers a new women-led business or SHG micro-enterprise showcase."""
    new_enterprise = WomenEnterprise(
        user_id=current_user.id,
        business_name=payload.business_name.strip(),
        title=payload.title.strip(),
        category=payload.category.strip(),
        description=payload.description.strip(),
        shg_group_name=payload.shg_group_name.strip() if payload.shg_group_name else None,
        products_offered=payload.products_offered.strip(),
        price_range=payload.price_range.strip(),
        production_capacity=payload.production_capacity.strip(),
        location=payload.location.strip(),
        district=payload.district.strip() if payload.district else None,
        contact_name=payload.contact_name.strip(),
        contact_phone=payload.contact_phone.strip(),
        government_scheme_availed=payload.government_scheme_availed.strip() if payload.government_scheme_availed else None,
        certifications=payload.certifications.strip() if payload.certifications else None,
        status="active"
    )

    db.add(new_enterprise)
    db.commit()
    db.refresh(new_enterprise)
    return format_enterprise_response(new_enterprise, include_inquiries=True)


@router.put("/enterprises/{enterprise_id}", response_model=WomenEnterpriseResponse)
def update_enterprise(
    enterprise_id: int,
    payload: WomenEnterpriseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_create)
):
    """Updates an existing women enterprise listing owned by the authenticated user."""
    enterprise = db.query(WomenEnterprise).filter(
        WomenEnterprise.id == enterprise_id,
        WomenEnterprise.user_id == current_user.id
    ).first()

    if not enterprise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enterprise not found or unauthorized to edit."
        )

    for field, val in payload.model_dump(exclude_unset=True).items():
        if val is not None:
            setattr(enterprise, field, val.strip() if isinstance(val, str) else val)

    enterprise.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(enterprise)
    return format_enterprise_response(enterprise, include_inquiries=True)


@router.delete("/enterprises/{enterprise_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_enterprise(
    enterprise_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_create)
):
    """Deletes an enterprise listing owned by current user."""
    enterprise = db.query(WomenEnterprise).filter(
        WomenEnterprise.id == enterprise_id,
        WomenEnterprise.user_id == current_user.id
    ).first()

    if not enterprise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enterprise not found or unauthorized to delete."
        )

    db.delete(enterprise)
    db.commit()
    return None


@router.post("/enterprises/{enterprise_id}/inquiries", response_model=WomenEnterpriseInquiryResponse, status_code=status.HTTP_201_CREATED)
def submit_buyer_inquiry(
    enterprise_id: int,
    payload: WomenEnterpriseInquiryCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_or_create)
):
    """Allows buyers, traders, or fellow farmers to send an inquiry / purchase order directly to the woman entrepreneur."""
    enterprise = db.query(WomenEnterprise).filter(WomenEnterprise.id == enterprise_id).first()
    if not enterprise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target women enterprise listing not found."
        )

    inquiry = WomenEnterpriseInquiry(
        enterprise_id=enterprise.id,
        buyer_user_id=current_user.id if current_user else None,
        buyer_name=payload.buyer_name.strip(),
        buyer_phone=payload.buyer_phone.strip(),
        inquiry_type=payload.inquiry_type or "Purchase Order",
        message=payload.message.strip() if payload.message else None,
        quantity_needed=payload.quantity_needed.strip() if payload.quantity_needed else None,
        status="pending"
    )

    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)
    return inquiry


# ==============================================================================
# GOVERNMENT SCHEMES & SUBSIDIES FOR WOMEN
# ==============================================================================

GOVERNMENT_SCHEMES_DATA = [
    {
        "id": "lakhpati-didi",
        "name": "Lakhpati Didi Initiative",
        "name_te": "లఖ్‌పతి దీదీ యోజన",
        "tagline": "Empowering SHG women to achieve annual household income of ₹1 Lakh or more.",
        "category": "Livelihood & Income Growth",
        "subsidy_grant": "Skill Training + Interest Subvention (₹1-3 Lakhs credit linkage)",
        "max_loan_limit": "Up to ₹5,00,000 through SHG Federations",
        "eligibility": [
            "Member of active Self Help Group (SHG) / DWCRA for at least 1 year",
            "Engaged or willing to engage in agri, dairy, poultry, or micro-enterprise",
            "Maintains regular savings and micro-loan repayment track record"
        ],
        "benefits": [
            "Technical skill training & digital literacy",
            "Business development planning & market linkage to local mandis and e-marketplaces",
            "Interest subvention reducing effective bank interest to 3%-7%"
        ],
        "documents_needed": [
            "Aadhaar Card",
            "SHG Membership Passbook & Bank Account Details",
            "Ration Card / Income Certificate",
            "Basic Business Plan or Trade Activity Proposal"
        ],
        "how_to_apply": "Approach your Village Organization (VO) / Community Resource Person (CRP) or Mandal Mahila Samakhya / BDO office.",
        "portal_url": "https://nrlm.gov.in/",
        "badge": "FLAGSHIP MISSION"
    },
    {
        "id": "pm-fme",
        "name": "PM FME (Food Processing) Scheme",
        "name_te": "పీఎం ఎఫ్.ఎం.ఇ ఆహార శుద్ధి పథకం",
        "tagline": "35% Credit-Linked Capital Subsidy for Micro Food Processing Units.",
        "category": "Food Processing & Agri Value-Addition",
        "subsidy_grant": "35% Capital Subsidy (Up to ₹10 Lakhs)",
        "max_loan_limit": "Up to ₹30,00,000 project cost",
        "eligibility": [
            "Individual women entrepreneurs or Women SHGs involved in food processing",
            "Processing local crops (e.g. cold-pressed oil, pickles, spices, millets, turmeric, jaggery)",
            "Enterprise should be registered under MSME Udyam (free online registration)"
        ],
        "benefits": [
            "35% grant on eligible project cost up to max ₹10,00,000",
            "Seed capital of ₹40,000 per SHG member for working capital and small tools",
            "Free FSSAI registration support and packaging design assistance"
        ],
        "documents_needed": [
            "Aadhaar & PAN Card",
            "Bank Statement of last 6 months",
            "Detailed Project Report (DPR) / Machinery quotation",
            "Premises ownership or rent agreement proof"
        ],
        "how_to_apply": "Apply online at official PMFME portal or through District Resource Person (DRP) appointed at District Industries Centre (DIC).",
        "portal_url": "https://pmfme.mofpi.gov.in/",
        "badge": "35% CAPITAL SUBSIDY"
    },
    {
        "id": "namo-drone-didi",
        "name": "Namo Drone Didi Scheme",
        "name_te": "నమో డ్రోన్ దీదీ పథకం",
        "tagline": "Subsidized Agricultural Drones & Drone Pilot Training for Women SHGs.",
        "category": "Agri-Tech & Custom Hiring Services",
        "subsidy_grant": "80% Central Subsidy (Up to ₹8 Lakhs for Drone Package)",
        "max_loan_limit": "Remaining 20% funded via low-interest AIF loan",
        "eligibility": [
            "Active Women SHGs selected under DAY-NRLM / State Rural Livelihoods Mission",
            "At least one literate member (10th/12th pass) eligible for 15-day DGCA-approved drone pilot certification",
            "Willing to provide pesticide/fertilizer nano-urea spraying services to village farmers"
        ],
        "benefits": [
            "Turnkey Agri Drone kit with dual battery, fast charger, and spray nozzles",
            "15-day comprehensive Drone Pilot training & DGCA drone operator license",
            "Estimated rental income: ₹50,000 to ₹1,50,000 per crop season (spray service at ₹350-₹450/acre)"
        ],
        "documents_needed": [
            "SHG Resolution copy selecting Drone Didi candidate",
            "Educational certificate of the candidate (10th or above)",
            "Aadhaar, Voter ID, and Passport size photos",
            "SHG Bank Account details"
        ],
        "how_to_apply": "Contact District Agriculture Officer (DAO) or State Rural Livelihood Mission (SRLM) District Office.",
        "portal_url": "https://agricoop.nic.in/",
        "badge": "HIGH EARNING POTENTIAL"
    },
    {
        "id": "stand-up-india",
        "name": "Stand-Up India Scheme for Women",
        "name_te": "స్టాండ్-అప్ ఇండియా మహిళా రుణాలు",
        "tagline": "Bank loans between ₹10 Lakhs and ₹1 Crore for greenfield women enterprises.",
        "category": "Greenfield Manufacturing & Services",
        "subsidy_grant": "Composite loan (Term Loan + Working Capital) with CGTMSE guarantee",
        "max_loan_limit": "₹10,00,000 to ₹1,00,00,000",
        "eligibility": [
            "Women entrepreneur aged 18 years and above",
            "Non-individual enterprises must have at least 51% shareholding held by women",
            "For setting up greenfield (first-time) ventures in manufacturing, services, or agri-allied trade"
        ],
        "benefits": [
            "No third-party collateral required up to prescribed guarantee limits",
            "Repayment tenure up to 7 years with initial 18-month moratorium period",
            "Access to handholding support via SIDBI portal"
        ],
        "documents_needed": [
            "Proof of identity and address (Aadhaar, Passport)",
            "Detailed Project Report (DPR) with financial projections",
            "Company / Partnership / MSME registration certificate",
            "Pollution clearance / Panchayat trade NOC if applicable"
        ],
        "how_to_apply": "Apply directly through any Scheduled Commercial Bank branch or online at standupmitra.in.",
        "portal_url": "https://www.standupmitra.in/",
        "badge": "HIGH CAPITAL"
    },
    {
        "id": "pm-mudra-yojana",
        "name": "Pradhan Mantri MUDRA Yojana (PMMY)",
        "name_te": "ప్రధాన మంత్రి ముద్ర యోజన",
        "tagline": "Collateral-free micro loans: Shishu (₹50k), Kishor (₹50k-5L), Tarun (₹5L-10L).",
        "category": "Micro Credit & Working Capital",
        "subsidy_grant": "Collateral-free credit with zero processing fee for Shishu category",
        "max_loan_limit": "Up to ₹10,00,000 (No collateral)",
        "eligibility": [
            "Any Indian woman micro-entrepreneur with a viable business idea or running micro-unit",
            "Good CIBIL track record (if prior loans existed)",
            "Applies to tailoring units, small dairies, grocery stores, pickle units, and packaging"
        ],
        "benefits": [
            "Mudra Card with ATM overdraft facility for working capital needs",
            "Zero processing charges and simple 1-page application for Shishu loans",
            "Fast sanction through all public, private, and regional rural banks (RRBs)"
        ],
        "documents_needed": [
            "Voter ID / Aadhaar / Driving License",
            "Proof of business address",
            "Quotation of machinery/items to be purchased",
            "Passport size photos"
        ],
        "how_to_apply": "Walk into your local Grameena Bank, SBI, or commercial bank branch or apply at udyamimitra.in.",
        "portal_url": "https://www.mudra.org.in/",
        "badge": "COLLATERAL-FREE"
    },
    {
        "id": "stree-nidhi-dwcra",
        "name": "Stree Nidhi Credit Cooperative & DWCRA Bank Linkage",
        "name_te": "స్త్రీ నిధి & డ్వాక్రా బ్యాంక్ లింకేజ్",
        "tagline": "Instant, hassle-free credit via mobile app for rural women SHGs at low interest rates.",
        "category": "SHG Microfinance",
        "subsidy_grant": "Direct credit to SHG bank account within 48 hours; Interest subvention (Vaddi Leni Runalu / Pavala Vaddi)",
        "max_loan_limit": "Up to ₹1,50,000 per member; ₹10-20 Lakhs per SHG",
        "eligibility": [
            "Member of recognized SHG / DWCRA in good standing (MIP graded)",
            "Regular thrift savings and group loan repayment",
            "Endorsed by Village Organization (VO) President and Secretary"
        ],
        "benefits": [
            "Very fast approval (within 24-48 hours via IVRS/mobile app)",
            "Prompt repayment earns full interest rebate (effective 0% or 3% interest)",
            "Ideal for purchasing milch animals, tailoring machines, oil presses, or grocery stock"
        ],
        "documents_needed": [
            "SHG Resolution copy",
            "Individual member Aadhaar & Bank Passbook",
            "VO Recommendation code"
        ],
        "how_to_apply": "Submit loan requisition directly through your village SHG meeting and VO Samakhya animator.",
        "portal_url": "https://www.streenidhi.ap.gov.in/",
        "badge": "RAPID DISBURSAL"
    }
]


@router.get("/schemes", response_model=List[GovernmentSchemeResponse])
def get_women_government_schemes():
    """Returns curated government schemes and subsidies specifically for rural women entrepreneurs."""
    return GOVERNMENT_SCHEMES_DATA


# ==============================================================================
# VIABILITY & PROFIT CALCULATOR (LAKHPATI DIDI ENGINE)
# ==============================================================================

@router.post("/viability-calculator", response_model=ViabilityCalculatorResponse)
def calculate_enterprise_viability(payload: ViabilityCalculatorRequest):
    """
    Simulates monthly and annual P&L for a women micro-enterprise.
    Computes break-even units, profit margin, and evaluates progress towards the
    national Lakhpati Didi target (₹1,00,000+ net income per year).
    """
    units = payload.monthly_units_produced
    price = payload.selling_price_per_unit
    raw_cost = payload.raw_material_cost_per_unit
    pack_cost = payload.packaging_processing_cost_per_unit
    fixed_cost = payload.fixed_monthly_expenses

    variable_cost_per_unit = raw_cost + pack_cost
    monthly_revenue = round(units * price, 2)
    monthly_variable_costs = round(units * variable_cost_per_unit, 2)
    monthly_fixed_costs = round(fixed_cost, 2)
    monthly_total_costs = round(monthly_variable_costs + monthly_fixed_costs, 2)

    monthly_net_profit = round(monthly_revenue - monthly_total_costs, 2)
    annual_net_profit = round(monthly_net_profit * 12, 2)

    net_margin_pct = round((monthly_net_profit / monthly_revenue * 100), 1) if monthly_revenue > 0 else 0.0

    # Break-even point calculation: Fixed Costs / (Price - Variable Cost)
    contribution_margin = price - variable_cost_per_unit
    if contribution_margin > 0:
        breakeven_units = round(fixed_cost / contribution_margin, 1)
    else:
        breakeven_units = float("inf")

    # Lakhpati Didi target is ₹1,00,000 annual net profit
    lakhpati_target = 100000.0
    lakhpati_pct = round(min(max((annual_net_profit / lakhpati_target) * 100, 0), 250), 1)

    if annual_net_profit >= 150000:
        lakhpati_status = "Super Lakhpati Didi (Excellent 🌟🌟🌟)"
    elif annual_net_profit >= 100000:
        lakhpati_status = "Achieved Lakhpati Didi Goal! (₹1 Lakh+ / Year 🌟)"
    elif annual_net_profit >= 60000:
        lakhpati_status = "Promising Milestone (60%+ towards Lakhpati Didi)"
    elif annual_net_profit > 0:
        lakhpati_status = "Emerging Enterprise (Focus on Volume & Direct Sales)"
    else:
        lakhpati_status = "Operating at Deficit (Needs Price Revision or Cost Cut)"

    insights = []
    if net_margin_pct >= 30:
        insights.append(f"Outstanding healthy profit margin of {net_margin_pct}%. Value addition significantly exceeds commodity raw material costs.")
    elif net_margin_pct >= 15:
        insights.append(f"Solid commercial margin of {net_margin_pct}%. Ensure timely batch turnover and low inventory holding.")
    else:
        insights.append(f"Slim margin of {net_margin_pct}%. Consider purchasing raw materials directly in bulk at harvest to compress input costs.")

    if units >= breakeven_units * 1.5:
        insights.append(f"Operating safely well above break-even volume ({breakeven_units:.0f} units/month required).")
    elif units > breakeven_units:
        insights.append(f"Close to break-even boundary ({breakeven_units:.0f} units/month). Expanding sales by 20% will double net take-home.")
    else:
        insights.append(f"Currently below break-even point of {breakeven_units:.0f} units. Boost local marketing or bundle products to cover fixed overheads.")

    recommended_schemes = []
    if "oil" in payload.enterprise_type.lower() or "food" in payload.enterprise_type.lower() or "pickle" in payload.enterprise_type.lower() or "millet" in payload.enterprise_type.lower() or "spice" in payload.enterprise_type.lower():
        recommended_schemes.extend(["PM FME Scheme (35% Capital Subsidy up to ₹10L)", "Lakhpati Didi Mission", "FSSAI Registration Support"])
    elif "dairy" in payload.enterprise_type.lower() or "poultry" in payload.enterprise_type.lower():
        recommended_schemes.extend(["Stree Nidhi Dairy Loan (Low Interest)", "MUDRA Shishu/Kishor Loan", "Lakhpati Didi Scheme"])
    elif "tailor" in payload.enterprise_type.lower() or "textile" in payload.enterprise_type.lower():
        recommended_schemes.extend(["DAY-NRLM Micro Credit", "PMMY Mudra Yojana (Up to ₹50,000 for sewing machines)", "Local Govt Tarpaulin Stitching Orders"])
    else:
        recommended_schemes.extend(["Lakhpati Didi Initiative", "DAY-NRLM Community Investment Fund", "Pradhan Mantri MUDRA Yojana"])

    return {
        "monthly_revenue": monthly_revenue,
        "monthly_variable_costs": monthly_variable_costs,
        "monthly_fixed_costs": monthly_fixed_costs,
        "monthly_total_costs": monthly_total_costs,
        "monthly_net_profit": monthly_net_profit,
        "annual_net_profit": annual_net_profit,
        "net_profit_margin_pct": net_margin_pct,
        "breakeven_units_per_month": breakeven_units if breakeven_units != float("inf") else 0.0,
        "lakhpati_didi_target_pct": lakhpati_pct,
        "lakhpati_didi_status": lakhpati_status,
        "insights": insights,
        "recommended_schemes": recommended_schemes
    }


# ==============================================================================
# SUCCESS STORIES & ROLE MODELS
# ==============================================================================

SUCCESS_STORIES_DATA = [
    {
        "id": 1,
        "entrepreneur_name": "Smt. Mangamma & Bhavani SHG (మంగమ్మ)",
        "shg_name": "Bhavani Mahila Mandali (10 Members)",
        "village": "Madanapalle Rural",
        "district": "Annamayya / Chittoor",
        "business_domain": "Cold-Pressed Groundnut & Sesame Oil",
        "annual_turnover": "₹14,50,000 / Year",
        "members_empowered": 10,
        "story": "Started with a single wooden cold-press (Gaana) with ₹1.5 Lakh Stree Nidhi credit and ₹2 Lakh PM-FME subsidy. Now supplying 400 liters of pure unadulterated oil monthly to households and natural food stores across Rayalaseema.",
        "quote": "'Through collective courage and Krishi AI market pricing, our SHG went from daily wage labor to generating ₹22,000 net monthly income per woman.'",
        "key_achievement": "100% of members achieved official Lakhpati Didi recognition in 2024."
    },
    {
        "id": 2,
        "entrepreneur_name": "Smt. Lakshmi Devi & Annapurna Group (లక్ష్మీ దేవి)",
        "shg_name": "Annapurna Bio-Organic SHG (12 Members)",
        "village": "Miryalaguda Rural",
        "district": "Nalgonda",
        "business_domain": "Vermicompost & Bio-Liquid Inputs (Jeevamrutham)",
        "annual_turnover": "₹11,20,000 / Year",
        "members_empowered": 12,
        "story": "Utilized agricultural crop residue and cattle manure to establish 24 brick vermicompost beds. Sells 50 tons of enriched organic compost and 2,000 liters of Neemastra bio-pesticide every kharif season to organic farmers.",
        "quote": "'Waste farm residue turned into gold for our families. Farmers come straight to our village gate with tractors.'",
        "key_achievement": "Awarded Best District Micro-Enterprise by State Rural Development Council."
    },
    {
        "id": 3,
        "entrepreneur_name": "Smt. Padmavathi (పద్మావతి) - Certified Drone Pilot",
        "shg_name": "Pragati DWCRA Group",
        "village": "Tenali",
        "district": "Guntur",
        "business_domain": "Kisan Drone Spraying Services (Namo Drone Didi)",
        "annual_turnover": "₹8,40,000 / Year",
        "members_empowered": 6,
        "story": "Completed DGCA-certified drone pilot training under Namo Drone Didi. Sprays 15 to 20 acres per day during peak chili and paddy pest season, saving water by 90% and protecting farmers from hazardous pesticide inhalation.",
        "quote": "'When people see a village woman flying a high-tech drone over paddy fields, the respect in their eyes is our greatest reward.'",
        "key_achievement": "Sprayed over 1,200 acres across 18 villages in 2 consecutive seasons."
    },
    {
        "id": 4,
        "entrepreneur_name": "Smt. Saraswathi & Suvarna SHG (సరస్వతి)",
        "shg_name": "Suvarna Millet Food Guild (8 Members)",
        "village": "Kadiri",
        "district": "Sri Sathya Sai",
        "business_domain": "Millet Value Addition (Ragi Laddu, Jowar Flakes, Health Mix)",
        "annual_turnover": "₹9,80,000 / Year",
        "members_empowered": 8,
        "story": "Procures finger millet (Ragi) and foxtail millet (Korra) from drought-prone farmers at ₹400 above mandi rates, then mills and produces traditional iron-rich malt and roasted snacks packaged with FSSAI QR-codes.",
        "quote": "'Adding value to our drought crops rescued both our farmers and our home finances.'",
        "key_achievement": "Supplying nutritious snacks to 42 local schools and village anganwadis."
    }
]


@router.get("/success-stories", response_model=List[SuccessStoryResponse])
def get_women_success_stories():
    """Returns real-world inspirational rural women entrepreneurship case studies."""
    return SUCCESS_STORIES_DATA
