import axios from 'axios';
import { Surah, Verse, Reciter, PrayerTime, QiblaInfo, UserPreferences, Bookmark } from '../types/quran';

const API_BASE_URL = 'https://api.quran.com/api/v4';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const STORAGE_KEYS = {
  CACHE_PREFIX: 'quran_cache_',
  PREFERENCES: 'quran_preferences_',
  BOOKMARKS: 'quran_bookmarks'
};

export class QuranService {
  private static async getCachedData<T>(key: string): Promise<T | null> {
    if (typeof window === 'undefined') return null;
    
    const cacheKey = STORAGE_KEYS.CACHE_PREFIX + key;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp < CACHE_DURATION) {
        return data.value as T;
      }
    }
    return null;
  }

  private static async setCachedData<T>(key: string, value: T): Promise<void> {
    if (typeof window === 'undefined') return;
    
    const cacheKey = STORAGE_KEYS.CACHE_PREFIX + key;
    localStorage.setItem(cacheKey, JSON.stringify({
      value,
      timestamp: Date.now(),
    }));
  }

  static async getSurah(number: number, options: {
    translations?: { en?: string[], bn?: string[] },
    tafsirs?: { en?: string[], bn?: string[] },
    wordByWord?: boolean
  } = {}): Promise<Surah> {
    const cacheKey = `surah_${number}_${JSON.stringify(options)}`;
    const cached = await this.getCachedData<Surah>(cacheKey);
    
    if (cached) return cached;

    const response = await axios.get(`${API_BASE_URL}/chapters/${number}`, {
      params: {
        translations: [
          ...(options.translations?.en ?? ['en.sahih']),
          ...(options.translations?.bn ?? ['bn.bengali'])
        ],
        tafsirs: [
          ...(options.tafsirs?.en ?? ['en.tafsir-ibn-kathir']),
          ...(options.tafsirs?.bn ?? ['bn.bengali-zakaria'])
        ],
        word_by_word: options.wordByWord ?? true,
        audio: 1
      }
    });
    
    const surah = response.data.chapter;
    await this.setCachedData(cacheKey, surah);
    
    return surah;
  }

  static async getVerse(surahNumber: number, verseNumber: number, options: {
    translations?: { en?: string[], bn?: string[] },
    tafsirs?: { en?: string[], bn?: string[] },
    reciterId?: string,
    wordByWord?: boolean
  } = {}): Promise<Verse> {
    const cacheKey = `verse_${surahNumber}_${verseNumber}_${JSON.stringify(options)}`;
    const cached = await this.getCachedData<Verse>(cacheKey);
    
    if (cached) return cached;

    const response = await axios.get(
      `${API_BASE_URL}/verses/by_key/${surahNumber}:${verseNumber}`,
      {
        params: {
          translations: [
            ...(options.translations?.en ?? ['en.sahih']),
            ...(options.translations?.bn ?? ['bn.bengali'])
          ],
          tafsirs: [
            ...(options.tafsirs?.en ?? ['en.tafsir-ibn-kathir']),
            ...(options.tafsirs?.bn ?? ['bn.bengali-zakaria'])
          ],
          word_by_word: options.wordByWord ?? true,
          audio: options.reciterId ?? 1
        },
      }
    );
    
    const verse = response.data.verse;
    await this.setCachedData(cacheKey, verse);
    
    return verse;
  }

  static async getReciters(): Promise<Reciter[]> {
    const cacheKey = 'reciters';
    const cached = await this.getCachedData<Reciter[]>(cacheKey);
    
    if (cached) return cached;

    // Return hardcoded list of everyayah.com reciters
    const reciters: Reciter[] = [
      {
        identifier: 'Alafasy_128kbps',
        name: 'Mishary Rashid Alafasy',
        style: 'Murattal',
        available: true,
        language: 'ar'
      },
      {
        identifier: 'Abdul_Basit_Mujawwad_128kbps',
        name: 'Abdul Basit (Mujawwad)',
        style: 'Mujawwad',
        available: true,
        language: 'ar'
      },
      {
        identifier: 'Abdul_Basit_Murattal_192kbps',
        name: 'Abdul Basit (Murattal)',
        style: 'Murattal',
        available: true,
        language: 'ar'
      },
      {
        identifier: 'Husary_128kbps',
        name: 'Mahmoud Khalil Al-Husary',
        style: 'Murattal',
        available: true,
        language: 'ar'
      },
      {
        identifier: 'Minshawi_Mujawwad_192kbps',
        name: 'Mohamed Siddiq El-Minshawi (Mujawwad)',
        style: 'Mujawwad',
        available: true,
        language: 'ar'
      },
      {
        identifier: 'Minshawi_Murattal_128kbps',
        name: 'Mohamed Siddiq El-Minshawi (Murattal)',
        style: 'Murattal',
        available: true,
        language: 'ar'
      }
    ];

    await this.setCachedData(cacheKey, reciters);
    return reciters;
  }

  static async searchQuran(query: string, options: {
    language?: 'en' | 'bn',
    translations?: string[],
    page?: number,
    size?: number
  } = {}): Promise<{
    verses: Verse[],
    total: number,
    currentPage: number
  }> {
    const response = await axios.get(`${API_BASE_URL}/search`, {
      params: {
        q: query,
        language: options.language ?? 'en',
        translations: options.translations,
        page: options.page ?? 1,
        size: options.size ?? 20,
      },
    });
    
    return {
      verses: response.data.search.results,
      total: response.data.search.total,
      currentPage: response.data.search.current_page
    };
  }

  static async getPrayerTimes(latitude: number, longitude: number, date?: string): Promise<PrayerTime> {
    const formattedDate = date ?? new Date().toISOString().split('T')[0];
    const response = await axios.get('https://api.aladhan.com/v1/timings/' + formattedDate, {
      params: {
        latitude,
        longitude,
        method: 2 // Islamic Society of North America method
      }
    });

    const timings = response.data.data.timings;
    return {
      fajr: timings.Fajr,
      sunrise: timings.Sunrise,
      dhuhr: timings.Dhuhr,
      asr: timings.Asr,
      maghrib: timings.Maghrib,
      isha: timings.Isha,
      date: formattedDate
    };
  }

  static async getQiblaDirection(latitude: number, longitude: number): Promise<QiblaInfo> {
    const response = await axios.get('https://api.aladhan.com/v1/qibla/' + latitude + '/' + longitude);
    return {
      direction: response.data.data.direction,
      latitude,
      longitude
    };
  }

  static async saveUserPreferences(userId: string, preferences: UserPreferences): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES + userId, JSON.stringify(preferences));
  }

  static async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const prefs = localStorage.getItem(STORAGE_KEYS.PREFERENCES + userId);
    return prefs ? JSON.parse(prefs) : null;
  }

  static async addBookmark(bookmark: Omit<Bookmark, 'id'>): Promise<string> {
    const bookmarks = this.getBookmarksFromStorage();
    const id = Date.now().toString();
    bookmarks.push({ ...bookmark, id });
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    return id;
  }

  static async getBookmarks(): Promise<Bookmark[]> {
    return this.getBookmarksFromStorage();
  }

  private static getBookmarksFromStorage(): Bookmark[] {
    const bookmarks = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    return bookmarks ? JSON.parse(bookmarks) : [];
  }
}