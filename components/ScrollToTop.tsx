// components/ScrollToTop.tsx
'use client'

import { useAppContext } from '@/app/context/AppContext';
import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 100); // Show after scrolling 100px
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const {userType} = useAppContext(); 
  return (
  
    <button
      onClick={scrollToTop}
      className={`fixed w-7 h-7 flex justify-center items-center  border-[2px] ${userType}-border rounded-full bg-[#E4E4E4] bottom-8 right-5 z-50 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
     <ArrowUp className={` ${userType}-text  w-5`} />
    </button>
  );
}
