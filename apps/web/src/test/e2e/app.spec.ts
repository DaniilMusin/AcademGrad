import { test, expect } from '@playwright/test'

test.describe('EGE Tutor App', () => {
  test('should display homepage', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/EGE/)
  })

  test('should navigate to dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.locator('h1')).toContainText('Панель управления')
  })

  test('should navigate to schedule', async ({ page }) => {
    await page.goto('/schedule')
    await expect(page.locator('h1')).toContainText('Расписание')
  })

  test('should have task solving flow', async ({ page }) => {
    // Переходим к задаче
    await page.goto('/tasks/1')
    
    // Проверяем наличие формы для ответа
    await expect(page.locator('form')).toBeVisible()
    
    // Заполняем ответ (если есть input)
    const answerInput = page.locator('input[type="text"]')
    if (await answerInput.isVisible()) {
      await answerInput.fill('42')
      await page.locator('button[type="submit"]').click()
    }
    
    // Проверяем что появилось сообщение об отправке
    await expect(page.locator('text=Отправлено')).toBeVisible()
  })

  test('should open chat and ask question', async ({ page }) => {
    await page.goto('/tasks/1')
    
    // Открываем чат
    const chatButton = page.locator('button:has-text("Чат")')
    if (await chatButton.isVisible()) {
      await chatButton.click()
      
      // Отправляем вопрос
      const messageInput = page.locator('textarea, input[placeholder*="вопрос"]')
      await messageInput.fill('Как решить эту задачу?')
      await page.locator('button[type="submit"]').click()
      
      // Проверяем что сообщение отправилось
      await expect(page.locator('text=Как решить эту задачу?')).toBeVisible()
    }
  })
})