
   # 🌍 Sistema de Inteligencia Multifuente
## Conflicto Irán–Israel–EE.UU. | ML1-2026I
**Universidad Externado de Colombia · Pregrado en Ciencia de Datos**

---

## 📌 Descripción

Sistema de inteligencia multifuente que clasifica el nivel de escalada del conflicto Irán–Israel–EE.UU. usando fuentes abiertas y gratuitas. Proyecto final del curso Machine Learning 1.

**Pregunta de ML:**
> ¿Es posible clasificar el nivel de escalada del conflicto Irán–Israel–EE.UU. en una ventana país-día usando señales mediáticas, textuales, económicas y de eventos físicos de fuentes abiertas?

---

## 🗂️ Estructura del Repositorio

    ml1_proyecto/
    │
    ├── data/
    │   ├── raw/
    │   │   ├── ACLED_Data_2026-05-13.csv
    │   │   ├── gdelt_articulos_2026.csv
    │   │   ├── gdelt_puente_2025_2026.csv
    │   │   └── yahoo_brent_2024_2026.csv
    │   │
    │   └── processed/
    │       ├── dataset_final_pais_dia.csv
    │       └── dataset_final_con_embeddings.csv
    │
    ├── notebooks/
    │   ├── 01_construccion_dataset.ipynb
    │   ├── 02_embeddings_linguisticos.ipynb
    │   ├── 03_eda.ipynb
    │   └── 04_modelos_ml.ipynb
    │
    ├── docs/
    │   └── construccion_dataset.md
    │
    ├── README.md
    └── requirements.txt

---

## 📦 Fuentes de Datos

| # | Fuente | Dimensión | Período | Registro |
|---|---|---|---|---|
| 1 | **ACLED** | Eventos físicos | 2024-01 → 2025-05 | ✅ Gratuito |
| 2 | **GDELT** | Señal mediática + análisis lingüístico | 2025-05 → 2026-05 | ❌ Sin registro |
| 3 | **Yahoo Finance** | Señal económica | 2024-01 → 2026-05 | ❌ Sin registro |

> **Nota sobre GDELT:** Esta fuente tiene dos usos en el proyecto.
> El primero es el tono mediático diario usado como feature numérica directa.
> El segundo son los 685 títulos de artículos, que se procesan con embeddings
> (`all-MiniLM-L6-v2`) para capturar el sentido lingüístico real del conflicto.
> Los embeddings no son una fuente externa — son un método de procesamiento
> aplicado sobre los datos de GDELT.

---

## 🏗️ Construcción del Dataset

### Unidad de análisis

**País-Día** — cada fila representa un país en un día específico.

    864 días × 3 países = 2,592 filas
    Países: Iran, Israel, United States
    Período: 2024-01-01 → 2026-05-13

### Pipeline de construcción

    ACLED (29,811 eventos)
    GDELT (685 artículos + 861 días de tono)    →   DATASET FINAL
    Yahoo Finance (595 días de precios)              2,592 filas
    Embeddings (685 titulares clasificados)          41 columnas

### Procesamiento por fuente

**ACLED** — 29,811 eventos agrupados por país-día:

    acled_dia = df_acled.groupby(['fecha', 'pais']).agg(
        n_eventos     = ('event_type', 'count'),
        n_explosiones = ('event_type', lambda x: (x == 'Explosions/Remote violence').sum()),
        total_bajas   = ('fatalities', 'sum'),
    )

**GDELT** — tono mediático diario:

    tono < -5  → escalada Alta  (2)
    tono < -2  → escalada Media (1)
    tono ≥ -2  → escalada Baja  (0)

**Yahoo Finance** — precio Brent replicado para los 3 países:

    brent_paises = pd.concat([df_brent.assign(pais=p) for p in PAISES])

**GDELT — Análisis lingüístico con Embeddings**

Los 685 títulos descargados de GDELT se procesan con el modelo de lenguaje
`all-MiniLM-L6-v2` de `sentence-transformers`. Este modelo convierte cada
titular en un vector numérico de 384 dimensiones que captura su significado
semántico real — no solo las palabras que contiene.

#### ¿Por qué embeddings y no conteo de palabras?

El conteo simple de palabras tiene limitaciones críticas:

    "Iran denies missile attack"   → conteo = 2 palabras de conflicto
                                     ← INCORRECTO (es una negación)

    "Rocket fired toward Tel Aviv" → "rocket" no está en la lista
                                     ← INCORRECTO (pierde la señal)

Los embeddings entienden el significado real:

    "Iran launches ballistic missiles" → score_alta = 0.538 ✅
    "Iranian missile cluster strike"   → score_alta = 0.520 ✅ (sinónimo)
    "Peace talks resume in Vienna"     → score_baja  = 0.227 ✅

#### ¿Cómo funciona la clasificación?

Se definieron frases de referencia por cada nivel de escalada.
El modelo compara cada titular contra esas frases usando similitud coseno.
El nivel con mayor similitud determina la clasificación del titular.

**Frases de referencia — Nivel ALTA (2):**

    "Iran launches ballistic missile attack on Israel"
    "Israel conducts massive airstrike bombing Iran"
    "Military strike kills dozens in explosion"
    "Civilians killed in rocket attack on city"
    "Warplanes bomb military base causing casualties"

**Frases de referencia — Nivel MEDIA (1):**

    "Military tensions escalate between Iran and Israel"
    "US deploys warships to Persian Gulf amid tensions"
    "Iran threatens retaliation against Israel"
    "Naval vessels patrol Strait of Hormuz"
    "Military forces placed on high alert"

**Frases de referencia — Nivel BAJA (0):**

    "Iran and US resume diplomatic negotiations"
    "Ceasefire agreement reached between parties"
    "Peace talks make progress in Vienna"
    "Both sides agree to de-escalation measures"
    "Sanctions partially lifted after agreement"

#### Pipeline completo del análisis lingüístico

    PASO 1: Cargar los 685 títulos de gdelt_articulos_2026.csv

    PASO 2: Cargar el modelo de embeddings
        modelo = SentenceTransformer('all-MiniLM-L6-v2')

    PASO 3: Calcular embeddings de las frases de referencia
        emb_ref['alta']  = modelo.encode(frases_alta)   # shape (10, 384)
        emb_ref['media'] = modelo.encode(frases_media)  # shape (10, 384)
        emb_ref['baja']  = modelo.encode(frases_baja)   # shape (10, 384)

    PASO 4: Calcular embeddings de cada titular
        emb_titulares = modelo.encode(titulares)  # shape (685, 384)

    PASO 5: Clasificar por similitud coseno
        sim_alta  = cosine_similarity(emb_titular, emb_ref['alta']).mean()
        sim_media = cosine_similarity(emb_titular, emb_ref['media']).mean()
        sim_baja  = cosine_similarity(emb_titular, emb_ref['baja']).mean()
        nivel = max({'alta': sim_alta, 'media': sim_media, 'baja': sim_baja})

    PASO 6: Agregar por país-día
        Para cada país y cada día:
        - nivel_emb_dia    = nivel dominante (moda de los titulares del día)
        - pct_alta_emb     = % titulares clasificados como alta escalada
        - score_alta_prom  = similitud promedio con frases de ataque
        - confianza_prom   = diferencia entre el mejor y segundo mejor score

    PASO 7: Unir al dataset final por fecha + pais

#### Resultados del análisis lingüístico

    Ejemplos clasificados correctamente:

    ALTA (2):
    → [Israel] "Iranian Ballistic Missile Attacks Kill 3 U.S. Servicemen"
               score_alta=0.538 | score_media=0.349 | score_baja=0.186

    → [Israel] "Iranian ballistic missile cluster munitions strike dozens"
               score_alta=0.520 | score_media=0.336 | score_baja=0.190

    MEDIA (1):
    → [Israel] "US moves toward invasion with UAE and Saudi involvement"
               score_alta=0.234 | score_media=0.355 | score_baja=0.219

    → [Israel] "Iran war latest: Non-hostile vessel can now enter Strait"
               score_alta=0.205 | score_media=0.362 | score_baja=0.226

#### Columnas generadas por los embeddings

| Columna | Descripción | Rango |
|---|---|---|
| `nivel_emb_dia` | Nivel dominante del día (0/1/2) | 0 a 2 |
| `pct_alta_emb` | % titulares de alta escalada | 0% a 100% |
| `pct_media_emb` | % titulares de escalada media | 0% a 100% |
| `pct_baja_emb` | % titulares de calma | 0% a 100% |
| `score_alta_prom` | Similitud promedio con frases de ataque | 0 a 0.41 |
| `score_media_prom` | Similitud promedio con frases de tensión | 0 a 0.38 |
| `score_baja_prom` | Similitud promedio con frases de calma | 0 a 0.31 |
| `confianza_prom` | Certeza promedio de la clasificación | 0 a 0.14 |
| `n_titulares` | Titulares procesados ese día | 0 a 101 |

---

## 🎯 TARGET — Nivel de Escalada

    0 = Baja  → 1,361 días (52.5%) → días tranquilos
    1 = Media →   833 días (32.1%) → tensión activa
    2 = Alta  →   398 días (15.4%) → ataques graves

### Lógica de construcción

    def construir_target(row):
        # Prioridad 1: ACLED (eventos físicos verificados)
        if row['escalada_acled'] == 2: return 2
        elif row['escalada_acled'] == 1: return 1
        # Prioridad 2: GDELT (tono mediático)
        if row['tono_gdelt'] < -5: return 2
        elif row['tono_gdelt'] < -2: return 1
        # Prioridad 3: Sentimiento noticias 2026
        if row['sentimiento_medio'] >= 4: return 2
        elif row['sentimiento_medio'] >= 2: return 1
        return 0

---

## 📋 Estructura del Dataset Final

### 41 columnas organizadas en 7 grupos

**ÍNDICES (2)**

    fecha, pais

**TARGET (1)**

    target → 0=Baja / 1=Media / 2=Alta

**ACLED — Eventos físicos (7)**

    n_eventos, n_batallas, n_explosiones, n_protestas,
    total_bajas, pob_afectada_1km, escalada_acled

**GDELT — Señal mediática (5)**

    tono_gdelt, escalada_gdelt, n_articulos_2026,
    sentimiento_medio, n_fuentes_2026

**YAHOO FINANCE — Señal económica (3)**

    precio_brent, brent_variacion, brent_7d

**VENTANAS TEMPORALES (14)**

    tono_gdelt_3d, tono_gdelt_7d, tono_gdelt_cambio,
    total_bajas_acum5d, total_bajas_cambio,
    n_eventos_3d, n_eventos_cambio, n_explosiones_acum5d,
    sentimiento_medio_3d, sentimiento_medio_7d,
    precio_brent_cambio, brent_variacion_3d,
    n_articulos_2026_3d, n_articulos_2026_cambio

**EMBEDDINGS — Sentido lingüístico de títulos GDELT (9)**

    nivel_emb_dia, pct_alta_emb, pct_media_emb, pct_baja_emb,
    score_alta_prom, score_media_prom, score_baja_prom,
    confianza_prom, n_titulares

    → Generadas aplicando embeddings sobre los títulos de GDELT 2026

---

---

## ⚠️ Limitaciones

- ACLED solo cubre hasta mayo 2025 con eventos físicos verificados
- El período 2025-2026 usa señal mediática como proxy de escalada
- GDELT captura más noticias en inglés — eventos en persa o hebreo pueden estar subrepresentados
- Algunos titulares de GDELT contienen ruido no relacionado al conflicto
 
