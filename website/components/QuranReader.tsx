'use client';

import { useState, useEffect, Suspense } from 'react';
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
  useColorMode,
  Collapse,
  Button,
} from '@chakra-ui/react';
import { CogIcon, BookmarkIcon, MoonIcon, SunIcon, ClockIcon } from '@heroicons/react/24/solid';
import { Verse, Surah, UserPreferences, Reciter, Bookmark } from '../types/quran';

const AudioPlayer = dynamic(() => import('./AudioPlayer'), { 
  ssr: false,
  loading: () => <div>Loading audio player...</div>
});

const VerseView = dynamic(() => import('./VerseView'), { 
  ssr: false,
  loading: () => <div>Loading verse...</div>
});

const PrayerTimesWidget = dynamic(() => import('./PrayerTimesWidget').then(mod => ({ default: mod.PrayerTimesWidget })), { 
  ssr: false,
  loading: () => <div>Loading prayer times...</div>
});

const QuranSettingsDrawer = dynamic(() => import('./QuranSettingsDrawer'), {
  ssr: false,
  loading: () => <div>Loading settings...</div>
});

interface QuranReaderProps {
  surahNumber: number;
  initialVerseNumber?: number;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  uiLanguage: 'en',  // Added default UI language
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

const VERSES_PER_PAGE = 10;

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
  const [currentPage, setCurrentPage] = useState(Math.floor((initialVerseNumber - 1) / VERSES_PER_PAGE));

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

  const startVerse = currentPage * VERSES_PER_PAGE;
  const endVerse = Math.min((currentPage + 1) * VERSES_PER_PAGE, surah?.verses.length || 0);
  const totalPages = Math.ceil((surah?.verses.length || 0) / VERSES_PER_PAGE);

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
          <Suspense fallback={<Text>Loading prayer times...</Text>}>
            <PrayerTimesWidget />
          </Suspense>
        </Box>
      </Collapse>

      {surah?.verses.slice(startVerse, endVerse).map((verse: Verse) => (
        <Suspense key={verse.number} fallback={<Text>Loading verse {verse.number}...</Text>}>
          <VerseView
            verse={verse}
            isPlaying={currentVerse === verse.number}
            onPlay={() => setCurrentVerse(verse.number)}
            onBookmark={handleBookmark}
            selectedTranslations={preferences.selectedTranslations}
            selectedTafsirs={preferences.selectedTafsirs}
            showWordByWord={true}
            fontSize={preferences.fontSize}
            uiLanguage={preferences.uiLanguage}
          />
        </Suspense>
      ))}

      <Stack direction="row" justify="center" spacing={2} mt={4}>
        <Button 
          onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
          isDisabled={currentPage === 0}
        >
          {preferences.uiLanguage === 'bn' ? 'পূর্ববর্তী' : 'Previous'}
        </Button>
        <Text alignSelf="center">
          {preferences.uiLanguage === 'bn' ? 
            `পৃষ্ঠা ${currentPage + 1} / ${totalPages}` : 
            `Page ${currentPage + 1} of ${totalPages}`}
        </Text>
        <Button 
          onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
          isDisabled={currentPage === totalPages - 1}
        >
          {preferences.uiLanguage === 'bn' ? 'পরবর্তী' : 'Next'}
        </Button>
      </Stack>

      <Suspense fallback={<Text>Loading audio player...</Text>}>
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
      </Suspense>

      <Suspense fallback={<Text>Loading settings...</Text>}>
        <QuranSettingsDrawer 
          isOpen={isOpen} 
          onClose={onClose}
          preferences={preferences}
          onPreferencesChange={savePreferences}
          onSurahChange={(newSurahNumber) => {
            router.push(`/surah/${newSurahNumber}/1`);
          }}
          currentSurah={surahNumber}
        />
      </Suspense>
    </Flex>
  );
}