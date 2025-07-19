'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface BadgeCarouselProps {
  badges: Badge[];
  className?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

const rarityColors = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-400 to-blue-600', 
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-yellow-600'
};

const rarityBorders = {
  common: 'border-gray-400',
  rare: 'border-blue-400',
  epic: 'border-purple-400', 
  legendary: 'border-yellow-400'
};

export default function BadgeCarousel({ 
  badges, 
  className, 
  autoPlay = true, 
  autoPlayInterval = 4000 
}: BadgeCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && !isHovered && badges.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % badges.length);
      }, autoPlayInterval);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoPlay, isHovered, badges.length, autoPlayInterval]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % badges.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + badges.length) % badges.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (badges.length === 0) {
    return (
      <div className={cn("p-6 text-center text-gray-500", className)}>
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
          🏆
        </div>
        <p>Начните решать задачи, чтобы заработать бейджи!</p>
      </div>
    );
  }

  const visibleBadges = badges.slice(currentIndex, currentIndex + 3).concat(
    badges.slice(0, Math.max(0, currentIndex + 3 - badges.length))
  );

  return (
    <div 
      className={cn("relative overflow-hidden bg-white rounded-lg shadow-lg", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      ref={carouselRef}
    >
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <h3 className="text-lg font-semibold">Достижения</h3>
        <p className="text-sm opacity-90">
          {badges.filter(b => b.isUnlocked).length} из {badges.length} разблокировано
        </p>
      </div>

      {/* Carousel Content */}
      <div className="relative p-6">
        <div className="flex space-x-4 transition-transform duration-500 ease-in-out">
          {visibleBadges.map((badge, index) => (
            <BadgeCard 
              key={`${badge.id}-${index}`} 
              badge={badge}
              isCenter={index === 1}
            />
          ))}
        </div>

        {/* Navigation Arrows */}
        {badges.length > 3 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors z-10"
              aria-label="Previous badge"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors z-10"
              aria-label="Next badge"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator */}
      {badges.length > 3 && (
        <div className="flex justify-center space-x-2 pb-4">
          {Array.from({ length: Math.ceil(badges.length / 3) }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index * 3)}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                Math.floor(currentIndex / 3) === index 
                  ? "bg-indigo-500" 
                  : "bg-gray-300 hover:bg-gray-400"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface BadgeCardProps {
  badge: Badge;
  isCenter?: boolean;
}

function BadgeCard({ badge, isCenter = false }: BadgeCardProps) {
  const progressPercentage = (badge.progress / badge.maxProgress) * 100;

  return (
    <div 
      className={cn(
        "flex-shrink-0 w-32 transition-all duration-300",
        isCenter ? "scale-110 z-10" : "scale-95 opacity-75"
      )}
    >
      <div className={cn(
        "relative p-4 rounded-xl border-2 transition-all duration-300",
        badge.isUnlocked ? rarityBorders[badge.rarity] : "border-gray-300",
        badge.isUnlocked ? "bg-white" : "bg-gray-50"
      )}>
        {/* Badge Icon */}
        <div className={cn(
          "relative w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-2xl",
          badge.isUnlocked 
            ? `bg-gradient-to-br ${rarityColors[badge.rarity]} text-white shadow-lg`
            : "bg-gray-200 text-gray-400"
        )}>
          {badge.icon}
          
          {/* Unlock Effect */}
          {badge.isUnlocked && (
            <div className="absolute -inset-1 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full animate-pulse opacity-20"></div>
          )}
        </div>

        {/* Badge Name */}
        <h4 className={cn(
          "text-sm font-medium text-center mb-2 line-clamp-2",
          badge.isUnlocked ? "text-gray-900" : "text-gray-500"
        )}>
          {badge.name}
        </h4>

        {/* Progress Bar */}
        {!badge.isUnlocked && (
          <div className="mb-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 text-center mt-1">
              {badge.progress}/{badge.maxProgress}
            </p>
          </div>
        )}

        {/* Unlocked Date */}
        {badge.isUnlocked && badge.unlockedAt && (
          <p className="text-xs text-gray-400 text-center">
            {new Date(badge.unlockedAt).toLocaleDateString('ru-RU')}
          </p>
        )}

        {/* Rarity Indicator */}
        <div className="absolute top-2 right-2">
          <div className={cn(
            "w-3 h-3 rounded-full",
            badge.isUnlocked 
              ? `bg-gradient-to-br ${rarityColors[badge.rarity]}`
              : "bg-gray-300"
          )} />
        </div>
      </div>
    </div>
  );
}