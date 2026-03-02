import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const CountryContext = createContext(null);

const SUPPORTED_COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', symbol: '$' },
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', symbol: '₹' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', currency: 'SAR', symbol: 'ر.س' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', currency: 'AED', symbol: 'د.إ' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', symbol: '£' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR', symbol: '€' },
  { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR', symbol: '€' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', symbol: 'C$' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY', symbol: '¥' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD', symbol: 'A$' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', currency: 'MXN', symbol: 'MX$' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', currency: 'BRL', symbol: 'R$' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', currency: 'TRY', symbol: '₺' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', currency: 'SGD', symbol: 'S$' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', currency: 'EGP', symbol: 'E£' },
];

export function CountryProvider({ children }) {
  const [countryCode, setCountryCode] = useState(() => {
    // Check saved preference or user profile
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.countryCode || localStorage.getItem('countryCode') || 'US';
  });

  const [countries, setCountries] = useState(SUPPORTED_COUNTRIES);

  useEffect(() => {
    // Fetch supported countries from backend
    api.get('/countries').then((res) => {
      if (res.data?.countries?.length) {
        setCountries(res.data.countries);
      }
    }).catch(() => {});
  }, []);

  const changeCountry = (code) => {
    setCountryCode(code);
    localStorage.setItem('countryCode', code);
  };

  const currentCountry = countries.find((c) => c.code === countryCode) || countries[0];

  return (
    <CountryContext.Provider value={{ countryCode, currentCountry, countries, changeCountry }}>
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error('useCountry must be used within CountryProvider');
  return ctx;
}

export default CountryContext;
