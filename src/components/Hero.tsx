
import React from 'react';
import { GraduationCap, Users, Code, Heart } from 'lucide-react';

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <div className="relative z-10 text-center max-w-6xl mx-auto">
        {/* Floating icons */}
        <div className="absolute -top-16 -left-16 animate-bounce delay-500">
          <GraduationCap className="w-12 h-12 text-blue-500/60" />
        </div>
        <div className="absolute -top-8 -right-20 animate-bounce delay-1000">
          <Code className="w-10 h-10 text-purple-500/60" />
        </div>
        <div className="absolute -bottom-12 -left-8 animate-bounce delay-700">
          <Users className="w-14 h-14 text-pink-500/60" />
        </div>
        <div className="absolute -bottom-8 -right-12 animate-bounce delay-300">
          <Heart className="w-8 h-8 text-red-500/60" />
        </div>

        <div className="animate-fade-in">
          <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6 leading-tight">
            RS School with love
          </h1>
          <p className="text-2xl md:text-3xl text-gray-700 mb-8 font-light">
            Empowering Developers, Building Community
          </p>
          <div className="text-lg md:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-12">
            <p className="mb-4">
              A beacon of hope in the tech education landscape, RS School has transformed thousands of lives 
              through free, high-quality programming education and mentorship.
            </p>
            <p className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Thank you for making the impossible, possible. 🚀
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-full px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <span className="text-blue-600 font-semibold text-lg">Free Education</span>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-full px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <span className="text-purple-600 font-semibold text-lg">Expert Mentorship</span>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-full px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <span className="text-pink-600 font-semibold text-lg">Global Community</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
