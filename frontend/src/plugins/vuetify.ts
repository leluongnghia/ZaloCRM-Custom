import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

export const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: localStorage.getItem('theme') || 'dark',
    themes: {
      dark: {
        dark: true,
        colors: {
          background: '#0A192F',
          surface: '#112240',
          'surface-variant': '#1D2D50',
          'surface-light': '#1A3050',
          primary: '#10B981', // Emerald Green
          secondary: '#E6F1FF',
          accent: '#10B981',
          error: '#FF5252',
          warning: '#FFB74D',
          success: '#4CAF50',
          info: '#10B981',
          'on-background': '#E6F1FF',
          'on-surface': '#E6F1FF',
          'on-primary': '#0A192F',
        },
      },
      light: {
        dark: false,
        colors: {
          background: '#F8FAFC', // Slate 50
          surface: '#FFFFFF',
          'surface-variant': '#F1F5F9', // Slate 100
          primary: '#00A651', // Zalo Green
          secondary: '#475569', // Slate 600
          accent: '#00A651',
          error: '#D32F2F',
          warning: '#F57F17',
          success: '#2E7D32',
          info: '#00A651',
        },
      },
    },
  },
  defaults: {
    VBtn: { variant: 'flat', rounded: 'lg' }, // 8px radius
    VTextField: { variant: 'outlined', density: 'compact', rounded: 'lg' },
    VSelect: { variant: 'outlined', density: 'compact', rounded: 'lg' },
    VAutocomplete: { variant: 'outlined', density: 'compact', rounded: 'lg' },
    VTextarea: { variant: 'outlined', density: 'compact', rounded: 'lg' },
    VCard: { rounded: 'xl', variant: 'flat' }, // 20px radius
    VChip: { rounded: 'md', size: 'small' },
    VDialog: { maxWidth: 600 },
  },
});
