export interface User {
  id: number;
  uuid?: string;
  name: string;
  email?: string;
  created_at: string;
}

export interface FarmerProfile {
  id?: number;
  user_id?: number;
  name?: string;
  age?: number;
  preferred_language: string;
  location: string;
  farm_size: string;
  primary_crop: string;
  soil_type?: string;
  current_crop_stage?: string;
  voice_response_enabled?: boolean;
  updated_at?: string;
}

export interface FarmerOnboardRequest {
  uuid: string;
  name: string;
  age?: number;
  location?: string;
  farm_size?: string;
  primary_crop?: string;
  preferred_language?: string;
}

export interface KnowledgeSource {
  title: string;
  source: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant';
  content: string;
  language?: string;
  imageUrl?: string;
  image_url?: string;
  sources?: KnowledgeSource[];
  created_at: string;
}

export interface Conversation {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface ChatMessageRequest {
  message: string;
  conversation_id?: number;
  response_language?: string;
  image_data?: string;
  weather_data?: Record<string, any>;
}

export interface ChatMessageResponse {
  conversation_id: number;
  user_message: Message;
  ai_message: Message;
}

export interface DiseaseDetectionResponse {
  success: boolean;
  plant_name?: string;
  disease_name?: string;
  confidence?: number;
  is_healthy?: boolean;
  is_plant?: boolean;
  causes?: string[];
  treatment?: string[];
  prevention?: string[];
  formatted_response: string;
}

export interface VoiceTranscribeResponse {
  text: string;
  language: string;
  confidence?: number | null;
}

export interface KnowledgeStatusResponse {
  document_count: number;
  chunk_count: number;
}

// KRISHI VISION - Farm Future Simulator Types
export interface SimulationInput {
  water_availability_pct: number;
  rain_delay_days: number;
  temp_delta_c: number;
  market_price_delta_pct: number;
  expected_rainfall: 'Normal' | 'Deficit' | 'Drought' | 'Excess' | string;
  budget: number;
  farm_size_acres: number;
  soil_type?: string;
  location?: string;
  coordinates?: { lat: number; lon: number };
  current_crop?: string;
  current_crop_stage?: string;
  selected_crops?: string[];
  language?: string;
}

export interface CropSimulationResult {
  crop_name: string;
  crop_name_te: string;
  category: string;
  water_requirement_mm: number;
  water_requirement_liters: number;
  weather_suitability_pct: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  risk_score: number;
  estimated_cost_per_acre: number;
  total_cost: number;
  estimated_yield_quintals_per_acre: number;
  estimated_revenue_per_acre: number;
  total_revenue: number;
  estimated_profit_per_acre: number;
  total_profit: number;
  roi_pct: number;
  overall_ai_score: number;
  key_factors: string[];
  agronomic_advice: string;
  water_stress_status: string;
  is_best_choice?: boolean;
}

export interface SimulationResponse {
  results: CropSimulationResult[];
  best_recommendation: CropSimulationResult;
  recommendation_summary: string;
  recommendation_reasoning: string;
  simulation_input: SimulationInput;
  disclaimer: string;
}

export interface SimulationAIInsightRequest {
  simulation_input: SimulationInput;
  simulation_results: CropSimulationResult[];
  best_crop_name: string;
  language?: string;
}

export interface SimulationAIInsightResponse {
  ai_insight: string;
  strategic_advice: string[];
  water_saving_tactics: string[];
  market_risk_mitigation: string[];
}

// KRISHI WORK & SERVICE PLATFORM TYPES
export interface WorkRequest {
  id: number;
  listing_id: number;
  seeker_name: string;
  seeker_phone: string;
  message?: string;
  status: string;
  created_at: string;
}

export interface WorkListing {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  payment: string;
  work_type: string;
  urgency: string;
  contact_name: string;
  contact_phone: string;
  status: 'published' | 'completed' | string;
  created_at: string;
  updated_at: string;
  request_count?: number;
  requests?: WorkRequest[];
}

export interface CreateWorkListingPayload {
  title: string;
  description: string;
  category: string;
  location: string;
  payment: string;
  work_type?: string;
  urgency?: string;
  contact_name: string;
  contact_phone: string;
  status?: string;
}

export interface CreateWorkRequestPayload {
  seeker_name: string;
  seeker_phone: string;
  message?: string;
}

// WOMEN ENTREPRENEURSHIP & SHG PLATFORM TYPES
export interface WomenEnterpriseInquiry {
  id: number;
  enterprise_id: number;
  buyer_name: string;
  buyer_phone: string;
  inquiry_type: string;
  message?: string;
  quantity_needed?: string;
  status: string;
  created_at: string;
}

export interface WomenEnterprise {
  id: number;
  user_id: number;
  business_name: string;
  title: string;
  category: string;
  description: string;
  shg_group_name?: string;
  products_offered: string;
  price_range: string;
  production_capacity: string;
  location: string;
  district?: string;
  contact_name: string;
  contact_phone: string;
  government_scheme_availed?: string;
  certifications?: string;
  status: 'active' | 'draft' | string;
  created_at: string;
  updated_at: string;
  inquiry_count: number;
  inquiries?: WomenEnterpriseInquiry[];
}

export interface CreateWomenEnterprisePayload {
  business_name: string;
  title: string;
  category: string;
  description: string;
  shg_group_name?: string;
  products_offered: string;
  price_range: string;
  production_capacity: string;
  location: string;
  district?: string;
  contact_name: string;
  contact_phone: string;
  government_scheme_availed?: string;
  certifications?: string;
}

export interface CreateWomenEnterpriseInquiryPayload {
  buyer_name: string;
  buyer_phone: string;
  inquiry_type?: string;
  message?: string;
  quantity_needed?: string;
}

export interface GovernmentScheme {
  id: string;
  name: string;
  name_te?: string;
  tagline: string;
  category: string;
  subsidy_grant: string;
  max_loan_limit: string;
  eligibility: string[];
  benefits: string[];
  documents_needed: string[];
  how_to_apply: string;
  portal_url: string;
  badge?: string;
}

export interface ViabilityCalculatorRequest {
  monthly_units_produced: number;
  selling_price_per_unit: number;
  raw_material_cost_per_unit: number;
  packaging_processing_cost_per_unit: number;
  fixed_monthly_expenses: number;
  enterprise_type: string;
}

export interface ViabilityCalculatorResponse {
  monthly_revenue: number;
  monthly_variable_costs: number;
  monthly_fixed_costs: number;
  monthly_total_costs: number;
  monthly_net_profit: number;
  annual_net_profit: number;
  net_profit_margin_pct: number;
  breakeven_units_per_month: number;
  lakhpati_didi_target_pct: number;
  lakhpati_didi_status: string;
  insights: string[];
  recommended_schemes: string[];
}

export interface SuccessStory {
  id: number;
  entrepreneur_name: string;
  shg_name: string;
  village: string;
  district: string;
  business_domain: string;
  annual_turnover: string;
  members_empowered: number;
  story: string;
  quote: string;
  key_achievement: string;
}


