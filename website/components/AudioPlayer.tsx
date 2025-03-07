import { useState, useEffect, useRef } from 'react';
import {
  Box,
  IconButton,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  HStack,
  Text,
  Select,
} from '@chakra-ui/react';
import {
  PlayIcon,
  PauseIcon,
  BackwardIcon,
  ForwardIcon,
} from '@heroicons/react/24/solid';
import { Surah, Reciter } from '@/types/quran';

interface AudioPlayerProps {
  surah: Surah | null;
  currentVerse: number;
  onVerseChange: (verseNumber: number) => void;
  onWordIndexChange: (index: number) => void;
  reciters: Reciter[];
  selectedReciter: string;
  onReciterChange: (reciterId: string) => void;
  autoPlayNext: boolean;
  uiLanguage?: 'en' | 'bn';
}

export default function AudioPlayer({
  surah,
  currentVerse,
  onVerseChange,
  onWordIndexChange,
  reciters,
  selectedReciter,
  onReciterChange,
  autoPlayNext,
  uiLanguage = 'en',
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const labels = {
    play: uiLanguage === 'bn' ? 'চালান' : 'Play',
    pause: uiLanguage === 'bn' ? 'বিরতি' : 'Pause',
    stop: uiLanguage === 'bn' ? 'থামান' : 'Stop',
    previous: uiLanguage === 'bn' ? 'পূর্ববর্তী আয়াত' : 'Previous verse',
    next: uiLanguage === 'bn' ? 'পরবর্তী আয়াত' : 'Next verse',
    repeat: uiLanguage === 'bn' ? 'পুনরাবৃত্তি' : 'Repeat',
    selectReciter: uiLanguage === 'bn' ? 'ক্বারী নির্বাচন করুন' : 'Select reciter',
    loading: uiLanguage === 'bn' ? 'লোড হচ্ছে...' : 'Loading...',
    error: uiLanguage === 'bn' ? 'অডিও লোড করতে সমস্যা হয়েছে' : 'Error loading audio',
  };

  useEffect(() => {
    if (!surah?.number) return;
    
    try {
      const formattedSurah = surah.number.toString().padStart(3, '0');
      const formattedVerse = currentVerse.toString().padStart(3, '0');
      const audioUrl = `https://everyayah.com/data/${selectedReciter}/${formattedSurah}_${formattedVerse}.mp3`;
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.load();
        if (isPlaying) {
          audioRef.current.play();
        }
      }
    } catch (error) {
      console.error('Error setting up audio:', error);
    }

    // Cleanup function
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [surah, currentVerse, selectedReciter, isPlaying]);

  const handlePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleSliderChange = (value: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setProgress(value);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    if (autoPlayNext && surah && currentVerse < surah.verses.length) {
      onVerseChange(currentVerse + 1);
    }
  };

  const handlePrevVerse = () => {
    if (currentVerse > 1) {
      onVerseChange(currentVerse - 1);
    }
  };

  const handleNextVerse = () => {
    if (surah && currentVerse < surah.verses.length) {
      onVerseChange(currentVerse + 1);
    }
  };

  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      p={4}
      bg="white"
      _dark={{ bg: 'gray.800' }}
      borderTopWidth={1}
      shadow="lg"
    >
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      <HStack spacing={4}>
        <Select
          value={selectedReciter}
          onChange={(e) => onReciterChange(e.target.value)}
          width="200px"
        >
          {reciters.map((reciter) => (
            <option key={reciter.identifier} value={reciter.identifier}>
              {reciter.name}
            </option>
          ))}
        </Select>

        <IconButton
          aria-label={labels.previous}
          icon={<BackwardIcon className="w-5 h-5" />}
          onClick={handlePrevVerse}
          isDisabled={currentVerse <= 1}
        />

        <IconButton
          aria-label={isPlaying ? labels.pause : labels.play}
          icon={isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
          onClick={handlePlay}
          colorScheme="blue"
        />

        <IconButton
          aria-label={labels.next}
          icon={<ForwardIcon className="w-5 h-5" />}
          onClick={handleNextVerse}
          isDisabled={!surah || currentVerse >= surah.verses.length}
        />

        <Box flex={1}>
          <Slider
            value={progress}
            max={duration || 100}
            onChange={handleSliderChange}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
        </Box>

        <Text fontSize="sm">
          {formatTime(progress)} / {formatTime(duration)}
        </Text>
      </HStack>
    </Box>
  );
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}