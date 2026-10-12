import api from './api';
import {
  WomenEnterprise,
  CreateWomenEnterprisePayload,
  WomenEnterpriseInquiry,
  CreateWomenEnterpriseInquiryPayload,
  GovernmentScheme,
  ViabilityCalculatorRequest,
  ViabilityCalculatorResponse,
  SuccessStory
} from '../types';

export const womenEnterpriseService = {
  // Fetch public active women-led enterprises and SHGs
  getEnterprises: async (params?: { category?: string; search?: string; district?: string }): Promise<WomenEnterprise[]> => {
    const response = await api.get<WomenEnterprise[]>('/api/women-entrepreneurship/enterprises', { params });
    return response.data;
  },

  // Fetch current authenticated user's own registered enterprises and incoming inquiries
  getMyEnterprises: async (): Promise<WomenEnterprise[]> => {
    const response = await api.get<WomenEnterprise[]>('/api/women-entrepreneurship/my-enterprises');
    return response.data;
  },

  // Fetch single enterprise details
  getEnterpriseDetail: async (id: number): Promise<WomenEnterprise> => {
    const response = await api.get<WomenEnterprise>(`/api/women-entrepreneurship/enterprises/${id}`);
    return response.data;
  },

  // Register a new women enterprise or SHG venture
  createEnterprise: async (payload: CreateWomenEnterprisePayload): Promise<WomenEnterprise> => {
    const response = await api.post<WomenEnterprise>('/api/women-entrepreneurship/enterprises', payload);
    return response.data;
  },

  // Update own enterprise details
  updateEnterprise: async (id: number, payload: Partial<CreateWomenEnterprisePayload>): Promise<WomenEnterprise> => {
    const response = await api.put<WomenEnterprise>(`/api/women-entrepreneurship/enterprises/${id}`, payload);
    return response.data;
  },

  // Delete own enterprise
  deleteEnterprise: async (id: number): Promise<void> => {
    await api.delete(`/api/women-entrepreneurship/enterprises/${id}`);
  },

  // Submit buyer purchase order or inquiry directly to woman entrepreneur
  submitInquiry: async (enterpriseId: number, payload: CreateWomenEnterpriseInquiryPayload): Promise<WomenEnterpriseInquiry> => {
    const response = await api.post<WomenEnterpriseInquiry>(`/api/women-entrepreneurship/enterprises/${enterpriseId}/inquiries`, payload);
    return response.data;
  },

  // Curated government schemes and subsidies for rural women
  getSchemes: async (): Promise<GovernmentScheme[]> => {
    const response = await api.get<GovernmentScheme[]>('/api/women-entrepreneurship/schemes');
    return response.data;
  },

  // Lakhpati Didi viability and P&L financial simulator
  calculateViability: async (payload: ViabilityCalculatorRequest): Promise<ViabilityCalculatorResponse> => {
    const response = await api.post<ViabilityCalculatorResponse>('/api/women-entrepreneurship/viability-calculator', payload);
    return response.data;
  },

  // Real inspirational success stories & role models
  getSuccessStories: async (): Promise<SuccessStory[]> => {
    const response = await api.get<SuccessStory[]>('/api/women-entrepreneurship/success-stories');
    return response.data;
  }
};
