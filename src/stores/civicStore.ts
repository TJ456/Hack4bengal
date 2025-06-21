import { create } from 'zustand';

interface CivicState {
  gatewayTokens: { [address: string]: string };
  setGatewayToken: (address: string, token: string) => void;
  getGatewayToken: (address: string) => string | null;
  clearGatewayToken: (address: string) => void;
}

export const useCivicStore = create<CivicState>((set, get) => ({
  gatewayTokens: {},
  
  setGatewayToken: (address: string, token: string) => 
    set(state => ({
      gatewayTokens: {
        ...state.gatewayTokens,
        [address.toLowerCase()]: token
      }
    })),
  
  getGatewayToken: (address: string) => 
    get().gatewayTokens[address.toLowerCase()] || null,
  
  clearGatewayToken: (address: string) =>
    set(state => {
      const { [address.toLowerCase()]: _, ...rest } = state.gatewayTokens;
      return { gatewayTokens: rest };
    }),
}));
