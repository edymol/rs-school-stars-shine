
import React from 'react';

export const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Thank You, RS School
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto mb-8 leading-relaxed">
            For believing in free education. For building bridges across continents. 
            For transforming dreams into careers. For proving that when we lift each other up, 
            we all rise together.
          </p>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
            <p className="text-2xl font-semibold mb-4">
              🌟 The impact you've made is immeasurable 🌟
            </p>
            <p className="text-lg text-gray-300">
              Every student you've educated, every career you've launched, 
              every dream you've made possible - it all matters.
            </p>
          </div>

          <div className="text-gray-400">
            <p>&copy; 2024 EdyMol | Built with ❤️ by the Community</p>
            <p className="mt-2 text-sm">
              This tribute website celebrates the incredible work of RS School and their impact on the global developer community.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
