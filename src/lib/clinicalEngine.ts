export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH';

export interface ClinicalResult {
  riskLevel: RiskLevel;
  riskScore: number; // 0 – 100
  summary: string;
  recommendations: string[];
  abnormalFields: string[];
  dataQuality: 'GOOD' | 'PARTIAL' | 'POOR';
}

/* =========================
   PROTOTYPE CLINICAL RANGES
   (Aligned with ESP + Prototype)
   ========================= */

const NORMAL_RANGES = {
  temp: { min: 31.0, max: 37.5 },   // °C (prototype relaxed)
  hr: { min: 60, max: 100 },        // bpm
  spo2: { min: 80, max: 100 },      // %
};

/* =========================
   MAIN ANALYSIS FUNCTION
   ========================= */

export function analyzeVitals(vital: {
  temp: number | null;
  hr: number | null;
  spo2: number | null;
  audio: number | null;
}) : ClinicalResult {

  let riskScore = 0;
  const abnormal: string[] = [];
  const recommendations: string[] = [];

  let validCount = 0;
  let invalidCount = 0;

  /* =========================
     TEMPERATURE ANALYSIS
     ========================= */

  if (vital.temp == null) {
    invalidCount++;
    recommendations.push('Temperature not recorded. Ensure skin contact.');
  } else {
    validCount++;

    if (vital.temp < 25 || vital.temp > 45) {
      riskScore += 20;
      abnormal.push('Temperature (Sensor Error)');
      recommendations.push('Temperature reading unrealistic. Check sensor wiring.');
    }
    else if (vital.temp < NORMAL_RANGES.temp.min) {
      riskScore += 10;
      abnormal.push('Temperature (Low)');
      recommendations.push('Possible hypothermia. Recheck sensor placement.');
    }
    else if (vital.temp > NORMAL_RANGES.temp.max) {
      riskScore += 20;
      abnormal.push('Temperature (High)');
      recommendations.push('Elevated temperature detected. Monitor closely.');
    }
  }

  /* =========================
     HEART RATE ANALYSIS
     ========================= */

  if (vital.hr == null) {
    invalidCount++;
    recommendations.push('Heart rate not detected. Place finger properly.');
  } else {
    validCount++;

    if (vital.hr === 0) {
      riskScore += 35;
      abnormal.push('Heart Rate (Invalid)');
      recommendations.push('No pulse detected. Ensure proper finger placement.');
    }
    else if (vital.hr < 30 || vital.hr > 200) {
      riskScore += 30;
      abnormal.push('Heart Rate (Sensor Error)');
      recommendations.push('Heart rate reading unrealistic. Check sensor.');
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

  /* =========================
     SpO₂ ANALYSIS
     ========================= */

  if (vital.spo2 == null) {
    invalidCount++;
    recommendations.push('SpO₂ not recorded. Ensure stable finger contact.');
  } else {
    validCount++;

    if (vital.spo2 < 50 || vital.spo2 > 100) {
      riskScore += 30;
      abnormal.push('SpO₂ (Sensor Error)');
      recommendations.push('SpO₂ reading unrealistic. Check sensor.');
    }
    else if (vital.spo2 < NORMAL_RANGES.spo2.min) {
      riskScore += 35;
      abnormal.push('SpO₂ (Low)');
      recommendations.push('Low oxygen saturation detected. Immediate evaluation recommended.');
    }
  }

  /* =========================
     AUDIO QUALITY CHECK
     ========================= */

  if (vital.audio != null) {
    validCount++;
    if (vital.audio < 1000) {
      recommendations.push('Low acoustic signal detected. Reposition stethoscope.');
    }
  }

  /* =========================
     DATA QUALITY SCORE
     ========================= */

  let dataQuality: 'GOOD' | 'PARTIAL' | 'POOR' = 'GOOD';

  if (invalidCount >= 2) dataQuality = 'POOR';
  else if (invalidCount === 1) dataQuality = 'PARTIAL';

  /* =========================
     RISK LEVEL
     ========================= */

  let riskLevel: RiskLevel = 'LOW';

  if (riskScore >= 60) riskLevel = 'HIGH';
  else if (riskScore >= 30) riskLevel = 'MODERATE';

  /* =========================
     SUMMARY GENERATION
     ========================= */

  let summary = '';

  if (dataQuality === 'POOR') {
    summary = 'Insufficient reliable data. Re-measure required.';
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