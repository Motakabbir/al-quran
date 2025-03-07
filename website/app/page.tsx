'use client';

import { useState, useEffect } from 'react';
import { ChakraProvider, VStack, Box, Heading, List, ListItem } from '@chakra-ui/react'
import { useRouter } from 'next/navigation';
import theme from '@/lib/theme'

export default function Home() {
  const [surahs, setSurahs] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        // Fetch both English and Bengali translations
        const response = await fetch('https://api.quran.com/api/v4/chapters?language=bn');
        const data = await response.json();
        setSurahs(data.chapters);
      } catch (error) {
        console.error('Error fetching surahs:', error);
      }
    };

    fetchSurahs();
  }, []);

  return (
    <ChakraProvider theme={theme}>
      <main className="flex min-h-screen flex-col items-center p-4">
        <Heading mb={6}>কুরআন রিডার</Heading>
        <VStack spacing={4} width="100%" maxW="800px">
          <List spacing={3} width="100%">
            {surahs.map((surah: any) => (
              <ListItem 
                key={surah.id}
                onClick={() => router.push(`/surah/${surah.id}/1`)}
                p={4}
                bg="whiteAlpha.200"
                borderRadius="md"
                cursor="pointer"
                _hover={{ bg: "whiteAlpha.300" }}
                display="flex"
                flexDirection="column"
                gap={2}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Box as="span" fontWeight="bold">{surah.id}. </Box>
                    <Box as="span" fontSize="lg">{surah.translated_name.name}</Box>
                  </Box>
                  <Box textAlign="right" fontSize="1.5em" fontFamily="traditional-arabic">
                    {surah.name_arabic}
                  </Box>
                </Box>
                <Box display="flex" justifyContent="space-between" fontSize="sm" color="gray.500">
                  <Box>English: {surah.name_simple}</Box>
                  <Box>{surah.verses_count} আয়াত • {surah.revelation_place === 'makkah' ? 'মক্কী' : 'মাদানী'}</Box>
                </Box>
              </ListItem>
            ))}
          </List>
        </VStack>
      </main>
    </ChakraProvider>
  )
}
