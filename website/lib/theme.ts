import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  fonts: {
    heading: 'var(--font-inter)',
    body: 'var(--font-inter)',
    mono: 'var(--font-inter)',
  },
  colors: {
    primary: {
      50: '#f0f7ff',
      100: '#c2e0ff',
      200: '#94c9ff',
      300: '#66b2ff',
      400: '#389bff',
      500: '#0a84ff',
      600: '#0063cc',
      700: '#004299',
      800: '#002166',
      900: '#000033',
    },
    secondary: {
      50: '#f5f5f5',
      100: '#e8e8e8',
      200: '#d6d6d6',
      300: '#b8b8b8',
      400: '#999999',
      500: '#666666',
      600: '#4d4d4d',
      700: '#333333',
      800: '#1a1a1a',
      900: '#000000',
    },
  },
  components: {
    Button: {
      variants: {
        solid: {
          bg: 'primary.500',
          color: 'white',
          _hover: {
            bg: 'primary.600',
          },
        },
      },
    },
  },
  styles: {
    global: (props: { colorMode: 'light' | 'dark' }) => ({
      body: {
        bg: props.colorMode === 'light' ? 'white' : 'gray.800',
        color: props.colorMode === 'light' ? 'gray.800' : 'white',
      },
    }),
  },
});

export default theme;