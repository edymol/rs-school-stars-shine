
import React from 'react';
import { Zap, Heart, Lightbulb, Target, Rocket, Star } from 'lucide-react';

export const Features = () => {
  const features = [
    {
      icon: Zap,
      title: "Cutting-Edge Curriculum",
      description: "Always up-to-date with the latest technologies and industry best practices",
      gradient: "from-yellow-400 to-orange-500"
    },
    {
      icon: Heart,
      title: "Community First",
      description: "Built on the foundation of mutual support and collaborative learning",
      gradient: "from-pink-400 to-red-500"
    },
    {
      icon: Lightbulb,
      title: "Real-World Projects",
      description: "Hands-on experience with projects that matter and build portfolios",
      gradient: "from-blue-400 to-cyan-500"
    },
    {
      icon: Target,
      title: "Career Focused",
      description: "Direct path from learning to landing your dream developer job",
      gradient: "from-green-400 to-emerald-500"
    },
    {
      icon: Rocket,
      title: "Mentor Guidance",
      description: "Expert mentors providing personalized feedback and career advice",
      gradient: "from-purple-400 to-indigo-500"
    },
    {
      icon: Star,
      title: "Open Source Spirit",
      description: "Fostering the open source community and giving back to developers",
      gradient: "from-amber-400 to-yellow-500"
    }
  ];

  return (
    <section className="py-24 px-4 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            What Makes RS School Special
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Every aspect of RS School is designed with one goal in mind: 
            your success as a developer and your growth as a person.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 overflow-hidden"
            >
              {/* Background gradient on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              
              <div className="relative z-10">
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
