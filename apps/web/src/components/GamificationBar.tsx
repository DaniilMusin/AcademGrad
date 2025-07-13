'use client';

import React from 'react'

interface GamificationBarProps {
  xp: number
  level: number
  streak: number
  badges: Array<{
    id: number
    name: string
    earned: boolean
    icon: string
  }>
}

export default function GamificationBar({ xp, level, streak, badges }: GamificationBarProps) {
  const nextLevelXP = (level + 1) * 1000
  const progress = (xp / nextLevelXP) * 100

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold">{level}</span>
          </div>
          <div>
            <h3 className="font-semibold">Уровень {level}</h3>
            <p className="text-sm opacity-80">{xp} / {nextLevelXP} XP</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-2xl">🔥</div>
            <div className="text-sm">Серия: {streak}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl">🏆</div>
            <div className="text-sm">Бейджи: {badges.filter(b => b.earned).length}</div>
          </div>
        </div>
      </div>
      
      <div className="w-full bg-white/20 rounded-full h-2 mb-4">
        <div 
          className="bg-white h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="flex space-x-2">
        {badges.slice(0, 5).map((badge) => (
          <div
            key={badge.id}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
              badge.earned ? 'bg-yellow-500' : 'bg-white/20'
            }`}
            title={badge.name}
          >
            {badge.icon}
          </div>
        ))}
      </div>
    </div>
  )
}