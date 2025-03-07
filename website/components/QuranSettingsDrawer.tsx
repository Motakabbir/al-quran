import { ChangeEvent, useEffect, useState } from 'react';
import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  VStack,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Switch
} from '@chakra-ui/react';
import { UserPreferences } from '../types/quran';

interface QuranSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onPreferencesChange: (newPrefs: Partial<UserPreferences>) => void;
  onSurahChange?: (surahNumber: number) => void;
  currentSurah?: number;
}

export default function QuranSettingsDrawer({
  isOpen,
  onClose,
  preferences,
  onPreferencesChange,
  onSurahChange,
  currentSurah = 1
}: QuranSettingsDrawerProps) {
  const [surahs, setSurahs] = useState<Array<{ number: number; name: string }>>([]);

  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const response = await fetch('https://api.quran.com/api/v4/chapters?language=en');
        const data = await response.json();
        setSurahs(data.chapters.map((ch: any) => ({
          number: ch.id,
          name: `${ch.id}. ${ch.name_simple}`
        })));
      } catch (error) {
        console.error('Error fetching surahs:', error);
      }
    };
    fetchSurahs();
  }, []);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader>Settings</DrawerHeader>
        <DrawerBody>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Interface Language / ইন্টারফেস ভাষা</FormLabel>
              <Select
                value={preferences.uiLanguage}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => onPreferencesChange({
                  uiLanguage: e.target.value as 'en' | 'bn'
                })}
              >
                <option value="en">English</option>
                <option value="bn">বাংলা</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>{preferences.uiLanguage === 'bn' ? 'সূরা নির্বাচন করুন' : 'Select Surah'}</FormLabel>
              <Select
                value={currentSurah}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                  onSurahChange?.(parseInt(e.target.value, 10));
                }}
              >
                {surahs.map(surah => (
                  <option key={surah.number} value={surah.number}>
                    {surah.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>{preferences.uiLanguage === 'bn' ? 'আরবি ফন্ট সাইজ' : 'Arabic Font Size'}</FormLabel>
              <NumberInput
                value={preferences.fontSize.arabic}
                onChange={(_: string, value: number) => onPreferencesChange({
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
              <FormLabel>{preferences.uiLanguage === 'bn' ? 'অনুবাদ ফন্ট সাইজ' : 'Translation Font Size'}</FormLabel>
              <NumberInput
                value={preferences.fontSize.translation}
                onChange={(_: string, value: number) => onPreferencesChange({
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
              <FormLabel>{preferences.uiLanguage === 'bn' ? 'ইংরেজি অনুবাদ' : 'English Translation'}</FormLabel>
              <Select
                value={preferences.selectedTranslations.en[0]}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => onPreferencesChange({
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
              <FormLabel>{preferences.uiLanguage === 'bn' ? 'বাংলা অনুবাদ' : 'Bengali Translation'}</FormLabel>
              <Select
                value={preferences.selectedTranslations.bn[0]}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => onPreferencesChange({
                  selectedTranslations: {
                    ...preferences.selectedTranslations,
                    bn: [e.target.value]
                  }
                })}
              >
                <option value="bn.bengali">মুহিউদ্দীন খান</option>
                <option value="bn.zakaria">তাফসীর ইবনে কাছীর বাংলা</option>
                <option value="bn.ahbayan">আহবায়ান</option>
                <option value="bn.taisirul">তাইসীরুল কুরআন</option>
              </Select>
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel mb={0}>
                {preferences.uiLanguage === 'bn' ? 'স্বয়ংক্রিয় পরবর্তী আয়াত' : 'Auto-play Next Verse'}
              </FormLabel>
              <Switch
                isChecked={preferences.autoPlayNext}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onPreferencesChange({
                  autoPlayNext: e.target.checked
                })}
              />
            </FormControl>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}