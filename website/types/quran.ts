export interface WordByWord {
  text: string;
  transliteration: string;
  translation: {
    en: string;
    bn: string;
  };
}

export interface Verse {
  number: number;
  text: string;
  textUthmani: string;
  transliteration: string;
  translation: {
    en: {
      text: string;
      author: string;
    };
    bn: {
      text: string;
      author: string;
    };
  };
  audio: {
    default: string;
    recitations: Record<string, string>;
  };
  wordByWord: WordByWord[];
  tafsir: {
    en: {
      short: string;
      long: string;
      author: string;
    };
    bn: {
      short: string;
      long: string;
      author: string;
    };
  };
}

export interface Surah {
  number: number;
  name: {
    arabic: string;
    en: string;
    bn: string;
  };
  versesCount: number;
  revelationType: 'Meccan' | 'Medinan';
  verses: Verse[];
  translation: {
    en: string;
    bn: string;
  };
  description: {
    en: string;
    bn: string;
  };
}

export interface Reciter {
  identifier: string;  // Changed from id to identifier to match our implementation
  name: string;
  style: string;      // Made required since we always provide it
  available: boolean;
  language: 'ar' | 'bn';
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  fontSize: {
    arabic: number;
    translation: number;
  };
  arabicFont: string;
  translationFont: string;
  autoPlayNext: boolean;
  selectedReciter: string;
  selectedTranslations: {
    en: string[];
    bn: string[];
  };
  selectedTafsirs: {
    en: string[];
    bn: string[];
  };
}

export interface Bookmark {
  id: string;
  surahNumber: number;
  verseNumber: number;
  timestamp: number;
  note?: string;
  tags?: string[];
}

export interface PrayerTime {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  date: string;
}

export interface QiblaInfo {
  direction: number;
  latitude: number;
  longitude: number;
}