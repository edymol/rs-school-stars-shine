
import React from 'react';
import { Hero } from '@/components/Hero';
import { Impact } from '@/components/Impact';
import { Community } from '@/components/Community';
import { Features } from '@/components/Features';
import { Footer } from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Hero />
      <Impact />
      <Features />
      <Community />
      <Footer />
    </div>
  );
};

export default Index;
