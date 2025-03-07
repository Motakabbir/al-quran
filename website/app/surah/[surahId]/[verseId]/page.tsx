import QuranReader from '@/components/QuranReader';

export default function SurahPage({ params }: { params: { surahId: string; verseId: string } }) {
  const surahNumber = parseInt(params.surahId, 10);
  const verseNumber = parseInt(params.verseId, 10);
  
  return <QuranReader surahNumber={surahNumber} initialVerseNumber={verseNumber} />;
}