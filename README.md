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
| 2 | **GDELT** | Señal mediática | 2025-05 → 2026-05 | ❌ Sin registro |
| 3 | **Yahoo Finance** | Señal económica | 2024-01 → 2026-05 | ❌ Sin registro |
| 4 | **Embeddings** | Sentido lingüístico | 2026-02 → 2026-05 | ❌ Sin registro |

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

**Embeddings** — clasificación semántica de titulares con similitud coseno:

    modelo = SentenceTransformer('all-MiniLM-L6-v2')
    similitud = cosine_similarity(embedding_titular, embeddings_referencia)

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

**EMBEDDINGS — Sentido lingüístico (9)**

    nivel_emb_dia, pct_alta_emb, pct_media_emb, pct_baja_emb,
    score_alta_prom, score_media_prom, score_baja_prom,
    confianza_prom, n_titulares

---

## ⚠️ Limitaciones

- ACLED solo cubre hasta mayo 2025 con eventos físicos verificados
- El período 2025-2026 usa señal mediática como proxy de escalada
- GDELT captura más noticias en inglés — eventos en persa o hebreo pueden estar subrepresentados
- Algunos titulares de GDELT contienen ruido no relacionado al conflicto
