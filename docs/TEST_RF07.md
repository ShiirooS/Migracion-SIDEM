# Guía de Prueba — RF07: Flujo de Subsanación de Documentos

## Pre-requisitos
- Backend corriendo en http://localhost:4000
- Frontend corriendo en http://localhost:5173
- Migraciones SQL ejecutadas en Supabase (002_subsanacion.sql, 003_email_logs.sql)
- Credenciales: agente1@sidem-pan.gob.pa / Admin2026!

---

## PASO 1 — Crear una solicitud (Solicitante)

1. Abrir http://localhost:5173
2. Hacer clic en la pestaña **"Ciudadano Extranjero"**
3. Hacer clic en **"Iniciar solicitud de evaluación"**

### Paso 1.1 — Formulario Paso 0: Identidad y Pasaporte
4. Llenar los campos:
   - Nombres: `Juan Carlos`
   - Apellidos: `Pérez López`
   - Fecha de nacimiento: `1990-05-15`
   - Nacionalidad: `Colombia`
   - N.º de Pasaporte: `AB123456`
   - Fecha de vencimiento del pasaporte: `2030-12-31` (debe tener +6 meses)
   - Categoría migratoria: `Residencia temporal`
   - Correo electrónico: `juan.perez@test.com` **(este email es clave para RF08)**
5. Hacer clic en **"Siguiente"**

### Paso 1.2 — Formulario Paso 1: Solvencia Económica
6. Monto declarado (USD): `1500`
7. Seleccionar un archivo PDF de prueba en "Comprobante de solvencia"
   - Si no tienes PDF, crea uno vacío con nombre `solvencia.pdf`
8. Hacer clic en **"Siguiente"**

### Paso 1.3 — Formulario Paso 2: Antecedentes Penales
9. Seleccionar un archivo PDF de prueba en "Certificado de antecedentes penales"
   - Si no tienes PDF, crea uno vacío con nombre `antecedentes.pdf`
10. Hacer clic en **"Someter Evaluación"**

### Paso 1.4 — Confirmación
11. **IMPORTANTE:** Copiar el número de ticket que aparece (ej. `PAN-2026-00042`)
12. Verificar que el estado mostrado sea **PENDIENTE**
13. Hacer clic en **"Volver al inicio"**

---

## PASO 2 — Login como Agente

14. En la pantalla de login, hacer clic en la pestaña **"Acceso Institucional"**
15. Email: `agente1@sidem-pan.gob.pa`
16. Contraseña: `Admin2026!`
17. Hacer clic en **"Iniciar sesión"**
18. Verificar que aparece la **Cola de expedientes**

---

## PASO 3 — Asignar expediente a EN_EVALUACION (simular)

19. Buscar el expediente creado en el PASO 1 (por ticket o nombre)
20. Hacer clic en el expediente para abrir el **Detalle**
21. Verificar que el estado sea **PENDIENTE**

> **Nota:** En un sistema real, el agente cambiaría el estado a EN_EVALUACION manualmente. Para esta prueba, emite un dictamen rápido para verificar que el flujo funciona, O saltar al PASO 4 directamente si el endpoint lo permite.

---

## PASO 4 — Solicitar Subsanación (Agente)

22. En el detalle del expediente, buscar el botón **"Solicitar subsanación"**
    - Solo visible si el estado es `PENDIENTE` o `EN_EVALUACION`
23. Hacer clic en **"Solicitar subsanación"**
24. Aparece el formulario con:
    - Título: "Solicitar subsanación — #PAN-2026-00042"
    - Textarea para indicar la razón
25. Escribir en el textarea:
    ```
    El comprobante de solvencia es ilegible — la imagen está borrosa y 
    no se puede verificar el monto declarado. Favor remitir una copia 
    legible del comprobante de solvencia bancaria.
    ```
26. Hacer clic en **"Solicitar subsanación"**
27. **Verificar:**
    - [ ] Aparece toast de éxito: "Subsanación solicitada correctamente"
    - [ ] El estado del expediente cambia a **SUBSANACION_PENDIENTE** (badge amarillo)
    - [ ] Se muestra la alerta "Subsanación solicitada" con la razón escrita
    - [ ] El botón "Emitir dictamen" ya NO aparece (deshabilitado)
    - [ ] El botón "Solicitar subsanación" ya NO aparece

---

## PASO 5 — Verificar email de notificación (RF08)

28. Abrir la consola del navegador (F12 → pestaña Network)
29. Verificar que se hizo una llamada a `/api/applications/:id/request-subsanacion`
30. Verificar en la respuesta: `{ ok: true, estado: "SUBSANACION_PENDIENTE" }`

> **Nota:** El email solo se envía si `RESEND_API_KEY` está configurado. Si no está configurado, el sistema funciona igual pero no envía email (falla silenciosa).

---

## PASO 6 — Consultar estado como Solicitante (SIN login)

31. Abrir una **nueva pestaña del navegador** (para simular otro usuario)
32. Ir a http://localhost:5173
33. Hacer clic en **"Ciudadano Extranjero"**
34. Hacer clic en **"Consultar estado de trámite"**
35. Número de ticket: `PAN-2026-00042` (el que copiaste en el PASO 1)
36. Número de pasaporte: `AB123456`
37. Hacer clic en **"Consultar estado"**
38. **Verificar:**
    - [ ] El estado mostrado es **SUBSANACION_PENDIENTE** (en amarillo)
    - [ ] Aparece el recuadro "Qué debe corregir" con la razón del agente
    - [ ] Aparece el botón **"Subir documentos corregidos"**

---

## PASO 7 — Subir documentos corregidos (Solicitante)

39. Hacer clic en **"Subir documentos corregidos"**
40. Se abre la pantalla de subsanación
41. Verificar que aparece:
    - Título: "Subsanar documentos"
    - Alerta "Documento requerido" con la razón del agente
    - Dos zonas de upload: solvencia y antecedentes
42. Seleccionar un **nuevo PDF** en "Comprobante de solvencia"
    - Usa un PDF diferente al original (para verificar que se actualiza)
43. (Opcional) Seleccionar un PDF en "Antecedentes penales" si también se necesita
44. Hacer clic en **"Subir documentos corregidos"**
45. **Verificar:**
    - [ ] Aparece pantalla de éxito: "Documentos enviados"
    - [ ] Mensaje: "El expediente ha vuelto a estado EN EVALUACIÓN"
    - [ ] Botón "Volver al inicio"

---

## PASO 8 — Verificar en la cola del agente

46. Volver a la pestaña del agente (donde está el detalle del expediente)
47. Hacer clic en **"Volver a la cola"**
48. **Verificar:**
    - [ ] El expediente aparece en la cola
    - [ ] El estado ahora es **EN_EVALUACION** (badge azul)
    - [ ] El score de riesgo se mantiene igual
49. Hacer clic en el expediente para abrir el detalle
50. **Verificar:**
    - [ ] Los documentos PDF muestran URLs firmadas válidas
    - [ ] El botón **"Emitir dictamen"** está visible y habilitado
    - [ ] El botón "Solicitar subsanación" está visible (para poder volver a pedir si es necesario)

---

## PASO 9 — Emitir dictamen normalmente

51. En el detalle del expediente, seleccionar **"APROBADO"** en Decisión
52. Artículo legal: `Art. 50 Num. 1 DL3/2008`
53. Justificación: `Solicitante cumple con todos los requisitos de solvencia económica.`
54. Hacer clic en **"Confirmar dictamen"**
55. **Verificar:**
    - [ ] Toast de éxito: "Dictamen APROBADO emitido correctamente"
    - [ ] Aparece alerta verde: "Dictamen emitido"
    - [ ] El estado cambia a **APROBADO** (badge verde)

---

## PASO 10 — Verificar audit_log

56. Ir a la pestaña del admin (login como admin@sidem-pan.gob.pa / Admin2026!)
57. Hacer clic en **"Auditoría WORM"** en el sidebar
58. **Verificar que aparezcan estas acciones** (de más reciente a más antigua):
    - [ ] `DICTAMEN_EMITIDO` — con decisión APROBADO
    - [ ] `SUBSANACION_ENVIADA` — con archivos_subidos
    - [ ] `SUBSANACION_SOLICITADA` — con la razón
    - [ ] `SOLICITUD_CREADA` — al inicio

---

## Checklist de Validación RF07

| # | Criterio de aceptación | Estado |
|---|------------------------|--------|
| 1 | Agente puede marcar expediente como SUBSANACION_PENDIENTE con razón documentada | ☐ |
| 2 | Solicitante que consulta estado ve mensaje claro con instrucciones de qué subir | ☐ |
| 3 | Solicitante puede subir nuevos PDFs y el expediente vuelve a EN_EVALUACION automáticamente | ☐ |
| 4 | Agente ve los documentos actualizados en el visor PDF de DetalleExpediente | ☐ |
| 5 | Todo el flujo queda registrado en audit_log con timestamps | ☐ |

---

## Pruebas adicionales (Edge Cases)

### EC-1: Subsanar sin archivos
1. Intentar hacer clic en "Subir documentos corregidos" sin seleccionar ningún archivo
2. **Esperado:** Error "Debe subir al menos un documento corregido"

### EC-2: Subsanar con archivo no-PDF
1. Seleccionar un archivo .jpg o .png
2. **Esperado:** Error "Solo se aceptan archivos PDF"

### EC-3: Subsanar con archivo > 5MB
1. Seleccionar un PDF de más de 5MB
2. **Esperado:** Error "El archivo no debe superar 5MB"

### EC-4: Intentar subsanar expediente que no está en SUBSANACION_PENDIENTE
1. Hacer POST directo a `/api/applications/:id/subsanar` con un expediente en EN_EVALUACION
2. **Esperado:** Error 422 "Este expediente no está en estado de subsanación"

### EC-5: Intentar subsanar sin ticket/pasaporte correctos
1. Hacer POST con ticket incorrecto
2. **Esperado:** Error 404 "Expediente no encontrado"

### EC-6: Solicitar subsanación en expediente ya APROBADO
1. Intentar solicitar subsanación en un expediente con estado APROBADO
2. **Esperado:** Error 422 "Solo se puede solicitar subsanación en expedientes pendientes o en evaluación"
