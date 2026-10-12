from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List


class WomenEnterpriseBase(BaseModel):
    business_name: str
    title: str
    category: str
    description: str
    shg_group_name: Optional[str] = None
    products_offered: str
    price_range: str
    production_capacity: str
    location: str
    district: Optional[str] = None
    contact_name: str
    contact_phone: str
    government_scheme_availed: Optional[str] = None
    certifications: Optional[str] = None
    status: Optional[str] = "active"


class WomenEnterpriseCreate(WomenEnterpriseBase):
    pass


class WomenEnterpriseUpdate(BaseModel):
    business_name: Optional[str] = None
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    shg_group_name: Optional[str] = None
    products_offered: Optional[str] = None
    price_range: Optional[str] = None
    production_capacity: Optional[str] = None
    location: Optional[str] = None
    district: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    government_scheme_availed: Optional[str] = None
    certifications: Optional[str] = None
    status: Optional[str] = None


class WomenEnterpriseInquiryCreate(BaseModel):
    buyer_name: str
    buyer_phone: str
    inquiry_type: Optional[str] = "Purchase Order"
    message: Optional[str] = None
    quantity_needed: Optional[str] = None


class WomenEnterpriseInquiryResponse(BaseModel):
    id: int
    enterprise_id: int
    buyer_name: str
    buyer_phone: str
    inquiry_type: str
    message: Optional[str] = None
    quantity_needed: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class WomenEnterpriseResponse(WomenEnterpriseBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    inquiry_count: Optional[int] = 0
    inquiries: Optional[List[WomenEnterpriseInquiryResponse]] = []

    model_config = ConfigDict(from_attributes=True)


class GovernmentSchemeResponse(BaseModel):
    id: str
    name: str
    name_te: str
    tagline: str
    category: str
    subsidy_grant: str
    max_loan_limit: str
    eligibility: List[str]
    benefits: List[str]
    documents_needed: List[str]
    how_to_apply: str
    portal_url: Optional[str] = None
    badge: str


class ViabilityCalculatorRequest(BaseModel):
    enterprise_type: str
    monthly_units_produced: float = Field(..., gt=0)
    selling_price_per_unit: float = Field(..., gt=0)
    raw_material_cost_per_unit: float = Field(..., ge=0)
    packaging_processing_cost_per_unit: float = Field(..., ge=0)
    fixed_monthly_expenses: float = Field(0.0, ge=0) # electricity, rent, transport, maintenance
    initial_setup_capital: Optional[float] = 0.0


class ViabilityCalculatorResponse(BaseModel):
    monthly_revenue: float
    monthly_variable_costs: float
    monthly_fixed_costs: float
    monthly_total_costs: float
    monthly_net_profit: float
    annual_net_profit: float
    net_profit_margin_pct: float
    breakeven_units_per_month: float
    lakhpati_didi_target_pct: float
    lakhpati_didi_status: str
    insights: List[str]
    recommended_schemes: List[str]


class SuccessStoryResponse(BaseModel):
    id: int
    entrepreneur_name: str
    shg_name: str
    village: str
    district: str
    business_domain: str
    annual_turnover: str
    members_empowered: int
    story: str
    quote: str
    key_achievement: str
