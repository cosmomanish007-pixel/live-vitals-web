export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH';

export interface ClinicalResult {
  riskLevel: RiskLevel;
  riskScore: number; // 0 – 100
  summary: string;
  recommendations: string[];
  abnormalFields: string[];
}

/* =========================
   NORMAL CLINICAL RANGES
   ========================= */

const NORMAL_RANGES = {
  temp: { min: 36.1, max: 37.5 },   // °C
  hr: { min: 60, max: 100 },        // bpm
  spo2: { min: 95, max: 100 },      // %
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

  /* ===== Temperature ===== */
  if (vital.temp != null) {
    if (vital.temp < NORMAL_RANGES.temp.min) {
      riskScore += 10;
      abnormal.push('Temperature (Low)');
      recommendations.push('Possible hypothermia. Recheck sensor placement.');
    }
    if (vital.temp > NORMAL_RANGES.temp.max) {
      riskScore += 20;
      abnormal.push('Temperature (High)');
      recommendations.push('Fever detected. Monitor closely.');
    }
  }

  /* ===== Heart Rate ===== */
  if (vital.hr != null) {
    if (vital.hr === 0) {
      riskScore += 40;
      abnormal.push('Heart Rate (Sensor Error)');
      recommendations.push('Heart rate reading invalid. Ensure proper finger placement.');
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

  /* ===== SpO2 ===== */
  if (vital.spo2 != null) {
    if (vital.spo2 < NORMAL_RANGES.spo2.min) {
      riskScore += 35;
      abnormal.push('SpO₂ (Low)');
      recommendations.push('Low oxygen saturation detected. Immediate evaluation recommended.');
    }
  }

  /* ===== Risk Level Logic ===== */
  let riskLevel: RiskLevel = 'LOW';

  if (riskScore >= 60) riskLevel = 'HIGH';
  else if (riskScore >= 30) riskLevel = 'MODERATE';

  /* ===== Summary Generation ===== */
  let summary = '';

  if (riskLevel === 'LOW') {
    summary = 'Vitals within acceptable physiological limits.';
  } else if (riskLevel === 'MODERATE') {
    summary = 'Some parameters outside normal range. Monitoring recommended.';
  } else {
    summary = 'Critical deviations detected. Immediate medical attention advised.';
  }

  return {
    riskLevel,
    riskScore,
    summary,
    recommendations,
    abnormalFields: abnormal,
  };
}