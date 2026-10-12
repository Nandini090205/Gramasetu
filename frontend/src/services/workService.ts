import api from './api';
import { 
  WorkListing, 
  CreateWorkListingPayload, 
  WorkRequest, 
  CreateWorkRequestPayload 
} from '../types';

export const workService = {
  // WORK NEED: Get all published work listings with optional filters
  getPublicListings: async (params?: { category?: string; search?: string; location?: string }): Promise<WorkListing[]> => {
    const response = await api.get<WorkListing[]>('/api/work-listings', { params });
    return response.data;
  },

  // WORK PROVIDER: Get current provider's own listings with applicant info
  getMyListings: async (): Promise<WorkListing[]> => {
    const response = await api.get<WorkListing[]>('/api/work-listings/my');
    return response.data;
  },

  // Get single listing details
  getListingDetail: async (id: number): Promise<WorkListing> => {
    const response = await api.get<WorkListing>(`/api/work-listings/${id}`);
    return response.data;
  },

  // WORK PROVIDER: Create and publish a new listing
  createListing: async (payload: CreateWorkListingPayload): Promise<WorkListing> => {
    const response = await api.post<WorkListing>('/api/work-listings', payload);
    return response.data;
  },

  // WORK PROVIDER: Update own listing
  updateListing: async (id: number, payload: Partial<CreateWorkListingPayload>): Promise<WorkListing> => {
    const response = await api.put<WorkListing>(`/api/work-listings/${id}`, payload);
    return response.data;
  },

  // WORK PROVIDER: Delete own listing
  deleteListing: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/api/work-listings/${id}`);
    return response.data;
  },

  // WORK NEED: Submit work request or application
  requestWork: async (listingId: number, payload: CreateWorkRequestPayload): Promise<WorkRequest> => {
    const response = await api.post<WorkRequest>(`/api/work-listings/${listingId}/request`, payload);
    return response.data;
  }
};
