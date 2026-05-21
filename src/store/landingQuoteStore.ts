import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LandingQuoteEstimate {
  total_cad: number;
  hours: number;
  confidence: number;
  warnings?: string[];
  breakdown?: {
    labor: number;
    stairs: number;
    fuel: number;
    specialtyTotal: number;
    tax: number;
  };
  status?: string;
}

export interface LandingQuoteDetails {
  pickupCity: string;
  pickupProvince: string;
  destinationCity: string;
  destinationProvince: string;
  bedrooms: number;
  moveDate?: string;
  hasPiano?: boolean;
  hasPoolTable?: boolean;
  hasSafe?: boolean;
}

interface LandingQuoteStore {
  estimate: LandingQuoteEstimate | null;
  details: LandingQuoteDetails | null;
  setLandingQuote: (estimate: LandingQuoteEstimate, details: LandingQuoteDetails) => void;
  clearLandingQuote: () => void;
}

export const useLandingQuoteStore = create<LandingQuoteStore>()(
  persist(
    (set) => ({
      estimate: null,
      details: null,

      setLandingQuote: (estimate, details) => set({ estimate, details }),

      clearLandingQuote: () => set({ estimate: null, details: null }),
    }),
    {
      name: 'kesmoving-landing-quote',
      partialize: (state) => ({
        estimate: state.estimate,
        details: state.details,
      }),
    },
  ),
);