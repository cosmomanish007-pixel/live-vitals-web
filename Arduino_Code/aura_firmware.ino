#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"
#include <driver/i2s.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <SPIFFS.h>
#include <ArduinoJson.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>
#include <base64.h>

// SpO2 Lookup Table (184 values)
const uint8_t spo2_table[184] = {
  95, 95, 95, 96, 96, 96, 97, 97, 97, 97, 97, 98, 98, 98, 98, 98, 99, 99, 99, 99,
  99, 99, 99, 99, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
  100, 100, 100, 100, 99, 99, 99, 99, 99, 99, 99, 99, 98, 98, 98, 98, 98, 98, 97, 97,
  97, 97, 96, 96, 96, 96, 95, 95, 95, 94, 94, 94, 93, 93, 93, 92, 92, 92, 91, 91,
  90, 90, 89, 89, 89, 88, 88, 87, 87, 86, 86, 85, 85, 84, 84, 83, 82, 82, 81, 81,
  80, 80, 79, 78, 78, 77, 76, 76, 75, 74, 74, 73, 72, 72, 71, 70, 69, 69, 68, 67,
  66, 66, 65, 64, 63, 62, 62, 61, 60, 59, 58, 57, 56, 56, 55, 54, 53, 52, 51, 50,
  49, 48, 47, 46, 45, 44, 43, 42, 41, 40, 39, 38, 37, 36, 35, 34, 33, 31, 30, 29,
  28, 27, 26, 25, 23, 22, 21, 20, 19, 17, 16, 15, 14, 12, 11, 10, 9, 7, 6, 5,
  3, 2, 1
};

// ===== FUNCTION PROTOTYPES =====
void logStep(const char* msg);
void readTemp();
void readAudio();
void resetVitals();
void readVitals();
void sendToAIBackend();
void recordAndSaveWav();
void warmupBackend();
void fetchLatestSession();
void updateSessionState(const char* state);
void sendWifiVitals(String json);
void writeWavHeader(File &file, uint32_t totalSamples);
void wifiConnect();
void oledMsg(const char* line1, const char* line2, const char* line3);
void oledProgress(const char* title, const char* subtitle, int percent);
void oledCountdown(const char* title, const char* sub, unsigned long elapsed, unsigned long total);

// ===== FAILSAFE MODE CONFIGURATION =====
#define FAILSAFE_MODE  // Comment this line to disable failsafe mode for testing

// ===== HC12 Failsafe Configuration =====
#define HC12_RX_PIN 4
#define HC12_TX_PIN 5
#define HC12_BAUD   9600
HardwareSerial HC12(2);  // Use UART2

// Failsafe mode flag
bool failsafeActive = false;

/* ===================== WIFI + SUPABASE ===================== */
// 🔐 Replace with your actual credentials before flashing
#define WIFI_SSID       "YOUR_WIFI_SSID"
#define WIFI_PASS       "YOUR_WIFI_PASSWORD"

#define SUPABASE_URL    "https://YOUR_PROJECT_ID.supabase.co"
#define SUPABASE_KEY    "YOUR_SUPABASE_ANON_KEY"

#define AI_BACKEND_HOST "YOUR_HF_USERNAME-YOUR_HF_SPACE_NAME.hf.space"
#define AI_BACKEND_URL  "https://YOUR_HF_USERNAME-YOUR_HF_SPACE_NAME.hf.space/predict/full"
#define AI_HEALTH_URL   "https://YOUR_HF_USERNAME-YOUR_HF_SPACE_NAME.hf.space/health"

bool   wifiEnabled = true;
String sessionId   = "";

/* ===================== TWILIO CONFIGURATION ===================== */
// 🔐 Replace with your actual Twilio credentials before flashing
#define TWILIO_ACCOUNT_SID      "YOUR_TWILIO_ACCOUNT_SID"
#define TWILIO_AUTH_TOKEN       "YOUR_TWILIO_AUTH_TOKEN"
#define TWILIO_PHONE_NUMBER     "+1XXXXXXXXXX"       // Your Twilio number
#define EMERGENCY_PHONE_NUMBER  "+91XXXXXXXXXX"      // Emergency contact number

// Track if alert already sent for current session
bool alertSentForSession = false;

/* ===================== OLED ===================== */
#define OLED_ADDR 0x3C
Adafruit_SH1106G display = Adafruit_SH1106G(128, 64, &Wire);

/* ===================== PINS ===================== */
#define SDA_PIN 8
#define SCL_PIN 9

#define TEMP_ADDR 0x48
#define TEMP_REG  0x00

#define I2S_WS   13
#define I2S_SCK  14
#define I2S_SD   15
#define I2S_PORT I2S_NUM_0

#define LED_RED_PIN    2
#define LED_YELLOW_PIN 21
#define LED_GREEN_PIN  41
#define BUZZER_PIN     42


bool alertActive = false;
String alertStatus = "GREEN";
unsigned long alertStartTime = 0;
unsigned long lastToggle = 0;
bool alertState = false;




/* ===================== TIMINGS ===================== */
#define TEMP_DURATION   30000UL
#define AUDIO_DURATION  30000UL
#define VITALS_DURATION 30000UL

/* ===================== STATES ===================== */
enum SystemState { IDLE, TEMP_MEASURE, AUDIO_MEASURE, VITALS_MEASURE, FINAL_REPORT };
SystemState   currentState   = IDLE;
unsigned long stateStartTime = 0;

/* ===================== SENSORS ===================== */
MAX30105 hrSensor;

#define FINGER_ON_THRESHOLD 60000
#define MIN_BEAT_INTERVAL   250
#define MAX_BEAT_INTERVAL   1800

byte  rates[8];
byte  rateSpot    = 0;
byte  validBeats  = 0;
long  lastBeatTime = 0;
int   avgBPM      = 0;
bool  fingerPresent = false;

float spo2Avg   = 0;
bool  spo2Valid = false;

// ===== SpO2 buffers =====
#define SPO2_BUFFER 50

uint32_t irBuffer[SPO2_BUFFER];
uint32_t redBuffer[SPO2_BUFFER];
int bufferIndex = 0;

float irAC = 0, irDC = 0;
float redAC = 0, redDC = 0;

int32_t i2s_samples[512];
int     audioPeakFinal = 0;

float skinTemp         = 0;
float skinTempFiltered = 0;
float skinTempFinal    = 0;

/* ===================== AI RESULTS ===================== */
String ai_heart_label  = "Unknown";
float  ai_heart_prob   = 0.0;
String ai_lung_label   = "Unknown";
float  ai_lung_conf    = 0.0;
float  ai_bpm_model    = 0.0;
float  ai_sqi          = 0.0;
bool   ai_alert        = false;
bool   ai_done         = false;
float  ai_systole_ms   = 0.0;
float  ai_diastole_ms  = 0.0;
bool   ai_sys_murmur   = false;
bool   ai_dia_murmur   = false;
String ai_valve_risk   = "None";
float  ai_normal_pct   = 0.0;
float  ai_crackle_pct  = 0.0;
float  ai_wheeze_pct   = 0.0;
bool   ai_artifact     = false;
String ai_warning      = "";

/* ===================== WAV ===================== */
#define SAMPLE_RATE    16000
#define RECORD_SECONDS 10
#define WAV_FILE       "/aura_audio.wav"

/* ===================== OLED HELPERS ===================== */
void oledMsg(const char* line1, const char* line2 = "", const char* line3 = "") {
  display.clearDisplay();
  display.setTextColor(SH110X_WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0);  display.println(line1);
  display.setCursor(0, 22); display.println(line2);
  display.setCursor(0, 44); display.println(line3);
  display.display();
}

void oledProgress(const char* title, const char* subtitle, int percent) {
  percent = constrain(percent, 0, 100);
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  display.setCursor(0, 0);  display.println(title);
  display.setCursor(0, 14); display.println(subtitle);
  display.drawRect(0, 40, 128, 12, SH110X_WHITE);
  int fillW = (percent * 124) / 100;
  if (fillW > 0) display.fillRect(2, 42, fillW, 8, SH110X_WHITE);
  display.setCursor(100, 52);
  display.printf("%d%%", percent);
  display.display();
}

void oledCountdown(const char* title, const char* sub,
                   unsigned long elapsed, unsigned long total) {
  int pct      = (int)((elapsed * 100UL) / total);
  int secsLeft = (int)((total - elapsed) / 1000);
  char buf[36];
  snprintf(buf, sizeof(buf), "%s %ds", sub, secsLeft);
  oledProgress(title, buf, pct);
}

void updateAlert() {

  if (!alertActive) return;

  unsigned long now = millis();

  if (now - alertStartTime > 15000) {
    digitalWrite(LED_RED_PIN, LOW);
    digitalWrite(LED_YELLOW_PIN, LOW);
    digitalWrite(LED_GREEN_PIN, LOW);
    digitalWrite(BUZZER_PIN, LOW);
    alertActive = false;
    return;
  }

  if (alertStatus == "GREEN") {
    digitalWrite(LED_RED_PIN, LOW);
    digitalWrite(LED_YELLOW_PIN, LOW);
    digitalWrite(LED_GREEN_PIN, HIGH);
    digitalWrite(BUZZER_PIN, LOW);
    return;
  }

  int interval = (alertStatus == "RED") ? 200 : 200;

  if (now - lastToggle >= interval) {
    lastToggle = now;
    alertState = !alertState;

    if (alertStatus == "RED") {
      digitalWrite(LED_RED_PIN, alertState);
      digitalWrite(LED_YELLOW_PIN, LOW);
      digitalWrite(LED_GREEN_PIN, LOW);
    } 
    else if (alertStatus == "YELLOW") {
      digitalWrite(LED_RED_PIN, LOW);
      digitalWrite(LED_YELLOW_PIN, alertState);
      digitalWrite(LED_GREEN_PIN, LOW);
    }

    digitalWrite(BUZZER_PIN, alertState);
  }
}

/* ===================== HF SPACE WARMUP ===================== */
void warmupBackend() {
  Serial.println("🔥 Warming up HF Space...");
  oledMsg("AURA AI", "Waking up AI...", "~20s wait");

  HTTPClient http;
  http.begin(AI_HEALTH_URL);
  http.setTimeout(15000);

  unsigned long start = millis();
  int attempts = 0;

  while (millis() - start < 25000) {
    unsigned long elapsed = millis() - start;
    int percent = (int)((elapsed * 100UL) / 25000UL);
    char buf[24];
    snprintf(buf, sizeof(buf), "Ping %d...", ++attempts);
    oledProgress("Waking AI Backend", buf, percent);

    int code = http.GET();
    if (code == 200) {
      Serial.println("✅ HF Space awake!");
      oledMsg("AI Backend", "Ready!", "");
      delay(800);
      http.end();
      return;
    }
    Serial.printf("   Ping %d → %d\n", attempts, code);
    delay(3000);
  }
  Serial.println("⚠️ Backend slow — continuing");
  oledMsg("AI Backend", "Starting...", "Continuing");
  delay(800);
  http.end();
}

/* ===================== WAV HEADER ===================== */
void writeWavHeader(File &file, uint32_t totalSamples) {
  uint32_t dataSize      = totalSamples * 2;
  uint32_t fileSize      = dataSize + 36;
  uint32_t sampleRate    = SAMPLE_RATE;
  uint16_t channels      = 1;
  uint16_t bitsPerSample = 16;
  uint32_t byteRate      = sampleRate * channels * bitsPerSample / 8;
  uint16_t blockAlign    = channels * bitsPerSample / 8;

  file.seek(0);
  file.write((uint8_t*)"RIFF", 4);
  file.write((uint8_t*)&fileSize,      4);
  file.write((uint8_t*)"WAVE",         4);
  file.write((uint8_t*)"fmt ",         4);
  uint32_t fmtSize   = 16; file.write((uint8_t*)&fmtSize,      4);
  uint16_t audioFmt  = 1;  file.write((uint8_t*)&audioFmt,     2);
  file.write((uint8_t*)&channels,      2);
  file.write((uint8_t*)&sampleRate,    4);
  file.write((uint8_t*)&byteRate,      4);
  file.write((uint8_t*)&blockAlign,    2);
  file.write((uint8_t*)&bitsPerSample, 2);
  file.write((uint8_t*)"data",         4);
  file.write((uint8_t*)&dataSize,      4);
}

/* ===================== RECORD WAV ===================== */
void recordAndSaveWav() {
  Serial.println("🎙️ Recording WAV...");

  uint32_t totalSamples = SAMPLE_RATE * RECORD_SECONDS;

  File f = SPIFFS.open(WAV_FILE, FILE_WRITE);
  if (!f) { Serial.println("❌ SPIFFS open failed"); return; }

  uint8_t blank[44] = {0};
  f.write(blank, 44);

  size_t   bytesRead;
  uint32_t written = 0;
  audioPeakFinal   = 0;

  for (uint32_t i = 0; i < totalSamples; i++) {
    int32_t samples[2];
    i2s_read(I2S_PORT, &samples, sizeof(samples), &bytesRead, portMAX_DELAY);

    int32_t raw = samples[0];
    int32_t val = raw >> 12;
    val = val * 2;
    if (val >  32767) val =  32767;
    if (val < -32768) val = -32768;
    int16_t sample = (int16_t)val;

    int v = abs(val);
    if (v > audioPeakFinal) audioPeakFinal = v;

    f.write((uint8_t*)&sample, 2);
    written += 2;

    if (i % 1600 == 0) {
      int pct = (int)((i * 100UL) / totalSamples);
      oledProgress("Recording Audio", "Hold still...", pct);
    }
  }

  writeWavHeader(f, totalSamples);
  f.close();
  Serial.printf("✅ WAV: %d bytes  peak=%d\n", written + 44, audioPeakFinal);

  if (audioPeakFinal < 10) {
    Serial.println("⚠️ Very low signal — check mic");
    oledMsg("Low signal", "Check mic", "placement");
    delay(2000);
  }
}

/* ===================== SEND TO AI BACKEND ===================== */
void sendToAIBackend() {
  Serial.println("🚀 Sending to AI backend...");
  logStep("AI Analysis Running");
  oledMsg("Analyzing...", "Sending to AI", "Please wait");

  File wavFile = SPIFFS.open(WAV_FILE, FILE_READ);
  if (!wavFile) {
    Serial.println("❌ Cannot open WAV");
    oledMsg("Error", "File open fail", "");
    return;
  }

  size_t fileSize = wavFile.size();
  Serial.printf("📁 File: %d bytes\n", fileSize);

  if (fileSize < 1000) {
    Serial.println("❌ File too small");
    wavFile.close();
    return;
  }

  String boundary   = "AURABoundary7749";
  String partHeader =
    "--" + boundary + "\r\n"
    "Content-Disposition: form-data; name=\"file\"; filename=\"recording.wav\"\r\n"
    "Content-Type: audio/wav\r\n\r\n";
  String partFooter = "\r\n--" + boundary + "--\r\n";
  int    contentLen = partHeader.length() + fileSize + partFooter.length();

  String httpReq =
    "POST /predict/full HTTP/1.1\r\n"
    "Host: " + String(AI_BACKEND_HOST) + "\r\n"
    "Content-Type: multipart/form-data; boundary=" + boundary + "\r\n"
    "Content-Length: " + String(contentLen) + "\r\n"
    "Connection: close\r\n\r\n";

  WiFiClientSecure client;
  client.setInsecure();
  client.setTimeout(120);

  Serial.println("🔗 Connecting...");
  if (!client.connect(AI_BACKEND_HOST, 443)) {
    Serial.println("❌ Connection failed");
    wavFile.close();
    oledMsg("AI Error", "Connect failed", "");
    logStep("AI Backend Error");
    return;
  }

  client.print(httpReq);
  client.print(partHeader);

  uint8_t buf[1024];
  size_t  r;
  size_t  totalSent = 0;

  oledMsg("Uploading...", "Audio data", "");
  while (wavFile.available()) {
    r = wavFile.read(buf, sizeof(buf));
    if (r > 0) {
      client.write(buf, r);
      totalSent += r;
      int pct = (int)((totalSent * 100UL) / fileSize);
      if (pct % 25 == 0 && pct > 0) {
        char pbuf[24];
        snprintf(pbuf, sizeof(pbuf), "Upload %d%%", pct);
        oledMsg("Uploading...", pbuf, "");
      }
    }
  }
  wavFile.close();
  client.print(partFooter);

  Serial.printf("📤 Sent %d bytes\n", totalSent);
  oledMsg("AI Processing", "Heart + Lung", "Analysis...");

  String statusLine   = "";
  String responseBody = "";
  bool   headersDone  = false;
  unsigned long timeout = millis() + 90000UL;

  while (millis() < timeout) {
    if (!client.connected() && !client.available()) break;
    if (!client.available()) { delay(10); continue; }
    String line = client.readStringUntil('\n');
    line.trim();
    if (!headersDone) {
      if (statusLine.isEmpty()) statusLine = line;
      if (line.isEmpty()) headersDone = true;
    } else {
      responseBody += line;
    }
  }
  client.stop();

  Serial.println("=== RESPONSE ===");
  Serial.println(statusLine);
  Serial.println(responseBody);
  Serial.println("================");

  SPIFFS.remove(WAV_FILE);

  if (statusLine.indexOf("200") < 0) {
    Serial.printf("❌ HTTP Error: %s\n", statusLine.c_str());
    oledMsg("AI Error", statusLine.substring(9, 30).c_str(), "");
    logStep("AI Backend Error");
    return;
  }

  StaticJsonDocument<2048> doc;
  DeserializationError err = deserializeJson(doc, responseBody);
  if (err) {
    Serial.printf("❌ JSON: %s\n", err.c_str());
    oledMsg("AI Error", "Parse failed", "");
    return;
  }

  bool artifact = doc["artifact"] | false;
  if (artifact) {
    ai_artifact = true;
    ai_warning  = doc["warning"] | "Motion detected";
    ai_done     = true;
    Serial.println("⚠️ ARTIFACT DETECTED");
    oledMsg("ARTIFACT!", "Keep device", "STILL & retry");
    logStep("AI: Artifact Detected");
    return;
  }

  ai_artifact    = false;
  ai_warning     = "";
  ai_heart_label = doc["heart"]["label"]         | "Unknown";
  ai_heart_prob  = doc["heart"]["abnormal_pct"]  | 0.0f;
  ai_bpm_model   = doc["heart"]["bpm"]           | 0.0f;
  ai_sqi         = doc["heart"]["sqi"]           | 0.0f;
  ai_systole_ms  = doc["heart"]["systole_ms"]    | 0.0f;
  ai_diastole_ms = doc["heart"]["diastole_ms"]   | 0.0f;
  ai_sys_murmur  = doc["heart"]["sys_murmur"]    | false;
  ai_dia_murmur  = doc["heart"]["dia_murmur"]    | false;
  ai_valve_risk  = doc["heart"]["valve_risk"]    | "None";
  ai_lung_label  = doc["lung"]["label"]          | "Unknown";
  ai_lung_conf   = doc["lung"]["confidence"]     | 0.0f;
  ai_normal_pct  = doc["lung"]["Normal_pct"]     | 0.0f;
  ai_crackle_pct = doc["lung"]["Crackle_pct"]    | 0.0f;
  ai_wheeze_pct  = doc["lung"]["Wheeze_pct"]     | 0.0f;
  ai_alert       = doc["alert"]                  | false;
  ai_done        = true;

  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.printf("❤️  Heart : %s (%.1f%%)  BPM=%.1f  SQI=%.1f\n",
    ai_heart_label.c_str(), ai_heart_prob, ai_bpm_model, ai_sqi);
  Serial.printf("    Sys=%.0fms  Dia=%.0fms\n", ai_systole_ms, ai_diastole_ms);
  Serial.printf("    Murmur Sys=%s Dia=%s  Valve=%s\n",
    ai_sys_murmur?"YES":"NO", ai_dia_murmur?"YES":"NO", ai_valve_risk.c_str());
  Serial.printf("🫁  Lung  : %s (%.1f%%)\n", ai_lung_label.c_str(), ai_lung_conf);
  Serial.printf("    N=%.1f%%  C=%.1f%%  W=%.1f%%\n",
    ai_normal_pct, ai_crackle_pct, ai_wheeze_pct);
  Serial.printf("🚨  Alert : %s\n", ai_alert?"YES":"NO");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  char h[32], l[32];
  snprintf(h, sizeof(h), "Heart:%s %.0f%%", ai_heart_label.c_str(), ai_heart_prob);
  snprintf(l, sizeof(l), "Lung:%s %.0f%%",  ai_lung_label.c_str(),  ai_lung_conf);
  oledMsg("AI Result", h, l);
  delay(3000);

  logStep(("AI: Heart=" + ai_heart_label + " Lung=" + ai_lung_label).c_str());
}

/* ===================== WIFI HELPERS ===================== */
#define WIFI_TIMEOUT_MS 20000

void wifiConnect() {
  oledMsg("AURA", "Connecting WiFi", "...");
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  
  unsigned long startTime = millis();
  int dots = 0;
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    dots++;
    
    if (millis() - startTime > WIFI_TIMEOUT_MS) {
      Serial.println("\n❌ WiFi Connection FAILED! (Timeout)");
      oledMsg("WiFi Error", "Connection timeout", "Entering Failsafe");
      delay(2000);
      
      failsafeActive = true;
      HC12.begin(HC12_BAUD, SERIAL_8N1, HC12_RX_PIN, HC12_TX_PIN);
      Serial.println("✅ HC12 Initialized - FAILSAFE MODE ACTIVE");
      oledMsg("FAILSAFE MODE", "WiFi failed", "Using HC12 radio");
      delay(2000);
      return;
    }
    
    char buf[24];
    int seconds = (millis() - startTime) / 1000;
    snprintf(buf, sizeof(buf), "Connecting %ds", seconds);
    oledMsg("AURA", buf, "");
    Serial.print(".");
  }
  
  Serial.println("\n📶 WiFi Connected!");
  oledMsg("WiFi", "Connected!", WiFi.localIP().toString().c_str());
  delay(1000);
}

void logStep(const char* msg) {
  Serial.println("➡️ " + String(msg));
  if (!wifiEnabled || sessionId == "") return;
  HTTPClient http;
  http.begin(String(SUPABASE_URL) + "/rest/v1/statuses");
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_KEY));
  http.addHeader("Content-Type", "application/json");
  String body = "{\"session_id\":\"" + sessionId
              + "\",\"message\":\"" + String(msg) + "\"}";
  http.POST(body);
  http.end();
}

void fetchLatestSession() {
  if (sessionId != "") return;
  HTTPClient http;
  http.begin(String(SUPABASE_URL)
    + "/rest/v1/sessions?state=eq.CREATED&order=created_at.desc&limit=1");
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_KEY));
  if (http.GET() == 200) {
    String p = http.getString();
    int idx = p.indexOf("\"id\":\"");
    if (idx > 0) {
      sessionId = p.substring(idx + 6, idx + 42);
      Serial.println("🆔 Session: " + sessionId);
    }
  }
  http.end();
}

void updateSessionState(const char* state) {
  if (sessionId == "") return;
  HTTPClient http;
  http.begin(String(SUPABASE_URL) + "/rest/v1/sessions?id=eq." + sessionId);
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_KEY));
  http.addHeader("Content-Type", "application/json");
  http.sendRequest("PATCH", "{\"state\":\"" + String(state) + "\"}");
  http.end();
}

void sendWifiVitals(String json) {
  if (sessionId == "") return;
  HTTPClient http;
  http.begin(String(SUPABASE_URL) + "/rest/v1/vitals");
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_KEY));
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Prefer", "return=minimal");

  json.remove(json.length() - 1);
  json += ",\"session_id\":\"" + sessionId + "\"";

  if (ai_done) {
    json += ",\"ai_artifact\":"      + String(ai_artifact ? "true" : "false");
    if (ai_artifact) {
      json += ",\"warning\":\""      + ai_warning + "\"";
    } else {
      json += ",\"ai_heart_label\":\"" + ai_heart_label + "\"";
      json += ",\"ai_heart_prob\":"    + String(ai_heart_prob, 1);
      json += ",\"ai_bpm\":"           + String(ai_bpm_model, 1);
      json += ",\"ai_sqi\":"           + String(ai_sqi, 1);
      json += ",\"ai_systole_ms\":"    + String(ai_systole_ms, 1);
      json += ",\"ai_diastole_ms\":"   + String(ai_diastole_ms, 1);
      json += ",\"ai_sys_murmur\":"    + String(ai_sys_murmur ? "true" : "false");
      json += ",\"ai_dia_murmur\":"    + String(ai_dia_murmur ? "true" : "false");
      json += ",\"ai_valve_risk\":\""  + ai_valve_risk + "\"";
      json += ",\"ai_lung_label\":\""  + ai_lung_label + "\"";
      json += ",\"ai_lung_conf\":"     + String(ai_lung_conf, 1);
      json += ",\"ai_normal_pct\":"    + String(ai_normal_pct, 1);
      json += ",\"ai_crackle_pct\":"   + String(ai_crackle_pct, 1);
      json += ",\"ai_wheeze_pct\":"    + String(ai_wheeze_pct, 1);
      json += ",\"ai_alert\":"         + String(ai_alert ? "true" : "false");
    }
  }
  json += "}";

  Serial.println("📤 Vitals: " + json);
  http.POST(json);
  http.end();
}

/* ===================== TWILIO FUNCTIONS ===================== */

String urlencode(String str) {
  String encoded = "";
  char c;
  char code0;
  char code1;
  for (int i = 0; i < str.length(); i++) {
    c = str.charAt(i);
    if (c == ' ') {
      encoded += '+';
    } else if (isalnum(c)) {
      encoded += c;
    } else {
      code1 = (c & 0xF) + '0';
      if ((c & 0xF) > 9) {
        code1 = (c & 0xF) - 10 + 'A';
      }
      c = (c >> 4) & 0xF;
      code0 = c + '0';
      if (c > 9) {
        code0 = c - 10 + 'A';
      }
      encoded += '%';
      encoded += code0;
      encoded += code1;
    }
  }
  return encoded;
}

void sendTwilioSMS(String message) {
  Serial.println("📱 Sending SMS via Twilio...");
  
  HTTPClient http;
  String url = "https://api.twilio.com/2010-04-01/Accounts/" + String(TWILIO_ACCOUNT_SID) + "/Messages.json";
  http.begin(url);
  
  http.setAuthorization(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  http.addHeader("Content-Type", "application/x-www-form-urlencoded");
  
  String postData = "To=" + String(EMERGENCY_PHONE_NUMBER) +
                    "&From=" + String(TWILIO_PHONE_NUMBER) +
                    "&Body=" + message;
  
  int httpCode = http.POST(postData);
  
  if (httpCode == 201) {
    Serial.println("✅ SMS Sent Successfully!");
  } else {
    Serial.printf("❌ SMS Failed! HTTP: %d\n", httpCode);
    String response = http.getString();
    Serial.println("Response: " + response);
  }
  
  http.end();
}

void makeTwilioCall() {
  Serial.println("📞 Making emergency call...");
  
  HTTPClient http;
  String url = "https://api.twilio.com/2010-04-01/Accounts/" + String(TWILIO_ACCOUNT_SID) + "/Calls.json";
  http.begin(url);
  
  http.setAuthorization(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  http.addHeader("Content-Type", "application/x-www-form-urlencoded");
  
  String twiml = "<Response><Pause length=\"2\"/></Response>";
  
  String encodedTwiml = "";
  for (int i = 0; i < twiml.length(); i++) {
    char c = twiml.charAt(i);
    if (c == ' ') {
      encodedTwiml += '+';
    } else if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9')) {
      encodedTwiml += c;
    } else {
      char hex[4];
      snprintf(hex, sizeof(hex), "%%%02X", (unsigned char)c);
      encodedTwiml += hex;
    }
  }
  
  String postData = "To=" + String(EMERGENCY_PHONE_NUMBER) +
                    "&From=" + String(TWILIO_PHONE_NUMBER) +
                    "&Twiml=" + encodedTwiml;
  
  int httpCode = http.POST(postData);
  
  if (httpCode == 201) {
    Serial.println("✅ Call Initiated (Silent)!");
  } else {
    Serial.printf("❌ Call Failed! HTTP: %d\n", httpCode);
    String response = http.getString();
    Serial.println("Response: " + response);
  }
  
  http.end();
}

bool checkWiFiAvailability() {
  Serial.println("🔍 Rechecking WiFi availability...");
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(100);
  
  int n = WiFi.scanNetworks();
  bool available = (n > 0);
  WiFi.scanDelete();
  
  if (available) {
    Serial.println("✅ WiFi found! Attempting to connect...");
    return true;
  }
  return false;
}

/* ===================== FAILSAFE MODE FUNCTIONS ===================== */

void runFailsafeMode() {
  Serial.println("🔧 FAILSAFE MODE - Running vitals...");
  
  // === STEP 1: Temperature (30 sec) ===
  oledMsg("FAILSAFE MODE", "Step 1/3", "Measuring Temp...");
  unsigned long tempStart = millis();
  while (millis() - tempStart < TEMP_DURATION) {
    readTemp();
    unsigned long elapsed = millis() - tempStart;
    char ts[24];
    snprintf(ts, sizeof(ts), "Temp: %.1f C", skinTemp);
    oledCountdown("TEMP SCAN", ts, elapsed, TEMP_DURATION);
    delay(100);
  }
  skinTempFinal = skinTemp;
  Serial.printf("✅ Temperature: %.1f C\n", skinTempFinal);
  
  // === STEP 2: Heart Rate + SpO2 (30 sec) ===
  oledMsg("FAILSAFE MODE", "Step 2/3", "Place finger on sensor");
  delay(3000);
  
  unsigned long vitalsStart = millis();
  resetVitals();
  
  while (millis() - vitalsStart < VITALS_DURATION) {
    readVitals();
    
    unsigned long elapsed = millis() - vitalsStart;
    
    static unsigned long lastDisplay = 0;
    if (millis() - lastDisplay > 100) {
      lastDisplay = millis();
      
      char vs[32];
      if (fingerPresent && avgBPM > 0) {
        snprintf(vs, sizeof(vs), "HR:%d SpO2:%.0f%%", 
          avgBPM, spo2Valid ? spo2Avg : 0.0f);
      } else {
        snprintf(vs, sizeof(vs), "Place finger...");
      }
      oledCountdown("HR+SpO2 SCAN", vs, elapsed, VITALS_DURATION);
    }
    
    delay(1);
  }
  
  // === Calculate Status ===
  bool tempAbnormal = skinTempFinal < 31 || skinTempFinal > 37.5;
  bool hrAbnormal   = avgBPM < 60 || avgBPM > 100;
  bool spo2Abnormal = (spo2Valid && spo2Avg < 80);
  
  int score = 0;
  if (tempAbnormal) score += 35;
  if (hrAbnormal)   score += 35;
  if (spo2Abnormal) score += 30;
  
  String status;
  if (score >= 70)      status = "RED";
  else if (score >= 30) status = "YELLOW";
  else                  status = "GREEN";
  
  // === Display Results ===
  char line2[32];
  char line3[32];
  snprintf(line2, sizeof(line2), "T:%.1f HR:%d", skinTempFinal, avgBPM);
  snprintf(line3, sizeof(line3), "SpO2:%s %s", 
           spo2Valid ? String(spo2Avg,0).c_str() : "??", status.c_str());
  oledMsg("FAILSAFE RESULTS", line2, line3);
  delay(3000);
  
  // === Send via HC12 ===
  String hc12Message = "AURA|T:" + String(skinTempFinal, 1) + 
                       "|HR:" + String(avgBPM) +
                       "|SPO2:" + String(spo2Valid ? String(spo2Avg, 0) : "0") +
                       "|STATUS:" + status;
  
  Serial.println("=================================");
  Serial.print("📡 Sending via HC12: ");
  Serial.println(hc12Message);
  Serial.print("HC12 available? ");
  Serial.println(HC12 ? "YES" : "NO");
  Serial.println("=================================");
  
  for (int i = 0; i < 3; i++) {
    HC12.println(hc12Message);
    Serial.print("  Sent attempt ");
    Serial.print(i + 1);
    Serial.println("/3");
    delay(100);
  }
  
  String statusMsg = "STATUS: " + status;
  oledMsg("HC12 SENT", hc12Message.substring(0, 30).c_str(), 
          statusMsg.c_str());
  delay(3000);
  
  // === Trigger Local Alerts ===
  alertActive = true;
  alertStatus = status;
  alertStartTime = millis();
  lastToggle = millis();
  alertState = false;
  
  unsigned long alertStartTime_local = millis();
  while (millis() - alertStartTime_local < 10000) {
    updateAlert();
    delay(50);
  }
  
  digitalWrite(LED_RED_PIN, LOW);
  digitalWrite(LED_YELLOW_PIN, LOW);
  digitalWrite(LED_GREEN_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);
  
  oledMsg("FAILSAFE MODE", "Checking WiFi", "in 30 seconds...");
  delay(30000);
  
  if (checkWiFiAvailability()) {
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    unsigned long wifiStart = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - wifiStart < 20000) {
      delay(500);
      Serial.print(".");
    }
    
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\n✅ WiFi Reconnected!");
      failsafeActive = false;
      warmupBackend();
      oledMsg("WiFi Connected", "Switching to", "Normal Mode");
      delay(2000);
      return;
    }
  }
  
  oledMsg("FAILSAFE MODE", "Cycle Complete", "Restarting...");
  delay(3000);
}

/* ===================== SETUP ===================== */
void setup() {
  Serial.begin(115200);
  delay(1500);
  pinMode(LED_RED_PIN, OUTPUT);
  pinMode(LED_YELLOW_PIN, OUTPUT);
  pinMode(LED_GREEN_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  digitalWrite(LED_RED_PIN, LOW);
  digitalWrite(LED_YELLOW_PIN, LOW);
  digitalWrite(LED_GREEN_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  if (!display.begin(OLED_ADDR, true)) {
    Serial.println("❌ OLED not found");
  } else {
    display.clearDisplay();
    display.setTextColor(SH110X_WHITE);
    display.setTextSize(2);
    display.setCursor(20, 16);
    display.println("AURA");
    display.setTextSize(1);
    display.setCursor(8, 44);
    display.println("AI Stethoscope v2");
    display.display();
    Serial.println("✅ OLED ready");
    delay(2000);
  }

  if (!SPIFFS.begin(true)) {
    Serial.println("❌ SPIFFS failed");
  } else {
    Serial.println("✅ SPIFFS ready");
  }

  hrSensor.begin(Wire, I2C_SPEED_FAST);
  hrSensor.setup();
  hrSensor.setPulseAmplitudeRed(0x3F);
  hrSensor.setPulseAmplitudeIR(0x3F);
  hrSensor.setPulseAmplitudeGreen(0);
  hrSensor.clearFIFO();
  Serial.println("✅ MAX30105 ready");

  i2s_config_t cfg = {
    .mode               = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate        = SAMPLE_RATE,
    .bits_per_sample    = I2S_BITS_PER_SAMPLE_32BIT,
    .channel_format     = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_I2S,
    .intr_alloc_flags   = 0,
    .dma_buf_count      = 8,
    .dma_buf_len        = 64,
    .use_apll           = false
  };
  i2s_pin_config_t pins = {
    .bck_io_num   = I2S_SCK,
    .ws_io_num    = I2S_WS,
    .data_out_num = -1,
    .data_in_num  = I2S_SD
  };
  i2s_driver_install(I2S_PORT, &cfg, 0, NULL);
  i2s_set_pin(I2S_PORT, &pins);
  i2s_zero_dma_buffer(I2S_PORT);
  delay(500);
  Serial.println("✅ I2S ready");

  #ifdef FAILSAFE_MODE
    Serial.println("🔍 Checking WiFi availability...");
    WiFi.mode(WIFI_STA);
    WiFi.disconnect();
    delay(100);
    
    int n = WiFi.scanNetworks();
    bool wifiAvailable = (n > 0);
    WiFi.scanDelete();
    
    if (!wifiAvailable) {
      failsafeActive = true;
      Serial.println("⚠️ NO WiFi - ENTERING FAILSAFE MODE");
      oledMsg("FAILSAFE MODE", "No WiFi detected", "Using HC12 only");
      delay(2000);
      
      HC12.begin(HC12_BAUD, SERIAL_8N1, HC12_RX_PIN, HC12_TX_PIN);
      Serial.println("✅ HC12 Initialized in FAILSAFE MODE");
      
      oledMsg("FAILSAFE MODE", "HC12 Ready", "Starting vitals...");
      delay(1500);
    } else {
      failsafeActive = false;
    }
  #endif

  #ifdef FAILSAFE_MODE
    if (!failsafeActive) {
      wifiConnect();
      if (WiFi.status() == WL_CONNECTED) {
        warmupBackend();
      } else {
        Serial.println("⚠️ WiFi not connected - Skipping AI Backend warmup");
        oledMsg("WiFi Failed", "Skipping AI", "Using Failsafe?");
        delay(1000);
      }
    }
  #else
    wifiConnect();
    warmupBackend();
  #endif

  Serial.println("✅ ESP READY — Waiting for session");
  oledMsg("AURA Ready!", "Waiting for", "session...");
}

/* ===================== LOOP ===================== */
void loop() {
  updateAlert();

  #ifdef FAILSAFE_MODE
    if (failsafeActive) {
      runFailsafeMode();
      return;
    }
  #endif

  if (sessionId == "") {
    fetchLatestSession();
    if (sessionId == "") {
      oledMsg("Waiting...", "Start session", "on app/web");
      delay(1000);
    } else {
      oledMsg("Session!", sessionId.substring(0, 8).c_str(), "Starting...");
      delay(1500);
    }
    return;
  }

  switch (currentState) {

    case IDLE:
      alertSentForSession = false;
      currentState   = TEMP_MEASURE;
      stateStartTime = millis();
      ai_done = false; ai_alert = false;
      ai_artifact = false; ai_warning = "";
      ai_heart_label = "Unknown"; ai_heart_prob  = 0.0;
      ai_lung_label  = "Unknown"; ai_lung_conf   = 0.0;
      ai_bpm_model   = 0.0;       ai_sqi         = 0.0;
      ai_systole_ms  = 0.0;       ai_diastole_ms = 0.0;
      ai_sys_murmur  = false;     ai_dia_murmur  = false;
      ai_valve_risk  = "None";
      ai_normal_pct  = 0.0;       ai_crackle_pct = 0.0;
      ai_wheeze_pct  = 0.0;
      audioPeakFinal = 0;
      updateSessionState("MONITORING");
      logStep("System Initialised");
      oledMsg("STEP 1", "Place device", "on SKIN");
      delay(3000);
      logStep("Measuring Skin Temperature");
      break;

    case TEMP_MEASURE: {
      readTemp();
      unsigned long el = millis() - stateStartTime;
      char ts[24];
      snprintf(ts, sizeof(ts), "%.1f C", skinTemp);
      oledCountdown("STEP 1 Temp", ts, el, TEMP_DURATION);
      if (el >= TEMP_DURATION) {
        skinTempFinal  = skinTemp;
        stateStartTime = millis();
        currentState   = AUDIO_MEASURE;
        oledMsg("STEP 2", "Place stethoscope", "on chest");
        delay(3000);
        oledMsg("Hold still...", "Recording in", "2 seconds...");
        delay(2000);
        logStep("Auscultation Started");
      }
      break;
    }

    case AUDIO_MEASURE: {
      static bool recorded = false;
      if (!recorded) {
        recordAndSaveWav();
        sendToAIBackend();
        recorded = true;
      }
      unsigned long el = millis() - stateStartTime;
      if (el < AUDIO_DURATION) {
        readAudio();
        oledCountdown("Audio Window", "AI done", el, AUDIO_DURATION);
      } else {
        recorded = false;
        resetVitals();
        stateStartTime = millis();
        currentState   = VITALS_MEASURE;
        oledMsg("STEP 3", "Place finger", "on sensor");
        delay(3000);
        logStep("Measuring HR & SpO2");
      }
      break;
    }

    case VITALS_MEASURE: {
      readVitals();
      unsigned long el = millis() - stateStartTime;
      char vs[32];
      if (fingerPresent && avgBPM > 0) {
        snprintf(vs, sizeof(vs), "HR:%d SpO2:%.0f%%",
          avgBPM, spo2Valid ? spo2Avg : 0.0f);
      } else {
        snprintf(vs, sizeof(vs), "Place finger...");
      }
      oledCountdown("STEP 3 HR+SpO2", vs, el, VITALS_DURATION);
      if (el >= VITALS_DURATION) {
        currentState = FINAL_REPORT;
      }
      break;
    }

    case FINAL_REPORT: {
      logStep("Final Analysis");

      bool tempAbnormal = skinTempFinal < 31 || skinTempFinal > 37.5;
      bool hrAbnormal   = avgBPM < 60 || avgBPM > 100;
      bool spo2Abnormal = (spo2Valid && spo2Avg < 80);
      
      int score = 0;
      if (tempAbnormal) score += 35;
      if (hrAbnormal)   score += 35;
      if (spo2Abnormal) score += 30;
      
      String status;
      if (score >= 70)      status = "RED";
      else if (score >= 30) status = "YELLOW"; 
      else                  status = "GREEN";

      if (ai_alert) {
        status = "RED";
      }
      
      if (status == "RED" && !alertSentForSession && WiFi.status() == WL_CONNECTED) {
        alertSentForSession = true;
        
        Serial.println("🚨 EMERGENCY! Sending SMS and Call...");
        oledMsg("EMERGENCY!", "Sending Alert...", "SMS + Call");
        delay(1000);
        
        String smsMessage = "AURA EMERGENCY! Temp:" + String(skinTempFinal, 1) + "C ";
        smsMessage += "HR:" + String(avgBPM) + " ";
        smsMessage += "SpO2:" + String(spo2Valid ? String(spo2Avg, 0) : "??") + "% ";
        
        if (ai_done && !ai_artifact) {
          smsMessage += "Heart:" + ai_heart_label + " ";
          smsMessage += "Lung:" + ai_lung_label;
        }
        
        smsMessage += " IMMEDIATE ATTENTION!";
        
        sendTwilioSMS(smsMessage);
        delay(2000);
        
        makeTwilioCall();
        delay(2000);
        
        oledMsg("ALERT SENT!", "SMS + Call", "Completed");
        Serial.println("✅ Emergency alert sent!");
        delay(2000);
      }
  
      if (ai_artifact) {
        alertStatus = "YELLOW";
      }
      else if (ai_alert) {
        alertStatus = "RED";
      }
      else {
        alertStatus = status;
      }
      
      alertActive = true;
      alertStartTime = millis();
      lastToggle = millis();
      alertState = false;
      String json =
        "{\"temp\":"     + String(skinTempFinal, 1) +
        ",\"hr\":"       + String(avgBPM) +
        ",\"spo2\":"     + (spo2Valid ? String(spo2Avg, 1) : "null") +
        ",\"audio\":"    + String(audioPeakFinal) +
        ",\"status\":\"" + status + "\"}";

      sendWifiVitals(json);
      updateSessionState("COMPLETED");

      if (ai_done) {
        if (ai_artifact) {
          oledMsg("ARTIFACT!", "Motion detected", "Keep still!");
        } else {
          char h[32], l[32];
          snprintf(h, sizeof(h), "Heart:%s %.0f%%",
            ai_heart_label.c_str(), ai_heart_prob);
          snprintf(l, sizeof(l), "Lung:%s %.0f%%",
            ai_lung_label.c_str(), ai_lung_conf);
          oledMsg("AI Results", h, l);
        }
        delay(4000);
      }

      oledMsg("Done!", "Report sent!", "");

      Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      Serial.println("📤 FINAL REPORT SENT");
      Serial.printf("🌡️  Temp   : %.1f C\n",  skinTempFinal);
      Serial.printf("❤️  HR     : %d BPM\n",  avgBPM);
      Serial.printf("💉  SpO2   : %s\n",
        spo2Valid ? (String(spo2Avg, 1) + "%").c_str() : "Read Again");
      Serial.printf("🔊  Audio  : %d\n",      audioPeakFinal);
      Serial.printf("🚦  Status : %s\n",      status.c_str());
      if (ai_done) {
        if (ai_artifact) {
          Serial.println("⚠️  ARTIFACT — " + ai_warning);
        } else {
          Serial.println("─────────────────────────────────────");
          Serial.printf("❤️  Heart  : %s (%.1f%%) BPM=%.1f SQI=%.1f\n",
            ai_heart_label.c_str(), ai_heart_prob, ai_bpm_model, ai_sqi);
          Serial.printf("    Sys=%.0fms Dia=%.0fms\n",
            ai_systole_ms, ai_diastole_ms);
          Serial.printf("    Murmur Sys=%s Dia=%s  Valve=%s\n",
            ai_sys_murmur?"YES":"NO", ai_dia_murmur?"YES":"NO",
            ai_valve_risk.c_str());
          Serial.printf("🫁  Lung   : %s (%.1f%%)\n",
            ai_lung_label.c_str(), ai_lung_conf);
          Serial.printf("    N=%.1f%% C=%.1f%% W=%.1f%%\n",
            ai_normal_pct, ai_crackle_pct, ai_wheeze_pct);
          Serial.printf("🚨  Alert  : %s\n", ai_alert?"YES":"NO");
        }
      }
      Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      unsigned long tStart = millis();
      while (millis() - tStart < 5000) {
        updateAlert();
        delay(50);
      }
      sessionId    = "";
      currentState = IDLE;
      alertSentForSession = false;
      oledMsg("AURA Ready!", "Waiting for", "next session");
      break;
    }
  }
}

/* ===================== SENSOR FUNCTIONS ===================== */
void readTemp() {
  Wire.beginTransmission(TEMP_ADDR);
  Wire.write(TEMP_REG);
  Wire.endTransmission(false);
  Wire.requestFrom(TEMP_ADDR, 2);
  if (Wire.available() == 2) {
    int16_t raw = (Wire.read() << 8) | Wire.read();
    raw >>= 7;
    float t = raw * 0.5;
    skinTempFiltered = (skinTempFiltered == 0) ? t
                     : skinTempFiltered * 0.6 + t * 0.4;
    skinTemp = skinTempFiltered;
  }
}

void readAudio() {
  size_t bytes;
  i2s_read(I2S_PORT, i2s_samples, sizeof(i2s_samples), &bytes, portMAX_DELAY);
  for (int i = 0; i < (int)(bytes / 4); i++) {
    int v = abs(i2s_samples[i] >> 14);
    if (v > audioPeakFinal) audioPeakFinal = v;
  }
}

void resetVitals() {
  fingerPresent = false;
  rateSpot      = 0;
  validBeats    = 0;
  avgBPM        = 0;
  spo2Avg       = 0;
  spo2Valid     = false;
  lastBeatTime  = 0;
  bufferIndex = 0;
  for (int i = 0; i < SPO2_BUFFER; i++) {
    irBuffer[i] = 0;
    redBuffer[i] = 0;
  }
}

void readVitals() {
  long ir = hrSensor.getIR();
  long red = hrSensor.getRed();
  
  static int stableCount = 0;
  
  if (ir > 30000) {
    stableCount++;
    if (stableCount > 5) {
      if (!fingerPresent) {
        fingerPresent = true;
        Serial.println("✅ Finger detected!");
      }
    }
  } else {
    stableCount = 0;
    if (fingerPresent) {
      fingerPresent = false;
      Serial.println("❌ Finger removed");
      avgBPM = 0;
      spo2Valid = false;
      validBeats = 0;
      rateSpot = 0;
      bufferIndex = 0;
    }
    return;
  }
  
  // ================== ❤️ HEART RATE ==================
  if (checkForBeat(ir)) {
    long now = millis();
    long dt = now - lastBeatTime;
    
    if (lastBeatTime > 0 && dt > MIN_BEAT_INTERVAL && dt < MAX_BEAT_INTERVAL) {
      int bpm = 60000 / dt;
      rates[rateSpot++] = (byte)bpm;
      rateSpot %= 6;
      
      if (validBeats < 8) validBeats++;
      
      int sum = 0;
      for (int i = 0; i < validBeats; i++) sum += rates[i];
      avgBPM = sum / validBeats;
    }
    
    lastBeatTime = now;
  }
  
  // ================== 🩸 SpO₂ ==================
  
  irBuffer[bufferIndex] = ir;
  redBuffer[bufferIndex] = red;
  bufferIndex++;
  if (bufferIndex >= SPO2_BUFFER) bufferIndex = 0;
  
  if (fingerPresent && validBeats >= 5) {
    
    uint32_t irDC = 0, redDC = 0;
    for (int i = 0; i < SPO2_BUFFER; i++) {
      irDC += irBuffer[i];
      redDC += redBuffer[i];
    }
    irDC /= SPO2_BUFFER;
    redDC /= SPO2_BUFFER;
    
    float irAC = 0, redAC = 0;
    for (int i = 0; i < SPO2_BUFFER; i++) {
      irAC += abs((int32_t)irBuffer[i] - (int32_t)irDC);
      redAC += abs((int32_t)redBuffer[i] - (int32_t)redDC);
    }
    irAC /= SPO2_BUFFER;
    redAC /= SPO2_BUFFER;
    
    static float irAC_prev = 0, redAC_prev = 0;
    irAC = 0.7 * irAC_prev + 0.3 * irAC;
    redAC = 0.7 * redAC_prev + 0.3 * redAC;
    irAC_prev = irAC;
    redAC_prev = redAC;
    
    if (irAC > 0 && redAC > 0 && irDC > 0 && redDC > 0) {
      
      long numerator = (redAC * irDC);
      long denominator = (redDC * irAC);
      int RX100 = (denominator > 0) ? (numerator * 100) / denominator : 999;
      
      int spo2_raw = 95;
      if (RX100 >= 0 && RX100 < 184) {
        spo2_raw = spo2_table[RX100];
      }
      
      static float spo2_prev = 0;
      spo2Avg = 0.8 * spo2_prev + 0.2 * spo2_raw;
      spo2_prev = spo2Avg;
      spo2Valid = true;
      
      Serial.printf("SpO2 → %.1f%% | R=%d | IR=%ld\n", spo2Avg, RX100, ir);
    }
  }
}
