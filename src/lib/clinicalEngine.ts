/* =========================================
   CLINICAL ENGINE – AURA-STETH AI
   Prototype + Intelligent Evaluation
========================================= */

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH';

export interface ClinicalResult {
  riskLevel: RiskLevel;
  riskScore: number; // 0 – 100
  summary: string;
  recommendations: string[];
  abnormalFields: string[];
  dataQuality: 'GOOD' | 'PARTIAL' | 'POOR';
}

/* =========================================
   PROTOTYPE CLINICAL RANGES
   (Aligned with ESP behaviour)
========================================= */

export const NORMAL_RANGES = {
  temp: { min: 31.0, max: 37.5, unit: '°C' },
  hr: { min: 60, max: 100, unit: 'bpm' },
  spo2: { min: 80, max: 100, unit: '%' },
};

/* =========================================
   MAIN ANALYSIS FUNCTION
========================================= */

export function analyzeVitals(vital: {
  temp: number | null;
  hr: number | null;
  spo2: number | null;
  audio: number | null;
}): ClinicalResult {

  let riskScore = 0;
  const abnormal: string[] = [];
  const recommendations: string[] = [];

  let validCount = 0;
  let invalidCount = 0;

  /* =========================================
     TEMPERATURE
  ========================================= */

  if (vital.temp == null) {
    invalidCount++;
    recommendations.push('Temperature not recorded. Ensure proper skin contact.');
  } else {
    validCount++;

    if (vital.temp < 20 || vital.temp > 45) {
      riskScore += 25;
      abnormal.push('Temperature (Sensor Error)');
      recommendations.push('Unrealistic temperature value detected. Check sensor wiring.');
    }
    else if (vital.temp < NORMAL_RANGES.temp.min) {
      riskScore += 10;
      abnormal.push('Temperature (Low)');
      recommendations.push('Low body temperature detected. Recheck placement.');
    }
    else if (vital.temp > NORMAL_RANGES.temp.max) {
      riskScore += 20;
      abnormal.push('Temperature (High)');
      recommendations.push('Elevated temperature detected. Monitor closely.');
    }
  }

  /* =========================================
     HEART RATE
  ========================================= */

  if (vital.hr == null) {
    invalidCount++;
    recommendations.push('Heart rate not detected. Place finger correctly.');
  } else {
    validCount++;

    if (vital.hr === 0) {
      riskScore += 35;
      abnormal.push('Heart Rate (Invalid)');
      recommendations.push('No pulse detected. Ensure proper finger placement.');
    }
    else if (vital.hr < 25 || vital.hr > 220) {
      riskScore += 30;
      abnormal.push('Heart Rate (Sensor Error)');
      recommendations.push('Unrealistic heart rate value. Check sensor stability.');
    }
    else if (vital.hr < NORMAL_RANGES.hr.min) {
      riskScore += 25;
      abnormal.push('Heart Rate (Low)');
      recommendations.push('Bradycardia suspected.');
    }
    else if (vital.hr > NORMAL_RANGES.hr.max) {
      riskScore += 25;
      abnormal.push('Heart Rate (High)');
      recommendations.push('Tachycardia suspected.');
    }
  }

  /* =========================================
     SpO₂
  ========================================= */

  if (vital.spo2 == null) {
    invalidCount++;
    recommendations.push('SpO₂ not recorded. Ensure stable finger contact.');
  } else {
    validCount++;

    if (vital.spo2 < 50 || vital.spo2 > 100) {
      riskScore += 30;
      abnormal.push('SpO₂ (Sensor Error)');
      recommendations.push('Unrealistic SpO₂ value. Check sensor positioning.');
    }
    else if (vital.spo2 < NORMAL_RANGES.spo2.min) {
      riskScore += 35;
      abnormal.push('SpO₂ (Low)');
      recommendations.push('Low oxygen saturation detected. Immediate evaluation recommended.');
    }
  }

  /* =========================================
     AUDIO QUALITY
  ========================================= */

  if (vital.audio != null) {
    validCount++;

    if (vital.audio < 800) {
      recommendations.push('Weak acoustic signal detected. Reposition stethoscope.');
    }

    if (vital.audio > 1000000) {
      abnormal.push('Audio (Noise Spike)');
      recommendations.push('Excessive acoustic spike detected. Reduce environmental noise.');
    }
  }

  /* =========================================
     DATA QUALITY EVALUATION
  ========================================= */

  let dataQuality: 'GOOD' | 'PARTIAL' | 'POOR' = 'GOOD';

  if (invalidCount >= 2) {
    dataQuality = 'POOR';
    riskScore += 20;
  }
  else if (invalidCount === 1) {
    dataQuality = 'PARTIAL';
    riskScore += 10;
  }

  /* Cap risk score */
  if (riskScore > 100) riskScore = 100;

  /* =========================================
     RISK LEVEL DETERMINATION
  ========================================= */

  let riskLevel: RiskLevel = 'LOW';

  if (riskScore >= 60) riskLevel = 'HIGH';
  else if (riskScore >= 30) riskLevel = 'MODERATE';

  /* =========================================
     SUMMARY GENERATION
  ========================================= */

  let summary = '';

  if (dataQuality === 'POOR') {
    summary = 'Insufficient reliable data. Re-measurement required.';
  }
  else if (riskLevel === 'LOW') {
    summary = 'Vitals within acceptable physiological limits.';
  }
  else if (riskLevel === 'MODERATE') {
    summary = 'Some parameters outside normal range. Monitoring recommended.';
  }
  else {
    summary = 'Critical deviations detected. Immediate medical attention advised.';
  }

  return {
    riskLevel,
    riskScore,
    summary,
    recommendations,
    abnormalFields: abnormal,
    dataQuality,
  };
}