import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Languages } from 'lucide-react';

const LanguageSwitcher = () => {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1.5 border border-slate-200 dark:border-slate-700">
        <Languages className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
          className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer text-slate-700 dark:text-slate-200"
        >
          <option value="en" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">EN</option>
          <option value="te" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">తెలుగు</option>
          <option value="hi" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">हिंदी</option>
          <option value="ta" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">தமிழ்</option>
        </select>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
