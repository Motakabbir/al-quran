import { redirect } from 'next/navigation';

export default function SurahDefaultPage({ params }: { params: { surahId: string } }) {
  // Redirect to verse 1 by default
  redirect(`/surah/${params.surahId}/1`);
}