import { useState, useEffect } from 'react';
import { Box, VStack, Text, HStack, Progress, useColorModeValue, IconButton } from '@chakra-ui/react';
import { ArrowUpIcon, MapPinIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { PrayerTime, QiblaInfo } from '../types/quran';
import { QuranService } from '../services/quranService';

export const PrayerTimesWidget = ({ uiLanguage = 'en' }: { uiLanguage?: 'en' | 'bn' }) => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime | null>(null);
  const [qibla, setQibla] = useState<QiblaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const qiblaArrowColor = useColorModeValue('primary.500', 'primary.300');

  const labels = {
    prayerTimes: uiLanguage === 'bn' ? 'নামাযের সময়সূচী' : 'Prayer Times',
    fajr: uiLanguage === 'bn' ? 'ফজর' : 'Fajr',
    sunrise: uiLanguage === 'bn' ? 'সূর্যোদয়' : 'Sunrise',
    dhuhr: uiLanguage === 'bn' ? 'যোহর' : 'Dhuhr',
    asr: uiLanguage === 'bn' ? 'আসর' : 'Asr',
    maghrib: uiLanguage === 'bn' ? 'মাগরিব' : 'Maghrib',
    isha: uiLanguage === 'bn' ? 'ইশা' : 'Isha',
    loading: uiLanguage === 'bn' ? 'লোড হচ্ছে...' : 'Loading...',
    error: uiLanguage === 'bn' ? 'সময়সূচী লোড করতে সমস্যা হয়েছে' : 'Error loading prayer times',
    findLocation: uiLanguage === 'bn' ? 'অবস্থান খুঁজুন' : 'Find my location'
  };

  useEffect(() => {
    loadPrayerData();
  }, []);

  const loadPrayerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user's location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;

      // Get prayer times and qibla direction
      const [timesData, qiblaData] = await Promise.all([
        QuranService.getPrayerTimes(latitude, longitude),
        QuranService.getQiblaDirection(latitude, longitude)
      ]);

      setPrayerTimes(timesData);
      setQibla(qiblaData);
    } catch (err) {
      setError('Could not load prayer times. Please check your location settings.');
      console.error('Error loading prayer data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPrayer = () => {
    if (!prayerTimes) return null;

    const now = new Date();
    const prayers = [
      { name: 'Fajr', time: prayerTimes.fajr },
      { name: 'Dhuhr', time: prayerTimes.dhuhr },
      { name: 'Asr', time: prayerTimes.asr },
      { name: 'Maghrib', time: prayerTimes.maghrib },
      { name: 'Isha', time: prayerTimes.isha }
    ];

    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    for (let i = 0; i < prayers.length; i++) {
      const [hours, minutes] = prayers[i].time.split(':').map(Number);
      const prayerTime = hours * 60 + minutes;
      
      if (currentTime < prayerTime) {
        return {
          current: i > 0 ? prayers[i - 1].name : 'Isha',
          next: prayers[i].name,
          nextTime: prayers[i].time,
          progress: ((currentTime - (i > 0 ? (prayers[i - 1].time.split(':').map(Number)[0] * 60 + prayers[i - 1].time.split(':').map(Number)[1]) : 0)) / 
                    (prayerTime - (i > 0 ? (prayers[i - 1].time.split(':').map(Number)[0] * 60 + prayers[i - 1].time.split(':').map(Number)[1]) : 0))) * 100
        };
      }
    }

    return {
      current: prayers[prayers.length - 1].name,
      next: prayers[0].name,
      nextTime: prayers[0].time,
      progress: 100
    };
  };

  const prayer = getCurrentPrayer();

  return (
    <Box
      p={4}
      bg={bgColor}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
      shadow="sm"
    >
      {loading ? (
        <Text>{labels.loading}</Text>
      ) : error ? (
        <VStack align="stretch" spacing={2}>
          <Text color="red.500">{labels.error}</Text>
          <IconButton
            aria-label="Retry loading prayer times"
            icon={<ArrowPathIcon width={20} />}
            onClick={loadPrayerData}
            size="sm"
          />
        </VStack>
      ) : (
        <VStack align="stretch" spacing={4}>
          <HStack justify="space-between">
            <Text fontSize="lg" fontWeight="bold">{labels.prayerTimes}</Text>
            <IconButton
              aria-label="Refresh prayer times"
              icon={<ArrowPathIcon width={20} />}
              onClick={loadPrayerData}
              size="sm"
              variant="ghost"
            />
          </HStack>

          {prayer && (
            <Box>
              <Text>Current: {prayer.current}</Text>
              <Text>Next: {prayer.next} at {prayer.nextTime}</Text>
              <Progress value={prayer.progress} size="sm" mt={2} />
            </Box>
          )}

          <VStack align="stretch" spacing={2}>
            <HStack justify="space-between">
              <Text>{labels.fajr}</Text>
              <Text>{prayerTimes?.fajr}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text>{labels.dhuhr}</Text>
              <Text>{prayerTimes?.dhuhr}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text>{labels.asr}</Text>
              <Text>{prayerTimes?.asr}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text>{labels.maghrib}</Text>
              <Text>{prayerTimes?.maghrib}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text>{labels.isha}</Text>
              <Text>{prayerTimes?.isha}</Text>
            </HStack>
          </VStack>

          {qibla && (
            <VStack align="center" spacing={2} pt={4}>
              <Text fontSize="sm">Qibla Direction</Text>
              <Box position="relative" w="100px" h="100px">
                <ArrowUpIcon
                  width={40}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) rotate(${qibla.direction}deg)`,
                    color: qiblaArrowColor
                  }}
                />
              </Box>
              <Text fontSize="sm">{Math.round(qibla.direction)}°</Text>
            </VStack>
          )}

          <HStack fontSize="xs" color="gray.500" justify="center">
            <MapPinIcon width={12} />
            <Text>Based on your current location</Text>
          </HStack>
        </VStack>
      )}
    </Box>
  );
};