import { apiClient } from './client';

export interface CalculateEstimateParams {
  stateId?: string;
  stateCode?: string;
  loadingPortId?: string;
  destinationPortId: string;
  vehicleType?: 'sedan' | 'suv' | 'heavy';
  includeClearance?: boolean;
}

export interface EstimateResult {
  state: {
    id: string;
    name: string;
    code: string;
    inlandCost: number;
  };
  loadingPort: {
    id: string;
    name: string;
    code: string;
  };
  destinationPort: {
    id: string;
    name: string;
    code: string;
  };
  breakdown: {
    inlandTransportFee: number;
    oceanFreightFee: number;
    vehicleSurcharge: number;
    customsClearanceFee: number;
    totalEstimate: number;
  };
  estimatedDays?: number;
}

export const calculatorApi = {
  getEstimate: async (params: CalculateEstimateParams): Promise<EstimateResult> => {
    const query = new URLSearchParams();
    if (params.stateId) query.set('stateId', params.stateId);
    if (params.stateCode) query.set('stateCode', params.stateCode);
    if (params.loadingPortId) query.set('loadingPortId', params.loadingPortId);
    if (params.destinationPortId) query.set('destinationPortId', params.destinationPortId);
    if (params.vehicleType) query.set('vehicleType', params.vehicleType);
    if (params.includeClearance !== undefined) query.set('includeClearance', String(params.includeClearance));

    return apiClient<EstimateResult>(`/calculator/estimate?${query.toString()}`);
  },
};
