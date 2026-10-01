import { apiClient } from './client';

export interface AiIntentResponse {
  actionId: string;
  actionType: 'money_transfer' | 'invoice_fee' | 'query';
  title: string;
  exchangeOffice?: string;
  exchangeOfficeId?: string;
  carLot?: string;
  carId?: string;
  carModel?: string;
  amount?: number;
  currency?: 'USD' | 'IQD';
  purpose?: string;
  status: 'preview';
  rawPrompt: string;
  payload: Record<string, any>;
}

export interface AiExecuteResponse {
  success: boolean;
  actionId: string;
  actionType: string;
  message: string;
  executedAt: string;
  result: any;
}

export const aiApi = {
  parseIntent: async (prompt: string): Promise<AiIntentResponse> => {
    return apiClient<AiIntentResponse>('/ai/parse-intent', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  },

  executeAction: async (
    actionId: string,
    actionType: string,
    payload: Record<string, any>
  ): Promise<AiExecuteResponse> => {
    return apiClient<AiExecuteResponse>('/ai/execute-action', {
      method: 'POST',
      body: JSON.stringify({ actionId, actionType, payload }),
    });
  },

  inspectAuction: async (imageUrl: string, lotNumber?: string) => {
    return apiClient<any>('/ai/inspect-auction', {
      method: 'POST',
      body: JSON.stringify({ imageUrl, lotNumber }),
    });
  },
};
