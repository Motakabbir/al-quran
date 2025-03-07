'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  Stack,
  Heading,
  Text,
  IconButton,
  Flex,
  useDisclosure,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Switch,
  FormControl,
  FormLabel,
  VStack,
  useColorMode,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  Collapse
} from '@chakra-ui/react';
import { CogIcon, BookmarkIcon, MoonIcon, SunIcon, ClockIcon } from '@heroicons/react/24/solid';
import { Verse, Surah, UserPreferences, Reciter, Bookmark } from '../types/quran';

const AudioPlayer = dynamic(() => import('./AudioPlayer').then(mod => mod.default), { 
  ssr: false,
  loading: () => <div>Loading audio player...</div>
});

const VerseView = dynamic(() => import('./VerseView').then(mod => mod.default), { 
  ssr: false,
  loading: () => <div>Loading verse...</div>
});

const PrayerTimesWidget = dynamic(() => import('./PrayerTimesWidget').then(mod => ({ default: mod.PrayerTimesWidget })), { 
  ssr: false,
  loading: () => <div>Loading prayer times...</div>
});

interface QuranReaderProps {
  surahNumber: number;
  initialVerseNumber?: number;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  fontSize: {
    arabic: 28,
    translation: 16
  },
  arabicFont: 'UthmanicHafs',
  translationFont: 'Arial',
  autoPlayNext: true,
  selectedReciter: 'Alafasy_128kbps',
  selectedTranslations: {
    en: ['en.sahih'],
    bn: ['bn.bengali']
  },
  selectedTafsirs: {
    en: ['en.tafsir-ibn-kathir'],
    bn: ['bn.bengali-zakaria']
  }
};

const LOCAL_STORAGE_KEYS = {
  PREFERENCES: 'quran-preferences',
  BOOKMARKS: 'quran-bookmarks'
};

export default function QuranReader({ surahNumber, initialVerseNumber = 1 }: QuranReaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [surah, setSurah] = useState<Surah | null>(null);
  const [currentVerse, setCurrentVerse] = useState<number>(initialVerseNumber);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [showPrayerTimes, setShowPrayerTimes] = useState(false);

  const loadUserPreferences = () => {
    const savedPrefs = localStorage.getItem(LOCAL_STORAGE_KEYS.PREFERENCES);
    if (savedPrefs) {
      setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(savedPrefs) });
    }
  };

  const checkBookmarkStatus = () => {
    const bookmarks: Bookmark[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.BOOKMARKS) || '[]');
    setIsBookmarked(bookmarks.some(b => b.surahNumber === surahNumber && b.verseNumber === currentVerse));
  };

  useEffect(() => {
    const loadSurah = async () => {
      try {
        // First fetch surah details
        const surahResponse = await fetch(`https://api.quran.com/api/v4/chapters/${surahNumber}?language=en`);
        const surahData = await surahResponse.json();
        
        // Then fetch verses for this surah
        const versesResponse = await fetch(`https://api.quran.com/api/v4/verses/by_chapter/${surahNumber}?language=en&words=true&translations=en.sahih,bn.bengali&fields=text_uthmani,verse_number`);
        const versesData = await versesResponse.json();
        
        // Transform and combine the data
        setSurah({
          ...surahData.chapter,
          name: {
            arabic: surahData.chapter.name_arabic,
            en: surahData.chapter.name_simple,
            bn: surahData.chapter.name_complex
          },
          verses: versesData.verses.map((verse: any) => ({
            number: verse.verse_number,
            text: verse.text_uthmani,
            textUthmani: verse.text_uthmani,
            transliteration: verse.words.map((w: { transliteration?: { text?: string } }) => w.transliteration?.text || '').join(' '),
            translation: {
              en: {
                text: verse.translations?.[0]?.text || '',
                author: verse.translations?.[0]?.resource_name || 'Unknown'
              },
              bn: {
                text: verse.translations?.[1]?.text || '',
                author: verse.translations?.[1]?.resource_name || 'Unknown'
              }
            },
            audio: {
              default: `https://verses.quran.com/${verse.verse_key}.mp3`,
              recitations: {}
            },
            wordByWord: verse.words.map((word: any) => ({
              text: word.text_uthmani,
              transliteration: word.transliteration?.text || '',
              translation: {
                en: word.translation?.text || '',
                bn: word.translation?.bn || ''
              }
            })),
            tafsir: {
              en: {
                short: '',
                long: '',
                author: 'Ibn Kathir'
              },
              bn: {
                short: '',
                long: '',
                author: 'Zakaria'
              }
            }
          }))
        });
      } catch (error) {
        console.error('Error loading surah:', error);
      }
    };

    const loadReciters = async () => {
      try {
        const response = await fetch('https://api.quran.com/api/v4/resources/recitations');
        const data = await response.json();
        setReciters(data.recitations);
      } catch (error) {
        console.error('Error loading reciters:', error);
      }
    };
    
    loadSurah();
    loadReciters();
    loadUserPreferences();
    checkBookmarkStatus();
  }, [surahNumber, currentVerse]);

  useEffect(() => {
    router.push(`/surah/${surahNumber}/${currentVerse}`);
  }, [currentVerse, surahNumber, router]);

  const handleVerseChange = (verseNumber: number) => {
    setCurrentVerse(verseNumber);
    setCurrentWordIndex(-1);
  };

  const handleReciterChange = (reciterId: string) => {
    const newPrefs = {
      ...preferences,
      selectedReciter: reciterId
    };
    setPreferences(newPrefs);
    localStorage.setItem(LOCAL_STORAGE_KEYS.PREFERENCES, JSON.stringify(newPrefs));
  };

  const handleBookmark = () => {
    const bookmarks: Bookmark[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.BOOKMARKS) || '[]');
    const bookmarkIndex = bookmarks.findIndex(
      b => b.surahNumber === surahNumber && b.verseNumber === currentVerse
    );

    if (bookmarkIndex === -1) {
      bookmarks.push({
        id: Date.now().toString(),
        surahNumber,
        verseNumber: currentVerse,
        timestamp: Date.now()
      });
      setIsBookmarked(true);
    } else {
      bookmarks.splice(bookmarkIndex, 1);
      setIsBookmarked(false);
    }

    localStorage.setItem(LOCAL_STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
  };

  const savePreferences = (newPrefs: Partial<UserPreferences>) => {
    const updatedPrefs = { ...preferences, ...newPrefs };
    setPreferences(updatedPrefs);
    localStorage.setItem(LOCAL_STORAGE_KEYS.PREFERENCES, JSON.stringify(updatedPrefs));
  };

  if (!surah) {
    return (
      <Box p={4}>
        <Text>Loading...</Text>
      </Box>
    );
  }

  return (
    <Flex direction="column" w="full" p={4} gap={6}>
      <Stack direction="row" justify="space-between" mb={8}>
        <Box>
          <Heading
            as="h1"
            fontSize="3xl"
            fontFamily={preferences.arabicFont}
            mb={2}
          >
            {surah?.name.arabic}
          </Heading>
          <Text fontSize="xl" mb={1}>{surah?.name.en}</Text>
          <Text fontSize="xl" mb={4}>{surah?.name.bn}</Text>
        </Box>
        
        <Stack direction="row">
          <IconButton
            aria-label="Toggle prayer times"
            icon={<ClockIcon className="w-5 h-5" />}
            onClick={() => setShowPrayerTimes(!showPrayerTimes)}
            colorScheme={showPrayerTimes ? 'blue' : undefined}
          />
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            onClick={toggleColorMode}
          />
          <IconButton
            aria-label="Bookmarks"
            icon={<BookmarkIcon className="w-5 h-5" />}
            onClick={handleBookmark}
            colorScheme={isBookmarked ? 'blue' : undefined}
          />
          <IconButton
            aria-label="Settings"
            icon={<CogIcon className="w-5 h-5" />}
            onClick={onOpen}
          />
        </Stack>
      </Stack>

      <Collapse in={showPrayerTimes}>
        <Box mb={6}>
          <PrayerTimesWidget />
        </Box>
      </Collapse>

      {surah?.verses.map((verse: Verse) => (
        <VerseView
          key={verse.number}
          verse={verse}
          isPlaying={currentVerse === verse.number}
          onPlay={() => setCurrentVerse(verse.number)}
          onBookmark={handleBookmark}
          selectedTranslations={preferences.selectedTranslations}
          selectedTafsirs={preferences.selectedTafsirs}
          showWordByWord={true}
          fontSize={preferences.fontSize}
        />
      ))}

      <AudioPlayer
        surah={surah}
        currentVerse={currentVerse}
        onVerseChange={handleVerseChange}
        onWordIndexChange={setCurrentWordIndex}
        reciters={reciters}
        selectedReciter={preferences.selectedReciter}
        onReciterChange={handleReciterChange}
        autoPlayNext={preferences.autoPlayNext}
      />

      <Drawer isOpen={isOpen} onClose={onClose} placement="right">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader>Settings</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Arabic Font Size</FormLabel>
                <NumberInput
                  value={preferences.fontSize.arabic}
                  onChange={(_: string, value: number) => savePreferences({
                    fontSize: { ...preferences.fontSize, arabic: value }
                  })}
                  min={16}
                  max={48}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Translation Font Size</FormLabel>
                <NumberInput
                  value={preferences.fontSize.translation}
                  onChange={(_: string, value: number) => savePreferences({
                    fontSize: { ...preferences.fontSize, translation: value }
                  })}
                  min={12}
                  max={32}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>English Translation</FormLabel>
                <Select
                  value={preferences.selectedTranslations.en[0]}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => savePreferences({
                    selectedTranslations: {
                      ...preferences.selectedTranslations,
                      en: [e.target.value]
                    }
                  })}
                >
                  <option value="en.sahih">Sahih International</option>
                  <option value="en.pickthall">Pickthall</option>
                  <option value="en.yusufali">Yusuf Ali</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Bengali Translation</FormLabel>
                <Select
                  value={preferences.selectedTranslations.bn[0]}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => savePreferences({
                    selectedTranslations: {
                      ...preferences.selectedTranslations,
                      bn: [e.target.value]
                    }
                  })}
                >
                  <option value="bn.bengali">Muhiuddin Khan</option>
                  <option value="bn.zakaria">Tafsir Ibn Kathir Bangla</option>
                </Select>
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0}>Auto-play Next Verse</FormLabel>
                <Switch
                  isChecked={preferences.autoPlayNext}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => savePreferences({
                    autoPlayNext: e.target.checked
                  })}
                />
              </FormControl>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Flex>
  );
}