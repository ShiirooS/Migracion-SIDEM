SIDEM-PAN — Plan de Desarrollo MVP  |  Ingeniería de Software Aplicada IV  |  Grupo 1GS241



**UNIVERSIDAD TECNOLÓGICA DE PANAMÁ**

Facultad de Ingeniería de Sistemas Computacionales


**SIDEM-PAN**

**Sistema de Debida Diligencia Migratoria**

**PLAN DE DESARROLLO MVP — DEMO PARCIAL 2**

Basado en Decreto Ley 3 de 22 de febrero de 2008



Ingeniería de Software Aplicada IV  •  Grupo: 1GS241

Facilitadora: María Mosquera

Mayo 2026


# **1. Resumen Ejecutivo — ¿Qué es SIDEM-PAN y por qué importa la ley?**

SIDEM-PAN digitaliza el proceso de debida diligencia migratoria del Servicio Nacional de Migración de Panamá. Su razón de ser NO es solo un trámite web: es la automatización de obligaciones legales específicas establecidas en el Decreto Ley 3 del 22 de febrero de 2008 (Gaceta Oficial 25986).

|<p>**⚖  Decreto Ley 3/2008 — Lo que el sistema DEBE cumplir para ser válido**</p><p>Art. 6 Num. 2: El Servicio Nacional de Migración lleva el registro nacional de extranjería → el sistema DEBE guardar cada solicitud con trazabilidad completa. Art. 6 Num. 4: El SNM autoriza, niega o prohíbe la entrada → el sistema DEBE registrar cada dictamen con su fundamento legal. Art. 15: Establece requisitos por categoría migratoria → el sistema DEBE capturar la categoría solicitada. Art. 43 Num. 2: Pasaporte o documento de viaje vigente es requisito obligatorio → el sistema DEBE validar vigencia ≥ 6 meses. Art. 50 Num. 1: Se puede negar por no acreditar solvencia económica → el sistema DEBE capturar y evaluar el monto de subsistencia. Art. 50 Num. 4 y 5: Se puede negar por antecedentes penales o riesgo de seguridad → el sistema DEBE cruzar datos con listas de control y mostrar resultado al agente.</p>|
| :- |

El MVP que se desarrolla para la demo NO es un sistema simplificado arbitrariamente. Es el subconjunto mínimo que cumple con los artículos anteriores de forma demostrable y trazable.

## **1.1 Estado actual del proyecto**

|**Métrica**|**Resultado Parcial 2**|**Implicación para desarrollo**|
| :- | :- | :- |
|Cobertura funcional estricta|41\.7% (5/12 RF cubiertos)|7 RF necesitan artefactos adicionales antes de codificar|
|Trazabilidad completa|33\.3% (6/18 requisitos)|12 requisitos no tienen cadena RF→CU→criterio→prueba|
|Volatilidad de requisitos|50% (9/18 req. inestables)|RF04, RF11, RF12 son los más críticos de resolver|
|Complejidad ciclomática|Promedio 3.4 — todos bajo 10|Arquitectura manejable, UC3 crece con scoring e INTERPOL|
|Acoplamiento CBO promedio|1\.5 — bajo y saludable|El diseño escala bien; agregar MotorDeRiesgo no rompe nada|


# **2. MVP Core — Lo que se desarrolla para la demo**

|<p>**⚠  Criterio de selección del MVP**</p><p>Solo entran los requisitos que: (1) tienen respaldo directo en el Decreto Ley 3/2008, (2) forman parte del flujo principal sin el cual el sistema no puede demostrarse, y (3) son implementables en 4–8 horas de trabajo con 3–4 personas partiendo de cero en código.</p>|
| :- |

## **2.1 Requisitos que SÍ entran al MVP — Obligatorios**

|**ID**|**Nombre**|**Por qué es core**|**Artículo del Decreto Ley**|
| :- | :- | :- | :- |
|RF01|Registro de evaluación migratoria|Sin registro no hay trámite. Es la puerta de entrada de todo el sistema.|Art. 6 Num.2, Art.15, Art.43 Num.2|
|RF02|Validación automática (pasaporte + PDF)|La ley exige pasaporte vigente. La validación automatiza una obligación legal, no una preferencia.|Art. 43 Num. 2|
|RF04|Motor de scoring de riesgo|El agente necesita información de riesgo para tomar una decisión fundamentada. Es el núcleo del 'análisis de debida diligencia'.|Art. 50 Num. 4 y 5|
|RF05|Dashboard del agente|Sin dashboard el agente no puede gestionar ni ver los expedientes asignados.|Art. 6 Num. 4|
|RF06|Dictamen legislativo (Aprobar/Rechazar)|La ley exige que la decisión de admisión o rechazo quede registrada con fundamento legal. Sin esto el sistema no tiene valor legal.|Art. 6 Num. 4, Art. 50|
|RF10|Trazabilidad y auditoría (log inmutable)|Art. 6 Num. 2 exige registro de extranjería. Cada acción del agente sobre un expediente debe quedar registrada de forma irreversible.|Art. 6 Num. 2|
|RF03|Consulta de estado del trámite|El solicitante tiene derecho a saber el estado de su proceso. Cierra el flujo end-to-end para la demo.|Art. 6 Num. 2 (registro público)|

## **2.2 Requisitos que NO entran al MVP — Justificación honesta**

|**ID**|**Nombre**|**Por qué queda fuera**|**¿Es para siempre?**|
| :- | :- | :- | :- |
|RF07|Subsanación de documentos|Flujo alternativo. El flujo principal (registro→scoring→dictamen) debe funcionar primero. Agrega 2 pantallas extra y lógica de estado adicional.|No. Sprint 2.|
|RF08|Notificaciones por correo|DEF-003 ya documenta que el correo puede caer en SPAM. Complejidad de DKIM/SPF supera el valor para demo. El log de auditoría demuestra las notificaciones.|No. Sprint 2.|
|RF09|Carga de listas CSV|RF04 funciona con listas hardcodeadas en la demo. Cargar CSV agrega una pantalla de admin que no es parte del flujo principal.|No. Sprint 2. Las listas se hardcodean en BD al iniciar.|
|RF11|Asignación automática de expedientes|Sin caso de uso ni algoritmo definido hasta ahora. El admin asigna manualmente en la demo.|No. Sprint 2 con least-load definido.|
|RF12|Búsqueda INTERPOL al abrir expediente|Depende de RF09 (listas cargadas). Si RF09 no entra, RF12 se integra como parte del scoring RF04 usando lista hardcodeada.|Parcialmente. La lógica entra en RF04 para la demo.|
|RNF01a|2FA (TOTP)|Autenticación básica (email+contraseña) es suficiente para demo. 2FA agrega pantalla extra y librería TOTP sin valor demostrativo adicional.|No. Sprint 2.|
|RNF01b|Cifrado AES-256 columnas|No hay columnas cifradas en demo. HTTPS cubre la transmisión.|No. Producción real.|
|RNF03|SLA 99.9%|Imposible de garantizar ni medir en entorno universitario.|Meta de producción futura.|

|<p>**✓  Los RNF que SÍ entran al MVP sin esfuerzo extra**</p><p>RNF01c (HTTPS): certificado Let's Encrypt gratuito, 1 línea de config en el deploy. RNF01d (Control de roles): el RBAC básico Solicitante/Agente/Admin sale con el sistema de login. RNF04 (Responsividad + WCAG): Tailwind CSS ya lo maneja por defecto. RNF05 (TypeScript strict): tsconfig.json con strict:true desde el inicio, cero esfuerzo extra. RNF06 (Logs WORM): un trigger SQL de 5 líneas en la tabla audit\_log hace append-only.</p>|
| :- |


# **3. Especificación Detallada — Sin ambigüedades para desarrollo**

Cada requisito del MVP se especifica con: qué hace exactamente, qué campos/datos maneja, qué valida, qué guarda en BD, qué devuelve al frontend, y el artículo del Decreto Ley que lo sustenta.

## **RF01 — Registro de Evaluación Migratoria**

|<p>**⚖  Sustento legal**</p><p>Art. 6 Num. 2: El SNM lleva el registro nacional de extranjería → cada solicitud es un registro oficial. Art. 15: La categoría migratoria determina los requisitos aplicables. Art. 43 Num. 2: El pasaporte vigente es requisito obligatorio de ingreso.</p>|
| :- |

**¿Qué hace exactamente?**

El solicitante (extranjero) llena un formulario en 3 pasos. Al finalizar, el sistema crea un expediente con número de ticket único y ejecuta automáticamente el motor de scoring (RF04).

**Campos del formulario — Paso 1: Identidad**

|**Campo**|**Tipo**|**Validación**|**Obligatorio**|**Justificación legal**|
| :- | :- | :- | :- | :- |
|Nombres|Texto|Solo letras y espacios, 3–150 caracteres, regex /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,150}$/|Sí|Art. 6 Num. 2: registro de extranjería|
|Apellidos|Texto|Misma regex anterior|Sí|Art. 6 Num. 2|
|Fecha de nacimiento|Fecha|Formato DD/MM/AAAA, debe tener ≥ 18 años|Sí|Identificación del solicitante|
|Nacionalidad|Select|Lista ISO 3166-1 (países). El valor se usa en RF04.|Sí|Art. 6 Num. 4: control de entrada por origen|
|Número de pasaporte|Texto|Alfanumérico, sin espacios, 6–20 caracteres|Sí|Art. 43 Num. 2: documento de viaje exigido por ley|
|Fecha de vencimiento pasaporte|Fecha|Debe ser > hoy + 180 días. Si no cumple: bloquear envío con mensaje 'El pasaporte debe tener vigencia mínima de 6 meses (Art. 43, DL3/2008)'|Sí|Art. 43: vigencia del documento de viaje|
|Categoría migratoria solicitada|Select|Opciones: Turismo, Residencia temporal, Residencia permanente, Trabajo, Estudio|Sí|Art. 15: categorías migratorias con requisitos propios|

**Campos del formulario — Paso 2: Solvencia económica**

|**Campo**|**Tipo**|**Validación**|**Obligatorio**|**Justificación legal**|
| :- | :- | :- | :- | :- |
|Monto de subsistencia declarado (USD)|Número decimal|Mayor a 0, formato ##,###.##|Sí|Art. 50 Num. 1: permite negar ingreso si no acredita solvencia|
|Comprobante de solvencia|PDF|Formato .pdf, tamaño ≤ 5MB. Si el archivo no es PDF: error 'Solo se aceptan archivos PDF'. Si supera 5MB: error 'El archivo no debe superar 5MB'|Sí|Art. 50 Num. 1|

**Campos del formulario — Paso 3: Antecedentes**

|**Campo**|**Tipo**|**Validación**|**Obligatorio**|**Justificación legal**|
| :- | :- | :- | :- | :- |
|Certificado de antecedentes penales|PDF|Formato .pdf, tamaño ≤ 5MB|Sí|Art. 50 Num. 4: negar ingreso por antecedentes penales|

**¿Qué guarda el sistema en la base de datos al enviar?**

|**Campo BD**|**Tipo BD**|**Descripción**|
| :- | :- | :- |
|id|UUID PRIMARY KEY|Identificador único del expediente|
|ticket\_number|VARCHAR(20) UNIQUE NOT NULL|Generado automáticamente: PAN-AAAA-NNNNN (ej: PAN-2026-00042)|
|nombres|VARCHAR(150) NOT NULL|Del formulario|
|apellidos|VARCHAR(150) NOT NULL|Del formulario|
|fecha\_nacimiento|DATE NOT NULL|Del formulario|
|nacionalidad\_codigo|CHAR(2) NOT NULL|Código ISO 3166-1 (ej: VE, CO, CU)|
|numero\_pasaporte|VARCHAR(20) NOT NULL|Del formulario|
|vencimiento\_pasaporte|DATE NOT NULL|Del formulario, validado > hoy+180d|
|categoria\_migratoria|VARCHAR(50) NOT NULL|Valor del select|
|monto\_subsistencia|DECIMAL(10,2) NOT NULL|Del formulario|
|ruta\_comprobante\_solvencia|VARCHAR(500)|Ruta del archivo PDF guardado en disco|
|ruta\_antecedentes\_penales|VARCHAR(500)|Ruta del archivo PDF guardado en disco|
|estado|VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE'|Estados válidos: PENDIENTE, EN\_EVALUACION, APROBADO, RECHAZADO, SUBSANACION\_PENDIENTE|
|nivel\_riesgo|VARCHAR(10)|BAJO, MEDIO o ALTO — calculado por RF04 al crear|
|score\_riesgo|INTEGER|Valor 0–100 calculado por RF04|
|agente\_asignado\_id|UUID REFERENCES agentes(id)|NULL hasta que admin asigne|
|created\_at|TIMESTAMPTZ NOT NULL DEFAULT NOW()|Fecha/hora de creación en UTC|
|updated\_at|TIMESTAMPTZ NOT NULL DEFAULT NOW()|Se actualiza con cada cambio de estado|

**¿Qué devuelve el sistema al solicitante?**

Pantalla de confirmación con: número de ticket (ej. #PAN-2026-00042), categoría solicitada, estado inicial 'PENDIENTE', y la instrucción de usar ese ticket para consultar el estado (RF03).

## **RF02 — Validación Automática de Negocio**

|<p>**⚖  Sustento legal**</p><p>Art. 43 Num. 2: El pasaporte es el documento de viaje exigido por ley para ingresar al territorio nacional. La validación de vigencia ≥ 6 meses automatiza esta exigencia legal.</p>|
| :- |

**¿Qué valida exactamente y cuándo?**

Las validaciones se ejecutan en DOS momentos: (1) en tiempo real en el frontend mientras el usuario llena el formulario, y (2) en el backend al recibir el POST /api/applications (validación de seguridad, no confiar solo en el frontend).

|**Validación**|**¿Cuándo?**|**Comportamiento si falla**|**Mensaje al usuario**|
| :- | :- | :- | :- |
|Pasaporte vigencia ≥ 6 meses|Frontend (onChange) + Backend|Botón 'Siguiente' deshabilitado en frontend. Backend devuelve 400 Bad Request.|'El pasaporte debe tener vigencia mínima de 6 meses (Art. 43, Decreto Ley 3/2008)'|
|Archivo PDF — tipo MIME|Frontend (onChange) + Backend|El archivo no se acepta. Error bajo el campo.|'Solo se aceptan archivos en formato PDF'|
|Archivo PDF — tamaño ≤ 5MB|Frontend (onChange) + Backend|El archivo no se acepta. Error bajo el campo.|'El archivo no debe superar 5MB'|
|Campos obligatorios vacíos|Frontend (onBlur + onSubmit)|Borde rojo + mensaje bajo el campo.|'Este campo es obligatorio'|
|Número de pasaporte — formato|Frontend (onChange)|Borde rojo + mensaje.|'Solo letras y números, sin espacios'|
|Monto subsistencia > 0|Frontend + Backend|Error bajo el campo.|'Debe declarar un monto de subsistencia válido (Art. 50, DL3/2008)'|
|Edad ≥ 18 años|Frontend + Backend|Error bajo campo fecha nacimiento.|'El solicitante debe ser mayor de edad'|

**Importante para el backend:**

El endpoint POST /api/applications SIEMPRE revalida todo aunque el frontend ya lo haya validado. Si alguna validación falla en el backend, devuelve HTTP 400 con un JSON de errores estructurado: { field: 'vencimiento\_pasaporte', message: '...' }.

## **RF04 — Motor de Scoring de Riesgo**

|<p>**⚖  Sustento legal**</p><p>Art. 50 Num. 4: Se puede negar el ingreso a quien tenga antecedentes penales en su país de origen. Art. 50 Num. 5: Se puede negar el ingreso a quien constituya un riesgo o amenaza a la seguridad nacional. Art. 6 Num. 4: El SNM tiene potestad de autorizar, negar o prohibir la entrada según políticas migratorias. El scoring automatiza el primer filtro de este análisis legal. NO reemplaza la decisión del agente (que sigue siendo humana y obligatoria), pero la informa con datos objetivos.</p>|
| :- |

|<p>**⚠  Decisión de diseño crítica — RF04 vs RF12**</p><p>RF04 y RF12 se solapaban en la documentación original. Decisión adoptada: RF04 calcula el scoring al CREAR el expediente usando listas internas + INTERPOL. RF12 es la visualización de ese resultado cuando el agente abre el expediente. Son el mismo dato, dos momentos de presentación.</p>|
| :- |

**¿Cuándo se ejecuta el scoring?**

Inmediatamente después de que el backend valida y guarda el expediente (RF01). Se ejecuta de forma síncrona antes de devolver la respuesta al frontend. El resultado (nivel\_riesgo + score\_riesgo) se guarda en el mismo registro del expediente.

### **Justificación legal de las ponderaciones — por qué cada factor tiene ese peso**

Las ponderaciones están ordenadas por la gravedad legal que establece el Art. 50 del Decreto Ley 3/2008 y por lo que cada lista representa técnica y legalmente:

|**Factor**|**Peso**|**Por qué este peso exacto**|**Artículo aplicable**|**Fuente de datos**|
| :- | :- | :- | :- | :- |
|Coincidencia en INTERPOL Red Notice|50 puntos|Una Red Notice es una solicitud formal de arresto y extradición emitida por un país miembro de INTERPOL. Es la causal MÁS DIRECTA del Art. 50 Num. 4 ('antecedentes penales en cualquier país'). Una persona con Red Notice activa tiene cargos penales formales reconocidos internacionalmente. Peso mayor que OFAC porque INTERPOL = proceso penal real, mientras OFAC puede incluir sanciones económicas sin proceso penal.|Art. 50 Num. 4: 'Tener antecedentes penales en su país de origen o en cualquier otro país'|**OpenSanctions** INTERPOL Red Notices (gratuito, uso no comercial): https://data.opensanctions.org/datasets/20260522/interpol\_red\_notices/targets.nested.json|
|Coincidencia en lista OFAC SDN|40 puntos|La lista OFAC SDN incluye terroristas, narcotraficantes y organizaciones criminales designadas por el Tesoro de EE.UU. Sin embargo, NO todos los registros representan antecedentes penales — algunos son sanciones económicas o por vínculos familiares con personas sancionadas. Por eso pesa MENOS que INTERPOL (40 vs 50). Score de 40 produce nivel MEDIO — el agente debe revisar qué tipo de designación tiene la persona antes de rechazar.|Art. 50 Num. 5: 'Constituir un riesgo o amenaza a la seguridad nacional o al orden público'|OFAC SDN directamente del Tesoro USA (CSV público, dominio público): https://ofac.treasury.gov/downloads/sdn.csv O vía OpenSanctions: https://data.opensanctions.org/datasets/latest/us\_ofac\_sdn/targets.nested.json|
|Nacionalidad en lista de atención especial SNM Panamá|10 puntos|NO es una acusación individual — es una política migratoria de Panamá. El Dec. Ej. 521/2018 define estos países como de mayor escrutinio. Peso MÍNIMO (10 pts) porque: (1) Es injusto rechazar a alguien solo por su origen. (2) Por sí solo produce MEDIO, no ALTO — indica mayor revisión documental, no rechazo automático. (3) La ley faculta al SNM a establecer requisitos adicionales, no a rechazar automáticamente.|Art. 6 Num. 4: 'Autorizar, negar o prohibir la entrada según las políticas migratorias del Estado'|Lista oficial del SNM. Fuente: Dec. Ej. 521/2018, Dec. Ej. 196/2024. Ver tabla completa más abajo.|

**Tabla de todos los escenarios posibles de score:**

|**Escenario**|**Score**|**Nivel**|**Qué debe hacer el agente**|**Artículo a citar**|
| :- | :- | :- | :- | :- |
|Sin ningún factor activo|0|BAJO|Revisar documentación normalmente. Aprobar si todo está en orden.|Art. 28 (aprobación)|
|Solo país restringido|10|MEDIO|El solicitante es de un país de mayor escrutinio pero sin alerta individual. Revisar visas y documentos adicionales requeridos.|Art. 6 Num. 4 si rechaza por documentación insuficiente|
|Solo OFAC SDN|40|MEDIO|Persona en lista de sanciones USA. Revisar el tipo de designación OFAC — puede ser sanción económica, no penal. El agente decide con criterio.|Art. 50 Num. 5 si rechaza|
|Solo INTERPOL Red Notice|50|ALTO|Orden de arresto internacional activa. Base legal clara para rechazo. El agente debe citar el artículo exacto.|Art. 50 Num. 4 (obligatorio citar)|
|OFAC + país restringido|50|ALTO|Sanción internacional + origen de mayor escrutinio. Fuerte base para rechazo.|Art. 50 Num. 5|
|INTERPOL + país restringido|60|ALTO|Red Notice activa + país de mayor escrutinio. Doble fundamento legal.|Art. 50 Num. 4|
|INTERPOL + OFAC|90|ALTO|Buscado internacionalmente Y sancionado por USA. Rechazo con múltiple fundamento.|Art. 50 Num. 4 y Num. 5|
|Los tres factores|100|ALTO|Score máximo. Múltiple fundamento legal para rechazo.|Art. 50 Num. 4 y Num. 5|

**Umbrales de clasificación:**

|**Score total**|**Nivel de riesgo**|**Color en UI**|**Significado**|**Base legal del dictamen**|
| :- | :- | :- | :- | :- |
|0 – 9|BAJO|Verde (#22C55E)|Sin alertas activas. Revisar documentación normalmente.|Art. 28 si se aprueba.|
|10 – 49|MEDIO|Amarillo (#EAB308)|Hay factores de riesgo. El agente debe revisar más a fondo antes de decidir. No es rechazo automático.|Art. 50 Num. 1/5 o Art. 28 según resultado de revisión.|
|50 – 100|ALTO|Rojo (#EF4444)|Alerta activa grave. El agente DEBE justificar su dictamen citando el artículo específico que activó el ALTO.|Art. 50 Num. 4 (INTERPOL) o Num. 5 (OFAC) según qué factor activó el nivel.|

### **Lista oficial de países con atención especial en Panamá (PAIS\_RESTRINGIDO)**

Esta lista proviene del Decreto Ejecutivo No. 521 del 6 de agosto de 2018 y sus modificaciones vigentes. Fuente oficial: www.migracion.gob.pa y www.embassyofpanama.org/visas.

|**Región**|**Países con código ISO 2**|**Fuente legal**|
| :- | :- | :- |
|África|AF: Afganistán, AO: Angola, DZ: Argelia, BD: Bangladesh, BJ: Benin, BF: Burkina Faso, BI: Burundi, CM: Camerún, CV: Cabo Verde, TD: Chad, CG: Congo, CD: R.D. Congo, CI: Costa de Marfil, EG: Egipto, ER: Eritrea, ET: Etiopía, GA: Gabón, GM: Gambia, GH: Ghana, GN: Guinea, GW: Guinea-Bissau, GQ: Guinea Ecuatorial, KE: Kenia, ML: Mali, MR: Mauritania, MZ: Mozambique, NE: Níger, NG: Nigeria, SN: Senegal, SL: Sierra Leona, SO: Somalia, SD: Sudán, TG: Togo, DJ: Yibuti|Dec. Ej. 521/2018 y embassyofpanama.org/visas|
|Asia|AZ: Azerbaiyán, GE: Georgia, IN: India, KZ: Kazajistán, KG: Kirguistán, NP: Nepal, PK: Pakistán, LK: Sri Lanka, TJ: Tayikistán, TM: Turkmenistán, UZ: Uzbekistán|Dec. Ej. 521/2018|
|América|CU: Cuba — visa de tránsito obligatoria VE: Venezuela — requisitos adicionales|Cuba: Dec. Ej. 22/2025 Venezuela: Dec. Ej. 196/2024|

**Registros INSERT en control\_lists para la migración SQL (demo):**

|**tipo\_lista**|**codigo\_pais**|**descripcion\_alerta**|**Fuente legal**|
| :- | :- | :- | :- |
|PAIS\_RESTRINGIDO|CU|Cuba — visa de tránsito especial obligatoria (Dec. Ej. No. 22 de 25 ago 2025, SNM Panamá).|Dec. Ej. 22/2025|
|PAIS\_RESTRINGIDO|AF|Afganistán — lista de atención especial migratoria SNM Panamá (embassyofpanama.org/visas).|Dec. Ej. 521/2018|
|PAIS\_RESTRINGIDO|SO|Somalia — lista de atención especial migratoria SNM Panamá.|Dec. Ej. 521/2018|
|PAIS\_RESTRINGIDO|PK|Pakistán — lista de atención especial migratoria SNM Panamá.|Dec. Ej. 521/2018|
|PAIS\_RESTRINGIDO|VE|Venezuela — requisitos adicionales según Dec. Ej. 196 de 28 oct 2024, SNM Panamá.|Dec. Ej. 196/2024|
|PAIS\_RESTRINGIDO|NG|Nigeria — lista de atención especial migratoria SNM Panamá.|Dec. Ej. 521/2018|

**Para la lista OFAC SDN — cómo obtenerla:**

- CSV directo del Tesoro USA (gratuito, dominio público): https://ofac.treasury.gov/downloads/sdn.csv
- JSON de OpenSanctions (más fácil de parsear, mismo formato que INTERPOL): https://data.opensanctions.org/datasets/latest/us\_ofac\_sdn/targets.nested.json
- Script de importación: igual que importInterpol.ts pero con tipo\_lista = 'OFAC\_SDN'.

**Estructura de la tabla control\_lists en BD:**

|**Campo BD**|**Tipo BD**|**Descripción**|
| :- | :- | :- |
|id|UUID PRIMARY KEY||
|tipo\_lista|VARCHAR(50) NOT NULL|Valores: INTERPOL\_RED\_NOTICE, OFAC\_SDN, PAIS\_RESTRINGIDO|
|numero\_pasaporte|VARCHAR(20)|NULL para PAIS\_RESTRINGIDO|
|nombre\_completo|VARCHAR(300)|NULL para PAIS\_RESTRINGIDO. Búsqueda con pg\_trgm similarity.|
|codigo\_pais|CHAR(2)|Solo para PAIS\_RESTRINGIDO (código ISO 3166-1 alpha-2)|
|descripcion\_alerta|TEXT|Texto mostrado al agente cuando hay coincidencia|
|activo|BOOLEAN DEFAULT TRUE|Permite desactivar sin borrar — trazabilidad|
|created\_at|TIMESTAMPTZ DEFAULT NOW()||

## **RF05 — Dashboard del Agente**

|<p>**⚖  Sustento legal**</p><p>Art. 6 Num. 4: El SNM ejerce control para autorizar, negar o prohibir la entrada. El dashboard es la herramienta operativa que permite al agente ejercer esa función.</p>|
| :- |

**¿Qué muestra el dashboard?**

Una lista de expedientes asignados al agente autenticado, ordenados por nivel\_riesgo DESC (ALTO primero, luego MEDIO, luego BAJO). Dentro de cada nivel, ordenados por created\_at ASC (más antiguo primero).

|**Columna visible**|**Dato que muestra**|**Origen en BD**|
| :- | :- | :- |
|Ticket|#PAN-2026-NNNNN|ticket\_number|
|Solicitante|Nombres + Apellidos|nombres + apellidos|
|Nacionalidad|Nombre del país (del código ISO)|nacionalidad\_codigo → tabla paises|
|Categoría|Categoría migratoria solicitada|categoria\_migratoria|
|Riesgo|Badge ALTO/MEDIO/BAJO con color|nivel\_riesgo|
|Estado|Badge PENDIENTE / EN\_EVALUACION|estado|
|Fecha|DD/MM/AAAA HH:mm|created\_at formateado|
|Acción|Botón 'Revisar →'|Navega a la pantalla del expediente|

**Comportamiento al hacer clic en 'Revisar →':**

El sistema cambia el estado del expediente a EN\_EVALUACION (si estaba PENDIENTE), registra en audit\_log la acción ABRIR\_EXPEDIENTE con el ID del agente y timestamp, y navega a la pantalla de detalle del expediente (RF06).

**Endpoint necesario:**

GET /api/applications?agente\_id={id}&estado=PENDIENTE,EN\_EVALUACION — devuelve lista paginada ordenada por riesgo.

## **RF06 — Dictamen Legislativo**

|<p>**⚖  Sustento legal**</p><p>Art. 6 Num. 4: El SNM autoriza, niega o prohíbe la entrada. Esta decisión DEBE quedar registrada con su fundamento legal. Art. 50: Lista las causales de rechazo. El agente DEBE citar el artículo aplicable. Este es el requisito más importante del sistema desde el punto de vista legal: sin él el sistema es solo un formulario web.</p>|
| :- |

**¿Qué puede hacer el agente en la pantalla del expediente?**

- Ver los datos completos del solicitante (todos los campos de RF01).
- Ver el semáforo de riesgo (ALTO/MEDIO/BAJO) con el desglose de qué factores activaron el score.
- Ver los PDFs adjuntos (comprobante de solvencia + antecedentes penales) en un visor embebido en la misma página.
- Emitir un dictamen: APROBAR o RECHAZAR.
- La justificación legal es OBLIGATORIA para cualquier dictamen (no puede estar vacía).

**Campos del formulario de dictamen:**

|**Campo**|**Tipo**|**Validación**|**Obligatorio**|
| :- | :- | :- | :- |
|Decisión|Radio button|Opciones: APROBAR / RECHAZAR|Sí|
|Artículo del Decreto Ley citado|Select|Opciones precargadas: Art. 28 (Aprobación), Art. 50 Num.1 (Insolvencia), Art. 50 Num.4 (Antecedentes), Art. 50 Num.5 (Riesgo seguridad), Art. 43 Num.2 (Pasaporte inválido)|Sí|
|Justificación del dictamen|Textarea|Mínimo 20 caracteres. Máximo 1000 caracteres.|Sí|

**¿Qué guarda el sistema al emitir el dictamen?**

|**Campo BD — tabla dictamenes**|**Tipo BD**|**Descripción**|
| :- | :- | :- |
|id|UUID PRIMARY KEY||
|expediente\_id|UUID REFERENCES applications(id)|Vínculo al expediente|
|agente\_id|UUID REFERENCES agentes(id)|Quién dictaminó — se guarda automáticamente desde la sesión|
|decision|VARCHAR(10) NOT NULL|APROBADO o RECHAZADO|
|articulo\_citado|VARCHAR(100) NOT NULL|Del select|
|justificacion|TEXT NOT NULL|Del textarea|
|created\_at|TIMESTAMPTZ NOT NULL DEFAULT NOW()|Timestamp exacto en UTC — no editable|

Además, el sistema actualiza el campo estado del expediente (APROBADO o RECHAZADO) y registra en audit\_log: DICTAMEN\_EMITIDO con agente\_id + expediente\_id + decision + timestamp.

**Restricción crítica:**

El agente NO puede modificar ningún dato del solicitante durante la revisión. Los campos son solo de lectura. Si lo intenta, el backend devuelve 403 Forbidden.

## **RF03 — Consulta de Estado del Trámite**

|<p>**⚖  Sustento legal**</p><p>Art. 6 Num. 2: El SNM lleva el registro de extranjería. El solicitante tiene derecho a conocer el estado de su trámite registrado.</p>|
| :- |

**¿Qué hace exactamente?**

El solicitante ingresa su número de pasaporte y el número de ticket en una pantalla pública (sin login). El sistema busca el expediente y muestra el estado actual.

|**Dato mostrado**|**Condición**|**Nota**|
| :- | :- | :- |
|Estado actual|Siempre|PENDIENTE / EN\_EVALUACION / APROBADO / RECHAZADO|
|Número de ticket|Siempre|Para confirmar que encontró el expediente correcto|
|Categoría migratoria solicitada|Siempre||
|Fecha de registro|Siempre|Cuándo se creó el trámite|
|Artículo citado en dictamen|Solo si APROBADO o RECHAZADO|Para transparencia legal|
|Datos personales completos|NUNCA|Protección de datos. Solo estado e información mínima.|

**Seguridad mínima:**

Tras 3 intentos fallidos con combinación incorrecta de pasaporte+ticket, bloquear esa IP por 5 minutos. Esto previene enumeración de tickets.

## **RF10 — Trazabilidad y Auditoría (Log Inmutable)**

|<p>**⚖  Sustento legal**</p><p>Art. 6 Num. 2: El registro nacional de extranjería implica trazabilidad completa. Toda acción sobre un expediente es parte del registro oficial. La inmutabilidad protege la integridad del proceso legal.</p>|
| :- |

**¿Qué acciones se registran?**

|**Acción registrada**|**Cuándo**|**Datos guardados**|
| :- | :- | :- |
|EXPEDIENTE\_CREADO|Al finalizar RF01 exitosamente|expediente\_id, ticket\_number, nivel\_riesgo calculado|
|SCORING\_CALCULADO|Al ejecutar RF04|expediente\_id, score, nivel\_riesgo, factores activados (JSON)|
|EXPEDIENTE\_ABIERTO|Cuando el agente abre el expediente|expediente\_id, agente\_id|
|DICTAMEN\_EMITIDO|Al guardar el dictamen RF06|expediente\_id, agente\_id, decision, articulo\_citado|
|LOGIN\_EXITOSO|Cuando un agente/admin inicia sesión|usuario\_id, rol, IP de origen|
|LOGIN\_FALLIDO|Intento de login con credenciales incorrectas|email intentado, IP de origen|
|CONSULTA\_ESTADO|Cuando un solicitante consulta su trámite|ticket\_number, IP de origen|

**Tabla audit\_log en BD:**

|**Campo BD**|**Tipo BD**|**Descripción**|
| :- | :- | :- |
|id|UUID PRIMARY KEY DEFAULT gen\_random\_uuid()||
|accion|VARCHAR(50) NOT NULL|Ver tabla de acciones arriba|
|usuario\_id|UUID|NULL para acciones de solicitante anónimo|
|expediente\_id|UUID|NULL para acciones de login|
|detalles|JSONB|Datos específicos de cada acción|
|ip\_origen|INET|IP del cliente|
|created\_at|TIMESTAMPTZ NOT NULL DEFAULT NOW()||

**Implementación WORM (Write-Once-Read-Many) — 5 líneas de SQL:**

|**Paso**|**SQL / Instrucción**|
| :- | :- |
|1\. Trigger anti-DELETE|CREATE OR REPLACE FUNCTION prevent\_audit\_delete() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'Los registros de auditoría no pueden eliminarse (Art. 6 DL3/2008)'; END; $$ LANGUAGE plpgsql;|
|2\. Trigger anti-UPDATE|CREATE TRIGGER no\_delete\_audit BEFORE DELETE ON audit\_log FOR EACH ROW EXECUTE FUNCTION prevent\_audit\_delete(); -- Repetir para UPDATE|
|3\. Rol de BD restringido|El usuario de BD que usa el backend solo tiene permisos INSERT + SELECT en audit\_log. REVOKE UPDATE, DELETE ON audit\_log FROM app\_user;|


# **4. Arquitectura del MVP — Sin especulación**

## **4.1 Stack tecnológico definitivo**

|**Capa**|**Tecnología**|**Justificación**|
| :- | :- | :- |
|Frontend|React + TypeScript + Tailwind CSS|Definido en documentación original. Prototipos ya existen. RNF04 y RNF05 se cumplen de forma nativa.|
|Backend|Node.js + Express + TypeScript|Consistencia de lenguaje con frontend. API REST simple. Sin overhead de NestJS para el tiempo disponible.|
|Base de datos|PostgreSQL|ACID, triggers para WORM (RNF06), sin configuración compleja. Alternativa para demo rápida: SQLite (misma lógica, sin servidor).|
|Autenticación|JWT (jsonwebtoken) + bcrypt|Stateless, simple, sin dependencias externas. Login con email+contraseña. Token expira en 15 minutos (DEF-007).|
|Almacenamiento PDF|Sistema de archivos local /uploads/|Suficiente para MVP. Los archivos se sirven con URL firmada temporalmente desde el backend.|
|Deploy|GCP Cloud Run o Azure Container Apps|Cumple restricción organizacional (sin Vercel). Dockerfile de 10 líneas.|
|HTTPS|Certificado gestionado por la plataforma de deploy|GCP y Azure gestionan TLS automáticamente. Costo: $0.|

## **4.2 Estructura del proyecto**

|**Directorio/Archivo**|**Responsabilidad**|
| :- | :- |
|backend/src/routes/applications.ts|Endpoints RF01 (POST), RF03 (GET por ticket), RF05 (GET lista agente)|
|backend/src/routes/verdicts.ts|Endpoints RF06 (POST dictamen)|
|backend/src/routes/auth.ts|Login, logout, refresh token|
|backend/src/services/risk-engine.ts|Lógica completa de RF04: cálculo de score, consulta a BD, retorno de nivel|
|backend/src/services/audit.ts|Función logAction() que inserta en audit\_log — llamada desde todos los servicios|
|backend/src/middleware/auth.ts|Verificación de JWT + extracción de rol (RBAC)|
|backend/src/db/migrations/001\_initial.sql|Creación de todas las tablas + triggers WORM + datos de prueba (control\_lists)|
|frontend/src/pages/SolicitudWizard.tsx|RF01 + RF02: formulario en 3 pasos con validaciones|
|frontend/src/pages/ConsultaEstado.tsx|RF03: búsqueda por pasaporte+ticket|
|frontend/src/pages/AgenteDashboard.tsx|RF05: lista de expedientes con semáforo|
|frontend/src/pages/DetalleExpediente.tsx|RF06: vista completa + visor PDF + formulario dictamen|
|frontend/src/components/SemaforoRiesgo.tsx|Componente reutilizable del badge ALTO/MEDIO/BAJO|

## **4.3 Endpoints de la API — Contrato completo**

|**Método**|**Ruta**|**Rol requerido**|**Descripción**|**RF**|
| :- | :- | :- | :- | :- |
|POST|/api/auth/login|Público|Login con email+contraseña. Devuelve JWT.|Auth|
|GET|/api/applications|Agente|Lista expedientes asignados al agente del JWT. Query params: ?estado=PENDIENTE,EN\_EVALUACION|RF05|
|POST|/api/applications|Público (solicitante)|Crear nueva solicitud. Ejecuta RF02 (validación) + RF04 (scoring) internamente. Devuelve ticket\_number.|RF01, RF02, RF04|
|GET|/api/applications/:id|Agente|Detalle completo del expediente. Marca como EN\_EVALUACION si estaba PENDIENTE. Registra en audit\_log.|RF05, RF06|
|POST|/api/applications/:id/verdict|Agente|Emitir dictamen. Body: { decision, articulo\_citado, justificacion }. Actualiza estado + guarda en dictamenes + audit\_log.|RF06|
|GET|/api/applications/status|Público|Consulta estado por pasaporte+ticket. Query: ?pasaporte=XX&ticket=XX. Rate limit: 3 intentos/IP.|RF03|
|GET|/api/audit-log|Admin|Lista log de auditoría. Query: ?fecha\_desde=&fecha\_hasta=&agente\_id=|RF10|

##
##
##
##
## **4.4 Roles y permisos (RBAC)**

|**Rol**|**¿Quién es?**|**Permisos en el sistema**|
| :- | :- | :- |
|SOLICITANTE|Extranjero que hace la solicitud|Crear solicitudes (RF01), consultar estado propio (RF03). No requiere login para estas acciones.|
|AGENTE|Agente de Cumplimiento Migratorio|Ver expedientes asignados (RF05), abrir expediente, emitir dictamen (RF06). Requiere JWT válido.|
|ADMIN|Administrador del sistema|Todo lo del Agente + ver audit log completo + gestionar agentes. Requiere JWT válido.|


# **5. Flujo Operativo del MVP — Paso a Paso**

Este es el flujo completo que debe demostrarse de inicio a fin. Cada paso especifica qué hace el actor, qué hace el sistema internamente, qué datos consulta (incluyendo cuándo y cómo se usan los datos de INTERPOL/OpenSanctions), qué guarda en BD, y qué queda en el log de auditoría.

### **Paso 1 — Solicitante envía la solicitud**

|**Aspecto**|**Detalle**|
| :- | :- |
|Actor|Solicitante / Extranjero (sin login)|
|Acción del actor|Completa el wizard de 3 pasos: (1) identidad y pasaporte, (2) solvencia económica + PDF comprobante, (3) PDF de antecedentes penales. Hace clic en 'Enviar solicitud'.|
|Qué valida el sistema (RF02)|Pasaporte vigencia ≥ 6 meses (Art. 43 DL3/2008). Ambos archivos son .pdf y ≤ 5MB. Todos los campos obligatorios completos. Si algo falla: error específico con el artículo legal. El envío queda bloqueado.|
|Qué guarda en BD|INSERT en tabla applications con todos los campos del formulario. Estado inicial: PENDIENTE. Genera ticket\_number = PAN-2026-NNNNN.|
|Estado del expediente|PENDIENTE|
|Log generado|EXPEDIENTE\_CREADO — guarda: expediente\_id, ticket\_number, nacionalidad, categoria\_migratoria, timestamp UTC.|
|Qué ve el solicitante|Pantalla de confirmación con el número de ticket. Instrucción: 'Use este número para consultar el estado de su trámite'.|

### **Paso 2 — El sistema ejecuta el motor de scoring con consulta a datos INTERPOL (RF04 + RF12)**

|<p>**✓  Aquí es donde se usan los datos de OpenSanctions/INTERPOL**</p><p>Inmediatamente después de guardar el expediente, el sistema ejecuta calcularScoring() de forma automática y síncrona. Esta función incluye la consulta a la tabla control\_lists que fue cargada con los datos reales de INTERPOL Red Notices descargados de OpenSanctions. El solicitante no ve esta operación — ocurre en el backend antes de devolver la respuesta.</p>|
| :- |

|**Aspecto**|**Detalle**|
| :- | :- |
|Actor|Sistema (automático — sin intervención humana)|
|Trigger|Se ejecuta justo después del INSERT exitoso en applications. Antes de devolver HTTP 201 al frontend.|
|Factor 1 — INTERPOL Red Notice (50 pts)|buscarEnInterpol(): busca en control\_lists WHERE tipo = 'INTERPOL\_RED\_NOTICE'. Datos reales de INTERPOL cargados desde OpenSanctions. Busca por numero\_pasaporte exacto OR similarity(nombre\_completo, nombre\_solicitante) > 0.85. Match: +50 puntos. Guarda interpol\_alerta\_encontrada = true y descripcion\_alerta.|
|Factor 2 — OFAC SDN (40 pts)|buscarEnOFAC(): busca en control\_lists WHERE tipo = 'OFAC\_SDN'. Lista de sanciones del Tesoro USA (ofac.treasury.gov/downloads/sdn.csv). Match exacto por pasaporte OR similitud nombre > 85%: +40 puntos.|
|Factor 3 — País restringido (10 pts)|verificarPaisRestringido(): busca el código ISO del país del solicitante en control\_lists WHERE tipo = 'PAIS\_RESTRINGIDO'. Match: suma 10 puntos.|
|Cálculo del nivel|Score 0–9 = BAJO. Score 10–49 = MEDIO. Score 50–100 = ALTO. (INTERPOL solo = 50 pts = ALTO. OFAC solo = 40 pts = MEDIO. País restringido solo = 10 pts = MEDIO.)|
|Qué guarda en BD|UPDATE applications SET nivel\_riesgo, score\_riesgo, interpol\_alerta\_encontrada, interpol\_alerta\_tipo, interpol\_alerta\_detalle WHERE id = expediente.id|
|Estado del expediente|PENDIENTE (no cambia, el scoring es transparente para el solicitante)|
|Log generado|SCORING\_CALCULADO — guarda: expediente\_id, score, nivel\_riesgo, interpol\_alerta\_encontrada (true/false), factores\_activados (JSON con el detalle de qué factor sumó cuánto), timestamp UTC.|

### **Paso 3 — Solicitante consulta el estado (RF03)**

|**Aspecto**|**Detalle**|
| :- | :- |
|Actor|Solicitante (sin login)|
|Acción|Ingresa número de pasaporte + número de ticket en la pantalla de consulta pública.|
|Qué muestra el sistema|Estado actual (PENDIENTE), fecha de registro, categoría migratoria. NO muestra el nivel de riesgo ni datos personales completos — solo el estado mínimo necesario.|
|Seguridad|Tras 3 intentos fallidos con combinación incorrecta, bloquear esa IP 5 minutos.|
|Log generado|CONSULTA\_ESTADO — ticket\_number, IP de origen, timestamp.|

### **Paso 4 — Admin asigna el expediente a un agente**

|**Aspecto**|**Detalle**|
| :- | :- |
|Actor|Administrador del sistema (con login JWT)|
|Acción|En el panel de admin, selecciona el expediente y elige un agente de la lista de agentes activos. En Sprint 2 esto se automatiza con least-load.|
|Qué hace el sistema|UPDATE applications SET agente\_asignado\_id = $agente WHERE id = $expediente. El expediente aparece en el dashboard del agente asignado.|
|Log generado|EXPEDIENTE\_ASIGNADO — expediente\_id, agente\_id, admin\_id, timestamp.|

### **Paso 5 — Agente abre el expediente y ve el resultado de INTERPOL (RF05)**

|**Aspecto**|**Detalle**|
| :- | :- |
|Actor|Agente de Cumplimiento Migratorio (con login JWT)|
|Acción|En su dashboard ve la lista de expedientes asignados ordenada por nivel\_riesgo DESC (ALTO primero). Hace clic en 'Revisar →' sobre un expediente.|
|Qué hace el sistema al abrir|Marca el expediente como EN\_EVALUACION (si estaba PENDIENTE). Devuelve todos los datos del expediente incluyendo nivel\_riesgo, score\_riesgo, interpol\_alerta\_encontrada, interpol\_alerta\_tipo e interpol\_alerta\_detalle.|
|Qué ve el agente — Semáforo de riesgo|Badge ALTO/MEDIO/BAJO con el score numérico. Desglose de qué factores activaron el riesgo: 'Listas internas: +60 pts', 'INTERPOL Red Notice: +30 pts', 'País restringido: +10 pts'.|
|Qué ve el agente — Alerta INTERPOL|SI interpol\_alerta\_encontrada = true: badge adicional 'Alerta INTERPOL Red Notice' en color rojo + panel con el texto de interpol\_alerta\_detalle (nombre real de la persona tal como aparece en el dataset de OpenSanctions). Esto le dice al agente exactamente por qué hay una alerta internacional.|
|Qué ve el agente — Documentos|Visor PDF embebido en la mitad derecha de la pantalla con el comprobante de solvencia y los antecedentes penales. Los datos del solicitante son de solo lectura.|
|Estado del expediente|EN\_EVALUACION|
|Log generado|EXPEDIENTE\_ABIERTO — expediente\_id, agente\_id, timestamp.|

### **Paso 6 — Agente emite el dictamen (RF06)**

|**Aspecto**|**Detalle**|
| :- | :- |
|Actor|Agente de Cumplimiento Migratorio|
|Acción A — APROBAR|El agente revisa todos los datos y no encuentra problemas. Selecciona APROBAR, elige Art. 28 en el select, escribe la justificación (mínimo 20 caracteres). Hace clic en 'Confirmar dictamen'.|
|Acción B — RECHAZAR con alerta INTERPOL|El agente ve el badge 'Alerta INTERPOL Red Notice' con el nombre real de la lista. Selecciona RECHAZAR, elige Art. 50 Num. 4 (antecedentes penales internacionales), escribe la justificación citando la alerta detectada. Este es el caso más importante de demostrar.|
|Acción C — RECHAZAR por otro motivo|Sin alerta INTERPOL pero con problema en documentos. Selecciona RECHAZAR + Art. 50 Num.1 (insolvencia) o Art. 50 Num.5 (riesgo seguridad) según corresponda.|
|Qué hace el sistema|INSERT en tabla dictamenes con: expediente\_id, agente\_id (del JWT), decision, articulo\_citado, justificacion, created\_at. UPDATE applications SET estado = APROBADO o RECHAZADO.|
|Restricción crítica|El agente NO puede modificar ningún campo del solicitante. Si lo intenta: HTTP 403.|
|Estado del expediente|APROBADO o RECHAZADO|
|Log generado|DICTAMEN\_EMITIDO — expediente\_id, agente\_id, decision, articulo\_citado, timestamp.|

### **Paso 7 — Solicitante consulta el resultado final (RF03)**

|**Aspecto**|**Detalle**|
| :- | :- |
|Actor|Solicitante (sin login)|
|Acción|Vuelve a la pantalla de consulta pública e ingresa pasaporte + ticket.|
|Qué muestra el sistema|Estado final: APROBADO o RECHAZADO. Artículo del Decreto Ley citado en el dictamen (para transparencia legal). Fecha de resolución. NO muestra datos personales ni detalles del agente.|
|Log generado|CONSULTA\_ESTADO — ticket\_number, IP, timestamp.|

### **Paso 8 — Admin verifica la trazabilidad completa (RF10)**

|**Aspecto**|**Detalle**|
| :- | :- |
|Actor|Administrador del sistema|
|Acción|Accede al log de auditoría, filtra por el expediente que se acaba de procesar.|
|Qué ve|Línea de tiempo completa e inmutable: 1. EXPEDIENTE\_CREADO — timestamp del registro 2. SCORING\_CALCULADO — score, nivel, interpol\_alerta\_encontrada: true/false 3. EXPEDIENTE\_ASIGNADO — agente asignado 4. EXPEDIENTE\_ABIERTO — agente que lo abrió 5. DICTAMEN\_EMITIDO — decision, artículo citado Cada entrada tiene usuario\_id, timestamp UTC exacto y IP de origen.|
|Prueba WORM|El admin intenta borrar un registro del log desde la BD. El trigger lanza: ERROR: Los registros de auditoría no pueden eliminarse (Art. 6 DL3/2008). Esto se demuestra en vivo.|
|Log generado|CONSULTA\_AUDITORIA — admin\_id, filtros aplicados, timestamp.|

|<p>**ℹ  Cómo preparar los 3 escenarios de demo (con datos reales de INTERPOL)**</p><p>Antes de la demo, abrir interpol\_data.json (descargado de OpenSanctions) y buscar 2 entradas con nombre completo claro. Anotar esos nombres exactos.  Escenario ALTO: registrar solicitud con el nombre exacto de una persona del JSON. El sistema la detecta con similarity() y marca ALTO + badge INTERPOL real. Escenario MEDIO: registrar solicitud con país en lista restringida pero sin alerta INTERPOL. Score 10 = MEDIO. Escenario BAJO: registrar solicitud con nombre inventado y país no restringido. Score 0 = BAJO. Agente aprueba citando Art. 28.</p>|
| :- |


# **6. División de Trabajo — 4 personas, 4–8 horas**

|<p>**⚠  Premisa de trabajo paralelo**</p><p>El backend y el frontend pueden desarrollarse en paralelo usando el contrato de API de la Sección 4.3. El frontend usa datos mock (JSON hardcodeado) mientras el backend no está listo, luego se conecta. La integración final toma 30–60 minutos si el contrato se respeta.</p>|
| :- |

|**Persona**|**Responsabilidad**|**Entregables concretos**|**Horas estimadas**|
| :- | :- | :- | :- |
|Persona 1 (Backend core)|BD + Auth + RF01 + RF02|migration 001\_initial.sql con todas las tablas y datos de prueba. Endpoints: POST /auth/login, POST /api/applications (con validaciones RF02 + scoring RF04 integrado).|3–4 horas|
|Persona 2 (Backend agente)|RF05 + RF06 + RF10|Endpoints: GET /api/applications, GET /api/applications/:id, POST /api/applications/:id/verdict. Función audit.logAction() llamada desde todos los endpoints.|3–4 horas|
|Persona 3 (Frontend solicitante)|RF01 wizard + RF03 consulta|SolicitudWizard.tsx (3 pasos con validaciones en tiempo real). ConsultaEstado.tsx (búsqueda por pasaporte+ticket).|3–4 horas|
|Persona 4 (Frontend agente + integración)|RF05 dashboard + RF06 detalle + integración|AgenteDashboard.tsx, DetalleExpediente.tsx con visor PDF y formulario dictamen. Conecta frontend con backend al final.|3–4 horas|

## **6.1 Orden recomendado de implementación**

1. Persona 1: crear la migración SQL completa primero. Esto desbloquea a todos.
1. Personas 2 y 3: trabajan en paralelo en sus módulos. Persona 3 usa mock data hasta que Persona 1 termine.
1. Persona 4: empieza con AgenteDashboard usando mock data. En paralelo con Persona 2.
1. Integración: cuando Personas 1 y 2 tienen los endpoints corriendo, Personas 3 y 4 conectan el frontend. Meta: última hora antes de la demo.
1. Datos de prueba: Persona 1 precarga los datos de control\_lists y 3 solicitudes de demostración en la migración.


# **7. Criterios de Aceptación — ¿Qué debe funcionar en la demo?**

Estos son los criterios mínimos que el sistema debe cumplir para que la demo sea exitosa y defendible ante la profesora. Cada criterio corresponde a un artículo del Decreto Ley o un requisito funcional.

|**ID Criterio**|**Qué se verifica**|**Cómo se verifica en demo**|**RF / Artículo**|
| :- | :- | :- | :- |
|CA-01|El sistema bloquea el envío si el pasaporte vence en menos de 6 meses|Intentar enviar formulario con fecha de vencimiento a 3 meses. Debe aparecer error con mención del Art. 43 DL3/2008.|RF02 / Art. 43|
|CA-02|El sistema bloquea si el archivo adjunto no es PDF|Intentar subir un archivo .jpg. Debe aparecer error 'Solo se aceptan archivos PDF'.|RF02|
|CA-03|Al enviar una solicitud válida se genera un ticket único|Enviar solicitud correcta. Ver pantalla de confirmación con #PAN-2026-NNNNN.|RF01|
|CA-04|El sistema calcula riesgo ALTO cuando el pasaporte coincide con lista INTERPOL de prueba|Enviar solicitud con número de pasaporte precargado como alerta INTERPOL. Dashboard del agente debe mostrar badge ALTO en rojo.|RF04 / Art. 50|
|CA-05|El dashboard ordena expedientes por riesgo (ALTO primero)|Con 3 solicitudes de distinto riesgo, verificar que ALTO aparece en primera posición.|RF05 / Art. 6 Num. 4|
|CA-06|El agente puede aprobar un expediente con justificación legal|Abrir expediente BAJO. Seleccionar APROBAR + Art. 28 + texto de justificación. Enviar. Estado cambia a APROBADO.|RF06 / Art. 6 Num. 4|
|CA-07|El agente puede rechazar un expediente con artículo legal|Abrir expediente ALTO. Seleccionar RECHAZAR + Art. 50 Num.4 + justificación. Estado cambia a RECHAZADO.|RF06 / Art. 50|
|CA-08|El sistema no permite dictaminar sin justificación|Intentar enviar dictamen con textarea vacío. Botón debe estar deshabilitado o aparecer error.|RF06|
|CA-09|El solicitante puede consultar el estado final de su trámite|Usar ticket+pasaporte para consultar. Debe mostrar APROBADO o RECHAZADO con el artículo legal citado.|RF03 / Art. 6 Num. 2|
|CA-10|El log de auditoría es inmutable y muestra la línea de tiempo completa|Admin consulta audit\_log del expediente aprobado/rechazado. Debe mostrar: CREADO → SCORING → ABIERTO → DICTAMEN. Intentar borrar un registro desde la BD: debe fallar con error del trigger.|RF10 / Art. 6 Num. 2|
|CA-11|El agente no puede modificar los datos del solicitante|En la pantalla de detalle, los campos del solicitante son solo de lectura. Intentar editar desde DevTools/Postman devuelve 403.|RF06|
|CA-12|Roles separados: el solicitante no accede al dashboard|Intentar acceder a /dashboard sin JWT de agente. Sistema debe redirigir a login o devolver 401.|RNF01d / RBAC|

|<p>**✓  Para una demo exitosa**</p><p>Si CA-01 al CA-10 funcionan correctamente, el sistema demuestra un flujo legal completo: registro → validación legal → análisis de riesgo (Art. 50) → dictamen fundamentado (Art. 6 Num. 4) → trazabilidad del registro (Art. 6 Num. 2). Eso es exactamente lo que exige el Decreto Ley 3/2008.</p>|
| :- |


# **9. RF12 — Integración INTERPOL: OpenSanctions como fuente de datos reales**

## **9.1 Resultado de la investigación técnica**

|**Fuente investigada**|**Resultado**|
| :- | :- |
|API directa de INTERPOL https://ws-public.interpol.int/notices/v1/red|BLOQUEADA. HTTP 403 — 'Host not in allowlist'. INTERPOL solo permite acceso a IPs institucionales autorizadas con convenio formal. No viable para proyecto universitario.|
|OpenSanctions — dataset INTERPOL Red Notices https://data.opensanctions.org/datasets/20260522/interpol\_red\_notices/targets.nested.json|ACCESIBLE desde browser. OpenSanctions procesa y republica los datos públicos de INTERPOL en JSON estructurado. Actualizado diariamente. Licencia: gratuito para uso no comercial. Un proyecto universitario es uso no comercial.|

|<p>**✓  Decisión final — OpenSanctions como fuente de datos reales de INTERPOL**</p><p>Se usa el dataset de INTERPOL Red Notices de OpenSanctions. Son datos REALES de INTERPOL — no simulados, no inventados. OpenSanctions los obtiene de la fuente oficial y los republica en formato JSON estructurado bajo licencia libre para uso no comercial.  Flujo: descargar el JSON una vez desde el browser → script de importación lo parsea → inserta en tabla control\_lists de la BD → el motor de scoring busca en esa tabla. En producción el SNM actualizaría esta tabla periódicamente con el JSON más reciente de OpenSanctions o, cuando tengan convenio con INTERPOL, directamente desde su API.</p>|
| :- |

## **9.2 Qué es OpenSanctions y por qué es válido usarlo**

|**Aspecto**|**Detalle**|
| :- | :- |
|¿Qué es OpenSanctions?|Organización alemana (OpenSanctions Datenbanken GmbH) que agrega, limpia y redistribuye datos de listas de sanciones y alertas internacionales en formato estructurado y abierto.|
|¿De dónde vienen los datos de INTERPOL?|OpenSanctions extrae los datos del sitio público de INTERPOL (el mismo que sirve la API bloqueada) y los republica en JSON estructurado, actualizado diariamente.|
|¿Son datos reales?|Sí. Son los mismos datos de la fuente oficial de INTERPOL, procesados y normalizados. Incluyen nombre, nacionalidad, fecha de nacimiento, países de origen de la alerta.|
|¿Podemos usarlos en el proyecto?|Sí. OpenSanctions es explícitamente gratuito para usuarios no comerciales. Un proyecto universitario cumple esta condición sin necesidad de registro ni API key.|
|URL del dataset|https://data.opensanctions.org/datasets/20260522/interpol\_red\_notices/targets.nested.json (La fecha 20260522 corresponde a la versión del 22 mayo 2026. Siempre disponible desde browser.)|
|¿Qué contiene el JSON?|Array de entidades. Cada entidad tiene: id, caption (nombre completo), properties.nationality, properties.birthDate, properties.country, y en algunos casos properties.passportNumber.|

## **9.3 En qué sprint va y quién lo hace**

|**Sprint**|**Tarea concreta**|**Responsable**|**Tiempo**|
| :- | :- | :- | :- |
|Sprint 1 (demo — hoy)|Paso 1: Una persona descarga el archivo JSON desde el browser: https://data.opensanctions.org/datasets/20260522/interpol\_red\_notices/targets.nested.json Guardarlo como interpol\_data.json en backend/src/db/seeds/  Paso 2: Crear script backend/src/db/seeds/importInterpol.ts que lea el JSON y haga INSERT en control\_lists para cada entrada.  Paso 3: Correr el script una vez antes de levantar el servidor para la demo: ts-node importInterpol.ts  Paso 4: Implementar buscarEnInterpol() en risk-engine.ts — query SQL contra control\_lists.  Paso 5: Frontend DetalleExpediente.tsx muestra badge si interpol\_alerta\_encontrada = true.|Persona 1: script de importación + buscarEnInterpol() Persona 4: badge en frontend|1–1.5 horas en total|
|Producción futura|Automatizar la descarga del JSON de OpenSanctions con un cron job diario (el archivo cambia de fecha en la URL). O cuando el SNM tenga convenio con INTERPOL, apuntar a la API directa. Solo cambia el script de importación, no el motor de scoring ni el frontend.|—|—|

## **9.4 Qué archivos crear y qué código escribir**

**ARCHIVO 1 — backend/src/db/seeds/importInterpol.ts**

Script que se corre UNA VEZ antes de la demo para cargar los datos reales en la BD:

|**Paso del script**|**Qué hace**|
| :- | :- |
|1\. Leer el JSON|const raw = fs.readFileSync('backend/src/db/seeds/interpol\_data.json', 'utf-8'); const entities = JSON.parse(raw);|
|2\. Por cada entidad del JSON|Extraer: nombre = entity.caption, nacionalidad = entity.properties?.nationality?.[0], pasaporte = entity.properties?.passportNumber?.[0] (puede ser null), descripcion = 'Red Notice INTERPOL — ' + entity.caption + (nationality ? ', Nacionalidad: ' + nationality : '')|
|3\. INSERT en control\_lists|INSERT INTO control\_lists (id, tipo\_lista, numero\_pasaporte, nombre\_completo, codigo\_pais, descripcion\_alerta, activo) VALUES (gen\_random\_uuid(), 'INTERPOL\_RED\_NOTICE', $pasaporte, $nombre, $pais, $descripcion, true) ON CONFLICT DO NOTHING|
|4\. Log final|console.log('Importados: ' + count + ' registros de INTERPOL Red Notices')|

**ARCHIVO 2 — backend/src/db/migrations/001\_initial.sql**

Agregar estas 3 columnas a la tabla applications:

|**Columna SQL completa**|**Descripción**|
| :- | :- |
|interpol\_alerta\_encontrada BOOLEAN DEFAULT FALSE NOT NULL|TRUE si el scoring encontró coincidencia en la tabla control\_lists tipo INTERPOL|
|interpol\_alerta\_tipo VARCHAR(50)|Valor: INTERPOL\_RED\_NOTICE. NULL si no hay alerta.|
|interpol\_alerta\_detalle TEXT|Texto de la descripcion\_alerta encontrada. Se muestra al agente en el expediente. NULL si no hay.|

También al inicio de la migración activar la extensión para búsqueda por similitud de nombre:

CREATE EXTENSION IF NOT EXISTS pg\_trgm;

**ARCHIVO 3 — backend/src/services/risk-engine.ts**

Función buscarEnInterpol() que consulta la tabla ya cargada con datos reales:

|**Función**|**Lógica exacta**|
| :- | :- |
|buscarEnInterpol (pasaporte: string, nombreCompleto: string) — 50 pts|1\. Buscar coincidencia EXACTA por pasaporte:    SELECT \* FROM control\_lists    WHERE activo = true    AND tipo\_lista = 'INTERPOL\_RED\_NOTICE'    AND numero\_pasaporte = $1    LIMIT 1  2. Si no hay resultado, buscar por similitud de nombre (pg\_trgm):    SELECT \* FROM control\_lists    WHERE activo = true    AND tipo\_lista = 'INTERPOL\_RED\_NOTICE'    AND similarity(nombre\_completo, $2) > 0.85    ORDER BY similarity(nombre\_completo, $2) DESC    LIMIT 1  3. Devolver: { descripcion\_alerta, tipo\_lista } si hay match, o null si no hay.|
|calcularScoring (expediente)|Ejecutar los 3 factores y sumar puntos: Factor 1 — buscarEnInterpol(pasaporte, nombre): busca en control\_lists WHERE tipo = 'INTERPOL\_RED\_NOTICE'. Match → +50 puntos. Guardar descripcion\_alerta en expediente. Factor 2 — buscarEnOFAC(pasaporte, nombre): busca en control\_lists WHERE tipo = 'OFAC\_SDN'. Match → +40 puntos. Factor 3 — verificarPaisRestringido(codigo\_iso): busca en control\_lists WHERE tipo = 'PAIS\_RESTRINGIDO'. Match → +10 puntos.  Nivel final: 0–9 = BAJO, 10–49 = MEDIO, 50–100 = ALTO. Retornar: { score, nivel, interpol\_alerta\_encontrada, interpol\_alerta\_tipo, interpol\_alerta\_detalle }|

**ARCHIVO 4 — frontend/src/pages/DetalleExpediente.tsx**

Lógica del semáforo de riesgo con badge INTERPOL:

|**Condición (datos del expediente)**|**Qué muestra en pantalla**|**Color**|
| :- | :- | :- |
|nivel\_riesgo = 'ALTO' interpol\_alerta\_encontrada = true|Badge grande 'RIESGO ALTO' + Badge secundario 'Alerta INTERPOL Red Notice' + panel expandible con interpol\_alerta\_detalle (nombre real de la persona en la lista)|Rojo #EF4444|
|nivel\_riesgo = 'ALTO' interpol\_alerta\_encontrada = false|Badge 'RIESGO ALTO' solo (activado por lista interna o país restringido). Sin badge INTERPOL.|Rojo #EF4444|
|nivel\_riesgo = 'MEDIO'|Badge 'RIESGO MEDIO'. Revisar expediente con atención.|Amarillo #EAB308|
|nivel\_riesgo = 'BAJO'|Badge 'RIESGO BAJO'. Sin alertas activas.|Verde #22C55E|

## **9.5 Cómo demostrar RF12 en la demo con datos reales**

Como los datos son reales de INTERPOL, para la demo se usan nombres que SÍ aparecen en el dataset de OpenSanctions. Antes de la demo se consulta el JSON descargado para identificar 2–3 personas con Red Notice activa y se registran esas solicitudes en el sistema.

|<p>**ℹ  Procedimiento para preparar los escenarios de demo**</p><p>Paso 1: Abrir interpol\_data.json en un editor de texto. Paso 2: Buscar 2 entidades con datos completos (nombre + nacionalidad). Anotar el caption (nombre completo) exacto. Paso 3: En el formulario del solicitante, ingresar ese nombre completo exacto. La búsqueda por similitud lo detectará. Paso 4: El sistema marcará la solicitud como ALTO con el badge 'Alerta INTERPOL Red Notice' mostrando el nombre real de la lista.  Para el escenario BAJO: registrar una solicitud con nombre y pasaporte completamente distintos a cualquier entrada del JSON.</p>|
| :- |

|**Escenario demo**|**Cómo prepararlo**|**Qué verá el evaluador**|
| :- | :- | :- |
|ALTO — con alerta INTERPOL real|Registrar solicitud con el nombre exacto de una persona del JSON de OpenSanctions (dato real de INTERPOL).|Badge ROJO + 'Alerta INTERPOL Red Notice' + nombre real de la lista. El agente rechaza citando Art. 50 Num. 4.|
|BAJO — sin alertas|Registrar solicitud con nombre 'María García López', pasaporte 'PA123456', España.|Badge VERDE. Sin alertas. El agente aprueba citando Art. 28.|
|MEDIO — país restringido|Registrar solicitud con nombre sin alertas pero con nacionalidad en lista de países de atención especial (precargado en BD).|Badge AMARILLO. El agente revisa y decide.|

## **9.6 Cómo defender esta implementación ante el evaluador**

|<p>**ℹ  Argumentos para la defensa — con datos reales, mucho más sólido**</p><p>Argumento principal: 'El sistema usa datos REALES de INTERPOL. La fuente es OpenSanctions (opensanctions.org), organización alemana que republica el dataset oficial de INTERPOL Red Notices en formato JSON abierto, actualizado diariamente, bajo licencia gratuita para uso no comercial. Descargamos ese dataset, lo importamos a nuestra base de datos, y el motor de scoring busca en esos datos reales al crear cada expediente.'  Si preguntan por qué no usaron la API directa de INTERPOL: 'La API directa de INTERPOL (ws-public.interpol.int) devuelve HTTP 403 desde cualquier servidor no autorizado. INTERPOL solo permite acceso a instituciones con convenio formal. OpenSanctions es la alternativa técnicamente correcta: mismos datos, formato estructurado, acceso libre para investigación y proyectos no comerciales.'  Si preguntan si los datos son reales: 'Sí. El badge que ve el agente en el expediente muestra el nombre real de una persona con Red Notice activa en la base de datos de INTERPOL, tal como aparece en el dataset oficial publicado por OpenSanctions.'</p>|
| :- |

# **8. Fuera del MVP — Fase siguiente**

Estos elementos están documentados en el Parcial 1 pero NO entran al MVP de la demo. No es porque sean innecesarios: es porque no hay tiempo suficiente y el flujo principal funciona sin ellos.

|**Requisito**|**Por qué NO entra hoy**|**Cuándo entra**|
| :- | :- | :- |
|RF07 — Subsanación de documentos|El flujo principal (registro→scoring→dictamen→consulta) ya es completo y demostrable. La subsanación es un flujo alternativo que agrega 2 pantallas extra (solicitud del agente + carga corregida del solicitante) y lógica de estado adicional.|Sprint 2. Requiere: nuevo estado SUBSANACION\_PENDIENTE, pantalla de carga para el solicitante, y reactiva el flujo del agente.|
|RF08 — Notificaciones por correo|DEF-003 documentado en Parcial 1: el correo de confirmación puede caer en SPAM por falta de DKIM. Configurar DKIM, SPF y reputación de dominio agrega complejidad que supera el valor para la demo.|Sprint 2. Usar Sendgrid o Resend que gestionan DKIM automáticamente.|
|RF09 — Carga de listas CSV|Las listas de control que necesita RF04 se precargan directamente en la migración SQL para la demo. La pantalla de carga CSV del admin es una funcionalidad de mantenimiento, no del flujo principal.|Sprint 2. La tabla control\_lists ya existe; solo falta el endpoint de importación y la pantalla de admin.|
|RF11 — Asignación automática (least-load)|No tiene caso de uso definido hasta este documento. El admin asigna manualmente en la demo (actualizar agente\_asignado\_id desde el panel admin).|Sprint 2. La lógica es: SELECT id FROM agentes WHERE activo=true ORDER BY (SELECT COUNT(\*) FROM applications WHERE agente\_asignado\_id=agentes.id AND estado='EN\_EVALUACION') ASC LIMIT 1.|
|RNF01a — 2FA (TOTP)|Autenticación básica (email+contraseña+JWT) es suficiente para demo universitaria. Agregar TOTP agrega 1 pantalla extra (QR code al registrar agente, código al login) sin valor demostrativo adicional.|Sprint 2. Librería: otplib (Node.js). QR con qrcode.|
|Panel de métricas admin (Fig. 10 del prototipo)|No es un requisito funcional explícito (RF01–RF12). Es una funcionalidad del dashboard de administración.|Sprint 2 o 3. Requiere queries de agregación sobre las tablas existentes.|

Decreto Ley 3 de 2008 — Universidad Tecnológica de Panamá	1
