import React, { createContext, useContext } from 'react';

export type SlideTheme = 'light' | 'dark';

export interface SlideThemeContextType {
  theme: SlideTheme;
  isDark: boolean;
  setTheme: (t: SlideTheme) => void;
}

export const SlideThemeContext = createContext<SlideThemeContextType>({
  theme: 'light',
  isDark: false,
  setTheme: () => {},
});

export const useSlideTheme = () => useContext(SlideThemeContext);
