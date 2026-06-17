UNIVERSIDAD TECNOLÓGICA DE PANAMÁ

Facultad de Ingeniería de Sistemas Computacionales

Licenciatura en Desarrollo y Gestión de Software

Avances para \
Parcial N°2

MÓDULO DIGITAL DE DEBIDA DILIGENCIA MIGRATORIA(DDM)

Decreto Ley 3 de 22 de febrero de 2008

Integrantes:

Aparicio, Ana (8-1003-2495)

Ferreira, Bruno (8-1009-494)

Rios, Gerald (8-987-741)

Ten Su, Eriel (8-1024-2395)

Grupo: 1GS241

Facilitador(a): María Mosquera

Asignatura: Ingeniería de Software Aplicada IV

Panamá, mayo de 2026







Medición 
# **Métrica En Requerimientos: Cobertura**
## **1. Propósito De La Métrica**
La cobertura de requerimientos permite medir qué porcentaje de los requisitos definidos para el sistema SIDEM-PAN cuenta con evidencia suficiente para ser analizado, diseñado, implementado y posteriormente probado.

Esta métrica es necesaria porque permite identificar requisitos que están correctamente respaldados por artefactos del proyecto y requisitos que aún presentan vacíos. Un requisito sin cobertura representa un riesgo para la calidad del software, ya que puede quedar fuera del diseño, no implementarse correctamente o no ser validado mediante pruebas.

## **2. Alcance De La Medición**
La medición se aplica sobre la línea base de requisitos definida en el documento del proyecto SIDEM-PAN.

La línea base está compuesta por:

- Requisitos funcionales: RF01 - RF12 = 12 
- Requisitos no funcionales: RNF01 - RNF06 = 6 
- Total de requisitos evaluados = 18 

Los artefactos usados para evaluar la cobertura son:

- Requisitos funcionales. 
- Requisitos no funcionales. 
- Casos de uso. 
- Criterios de aceptación. 
- Prototipos de interfaz. 
- Diagrama de clases. 
- Pruebas alfa. 
- Pruebas beta. 
- Pruebas UX. 
- Matriz de defectos. 

## **3. Definición Formal**
La cobertura de requerimientos se calcula mediante la siguiente fórmula:

Cobertura de requerimientos =\
` `(Requisitos cubiertos / Total de requisitos evaluados) × 100

Para mayor precisión, se calculan tres tipos de cobertura:
### **Cobertura funcional**
Cobertura funcional =\
` `(Requisitos funcionales cubiertos / Total de requisitos funcionales) × 100
### **Cobertura no funcional**
Cobertura no funcional =\
` `(Requisitos no funcionales cubiertos / Total de requisitos no funcionales) × 100
### **Cobertura total**
Cobertura total =\
` `(Requisitos cubiertos / Total de requisitos evaluados) × 100

## **4. Criterio De Clasificación**
Para evitar subjetividad, cada requisito se clasifica en uno de los siguientes estados:

|**Estado**|**Criterio**|
| :-: | :-: |
|Cubierto|El requisito tiene evidencia suficiente para ser verificado: caso de uso o criterio de aceptación y al menos una prueba, módulo, prototipo o evidencia de diseño relacionada.|
|Parcialmente cubierto|El requisito tiene alguna evidencia documental, pero no es suficiente para verificarlo completamente.|
|No cubierto|El requisito no tiene caso de uso, criterio de aceptación, prueba ni evidencia clara de diseño.|

Para el cálculo estricto solo se consideran como cubiertos los requisitos clasificados como Cubierto.

Los requisitos parciales se reportan aparte porque representan riesgos que deben ser refinados antes del desarrollo.

## **5. Recolección De Datos**
La recolección se realiza mediante revisión documental del informe SIDEM-PAN. Cada requisito se compara contra los artefactos existentes en el documento.

La revisión responde a las siguientes preguntas:

- ¿El requisito tiene caso de uso asociado? 
- ¿Tiene criterio de aceptación? 
- ¿Tiene prueba alfa, beta o UX relacionada? 
- ¿Está representado en el diseño o prototipo? 
- ¿Tiene un módulo funcional identificado? 
- ¿Puede verificarse de forma objetiva? 

Como complemento de la revisión documental, los requisitos se registran en Jira para mantener la trazabilidad y el control del avance del proyecto. Se recomienda crear una épica general llamada “SIDEM-PAN - Debida Diligencia Migratoria”, donde se gestionen los requisitos funcionales (RF01–RF12) y no funcionales (RNF01–RNF06). Cada tarea debe incluir descripción, responsable, prioridad, estado, criterios de aceptación y evidencias asociadas. Además, pueden añadirse subtareas para pruebas y validaciones. Esto permite controlar la cobertura, trazabilidad y seguimiento de los requisitos del sistema.

|**ID**|**Evidencia encontrada**|**Estado**|
| :-: | :-: | :-: |
|RF01|Caso de uso 1, formulario, criterios de envío y módulo Evaluación.|Cubierto|
|RF02|Validaciones de pasaporte y PDF, criterios y pruebas ALF-01 y ALF-02.|Cubierto|
|RF03|Caso de uso 2, portal de consulta y criterios de estado.|Cubierto|
|RF04|Existe scoring y prueba ALF-03, pero faltan pesos, variables y umbrales.|Parcial|
|RF05|Existe dashboard, pero faltan criterios completos de filtro y gestión.|Parcial|
|RF06|Caso de uso 3, criterios de dictamen, agente, timestamp y justificación.|Cubierto|
|RF07|Existe subsanación, pero falta cubrir carga corregida y reanudación.|Parcial|
|RF08|Hay evidencia de correo por subsanación, pero no de todos los estados.|Parcial|
|RF09|Hay caso de uso y prueba para CSV, pero el requisito también menciona XML.|Parcial|
|RF10|Caso de uso 7, criterios de logs y prueba ALF-06.|Cubierto|
|RF11|Requisito declarado, sin caso de uso, algoritmo, criterio ni prueba.|No cubierto|
|RF12|Se solapa con RF04 y no tiene prueba independiente.|Parcial|
|RNF01|Menciona 2FA, cifrado y TLS, pero faltan pruebas específicas.|Parcial|
|RNF02|Tiene meta de 3 segundos, pero falta carga esperada y usuarios concurrentes.|Parcial|
|RNF03|Disponibilidad 99.9% declarada, sin mecanismo de medición.|No cubierto|
|RNF04|Pruebas UX, responsividad y WCAG 2.1.|Cubierto|
|RNF05|TypeScript declarado, sin evidencia de código o análisis estático.|No cubierto|
|RNF06|Logs WORM declarados, pero falta diseño técnico de inmutabilidad.|Parcial|

## **7. Cálculo De La Métrica De Cobertura**
### **Cobertura funcional estricta**
RF cubiertos estrictamente = 5\
` `Total RF = 12

Cobertura funcional estricta =\
` `(5 / 12) × 100 = 41.7%

### **Cobertura no funcional estricta**
RNF cubiertos estrictamente = 1\
` `Total RNF = 6

Cobertura no funcional estricta =\
` `(1 / 6) × 100 = 16.7%

### **Cobertura total estricta**
Requisitos cubiertos estrictamente = 6\
` `Total requisitos = 18

Cobertura total estricta =\
` `(6 / 18) × 100 = 33.3%

### **Cobertura general incluyendo parciales**
Requisitos cubiertos + parcialmente cubiertos = 15\
` `Total requisitos = 18

Cobertura general =\
` `(15 / 18) × 100 = 83.3%

## **8. Resultado De La Medición De Cobertura**

|**Tipo de cobertura**|**Resultado**|
| :-: | :-: |
|Cobertura funcional estricta|41\.7%|
|Cobertura no funcional estricta|16\.7%|
|Cobertura total estricta|33\.3%|
|Cobertura general con requisitos parciales|83\.3%|

## **9. Análisis Del Resultado De Cobertura**
La cobertura general de SIDEM-PAN es de 83.3% si se consideran tanto los requisitos cubiertos como los parcialmente cubiertos. Esto indica que la mayoría de los requisitos aparecen relacionados con algún artefacto del documento, como casos de uso, criterios de aceptación, prototipos o pruebas.

Sin embargo, la cobertura total estricta es de 33.3%, ya que solamente 6 de los 18 requisitos cuentan con evidencia suficientemente clara para ser desarrollados y validados sin ambigüedad. Esto demuestra que el proyecto tiene una base documental amplia, pero varios requisitos todavía requieren refinamiento técnico.

Los requisitos funcionales con mejor cobertura estricta son RF01, RF02, RF03, RF06 y RF10. Estos requisitos tienen relación clara con casos de uso, criterios de aceptación, módulos o pruebas.

Los requisitos parcialmente cubiertos son RF04, RF05, RF07, RF08, RF09, RF12, RNF01, RNF02 y RNF06. Estos requisitos tienen evidencia documental, pero presentan ambigüedades, falta de pruebas específicas o mezcla de responsabilidades.

Los requisitos no cubiertos son RF11, RNF03 y RNF05. Estos deben priorizarse en las acciones de mejora porque no poseen evidencia suficiente para comprobar su cumplimiento.


## **12. Acciones De Mejora**

|**Acción correctiva**|**Requisito afectado**|**Prioridad**|
| :-: | :-: | :-: |
|Definir variables, pesos y umbrales del motor de scoring.|RF04|Alta|
|Agregar prueba específica para validar niveles Bajo, Medio y Alto.|RF04|Alta|
|Completar criterios de filtrado, priorización y gestión del dashboard.|RF05|Media|
|Agregar prueba para filtros por riesgo, estado y agente asignado.|RF05|Media|
|Separar el flujo de subsanación en solicitud y carga corregida.|RF07|Media|
|Agregar prueba para carga del documento corregido por el solicitante.|RF07|Media|
|Agregar criterios para notificación por aprobación y rechazo.|RF08|Media|
|Crear pruebas de correo para aprobación, rechazo y cambio de estado.|RF08|Media|
|Aclarar si las listas de seguridad aceptan CSV, XML o ambos.|RF09|Media|
|Agregar prueba para XML si el formato se mantiene en el requisito.|RF09|Media|
|Crear caso de uso “Asignar expediente a agente”.|RF11|Alta|
|Definir algoritmo de asignación equitativa.|RF11|Alta|
|Agregar criterio de aceptación para validar reparto equitativo.|RF11|Alta|
|Crear prueba alfa para validar asignación automática entre agentes.|RF11|Alta|
|Separar RF12 de RF04 para evitar duplicidad con el scoring.|RF12|Alta|
|Crear prueba independiente para consulta automática a INTERPOL.|RF12|Alta|
|Definir manejo de error si INTERPOL no responde.|RF12|Alta|
|Dividir RNF01 en control de acceso, 2FA, cifrado y TLS.|RNF01|Alta|
|Crear pruebas específicas para 2FA, AES-256 y TLS 1.3.|RNF01|Alta|
|Definir cantidad esperada de usuarios concurrentes.|RNF02|Media|
|Crear prueba de rendimiento con escenario de carga definido.|RNF02|Media|
|Definir mecanismo de medición para disponibilidad 99.9%.|RNF03|Media|
|Crear evidenc|||






## **Métrica De Volatilidad De Requisitos**
La volatilidad de requisitos mide el porcentaje de requisitos que necesitan modificación, división, refinamiento o redefinición para poder desarrollarse y validarse correctamente.

En SIDEM-PAN, la volatilidad se identifica comparando los requisitos funcionales y no funcionales contra los casos de uso, criterios de aceptación, pruebas alfa, pruebas beta, pruebas UX, prototipos y módulos definidos en el documento.

Debido a que no se cuenta con un historial formal de versiones, se toma como línea base el documento actual y se consideran volátiles aquellos requisitos que presentan ambigüedad, duplicidad, falta de criterio verificable o mezcla de responsabilidades.


## **11. Matriz De Evaluación De Volatilidad**

|**ID**|**Tipo de cambio requerido**|**Justificación**|
| :-: | :-: | :-: |
|RF04|Refinamiento / separación|Mezcla scoring de riesgo con consulta automática a INTERPOL.|
|RF07|División|Incluye solicitar subsanación y cargar documento corregido.|
|RF09|Corrección de alcance|Declara CSV/XML, pero la evidencia solo valida CSV.|
|RF11|Definición completa|No tiene caso de uso, algoritmo, criterio ni prueba asociada.|
|RF12|Separación / redefinición|Se solapa con RF04 y no queda claro cuándo se ejecuta INTERPOL.|
|RNF01|División / refinamiento|Incluye 2FA, cifrado, TLS y control de acceso en un solo requisito.|
|RNF02|Refinamiento|No define cantidad de usuarios concurrentes ni escenario de carga.|
|RNF03|Definición de medición|Declara 99.9% de disponibilidad, pero no define cómo comprobarlo.|
|RNF05|Definición de evidencia|Declara mantenibilidad con TypeScript, pero falta evidencia medible.|

## **12. Cálculo De La Métrica De Volatilidad**
Requisitos con volatilidad detectada = 9\
` `Total de requisitos = 18

Volatilidad =\
` `(9 / 18) × 100

Volatilidad = 50%

## **13. Resultado De La Medición De Volatilidad**
La volatilidad actual de requisitos es de 50%.

## **14. Análisis Del Resultado De Volatilidad**
El resultado indica que SIDEM-PAN presenta una volatilidad media-alta en su especificación de requisitos. Esto no significa que el proyecto esté mal planteado, sino que varios requisitos necesitan ajustes antes de pasar a una etapa de desarrollo completamente verificable.

Los principales puntos de volatilidad se concentran en RF04, RF11 y RF12, ya que afectan directamente el flujo de scoring, asignación de expedientes y consulta a servicios externos como INTERPOL.

También se identifican ajustes relevantes en RNF01, RNF03 y RNF05, debido a que estos requisitos no funcionales necesitan mayor precisión para poder medirse objetivamente.

Una volatilidad de 50% evidencia que el documento tiene una base funcional válida, pero requiere refinamiento para evitar ambigüedades, duplicidades y requisitos difíciles de probar.

## **15. Acciones De Mejora**

|**Acción correctiva**|**Requisito afectado**|**Prioridad**|
| :-: | :-: | :-: |
|Separar scoring de riesgo y consulta INTERPOL.|RF04 / RF12|Alta|
|Definir cuándo se ejecuta la consulta INTERPOL.|RF12|Alta|
|Crear caso de uso “Asignar expediente a agente”.|RF11|Alta|
|Definir algoritmo de asignación equitativa.|RF11|Alta|
|Agregar criterio de aceptación para reparto equitativo.|RF11|Alta|
|Crear prueba alfa para validar asignación automática.|RF11|Alta|
|Dividir subsanación en solicitud del agente y carga del solicitante.|RF07|Media|
|Corregir si las listas aceptan solo CSV o también XML.|RF09|Media|
|Dividir RNF01 en control de acceso, 2FA, cifrado y TLS.|RNF01|Alta|
|Definir usuarios concurrentes y escenario de rendimiento.|RNF02|Media|
|Definir mecanismo de medición para disponibilidad 99.9%.|RNF03|Media|
|Definir evidencia para mantenibilidad: TypeScript, linting y QA.|RNF05|Media|
|Diseñar mecanismo técnico para logs WORM.|RNF06|Alta|


## **Métrica De Trazabilidad De Requisitos**
La métrica de trazabilidad permite medir qué porcentaje de requisitos está correctamente vinculado con los artefactos del proyecto. Para SIDEM-PAN, cada requisito se revisa contra casos de uso, criterios de aceptación, pruebas alfa, pruebas beta, pruebas UX, prototipos, módulos funcionales y evidencias documentales.

Un requisito se considera con trazabilidad completa cuando puede seguirse desde su definición hasta su validación mediante artefactos claros. Se considera trazabilidad parcial cuando existe alguna evidencia, pero faltan vínculos importantes. Se considera sin trazabilidad cuando el requisito está declarado, pero no tiene caso de uso, criterio, prueba o evidencia suficiente asociada.

**Métricas Aplicables**

`  `Para realizar la medición se clasificó cada requisito en tres estados: completa, parcial o sin trazabilidad. 



**Módulos principales detectados**

- Evaluación migratoria. 
- Validación documental. 
- Consulta de estado. 
- Scoring de riesgo. 
- INTERPOL. 
- Dashboard de agentes. 
- Dictamen legal. 
- Subsanaciones. 
- Notificaciones. 
- Listas de control. 
- Auditoría. 
- Seguridad. 
- Rendimiento. 
- Disponibilidad. 
- Mantenibilidad. 

## **3. Requisitos Involucrados**
Se evalúan los 18 requisitos:

RF01 a RF12\
` `RNF01 a RNF06

## **4. Riesgos O Inconsistencias**
Los principales problemas de trazabilidad son:

RF04 y RF12 están relacionados con INTERPOL, pero no están separados claramente.

RF11 no tiene caso de uso, criterio de aceptación ni prueba asociada.

RF07 tiene trazabilidad parcial porque cubre la solicitud de subsanación, pero no la carga corregida del solicitante.

RF09 menciona CSV/XML, pero los artefactos solo evidencian CSV.

RNF01 contiene varios controles de seguridad en un solo requisito.

RNF03 no tiene mecanismo para comprobar disponibilidad 99.9%.

RNF05 no tiene evidencia verificable porque depende de código fuente o análisis estático.

RNF06 menciona logs WORM, pero falta explicar cómo se asegura la inmutabilidad.

|**ID**|**Artefactos vinculados**|**Estado**|
| :-: | :-: | :-: |
|RF01|Caso de uso 1, formulario, criterios de envío y módulo Evaluación.|Completa|
|RF02|Validaciones, criterios de aceptación, ALF-01 y ALF-02.|Completa|
|RF03|Caso de uso 2, portal de consulta y criterios de estado.|Completa|
|RF04|Caso de uso 3, ALF-03 y prototipo del agente, pero se solapa con RF12.|Parcial|
|RF05|Dashboard y criterios de priorización, pero faltan pruebas específicas.|Parcial|
|RF06|Caso de uso 3, criterios de dictamen, agente, timestamp y justificación.|Completa|
|RF07|Caso de uso 4 y ALF-05, pero falta carga corregida del solicitante.|Parcial|
|RF08|Evidencia de correo por subsanación, pero faltan otros estados.|Parcial|
|RF09|Caso de uso 5, ALF-04 y BET-05, pero solo se valida CSV.|Parcial|
|RF10|Caso de uso 7, criterios de logs y ALF-06.|Completa|
|RF11|Requisito declarado, sin caso de uso, criterio ni prueba.|Sin trazabilidad|
|RF12|Criterio dentro del caso de uso 3, pero se solapa con RF04.|Parcial|
|RNF01|Seguridad declarada, pero faltan vínculos específicos para 2FA, AES-256 y TLS.|Parcial|
|RNF02|Rendimiento declarado, con BET-02, BET-03 y BET-05, pero sin carga definida.|Parcial|
|RNF03|Disponibilidad 99.9% declarada, sin mecanismo de validación.|Sin trazabilidad|
|RNF04|Pruebas UX, responsividad y WCAG 2.1.|Completa|
|RNF05|Mantenibilidad declarada, sin evidencia de código o análisis estático.|Sin trazabilidad|
|RNF06|Caso de uso 7 y ALF-06, pero falta diseño técnico WORM.|Parcial|

## **Recolección** 
La recolección de datos se realizó revisando cada requisito RF/RNF contra los artefactos disponibles del proyecto. Para cada requisito se verificó si existía caso de uso asociado, criterio

`  `de aceptación, prueba alfa, prueba beta, prueba UX, prototipo, módulo funcional y evidencia documental.



`  `La revisión se hizo de forma manual mediante una matriz de evaluación, marcando cada requisito como completo, parcial o sin trazabilidad. Se consideró completo cuando el requisito tenía

`  `evidencia suficiente desde su definición hasta su validación. Se consideró parcial cuando existían artefactos relacionados, pero faltaba algún vínculo importante. Se consideró sin

`  `trazabilidad cuando el requisito no tenía evidencia suficiente para comprobar su cumplimiento.

##
## **19. Cálculo De La Métrica De Trazabilidad**
Requisitos con trazabilidad completa = 6\
` `Total de requisitos = 18

Trazabilidad completa =\
` `(6 / 18) × 100

Trazabilidad completa = 33.3%

### **Trazabilidad general incluyendo parciales**
Requisitos con trazabilidad completa + parcial = 15\
` `Total de requisitos = 18

Trazabilidad general =\
` `(15 / 18) × 100

Trazabilidad general = 83.3%

## **20. Resultado De La Medición De Trazabilidad**

|**Tipo de trazabilidad**|**Resultado**|
| :-: | :-: |
|Trazabilidad completa|33\.3%|
|Trazabilidad general con requisitos parciales|83\.3%|
|Requisitos sin trazabilidad suficiente|16\.7%|

## **21. Análisis Del Resultado De Trazabilidad**
La trazabilidad general de SIDEM-PAN es de 83.3%, ya que 15 de los 18 requisitos tienen al menos una relación con casos de uso, criterios de aceptación, pruebas, prototipos o módulos funcionales.

Sin embargo, la trazabilidad completa es de 33.3%, debido a que solo 6 requisitos poseen una relación suficientemente clara entre requisito, evidencia y validación. Esto demuestra que el documento tiene una base trazable aceptable, pero todavía necesita fortalecer la conexión formal entre requisitos, pruebas y artefactos técnicos.

Los requisitos con mejor trazabilidad son RF01, RF02, RF03, RF06, RF10 y RNF04. Estos requisitos pueden seguirse desde su definición hasta algún artefacto de validación o diseño.

Los requisitos con trazabilidad parcial son RF04, RF05, RF07, RF08, RF09, RF12, RNF01, RNF02 y RNF06. Estos tienen evidencia relacionada, pero presentan vacíos, duplicidades o falta de pruebas específicas.

Los requisitos sin trazabilidad suficiente son RF11, RNF03 y RNF05. Estos deben priorizarse porque no cuentan con evidencia clara que permita verificar su cumplimiento.

## **22. Acciones De Mejora Para La Trazabilidad**

|**Acción correctiva**|**Requisito afectado**|**Prioridad**|
| :-: | :-: | :-: |
|Crear una matriz formal RF/RNF - caso de uso - criterio - prueba.|Todos|Alta|
|Asignar un identificador único a cada criterio de aceptación.|Todos|Alta|
|Vincular cada requisito con una tarea o historia en Jira.|Todos|Alta|
|Separar RF04 y RF12 en artefactos trazables independientes.|RF04 / RF12|Alta|
|Crear prueba específica para consulta automática a INTERPOL.|RF12|Alta|
|Crear caso de uso “Asignar expediente a agente”.|RF11|Alta|
|Agregar criterio y prueba para reparto equitativo.|RF11|Alta|
|Agregar prueba específica para filtros del dashboard.|RF05|Media|
|Agregar trazabilidad para carga corregida de documentos.|RF07|Media|
|Agregar pruebas de notificación para aprobación y rechazo.|RF08|Media|
|Aclarar si RF09 acepta CSV, XML o ambos formatos.|RF09|Media|
|Dividir RNF01 en requisitos trazables separados.|RNF01|Alta|
|Vincular RNF02 con pruebas de carga y concurrencia.|RNF02|Media|
|Definir evidencia de monitoreo para disponibilidad 99.9%.|RNF03|Media|
|Definir evidencia de mantenibilidad con TypeScript y linting.|RNF05|Media|
|Vincular RNF06 con diseño técnico de logs WORM.|RNF06|Alta|

















\*\*\*por borrar

## **Métrica de Complejidad Ciclomática**
La métrica de complejidad <a name="_int_wzrfn5df"></a>ciclomática busca evaluar la estabilidad, mantenibilidad y el riesgo técnico intrínseco del código fuente del software. Teniendo como propósito identificar que funciones, métodos o módulos del sistema poseen una lógica interna demasiado compleja, ramificada o densa.

En el caso del sistema SIDEM-PAN, identificamos los metodos que posean lógica condicional compleja que podrían dificultar no solo su mantenimiento, sino que también sus pruebas, priorizando la refactorización antes del desarrollo.

## **Métrica**
La métrica para medir este es 

**M= Decisiones Lógicas + 1**

O sea que cada vez que el código pueda tomar un camino diferente, se toma como una decisión y el “+1” sería el camino sin condiciones cumplidas.

Visto de otra forma M son la cantidad de casos de prueba necesarios para cubrir todos los caminos posibles de la función y aquellas donde M > 10 sería problemático y objetivo para refactorización, al necesitar 10 casos de prueba para una sola función.

## **Recolección**
Dado la fase del proyecto, la métrica se aplicará sobre los casos de uso, adaptando los flujos alternativos, haciendo uso de los flujos como decisiones lógicas, cuando exista código se realizará el cálculo con el respectivo programa.

|Caso de Uso|Flujo Principal|Flujos Alternativos|Métrica|Nivel|
| :-: | :-: | :-: | :-: | :-: |
|UC1 - Registrar Evaluación|Envío exitoso|Pasaporte < 6 meses / Archivo no es PDF / Archivo > 5MB|**4**|` `Bajo|
|UC2 - Consultar Estado|Consulta exitosa|3 intentos fallidos bloqueados / Ticket no existe|**3**|` `Bajo|
|UC3 - Auditar y Dictaminar|Aprobar expediente|Rechazar / Solicitar subsanación / PDF dañado (error)|**4**|` `Bajo|
|UC4 - Solicitar Subsanación|Subsanación enviada|Texto en blanco (< 20 caracteres) / Expediente ya cerrado|**3**|Bajo|
|UC5 - Actualizar Listas de Control|Carga exitosa CSV|Formato incorrecto (no .csv) / Fallo durante carga (rollback)|**3**|Bajo|
|UC6 - Gestionar Cuentas de Agentes|Crear agente|Modificar / Desactivar (soft delete) / Contraseña no cumple política|**4**|Bajo|
|UC7 - Auditar Trazabilidad|Consulta de logs|Filtro sin resultados / Exportar a PDF|**3**|Bajo|

Análisis 

En base a los casos de uso evaluados se verifico que en base a los casos de uso todos están en un rango aceptable, donde los de mayor complejidad son aquellos con 4 de métrica, siendo el UC1, UC3 Y UC6.

Al momento de programar el caso de uso 3 podría ver su métrica elevada por la logica que vendria con la implementación de scoring de riesgo, consulta a al INTERPOL y los posibles dictámenes.

El cálculo para verificar el porcentaje de casos de uso complejo es

Cantidad de casos de uso cuya métrica supere 10/ Cantidad de casos de Uso x 100

Dándonos como resultado el porcentaje respectivo, que en este caso es 0%.

Acciones de mejora

En base a los casos de uso, todo se encuentra correcto, pero se debe tener cuidado al momento de pasar a código porque tanto como el UC1 y UC3 podrían llegar a necesitar una separación para que ninguna supere esa métrica de 10.

También en realizar las métricas con un software externo y no a mano, ya que hacerlo de función en función de forma manual, tomaría mucho tiempo, siendo más sencillo y eficiente hacerlo de la otra manera.



























**Métricas en Diseño: Acoplamiento y cohesión.** 

Objetivo: 

Evaluar si el diagrama de clases definido en el Parcial 1 refleja un diseño mantenible y escalable, identificando clases que asumen demasiadas responsabilidades (baja cohesión) o que dependen de demasiadas otras clases (alto acoplamiento). El propósito es detectar estos problemas antes de que se escriba código de producción, orientando las decisiones de diseño bajo el modelo de mejora continua TQM.

Métrica: 

Se aplican dos métricas complementarias sobre el diagrama de clases:

- Acoplamiento CBO (Coupling Between Objects): cuenta cuántas clases externas distintas tiene cada clase como dependencia directa, ya sea porque retorna un objeto de otra clase, recibe uno como parámetro, o tiene una relación de composición o asociación.

CBO por clase = Número de clases externas con dependencia directa Umbral aceptable: CBO ≤ 4 por clase  |  Riesgo: CBO ≥ 5 CBO promedio del sistema = Suma de todos los CBO / Total de clases

- Cohesión LCOM (Lack of Cohesion of Methods), evaluación cualitativa: determina si los métodos de una clase operan principalmente sobre los atributos de esa misma clase. Una clase con alta cohesión hace una sola cosa bien; una con cohesión media mezcla responsabilidades de distintos niveles de abstracción.

Alta cohesión:  todos o casi todos los métodos usan atributos propios de la clase Cohesión media: algunos métodos operan principalmente sobre objetos de otras clases Baja cohesión:  la mayoría de los métodos no usan los atributos de la clase



Recolección:

La recolección se realizó mediante análisis directo del diagrama de clases del Parcial 1 (sección 9), examinando clase por clase los tipos de retorno de los métodos, los parámetros recibidos y las relaciones de asociación y composición. Se construyeron tres artefactos de medición:

**Matriz de dependencias entre clases (CBO)**

Cada celda marcada con ● indica una dependencia directa. Las celdas — corresponden a la diagonal. Abreviaciones: US = UsuarioSolicitante, EM = EvaluacionMigratoria, AM = AgenteMigratorio, AD = Administrador, DA = DocumentoAdjunto, LA = LogAuditoria.

||**US**|**EM**|**AM**|**AD**|**DA**|**LA**|
| :-: | :-: | :-: | :-: | :-: | :-: | :-: |
|**UsuarioSolicitante (US)**|—|**●**|·|·|·|·|
|**EvaluacionMigratoria (EM)**|**●**|—|**●**|·|**●**|·|
|**AgenteMigratorio (AM)**|·|**●**|—|·|·|·|
|**Administrador (AD)**|·|·|**●**|—|·|**●**|
|**DocumentoAdjunto (DA)**|·|**●**|·|·|—|·|
|**LogAuditoria (LA)**|·|·|·|**●**|·|—|


**Tabla de CBO y gaps de diseño por clase**

Para cada clase se registra el CBO calculado, su nivel de acoplamiento o cohesión, y el gap específico encontrado al cruzar el diagrama de clases con los requisitos funcionales y criterios de aceptación del Parcial 1.

|**Clase**|**CBO**|**Nivel**|**Gap identificado**|
| :- | :- | :- | :- |
|**UsuarioSolicitante**|1|Bajo ✓|Sin gaps. Clase correctamente enfocada. Solo genera EvaluacionMigratoria.|
|**EvaluacionMigratoria**|3|Moderado ⚠|Gap: calcularNivelDeRiesgo() no tiene clase de soporte. No existe MotorDeRiesgo ni ListaControl. RF04 queda sin representación de diseño.|
|**AgenteMigratorio**|1|Cohesión media ⚠|Gap: registrarDictamen() y solicitarSubsanacion() actúan sobre EvaluacionMigratoria, no sobre atributos propios del agente. Viola el Principio de Responsabilidad Única (SRP).|
|**Administrador**|2|Cohesión media ⚠|Gap: gestionarCuentasAgentes() recibe un objeto AgenteMigratorio completo, creando acoplamiento de contenido innecesario.|
|**DocumentoAdjunto**|1|Alto ✓|Sin gaps. Clase bien acotada. Solo representa un documento y verifica su integridad.|
|**LogAuditoria**|1|Alto ✓|Gap menor: no tiene métodos. El criterio UC7-2 exige exportar logs a PDF, pero no hay método ni clase de servicio que lo soporte en el modelo actual.|

**Tabla de cohesión por clase** 

Se evaluó si los métodos de cada clase operan sobre sus propios atributos o si trabajan principalmente sobre objetos externos, lo que indica mezcla de responsabilidades.

|**Clase**|**Atributos / Métodos**|**¿Los métodos usan atributos propios?**|**Cohesión**|
| :- | :- | :- | :- |
|**UsuarioSolicitante**|7 atr. / 2 mét.|someterEvaluacion() usa datos de identidad propios. consultarEstado() opera sobre el ticket del solicitante.|Alta ✓|
|**EvaluacionMigratoria**|4 atr. / 2 mét.|validarVigenciaPasaporte() y calcularNivelDeRiesgo() operan sobre los atributos propios de la evaluación.|Alta ✓|
|**AgenteMigratorio**|3 atr. / 3 mét.|registrarDictamen() y solicitarSubsanacion() operan sobre EvaluacionMigratoria externa, no sobre los atributos del agente (id, nombre, nivelAcceso).|Media ⚠|
|**Administrador**|2 atr. / 3 mét.|gestionarCuentasAgentes() recibe un AgenteMigratorio externo; consultarLogsAuditoria() devuelve objetos de otra clase. Solo 1 de 3 métodos opera sobre atributos propios.|Media ⚠|
|**DocumentoAdjunto**|3 atr. / 1 mét.|verificarIntegridadPDF() opera directamente sobre tipoDocumento y tamanoBytes. Cohesión perfecta.|Alta ✓|
|**LogAuditoria**|5 atr. / 0 mét.|Entidad de datos pura. Todos sus atributos están relacionados con el registro de auditoría.|Alta ✓|

Resultados consolidados: CBO promedio del sistema = 9 dependencias totales / 6 clases = 1.5 (bien por debajo del umbral de riesgo de 5). Clases con cohesión alta: 4 de 6. Clases con cohesión media: 2 de 6 (AgenteMigratorio y Administrador). Clases con gap estructural: 2 de 6 (EvaluacionMigratoria y LogAuditoria).

***Análisis:***

|**Fortaleza del diseño:** El acoplamiento general del sistema es bajo (CBO promedio = 1.5). Las clases periféricas —UsuarioSolicitante, DocumentoAdjunto y LogAuditoria— están bien diseñadas y aisladas. Un cambio en cualquiera de ellas tiene impacto mínimo sobre el resto del sistema.|
| :-: |
|**Gap crítico — RF04 sin clase de soporte en el diagrama:** El método calcularNivelDeRiesgo() está declarado en EvaluacionMigratoria, pero el diagrama no incluye ninguna clase que represente las listas de control, las reglas de scoring ni la integración con INTERPOL. El requisito más sensible del sistema no tiene respaldo estructural en el diseño. Este método no puede implementarse correctamente sin que exista una clase MotorDeRiesgo en el modelo.|
|**Gap de cohesión — AgenteMigratorio viola el Principio de Responsabilidad Única:** La clase combina la representación del agente como persona (id, nombre, nivel de acceso) con lógica de proceso de negocio (dictaminar expedientes, solicitar subsanaciones). Los métodos registrarDictamen() y solicitarSubsanacion() no operan sobre los atributos del agente sino sobre objetos EvaluacionMigratoria externos. Si la lógica de dictamen cambia, habrá que modificar la clase del agente cuando no debería ser así.|
|**Gap entre criterios de aceptación y diagrama — LogAuditoria:** El criterio UC7-2 establece que el sistema debe exportar los logs a un PDF no editable. Sin embargo, LogAuditoria no tiene ningún método de exportación y tampoco existe una clase de servicio en el modelo que asuma esa responsabilidad. Hay un gap directo entre lo que los criterios de aceptación exigen y lo que el diseño actual puede soportar.|

***Acción de Mejora:***  

1. Agregar la clase MotorDeRiesgo al diagrama de clases con atributos listasActivas y reglasDeEvaluacion, y métodos evaluarSolicitud(evaluacion: EvaluacionMigratoria) y consultarInterpol(numeroPasaporte: Cadena). Esto cierra el gap de RF04 y RF12 haciendo el diagrama coherente con los requisitos.



1. Separar AgenteMigratorio en dos responsabilidades: mantener la clase como entidad de identidad del agente y crear una clase de servicio DictamenService con los métodos registrarDictamen() y solicitarSubsanacion(). Esto mejora la cohesión y hace la lógica de dictamen independiente del actor.



1. Ajustar el parámetro de gestionarCuentasAgentes() en Administrador: en lugar de recibir un objeto AgenteMigratorio completo, debería recibir solo el identificador del agente (idAgente: UUID). Esto reduce el acoplamiento de contenido y aplica el principio de mínimo conocimiento (Law of Demeter).



1. Crear la clase LogAuditoriaRepository con el método exportarPDF(filtros: Cadena): Cadena, para cubrir el criterio de aceptación UC7-2 que actualmente no tiene representación en el diagrama de clases.



1. Actualizar el diagrama de clases en el Parcial 2 incorporando las nuevas clases (MotorDeRiesgo, DictamenService, LogAuditoriaRepository) y verificar que cada criterio de aceptación tenga al menos un método en alguna clase que lo soporte.



1. Monitorear el CBO durante el desarrollo utilizando SonarQube en el repositorio de GitHub, con una regla de calidad que bloquee merges cuando alguna clase supere CBO = 4.





