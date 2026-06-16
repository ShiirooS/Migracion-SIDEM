# Ratings de SonarCloud — explicación rápida

Cada tarjeta del Overview tiene nota **A (mejor) → E (peor)**. Esto es lo que mide cada una y lo que sacamos.

---

## 1. Reliability (Confiabilidad) — mide **Bugs**
Errores que pueden romper el programa. **A** = 0 bugs; baja a E según el bug más grave.
🟢 **Nuestro: 0 bugs → A.**

## 2. Security (Seguridad) — mide **Vulnerabilidades**
Fallos de seguridad confirmados. **Una sola** ya baja a E (tolerancia cero).
🔴 **Nuestro: 6 vulnerabilidades → E.** Es nuestro punto débil y la prioridad del Sprint 2.

## 3. Security Hotspots — mide **% revisado por un humano**
Código sensible que **tú debes revisar** y marcar como seguro o no. La nota es el % revisado: **A** ≥ 80 %, **E** < 30 %.
🔴 **Nuestro: 1 hotspot, 0 % revisado → E.** Está en E **solo porque no lo hemos revisado**, no porque sea peligroso. Al marcarlo → sube a A.

## 4. Maintainability (Mantenibilidad) — mide **Deuda Técnica**
Qué tan fácil es mantener el código. Nota = *Debt Ratio* (tiempo de arreglar ÷ tiempo de construir). **A** ≤ 5 %.
🟢 **Nuestro: 0,1 % → A.**

---

> **🔑 Lo que cae en examen — Vulnerability vs Hotspot:**
> - **Vulnerability** = SonarCloud *seguro* de que es fallo → arréglalo.
> - **Hotspot** = SonarCloud *no seguro* → revísalo tú.

---

## Resumen

| Indicador | Valor | Nota |
| :- | :-: | :-: |
| Reliability (bugs) | 0 | 🟢 A |
| Security (vulns) | 6 | 🔴 E |
| Security Review (hotspots) | 0 % | 🔴 E |
| Maintainability (deuda) | 0,1 % | 🟢 A |

**Frase para cerrar:** *"Código confiable y fácil de mantener (A), pero la seguridad es el punto débil (E). El Sprint 2 empieza por seguridad."*
