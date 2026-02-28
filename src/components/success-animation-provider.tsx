'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type SuccessContextType = {
  triggerSuccess: () => void;
};

const SuccessContext = createContext<SuccessContextType | undefined>(undefined);

export function useSuccessAnimation() {
  const context = useContext(SuccessContext);
  if (!context) {
    throw new Error('useSuccessAnimation must be used within a SuccessProvider');
  }
  return context;
}

export function SuccessProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  const triggerSuccess = useCallback(() => {
    setIsVisible(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 2000); // 2 seconds duration
  }, []);

  return (
    <SuccessContext.Provider value={{ triggerSuccess }}>
      {children}
      {isVisible && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-success text-success-foreground p-8 rounded-full shadow-2xl flex flex-col items-center justify-center animate-scale-up">
            <svg
              className="w-20 h-20 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline
                points="20 6 9 17 4 12"
                className="animate-checkmark"
              />
            </svg>
            <span className="mt-4 font-bold text-xl uppercase tracking-widest text-white">Sucesso</span>
          </div>
        </div>
      )}
    </SuccessContext.Provider>
  );
}