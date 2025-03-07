import { useState } from 'react';
import { Box, Text, HStack, IconButton, VStack, useColorModeValue, Grid, Tooltip, Button } from '@chakra-ui/react';
import { PlayIcon, PauseIcon, BookmarkIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import { Verse } from '../types/quran';
import { motion } from 'framer-motion';

interface VerseViewProps {
  verse: Verse;
  isPlaying: boolean;
  onPlay: () => void;
  onBookmark: () => void;
  selectedTranslations: {
    en: string[];
    bn: string[];
  };
  selectedTafsirs: {
    en: string[];
    bn: string[];
  };
  showWordByWord: boolean;
  fontSize: {
    arabic: number;
    translation: number;
  };
}

const HighlightedWord = motion(Box);

export default function VerseView({
  verse,
  isPlaying,
  onPlay,
  onBookmark,
  selectedTranslations,
  selectedTafsirs,
  showWordByWord,
  fontSize,
}: VerseViewProps) {
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const [showTafsir, setShowTafsir] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);

  return (
    <Box
      p={4}
      bg={bgColor}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
      position="relative"
    >
      <HStack spacing={4} mb={4}>
        <Box
          w={10}
          h={10}
          borderRadius="full"
          bg="primary.500"
          color="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="sm"
        >
          {verse.number}
        </Box>
        <IconButton
          aria-label={isPlaying ? 'Pause' : 'Play'}
          icon={isPlaying ? <PauseIcon width={20} /> : <PlayIcon width={20} />}
          onClick={onPlay}
          variant="ghost"
          colorScheme="primary"
        />
        {onBookmark && (
          <IconButton
            aria-label="Bookmark verse"
            icon={<BookmarkIcon width={20} />}
            onClick={onBookmark}
            variant="ghost"
            colorScheme="primary"
          />
        )}
        <IconButton
          aria-label="Show tafsir"
          icon={<InformationCircleIcon width={20} />}
          onClick={() => setShowTafsir(!showTafsir)}
          variant="ghost"
          colorScheme="primary"
        />
      </HStack>

      <VStack align="stretch" spacing={4}>
        <Text
          fontSize={`${fontSize.arabic}px`}
          fontFamily="var(--font-arabic)"
          textAlign="right"
          lineHeight={1.8}
          dir="rtl"
        >
          {verse.textUthmani}
        </Text>

        {showWordByWord && (
          <Grid
            templateColumns="repeat(auto-fill, minmax(120px, 1fr))"
            gap={4}
            p={4}
            bg={useColorModeValue('gray.100', 'gray.600')}
            borderRadius="md"
          >
            {verse.wordByWord.map((word, index) => (
              <HighlightedWord
                key={index}
                p={2}
                borderRadius="md"
                bg={currentWordIndex === index ? 'primary.100' : 'transparent'}
                animate={isPlaying && currentWordIndex === index ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
                onClick={() => setCurrentWordIndex(index)}
              >
                <VStack spacing={1} align="center">
                  <Text fontFamily="var(--font-arabic)" fontSize={`${fontSize.arabic - 4}px`}>
                    {word.text}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {word.transliteration}
                  </Text>
                  <Text fontSize="sm">
                    {word.translation.en}
                  </Text>
                  <Text fontSize="sm">
                    {word.translation.bn}
                  </Text>
                </VStack>
              </HighlightedWord>
            ))}
          </Grid>
        )}

        <Text fontSize={`${fontSize.translation}px`} color="gray.500">
          {verse.transliteration}
        </Text>

        {selectedTranslations.en.map((translator, index) => (
          <Box key={`en-${index}`}>
            <Text fontSize={`${fontSize.translation}px`} mb={2}>
              {verse.translation.en.text}
            </Text>
            <Text fontSize="sm" color="gray.500">
              — {verse.translation.en.author}
            </Text>
          </Box>
        ))}

        {selectedTranslations.bn.map((translator, index) => (
          <Box key={`bn-${index}`}>
            <Text fontSize={`${fontSize.translation}px`} mb={2}>
              {verse.translation.bn.text}
            </Text>
            <Text fontSize="sm" color="gray.500">
              — {verse.translation.bn.author}
            </Text>
          </Box>
        ))}

        {showTafsir && (
          <VStack align="stretch" spacing={4} mt={4} p={4} bg={useColorModeValue('white', 'gray.800')} borderRadius="md">
            <Text fontWeight="bold" fontSize="lg">Tafsir</Text>
            
            {selectedTafsirs.en.map((tafsir, index) => (
              <Box key={`tafsir-en-${index}`}>
                <Text fontSize={`${fontSize.translation}px`} mb={2}>
                  {verse.tafsir.en.short}
                </Text>
                <Button size="sm" onClick={() => window.open(`/tafsir/${verse.number}?lang=en`, '_blank')}>
                  Read full tafsir
                </Button>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  — {verse.tafsir.en.author}
                </Text>
              </Box>
            ))}

            {selectedTafsirs.bn.map((tafsir, index) => (
              <Box key={`tafsir-bn-${index}`}>
                <Text fontSize={`${fontSize.translation}px`} mb={2}>
                  {verse.tafsir.bn.short}
                </Text>
                <Button size="sm" onClick={() => window.open(`/tafsir/${verse.number}?lang=bn`, '_blank')}>
                  পূর্ণ তাফসীর পড়ুন
                </Button>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  — {verse.tafsir.bn.author}
                </Text>
              </Box>
            ))}
          </VStack>
        )}
      </VStack>
    </Box>
  );
}