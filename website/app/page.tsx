'use client';

import { ChakraProvider } from '@chakra-ui/react'
import QuranReader from '@/components/QuranReader'
import theme from '@/lib/theme'

export default function Home() {
  return (
    <ChakraProvider theme={theme}>
      <main className="flex min-h-screen flex-col items-center justify-between p-4">
        <QuranReader surahNumber={1} />
      </main>
    </ChakraProvider>
  )
}
