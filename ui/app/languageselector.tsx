import React from "react";
import { useLanguage } from "./languagecontext";

const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <select value={language} onChange={(e) => setLanguage(e.target.value as any)}>
      <option value="en">English</option>
      <option value="de">Deutsch</option>
    </select>
  );
};

export default LanguageSelector;