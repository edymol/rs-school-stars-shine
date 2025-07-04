
import React from 'react';
import { MessageCircle, Handshake, Trophy, Coffee } from 'lucide-react';

export const Community = () => {
  return (
    <section className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            More Than Education - It's Family
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            RS School has created something beautiful: a global family of developers 
            who support, inspire, and celebrate each other's success.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Active Discord Community</h3>
                <p className="text-gray-600">
                  24/7 support from fellow students and mentors in one of the most 
                  welcoming developer communities online.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl">
                <Handshake className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Peer-to-Peer Learning</h3>
                <p className="text-gray-600">
                  Students helping students, creating bonds that last well beyond 
                  the course completion.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Celebrating Success</h3>
                <p className="text-gray-600">
                  Every milestone, every job offer, every breakthrough is celebrated 
                  by the entire community.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 p-3 bg-gradient-to-br from-pink-500 to-red-600 rounded-2xl">
                <Coffee className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Lifelong Connections</h3>
                <p className="text-gray-600">
                  Alumni network spanning the globe, creating opportunities and 
                  friendships that transcend borders.
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl">
              <h3 className="text-2xl font-bold mb-6">Community Testimonial</h3>
              <blockquote className="text-lg italic mb-6 leading-relaxed">
                "RS School didn't just teach me to code - it gave me a community, 
                confidence, and a career I never thought possible. The mentors and 
                fellow students became my extended family, and I'm forever grateful."
              </blockquote>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold">A</span>
                </div>
                <div>
                  <div className="font-semibold">Anonymous Graduate</div>
                  <div className="text-white/80">Now Senior Developer</div>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-400/20 rounded-full blur-xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-400/20 rounded-full blur-xl" />
          </div>
        </div>
      </div>
    </section>
  );
};
