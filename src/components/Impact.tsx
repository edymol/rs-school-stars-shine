
import React from 'react';
import { Users, Award, Globe, BookOpen } from 'lucide-react';

export const Impact = () => {
  const stats = [
    {
      icon: Users,
      number: "50,000+",
      label: "Students Educated",
      description: "Lives transformed through quality education",
      color: "text-blue-600"
    },
    {
      icon: Award,
      number: "95%+",
      label: "Success Rate",
      description: "Students finding jobs after graduation",
      color: "text-purple-600"
    },
    {
      icon: Globe,
      number: "100+",
      label: "Countries",
      description: "Global reach and impact",
      color: "text-pink-600"
    },
    {
      icon: BookOpen,
      number: "1000+",
      label: "Hours of Content",
      description: "Comprehensive curriculum coverage",
      color: "text-green-600"
    }
  ];

  return (
    <section className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            The Numbers Tell the Story
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            RS School's impact reaches far beyond code - it's about changing lives, 
            building careers, and creating opportunities for everyone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100"
            >
              <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
              <div className="text-lg font-semibold text-gray-800 mb-2">{stat.label}</div>
              <div className="text-gray-600 text-sm leading-relaxed">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
