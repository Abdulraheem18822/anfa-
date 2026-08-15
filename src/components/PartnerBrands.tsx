import React from 'react';
import { Plane, Dog, Sun, Snowflake, Briefcase, Heart } from 'lucide-react';

interface PartnerBrandsProps {
  activeCategory?: string;
  onSelectCategory?: (category: string) => void;
}

export const PartnerBrands: React.FC<PartnerBrandsProps> = ({ activeCategory, onSelectCategory }) => {
  const nicheCategories = [
    {
      id: 'traveling',
      name: 'Traveling',
      subtext: 'WANDERLUST',
      category: 'traveling',
      icon: <Plane className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 group-hover:scale-110 transition-transform" />,
    },
    {
      id: 'dog-lovers',
      name: 'Dog Lovers',
      subtext: 'PET OBSESSED',
      category: 'dog-lovers',
      icon: <Dog className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 group-hover:scale-110 transition-transform" />,
    },
    {
      id: 'summer-special',
      name: 'Summer Special',
      subtext: 'SUNNY VIBES',
      category: 'summer-special',
      icon: <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 group-hover:scale-110 transition-transform" />,
    },
    {
      id: 'winter-special',
      name: 'Winter Special',
      subtext: 'COZY DROPS',
      category: 'winter-special',
      icon: <Snowflake className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400 group-hover:scale-110 transition-transform" />,
    },
    {
      id: 'occasional',
      name: 'Occasional',
      subtext: 'SPECIAL EVENTS',
      category: 'occasional',
      icon: <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 group-hover:scale-110 transition-transform" />,
    },
    {
      id: 'valentines',
      name: "Valentine's Special",
      subtext: 'ROMANCE & LOVE',
      category: 'valentines',
      icon: <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500 fill-rose-500/30 group-hover:scale-110 transition-transform" />,
    },
  ];

  const handleClick = (category: string) => {
    if (onSelectCategory) {
      onSelectCategory(category);
    }
  };

  return (
    <section id="brands-section" className="py-6 sm:py-8 border-b border-neutral-200 bg-neutral-50/80 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between overflow-x-auto no-scrollbar space-x-3 sm:space-x-6 md:space-x-8 py-1">
          {nicheCategories.map((item) => {
            const isActive = activeCategory === item.category;
            return (
              <button
                key={item.id}
                id={`category-bar-${item.id}`}
                onClick={() => handleClick(item.category)}
                className={`flex-shrink-0 flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl transition-all duration-300 group cursor-pointer border ${
                  isActive
                    ? 'bg-white shadow-md border-amber-400 scale-105 ring-2 ring-amber-400/20'
                    : 'bg-transparent hover:bg-white hover:shadow-md border-transparent hover:border-neutral-200'
                }`}
                title={`View ${item.name} T-Shirts`}
              >
                <div
                  className={`w-11 h-11 sm:w-13 sm:h-13 rounded-xl flex items-center justify-center mb-1.5 transition ${
                    isActive ? 'bg-amber-400/15' : 'bg-neutral-100 group-hover:bg-amber-400/10'
                  }`}
                >
                  {item.icon}
                </div>
                <span
                  className={`font-['Oswald'] font-bold text-xs sm:text-sm tracking-wider uppercase transition ${
                    isActive ? 'text-black font-black' : 'text-neutral-800 group-hover:text-black'
                  }`}
                >
                  {item.name}
                </span>
                <span className="text-[8px] sm:text-[9px] tracking-widest text-neutral-400 font-semibold uppercase mt-0.5">
                  {item.subtext}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
