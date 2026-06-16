# Guía de Presentación — Parcial 2 · SIDEM-PAN

**Grupo 1GS241** · Tu chuleta para exponer.

---

## 🧠 La idea en una frase
> En el Parcial 2 **predijimos** problemas con diagramas. Ahora lo **comprobamos** midiendo el código real. Y cada problema **ya es una tarea** del Sprint 2.

---

## 📦 Las 5 métricas que pide la profe (con el dato clave)

1. **Requerimientos** → 55,6 % implementado · volatilidad 50 % · matriz requisito→código→prueba.
2. **Diseño** → complejidad máx **19** (umbral 10) · acoplamiento **CBO 1,6** (bajo = bueno).
3. **Código** → 37 smells · **6 vulnerabilidades (Seguridad E)** · **deuda 0,1 % (A)**.
4. **Clásicas** → ~3,16 KLOC · ~790 líneas por persona.
5. **Proceso** → en cada métrica: Objetivo → Métrica → Recolección → Análisis → Mejora.

---

## 🛠️ Herramientas (Criterio 4)
**SonarCloud** (dashboard), **ESLint** (complejidad), **Vitest** (pruebas), **npm audit** (vulns), **GitHub Actions** (CI), **Jira** (backlog).

**¿Por qué 2 herramientas (ESLint + SonarQube)?** ESLint es rápido y local; SonarQube da el panorama completo. Si **ambas coinciden**, el número es confiable → *triangulación* (TMMi).

**¿Por qué SonarQube?** Estándar de la industria · gratis para repos públicos · todo en un dashboard con notas A–E · se integra con GitHub.

---

## 🧩 Los 3 modelos, en una línea
- **ISTQB** → cómo diseñamos las pruebas (casos en los límites 10 y 50).
- **TMMi** → medir en serio y confirmar con dos herramientas.
- **TQM** → cada hallazgo se vuelve una tarea (mejora continua).

---

## ⭐ Si solo recuerdas 3 cosas
1. Medimos **código real**, y confirmó lo que el Parcial 2 predijo.
2. **Dos herramientas confirman cada número** (confianza).
3. **Cada problema ya tiene su tarea** en Jira.

---

## ❓ Si te preguntan…
- **¿Seguridad en E?** → 6 vulnerabilidades; una sola ya baja a E. Prioridad del Sprint 2.
- **¿14 % duplicación?** → mismo SQL repetido en 3 carpetas (Docker, migración, Supabase). No es descuido; se arregla con una sola fuente.
- **¿Complejidad 19 es mala?** → Sí, pasa el límite de 10. Primer refactor del Sprint 2.

---

## 🎤 Daily (≈1 min)

**🟢 ¿Qué hice?**
> Medí la calidad del Sprint 1 con SonarCloud, ESLint, Vitest y npm audit, cubriendo las 5 categorías de métricas, con números reales del dashboard.

**🔵 ¿Qué haré?**
> Pasar los hallazgos a tareas de Jira: agregar el rate limiting que falta, refactorizar las dos funciones más complejas y revisar la regla de OFAC.

**🔴 ¿Qué problemas tuve?**
> El motor de scoring tiene complejidad alta (16) y hay 6 vulnerabilidades (Rating E). Además las pruebas mostraron que una coincidencia OFAC se marca como riesgo medio, y debo validar con el cliente si debería ser alto.
