import { describe, it, expect } from 'vitest'

// Пример utility функции для тестирования
function formatScore(score: number): string {
  if (score >= 90) return 'Отлично'
  if (score >= 70) return 'Хорошо'
  if (score >= 50) return 'Удовлетворительно'
  return 'Неудовлетворительно'
}

function calculateProgress(correct: number, total: number): number {
  if (total === 0) return 0
  return Math.round((correct / total) * 100)
}

describe('Utility functions', () => {
  describe('formatScore', () => {
    it('should return "Отлично" for score >= 90', () => {
      expect(formatScore(90)).toBe('Отлично')
      expect(formatScore(95)).toBe('Отлично')
      expect(formatScore(100)).toBe('Отлично')
    })

    it('should return "Хорошо" for score >= 70 and < 90', () => {
      expect(formatScore(70)).toBe('Хорошо')
      expect(formatScore(80)).toBe('Хорошо')
      expect(formatScore(89)).toBe('Хорошо')
    })

    it('should return "Удовлетворительно" for score >= 50 and < 70', () => {
      expect(formatScore(50)).toBe('Удовлетворительно')
      expect(formatScore(60)).toBe('Удовлетворительно')
      expect(formatScore(69)).toBe('Удовлетворительно')
    })

    it('should return "Неудовлетворительно" for score < 50', () => {
      expect(formatScore(0)).toBe('Неудовлетворительно')
      expect(formatScore(25)).toBe('Неудовлетворительно')
      expect(formatScore(49)).toBe('Неудовлетворительно')
    })
  })

  describe('calculateProgress', () => {
    it('should return 0 for total = 0', () => {
      expect(calculateProgress(0, 0)).toBe(0)
    })

    it('should calculate correct percentage', () => {
      expect(calculateProgress(3, 10)).toBe(30)
      expect(calculateProgress(7, 10)).toBe(70)
      expect(calculateProgress(10, 10)).toBe(100)
    })

    it('should round to nearest integer', () => {
      expect(calculateProgress(1, 3)).toBe(33)
      expect(calculateProgress(2, 3)).toBe(67)
    })
  })
})