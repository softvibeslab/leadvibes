---
id: SCORE-001
version: 0.0.1
status: draft
created: 2026-03-20
updated: 2026-03-20
author: @RogerVibes
priority: critical
category: feature
labels:
  - machine-learning
  - lead-scoring
  - predictive-analytics
  - ml-model
depends_on:
  - LEAD-001
  - ANAL-001
blocks: []
related_specs: []
scope:
  packages:
    - backend/services/scoring_service.py
    - backend/api/scoring.py
  files:
    - scoring_model.pkl
    - feature_engineering.py
    - lead_score_calculator.py
---

# @SPEC:SCORE-001: Lead Scoring Engine con Machine Learning

## HISTORY

### v0.0.1 (2026-03-20)
- **INITIAL**: Lead Scoring Engine con Machine Learning - Creación inicial
- **AUTHOR**: @RogerVibes
- **SCOPE**: Sistema predictivo que califica leads del 1-100 basado en datos demográficos, comportamiento, fuente e interacciones
- **CONTEXT**: Brokers pierden tiempo contactando leads no calificados. Se necesita priorización automática basada en patrones de conversión históricos
- **REASON**: Aumentar tasa de conversión del 5% al 10% enfocándose en leads con mayor probabilidad de compra

---

## Environment

### Contexto de Negocio

- **Problema Actual**: Brokers tratan todos los leads igual, gastando tiempo en prospectos no calificados
- **Objetivo**: Priorizar leads con mayor probabilidad de conversión (score alto)
- **Impacto Esperado**: Aumentar conversión de 5% → 10% y reducir tiempo de cierre

### Infraestructura de Machine Learning

- **Lenguaje**: Python 3.11+
- **Frameworks**:
  - scikit-learn (modelos clásicos: Random Forest, Gradient Boosting)
  - pandas, numpy (procesamiento de datos)
  - joblib (serialización de modelos)
- **Almacenamiento**: MongoDB para datos de entrenamiento y predicciones
- **Schedule**: Retraining semanal del modelo con nuevos datos

### Data Sources

- **Lead Data**: Demográficos (edad, ubicación, presupuesto), fuente (Facebook, Instagram, Referido)
- **Behavioral Data**: Interacciones previas (llamadas, emails, visitas web)
- **Historical Data**: Leads convertidos vs no convertidos (últimos 6 meses)
- **External Data**: (Opcional) Datos socioeconomicos de zona geográfica

---

## Assumptions

1. **Datos Históricos Disponibles**: Mínimo 1000 leads con etiqueta de conversión (sí/no)
2. **Feature Engineering**: Variables predictoras pueden extraerse de datos existentes
3. **Modelo Actualizable**: Modelo se reentrena semanalmente con nuevos datos
4. **Explicabilidad**: Score debe ser interpretable por brokers (no caja negra)
5. **Fallback**: Si ML model falla, usa rule-based scoring como backup

---

## Requirements

### Ubiquitous Requirements (Básicas)

- El sistema debe calcular un score de 1-100 para cada lead
- El sistema debe actualizar score automáticamente cuando hay nueva interacción
- El sistema debe explicar por qué un lead tiene cierto score (feature importance)
- El sistema debe reentrenar el modelo semanalmente con datos nuevos
- El sistema debe proveer endpoints para consultar y recalcular scores

### Event-driven Requirements (WHEN-THEN)

- **WHEN** se crea un nuevo lead, el sistema debe calcular score inicial en <5 segundos
- **WHEN** un lead tiene nueva actividad (llamada, email), el sistema debe actualizar score
- **WHEN** se consulta `/leads/score/{id}`, el sistema debe retornar score + explicación
- **WHEN** el modelo se reentrena, el sistema debe comparar accuracy vs versión anterior
- **WHEN** el accuracy del modelo baja del 70%, el sistema debe alertar al admin

### State-driven Requirements (WHILE-THEN)

- **WHILE** se calcula score, el sistema debe mostrar loading state en UI
- **WHILE** el modelo se reentrena, el sistema debe seguir usando versión anterior
- **WHILE** un lead aumenta su score, el sistema debe notificar al broker asignado

### Optional Requirements (WHERE-THEN)

- **WHERE** un lead tiene score >80, el sistema debe resaltarlo en dashboard como "hot lead"
- **WHERE** un broker pide "leads prioritarios", el sistema debe ordenar por score descendente
- **WHERE** se detecta patrón inusual (score cambia drásticamente), el sistema debe loggear para análisis

### Constraints (IF-THEN)

- **IF** un lead tiene <24 horas de creado, el sistema debe usar reglas estáticas (sin ML)
- **IF** el modelo ML no está disponible, el sistema debe usar rule-based scoring
- **IF** un lead tiene datos incompletos (<50% de features), el sistema debe asignar score mínimo (1-10)
- **IF** el score no puede calcularse, el sistema debe asignar valor default: 50
- **IF** un lead se convierte, el sistema debe guardar como caso de éxito para retraining

---

## Specifications

### @CODE:SCORE-001:MODEL Machine Learning Model

**Ubicación**: `backend/services/scoring_service.py`

#### Features Predictorias

1. **Demográficas**
   - `age_range`: 18-25, 26-35, 36-45, 46-55, 55+ (one-hot encoded)
   - `location_zone`: Tulum Centro, La Veleta, Aldea Zama, etc.
   - `budget_range`: <$1M, $1-2M, $2-3M, $3-5M, >$5M

2. **Fuente del Lead**
   - `source`: Facebook Ads, Instagram, Referido, Web, Evento
   - `campaign_id`: ID de campaña que generó el lead

3. **Comportamiento**
   - `hours_to_first_contact`: Tiempo entre lead creado → primera actividad
   - `total_interactions`: Cantidad de llamadas + emails + WhatsApp
   - `last_interaction_days`: Días desde última interacción
   - `response_rate`: (Respuestas / Mensajes enviados)

4. **Engagement**
   - `visited_properties`: Cantidad de propiedades visitadas
   - `requested_info`: Solicitó más información (bool)
   - `attended_presentation`: Asistió a presentación (bool)

#### Algoritmo de ML

- **Modelo Principal**: Gradient Boosting Classifier (scikit-learn)
- **Features**: 20-30 variables predictoras
- **Target Variable`: `converted` (1 = venta, 0 = no venta)
- **Métricas Objetivo**:
  - Accuracy: ≥75%
  - Precision: ≥70% (minimizar falsos positivos)
  - Recall: ≥65% (capturar la mayoría de leads que compran)
  - F1-Score: ≥68%

#### Feature Importance (Interpretabilidad)

Para cada lead, el sistema debe retornar:
- **Score Total**: 1-100
- **Top 3 Factores Positivos**: "Presupuesto alto (+15)", "Referido (+12)", "Respondió rápido (+10)"
- **Top 3 Factores Negativos**: "Sin interacciones (-20)", "Fuente genérica (-5)", "Ubicación lejana (-3)"

---

### @CODE:SCORE-001:API Scoring Endpoints

**Ubicación**: `backend/api/scoring.py` (nuevo módulo)

#### Endpoints

1. **GET `/leads/score/{lead_id}`**
   - **Descripción**: Obtener score actual de un lead
   - **Response**:
     ```json
     {
       "lead_id": "uuid",
       "score": 78,
       "percentile": 85,  // Top 15% de todos los leads
       "factors": {
         "positive": ["Presupuesto $2-3M (+15)", "Referido (+12)", "Respondió en 2h (+10)"],
         "negative": ["Solo 1 interacción (-5)", "Sin visitas (-3)"]
       },
       "recommendation": "Prioritario - Llamar hoy mismo"
     }
     ```

2. **POST `/leads/score/recalculate/{lead_id}`**
   - **Descripción**: Forzar recálculo de score (útil después de nueva actividad)
   - **Response**: Same as GET `/leads/score/{lead_id}`

3. **GET `/leads/score/top?limit=10`**
   - **Descripción**: Obtener top N leads con mayor score
   - **Use Case**: Broker pide "mis mejores leads"
   - **Response**: Array de leads ordenados por score descendente

4. **POST `/scoring/model/retrain`**
   - **Descripción**: Forzar retraining del modelo (admin only)
   - **Process**:
     1. Extraer todos los leads con etiqueta de conversión
     2. Feature engineering
     3. Split train/test (80/20)
     4. Entrenar nuevo modelo
     5. Evaluar accuracy vs modelo anterior
     6. Si mejora → deploy nuevo modelo
   - **Response**:
     ```json
     {
       "old_accuracy": 0.72,
       "new_accuracy": 0.76,
       "improvement": 0.04,
       "deployed": true,
       "training_samples": 1500
     }
     ```

---

### @CODE:SCORE-001:FALLBACK Rule-Based Scoring (Backup)

**Ubicación**: `backend/services/scoring_service.py`

Si ML model falla o no hay suficientes datos, usar reglas estáticas:

```python
def rule_based_score(lead: Lead) -> int:
    score = 50  # Base score

    # Fuente del lead
    if lead.source == "referido":
        score += 20
    elif lead.source in ["facebook", "instagram"]:
        score += 10
    elif lead.source == "web":
        score += 5

    # Presupuesto
    if lead.budget >= 3000000:  # >$3M MXN
        score += 15
    elif lead.budget >= 2000000:
        score += 10

    # Interacciones
    if lead.total_interactions >= 5:
        score += 15
    elif lead.total_interactions >= 2:
        score += 5

    # Tiempo de respuesta
    if lead.hours_to_first_contact <= 2:
        score += 10
    elif lead.hours_to_first_contact <= 24:
        score += 5

    return max(1, min(100, score))  # Clamp 1-100
```

---

## Traceability (@TAG)

- **SPEC**: @SPEC:SCORE-001
- **TEST**:
  - `backend/tests/test_scoring.py` → @TEST:SCORE-001
  - `backend/tests/test_scoring_model.py` → @TEST:SCORE-001:MODEL
- **CODE**:
  - `backend/services/scoring_service.py` → @CODE:SCORE-001:SERVICE
  - `backend/api/scoring.py` → @CODE:SCORE-001:API
  - `backend/models.py` → @CODE:SCORE-001:DATA (LeadScore model)
- **DOC**: `docs/lead-scoring-guide.md` → @DOC:SCORE-001

---

## Acceptance Criteria

### Criterios de Aceptación

1. **Modelo ML Entrenado**: Accuracy ≥75% en dataset de test
2. **Score en Tiempo Real**: Lead nuevo recibe score en <5 segundos
3. **Interpretabilidad**: Cada score incluye top 3 factores positivos/negativos
4. **Retraining Automático**: Modelo se reentrena semanalmente
5. **Fallback Funcionando**: Si ML falla, rule-based scoring funciona correctamente

### Definición de Done

- [ ] Modelo ML entrenado con 1000+ leads históricos
- [ ] Accuracy ≥75%, Precision ≥70%, Recall ≥65%
- [ ] Endpoints `/leads/score/*` funcionando y testeados
- [ ] Interfaz UI muestra score en lista de leads
- [ ] Sistema de retraining automático configurado (cron job)
- [ ] Documentación de feature engineering creada
- [ ] Monitoreo de accuracy del modelo en dashboard de analytics
