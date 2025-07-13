---
exam: ege
topic: Тригонометрия
subtopic: Тригонометрические уравнения
difficulty: 3
answer: "pi/4"
points: 1
time_limit: 15
tags: ["тригонометрия", "уравнения", "синус", "косинус"]
---

# Условие

Найдите корень уравнения $\sin x + \cos x = \sqrt{2}$ на интервале $[0; \pi]$.

# Решение

Умножим обе части уравнения на $\frac{1}{\sqrt{2}}$:

$$\frac{\sin x}{\sqrt{2}} + \frac{\cos x}{\sqrt{2}} = 1$$

Это можно записать как:

$$\sin x \cdot \frac{1}{\sqrt{2}} + \cos x \cdot \frac{1}{\sqrt{2}} = 1$$

Заметим, что $\frac{1}{\sqrt{2}} = \cos \frac{\pi}{4} = \sin \frac{\pi}{4}$, поэтому:

$$\sin x \cos \frac{\pi}{4} + \cos x \sin \frac{\pi}{4} = 1$$

По формуле сложения синусов:

$$\sin\left(x + \frac{\pi}{4}\right) = 1$$

Отсюда:

$$x + \frac{\pi}{4} = \frac{\pi}{2} + 2\pi k$$

$$x = \frac{\pi}{4} + 2\pi k$$

На интервале $[0; \pi]$ единственное решение: $x = \frac{\pi}{4}$.