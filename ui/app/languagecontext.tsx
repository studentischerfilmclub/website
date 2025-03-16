'use client'

import React, { createContext, useContext, useState, ReactNode } from "react";

// Define language types
type Language = "en" | "de";

// Create context with default value
const LanguageContext = createContext<{ language: Language; setLanguage: (lang: Language) => void } | undefined>(undefined);

// Provider Component
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem("language") as Language) || "de"; // Load from storage
  });

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("language", lang); // Persist selection
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook to use the language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
};