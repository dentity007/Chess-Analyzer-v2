import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(createPageUrl('Dashboard'));
  }, [navigate]);

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center">
      <div className="text-amber-400 animate-pulse">Loading Chess Analyzer v2...</div>
    </div>
  );
}