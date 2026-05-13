/**
 * DengueSense BD — Combined App
 * ============================================================
 * Two-layer architecture:
 *   Layer 1 — PublicPortal  : General public awareness (converted from HTML)
 *   Layer 2 — ProPortal     : Healthcare professional dashboard
 *
 * Cross-platform (React Native Web / Expo):
 *   - All styling via StyleSheet / inline style objects
 *   - No DOM-only APIs; no className; no window/document usage
 *   - Navigation via React state (stack-style)
 *   - Charts via react-native-chart-kit (swap recharts for RN)
 *   - Safe-area handled via SafeAreaView
 *
 * Dependencies (install in your Expo/RN project):
 *   expo install expo-status-bar
 *   npm install react-native-safe-area-context react-native-screens
 *   npm install react-native-chart-kit react-native-svg
 *   npm install lucide-react-native          ← icons
 *
 * Entry point: default export <DengueSenseBDApp />
 * ============================================================
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Modal,
  FlatList,
  Animated,
  Linking,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Dimensions ───────────────────────────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IS_SMALL = SCREEN_WIDTH < 380;

// ============================================================================
//  THEME TOKENS
// ============================================================================
const COLORS = {
  brand: {
    50:  "#E8F4EE",
    100: "#D0E9DD",
    200: "#A1D2BB",
    300: "#72BB99",
    400: "#43A477",
    500: "#1A6B3A",
    600: "#155730",
    700: "#104326",
    800: "#0B2F1B",
    900: "#061B10",
  },
  risk: {
    safe:   { bg: "#16A34A", soft: "#E8F7EE", text: "#16A34A", border: "#BBF7D0" },
    warn:   { bg: "#D97706", soft: "#FEF3C7", text: "#D97706", border: "#FDE68A" },
    danger: { bg: "#DC2626", soft: "#FEE2E2", text: "#DC2626", border: "#FECACA" },
  },
  level: {
    Critical: { bg: "#DC2626", soft: "rgba(220,38,38,0.1)",  text: "#DC2626", border: "rgba(220,38,38,0.4)" },
    High:     { bg: "#D97706", soft: "rgba(217,119,6,0.1)",  text: "#D97706", border: "rgba(217,119,6,0.4)" },
    Moderate: { bg: "#EAB308", soft: "rgba(234,179,8,0.1)",  text: "#CA8A04", border: "rgba(234,179,8,0.4)" },
    Low:      { bg: "#16A34A", soft: "rgba(22,163,74,0.1)",  text: "#16A34A", border: "rgba(22,163,74,0.4)" },
  },
  light: {
    bg:          "#F8F7F4",
    card:        "#FFFFFF",
    border:      "#E5E7EB",
    text:        "#171717",
    textSecond:  "#6B7280",
    textMuted:   "#9CA3AF",
    navBg:       "#FFFFFF",
    headerBg:    "#1A6B3A",
    inputBg:     "#FFFFFF",
  },
  dark: {
    bg:          "#0A0A0A",
    card:        "#171717",
    border:      "#262626",
    text:        "#F5F5F5",
    textSecond:  "#A3A3A3",
    textMuted:   "#525252",
    navBg:       "#171717",
    headerBg:    "#1A6B3A",
    inputBg:     "#262626",
  },
  pro: {
    bg:    "#020617",
    card:  "#0F172A",
    border:"#1E293B",
    text:  "#F1F5F9",
    muted: "#94A3B8",
    accent:"#10B981",
  },
};

// ============================================================================
//  i18n STRINGS
// ============================================================================
const STRINGS = {
  en: {
    appName: "DengueSense BD",
    tagline: "Your dengue health companion",
    choosePortal: "Choose your portal",
    publicPortal: "Public Portal",
    publicDesc: "Risk map, symptom checker, prevention tips & hospital finder",
    proPortal: "Healthcare Professional",
    proDesc: "Outbreak intelligence for DGHS, epidemiologists, CHWs & vector control",
    publicAccess: "Free public access",
    secureLogin: "Secure sign-in required",
    enter: "Enter",
    signIn: "Sign in",
    back: "Back",
    nav: { home: "Home", check: "Symptom Check", prevent: "Prevention", report: "Report", help: "Help" },
    home: {
      riskTitle: "Area Risk Level",
      riskLow: "Low Risk", riskMed: "Moderate Risk", riskHigh: "High Risk",
      riskDesc: {
        low: "Dengue activity is low in your area. Stay vigilant.",
        med: "Moderate dengue activity reported. Take precautions.",
        high: "High dengue activity! Protect yourself and family.",
      },
      quickActions: "Quick Actions",
      checkSymptoms: "Check Symptoms",
      preventTips: "Prevention Tips",
      reportCase: "Report a Case",
      getHelp: "Get Help",
      alertBanner: "Dengue cases rising in Dhaka South. Stay protected!",
      weeklyStats: "Weekly Cases (National)",
    },
    check: {
      title: "Symptom Checker",
      subtitle: "Select all symptoms you are experiencing",
      symptoms: [
        "Sudden high fever (≥38°C / 100.4°F)",
        "Severe headache",
        "Pain behind the eyes",
        "Muscle & joint pain",
        "Nausea or vomiting",
        "Skin rash",
        "Mild bleeding (gums, nose)",
        "Fatigue / tiredness",
        "Loss of appetite",
        "Abdominal pain",
      ],
      warningSymptoms: "Warning Signs (Severe Dengue)",
      warningSigns: [
        "Bleeding from nose or gums",
        "Blood in urine or stool",
        "Persistent vomiting",
        "Severe abdominal pain",
        "Difficulty breathing",
        "Rapid, weak pulse",
      ],
      btnCheck: "Check Now",
      btnClear: "Clear",
      resultLow: "Low likelihood of dengue. Monitor symptoms.",
      resultMed: "Possible dengue. See a doctor within 24 hours.",
      resultHigh: "High likelihood of dengue. Seek medical care immediately!",
      resultWarn: "⚠️ Warning signs present — go to hospital NOW!",
      noSymptoms: "No symptoms selected.",
      duration: "How long have you had these symptoms?",
      durationOpts: ["< 24 hours", "1–2 days", "3–4 days", "5–7 days", "> 7 days"],
    },
    prevent: {
      title: "Prevention Tips",
      subtitle: "Protect yourself and your community",
      categories: [
        { icon: "🦟", title: "Eliminate Breeding Sites", tips: ["Empty and scrub water containers weekly", "Cover water storage tanks tightly", "Clear blocked gutters and drains", "Remove old tires, cans, flower pot saucers", "Change water in vases every 3 days"] },
        { icon: "🛡️", title: "Personal Protection", tips: ["Apply mosquito repellent (DEET/picaridin)", "Wear long-sleeved shirts and long pants", "Use mosquito nets, especially when sleeping", "Install window and door screens", "Aedes mosquitoes bite mainly at dawn & dusk"] },
        { icon: "🏠", title: "Home & Environment", tips: ["Use air conditioning when available", "Keep surroundings clean and clutter-free", "Spray insecticide in dark corners", "Report stagnant water to local authorities", "Participate in community clean-up drives"] },
        { icon: "💊", title: "If You Get Dengue", tips: ["Rest and drink plenty of fluids", "Take paracetamol only — NO aspirin or ibuprofen", "Monitor platelet count as advised by doctor", "Watch for warning signs", "Stay under a mosquito net"] },
      ],
    },
    report: {
      title: "Report a Case",
      subtitle: "Help track dengue in your community",
      labels: { name: "Full Name (optional)", age: "Age *", gender: "Gender", area: "Area / Locality *", division: "Division *", onset: "Date of onset", hospitalised: "Hospitalised?", notes: "Additional notes", submit: "Submit Report" },
      genders: ["Male", "Female", "Other", "Prefer not to say"],
      divisions: ["Dhaka", "Chittagong", "Rajshahi", "Khulna", "Barisal", "Sylhet", "Rangpur", "Mymensingh"],
      yes: "Yes", no: "No",
      success: "Report submitted! Thank you for helping your community.",
      required: "Please fill in required fields (Age, Area, Division).",
    },
    help: {
      title: "Get Help",
      subtitle: "Emergency contacts & resources",
      emergency: "Emergency Numbers",
      contacts: [
        { label: "National Health Helpline", number: "16000", desc: "24/7 free health advice" },
        { label: "Dengue Hotline (DGDA)", number: "16645", desc: "Drug & disease control" },
        { label: "Emergency Ambulance", number: "999", desc: "Police / Fire / Ambulance" },
        { label: "IEDCR Hotline", number: "10655", desc: "Infectious disease control" },
      ],
      faqTitle: "Frequently Asked Questions",
      faqs: [
        { q: "What is dengue fever?", a: "Dengue is a mosquito-borne viral infection transmitted by the Aedes aegypti mosquito. It causes flu-like illness and, occasionally, severe dengue which can be fatal." },
        { q: "How long does dengue last?", a: "Dengue fever typically lasts 2–7 days. Full recovery may take 2–4 weeks." },
        { q: "Is dengue contagious?", a: "No. Dengue spreads only through the bite of an infected mosquito, not person-to-person." },
        { q: "Can dengue be treated?", a: "There is no specific antiviral treatment. Management is supportive: rest, fluids, and paracetamol." },
        { q: "How can I protect my children?", a: "Use mosquito nets, apply child-safe repellents, dress children in long sleeves, and eliminate breeding sites." },
      ],
      hospitals: "Nearest Hospitals (Dhaka)",
      hospitalList: [
        { name: "Dhaka Medical College Hospital", dist: "2.1 km", beds: "Dengue ward available" },
        { name: "Sir Salimullah Medical College", dist: "3.4 km", beds: "Dengue ward available" },
        { name: "Shaheed Suhrawardy Medical", dist: "5.0 km", beds: "Dengue ward available" },
        { name: "Mugda Medical College Hospital", dist: "6.2 km", beds: "Dengue ward available" },
      ],
    },
    // Pro layer strings
    pro: {
      overview: "Live Risk Map", forecast: "AI Forecast", satellite: "Satellite Feed",
      chw: "CHW Reports", alertCentre: "Alert Centre", interventions: "Interventions",
      analytics: "Analytics", settings: "Settings",
      role: "Role", email: "Official email", password: "Password",
      rememberMe: "Keep me signed in", forgotPassword: "Forgot password?",
      logout: "Sign out",
      unauthorized: "Restricted area",
      unauthorizedDesc: "Your role does not have access to this module.",
      Critical: "Critical", High: "High", Moderate: "Moderate", Low: "Low",
    },
  },
  bn: {
    appName: "ডেঙ্গু সেন্স BD",
    tagline: "আপনার ডেঙ্গু স্বাস্থ্য সহায়ক",
    choosePortal: "আপনার পোর্টাল বেছে নিন",
    publicPortal: "জনসাধারণ পোর্টাল",
    publicDesc: "ঝুঁকি মানচিত্র, লক্ষণ পরীক্ষা, প্রতিরোধ ও হাসপাতাল খোঁজা",
    proPortal: "স্বাস্থ্যকর্মী পোর্টাল",
    proDesc: "DGHS, এপিডেমিওলজিস্ট ও ভেক্টর নিয়ন্ত্রণের জন্য অপারেশনাল বুদ্ধিমত্তা",
    publicAccess: "বিনামূল্যে সর্বজনীন প্রবেশ",
    secureLogin: "নিরাপদ লগইন প্রয়োজন",
    enter: "প্রবেশ করুন",
    signIn: "সাইন ইন",
    back: "ফিরে যান",
    nav: { home: "হোম", check: "লক্ষণ পরীক্ষা", prevent: "প্রতিরোধ", report: "রিপোর্ট", help: "সাহায্য" },
    home: {
      riskTitle: "এলাকার ঝুঁকির মাত্রা",
      riskLow: "কম ঝুঁকি", riskMed: "মাঝারি ঝুঁকি", riskHigh: "উচ্চ ঝুঁকি",
      riskDesc: {
        low: "আপনার এলাকায় ডেঙ্গুর কার্যকলাপ কম। সতর্ক থাকুন।",
        med: "মাঝারি ডেঙ্গু কার্যকলাপ রিপোর্ট হয়েছে। সতর্কতা নিন।",
        high: "উচ্চ ডেঙ্গু কার্যকলাপ! নিজেকে ও পরিবারকে রক্ষা করুন।",
      },
      quickActions: "দ্রুত পদক্ষেপ",
      checkSymptoms: "লক্ষণ পরীক্ষা করুন",
      preventTips: "প্রতিরোধমূলক টিপস",
      reportCase: "একটি কেস রিপোর্ট করুন",
      getHelp: "সাহায্য নিন",
      alertBanner: "ঢাকা দক্ষিণে ডেঙ্গু রোগী বাড়ছে। সুরক্ষিত থাকুন!",
      weeklyStats: "সাপ্তাহিক কেস (জাতীয়)",
    },
    check: {
      title: "লক্ষণ পরীক্ষক",
      subtitle: "আপনার সমস্ত লক্ষণ নির্বাচন করুন",
      symptoms: [
        "হঠাৎ উচ্চ জ্বর (≥৩৮°C)",
        "তীব্র মাথাব্যথা",
        "চোখের পেছনে ব্যথা",
        "মাংসপেশি ও জয়েন্টে ব্যথা",
        "বমি বমি ভাব বা বমি",
        "ত্বকে ফুসকুড়ি",
        "হালকা রক্তপাত (মাড়ি, নাক)",
        "ক্লান্তি / দুর্বলতা",
        "ক্ষুধামন্দা",
        "পেটে ব্যথা",
      ],
      warningSymptoms: "সতর্কতার লক্ষণ (গুরুতর ডেঙ্গু)",
      warningSigns: ["নাক বা মাড়ি থেকে রক্তপাত", "প্রস্রাব বা মলে রক্ত", "ক্রমাগত বমি", "তীব্র পেটে ব্যথা", "শ্বাসকষ্ট", "দ্রুত, দুর্বল নাড়ি"],
      btnCheck: "এখনই পরীক্ষা করুন",
      btnClear: "পরিষ্কার",
      resultLow: "ডেঙ্গুর সম্ভাবনা কম।",
      resultMed: "ডেঙ্গু সম্ভব। ২৪ ঘণ্টায় ডাক্তার দেখান।",
      resultHigh: "ডেঙ্গুর সম্ভাবনা বেশি। অবিলম্বে চিকিৎসা নিন!",
      resultWarn: "⚠️ সতর্কতার লক্ষণ — এখনই হাসপাতালে যান!",
      noSymptoms: "কোনো লক্ষণ নির্বাচন করা হয়নি।",
      duration: "এই লক্ষণগুলো কতদিন ধরে?",
      durationOpts: ["২৪ ঘণ্টারও কম", "১–২ দিন", "৩–৪ দিন", "৫–৭ দিন", "৭ দিনের বেশি"],
    },
    prevent: {
      title: "প্রতিরোধমূলক টিপস",
      subtitle: "নিজেকে ও সমাজকে রক্ষা করুন",
      categories: [
        { icon: "🦟", title: "প্রজনন স্থান দূর করুন", tips: ["প্রতি সপ্তাহে পানির পাত্র খালি করুন", "পানির ট্যাঙ্ক ঢেকে রাখুন", "নর্দমা ও ড্রেন পরিষ্কার করুন", "পুরানো টায়ার ও টিন সরান"] },
        { icon: "🛡️", title: "ব্যক্তিগত সুরক্ষা", tips: ["মশা তাড়ানোর ক্রিম ব্যবহার করুন", "লম্বা হাতার পোশাক পরুন", "মশারি ব্যবহার করুন", "দরজা-জানালায় নেট লাগান"] },
        { icon: "🏠", title: "বাড়ি ও পরিবেশ", tips: ["চারপাশ পরিষ্কার রাখুন", "অন্ধকার কোণে কীটনাশক স্প্রে করুন", "স্থানীয় কর্তৃপক্ষকে জানান"] },
        { icon: "💊", title: "ডেঙ্গু হলে করণীয়", tips: ["বিশ্রাম নিন ও প্রচুর তরল পান করুন", "শুধু প্যারাসিটামল নিন", "প্লেটলেট গণনা পর্যবেক্ষণ করুন"] },
      ],
    },
    report: {
      title: "একটি কেস রিপোর্ট করুন",
      subtitle: "আপনার সমাজে ডেঙ্গু ট্র্যাক করতে সাহায্য করুন",
      labels: { name: "পূর্ণ নাম (ঐচ্ছিক)", age: "বয়স *", gender: "লিঙ্গ", area: "এলাকা *", division: "বিভাগ *", onset: "লক্ষণ শুরুর তারিখ", hospitalised: "হাসপাতালে ভর্তি?", notes: "অতিরিক্ত তথ্য", submit: "রিপোর্ট জমা দিন" },
      genders: ["পুরুষ", "মহিলা", "অন্যান্য", "বলতে চাই না"],
      divisions: ["ঢাকা", "চট্টগ্রাম", "রাজশাহী", "খুলনা", "বরিশাল", "সিলেট", "রংপুর", "ময়মনসিংহ"],
      yes: "হ্যাঁ", no: "না",
      success: "রিপোর্ট জমা দেওয়া হয়েছে! ধন্যবাদ।",
      required: "অনুগ্রহ করে প্রয়োজনীয় ক্ষেত্রগুলি পূরণ করুন।",
    },
    help: {
      title: "সাহায্য নিন",
      subtitle: "জরুরি যোগাযোগ ও তথ্য",
      emergency: "জরুরি নম্বর",
      contacts: [
        { label: "জাতীয় স্বাস্থ্য সেবা লাইন", number: "১৬০০০", desc: "২৪/৭ বিনামূল্যে পরামর্শ" },
        { label: "ডেঙ্গু হটলাইন (DGDA)", number: "১৬৬৪৫", desc: "ওষুধ ও রোগ নিয়ন্ত্রণ" },
        { label: "জরুরি অ্যাম্বুলেন্স", number: "৯৯৯", desc: "পুলিশ / ফায়ার / অ্যাম্বুলেন্স" },
        { label: "আইইডিসিআর হটলাইন", number: "১০৬৫৫", desc: "সংক্রামক রোগ নিয়ন্ত্রণ" },
      ],
      faqTitle: "প্রায়শই জিজ্ঞাসিত প্রশ্ন",
      faqs: [
        { q: "ডেঙ্গু জ্বর কি?", a: "এডিস এজিপ্টি মশার কামড়ে ছড়ানো ভাইরাল সংক্রমণ।" },
        { q: "ডেঙ্গু কতদিন স্থায়ী হয়?", a: "সাধারণত ২–৭ দিন। সুস্থ হতে ২–৪ সপ্তাহ লাগে।" },
        { q: "ডেঙ্গু কি সংক্রামক?", a: "না। শুধুমাত্র সংক্রমিত মশার কামড়ে ছড়ায়।" },
        { q: "চিকিৎসা কি?", a: "বিশ্রাম, তরল পান ও প্যারাসিটামল। গুরুতর ক্ষেত্রে হাসপাতাল।" },
        { q: "শিশুদের রক্ষা করব কিভাবে?", a: "মশারি, রিপেলেন্ট ও লম্বা হাতার পোশাক।" },
      ],
      hospitals: "নিকটবর্তী হাসপাতাল (ঢাকা)",
      hospitalList: [
        { name: "ঢাকা মেডিকেল কলেজ হাসপাতাল", dist: "২.১ কিমি", beds: "ডেঙ্গু ওয়ার্ড আছে" },
        { name: "স্যার সলিমুল্লাহ মেডিকেল", dist: "৩.৪ কিমি", beds: "ডেঙ্গু ওয়ার্ড আছে" },
        { name: "শহীদ সোহরাওয়ার্দী মেডিকেল", dist: "৫.০ কিমি", beds: "ডেঙ্গু ওয়ার্ড আছে" },
        { name: "মুগদা মেডিকেল কলেজ", dist: "৬.২ কিমি", beds: "ডেঙ্গু ওয়ার্ড আছে" },
      ],
    },
    pro: {
      overview: "লাইভ ঝুঁকি মানচিত্র", forecast: "AI পূর্বাভাস", satellite: "স্যাটেলাইট ফিড",
      chw: "CHW প্রতিবেদন", alertCentre: "সতর্কতা কেন্দ্র", interventions: "হস্তক্ষেপ",
      analytics: "বিশ্লেষণ", settings: "সেটিংস",
      role: "ভূমিকা", email: "দাপ্তরিক ইমেইল", password: "পাসওয়ার্ড",
      rememberMe: "সাইন ইন রাখুন", forgotPassword: "পাসওয়ার্ড ভুলে গেছেন?",
      logout: "সাইন আউট",
      unauthorized: "নিষিদ্ধ এলাকা",
      unauthorizedDesc: "আপনার ভূমিকার এই মডিউলে প্রবেশাধিকার নেই।",
      Critical: "সংকটাপন্ন", High: "উচ্চ", Moderate: "মাঝারি", Low: "নিম্ন",
    },
  },
};

// ============================================================================
//  DETERMINISTIC RNG + WARD DATA  (for professional portal)
// ============================================================================
const seededRng = (seed) => {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
};

const WARD_NAMES = [
  "Gulshan-1","Gulshan-2","Banani","Baridhara","Bashundhara","Mohakhali","Tejgaon",
  "Farmgate","Kawran Bazar","New Market","Dhanmondi-1","Dhanmondi-2","Lalmatia",
  "Mohammadpur","Adabor","Shyamoli","Mirpur-1","Mirpur-2","Mirpur-6","Mirpur-10",
  "Mirpur-12","Pallabi","Kafrul","Uttara-1","Uttara-3","Uttara-7","Uttara-13",
  "Khilkhet","Badda","Rampura","Khilgaon","Shahjahanpur","Motijheel","Paltan",
  "Ramna","Shahbag","Old Dhaka","Lalbagh","Hazaribagh","Kamrangirchar",
  "Jatrabari","Demra","Sutrapur","Wari","Gendaria","Sayedabad","Cantonment","Khilgaon-2",
];

const buildWards = () => {
  const r = seededRng(2026);
  return WARD_NAMES.map((name, i) => {
    const base = r() * 100;
    const trendDir = r() > 0.5 ? 1 : -1;
    const score = Math.min(99, Math.max(8, Math.round(base)));
    const level = score >= 75 ? "Critical" : score >= 55 ? "High" : score >= 35 ? "Moderate" : "Low";
    const spark = Array.from({ length: 8 }, (_, k) =>
      Math.max(2, Math.round(score / 2 + (r() * 20 - 10) + k * trendDir * (r() * 1.8)))
    );
    return {
      id: i + 1, name, score, level, spark,
      trend: trendDir > 0 ? "up" : "down",
      cases7d: Math.round((score / 100) * 180 + r() * 25),
      vectorIdx: Math.round((score / 100) * 90 + r() * 12),
      confidence: Math.round(72 + r() * 22),
      chwSignal: Math.round(40 + r() * 55),
      population: 90000 + Math.round(r() * 80000),
      outbreakProb: Math.round((score / 100) * 86 + r() * 9),
    };
  });
};

const WEEKLY_DATA = [
  { week: "W1", cases: 210 }, { week: "W2", cases: 340 },
  { week: "W3", cases: 480 }, { week: "W4", cases: 620 },
  { week: "W5", cases: 590 }, { week: "W6", cases: 730 },
  { week: "W7", cases: 890 }, { week: "W8", cases: 1120 },
];

// ============================================================================
//  SHARED MICRO-COMPONENTS
// ============================================================================
const Divider = ({ theme }) => (
  <View style={{ height: 1, backgroundColor: theme === "dark" ? COLORS.dark.border : COLORS.light.border, marginVertical: 4 }} />
);

const Badge = ({ label, color = "#1A6B3A", textColor = "#fff", style }) => (
  <View style={[{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, backgroundColor: color }, style]}>
    <Text style={{ fontSize: 10, fontWeight: "700", color: textColor }}>{label}</Text>
  </View>
);

const PressableRow = ({ onPress, children, style, theme }) => {
  const C = theme === "dark" ? COLORS.dark : COLORS.light;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[{ backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 10 }, style]}
    >
      {children}
    </TouchableOpacity>
  );
};

// ─── Simple bar chart (no external library needed) ──────────────────────────
const MiniBarChart = ({ data, maxVal, theme }) => {
  const C = theme === "dark" ? COLORS.dark : COLORS.light;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", height: 64, gap: 3 }}>
      {data.map((d, i) => {
        const pct = d.cases / maxVal;
        const isLast = i === data.length - 1;
        return (
          <View key={d.week} style={{ flex: 1, alignItems: "center", gap: 2 }}>
            <View style={{
              width: "100%",
              height: Math.max(4, Math.round(pct * 52)),
              borderRadius: 3,
              backgroundColor: isLast ? COLORS.risk.danger.bg : COLORS.brand[500],
              opacity: isLast ? 1 : 0.45 + (i / data.length) * 0.55,
            }} />
            <Text style={{ fontSize: 8, color: C.textMuted }}>{d.week}</Text>
          </View>
        );
      })}
    </View>
  );
};

// ============================================================================
//  LANDING / PORTAL SELECTOR
// ============================================================================
const LandingScreen = ({ t, lang, setLang, dark, setDark, onPickPublic, onPickPro }) => {
  const C = dark ? COLORS.dark : COLORS.light;
  const stats = [
    { label: "Wards monitored", value: "48", sub: "Dhaka" },
    { label: "Model AUROC", value: "0.91", sub: "14-day lead" },
    { label: "CHWs networked", value: "8,400", sub: "Shasthya Sheba" },
    { label: "Data sources", value: "6+", sub: "MODIS·GPM·DGHS" },
  ];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dark ? "#050D0A" : "#F0F7F3" }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Header controls */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.brand[500] }}>DengueSense</Text>
            <Text style={{ fontSize: 11, fontWeight: "700", color: COLORS.brand[400], letterSpacing: 2 }}>BD · DGHS</Text>
          </View>
          <TouchableOpacity onPress={() => setLang(lang === "en" ? "bn" : "en")}
            style={[styles.ctrlBtn, { borderColor: C.border, backgroundColor: C.card }]}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: C.text }}>{lang === "en" ? "বাং" : "EN"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setDark(!dark)}
            style={[styles.ctrlBtn, { borderColor: C.border, backgroundColor: C.card, marginLeft: 8 }]}>
            <Text style={{ fontSize: 14 }}>{dark ? "☀️" : "🌙"}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ alignItems: "center", marginVertical: 28 }}>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(26,107,58,0.1)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 14, borderWidth: 1, borderColor: "rgba(26,107,58,0.25)" }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.brand[500], marginRight: 6 }} />
            <Text style={{ fontSize: 10, fontWeight: "700", color: COLORS.brand[500], letterSpacing: 1 }}>DGHS · BSIA · WHO SEARO</Text>
          </View>
          <Text style={{ fontSize: 28, fontWeight: "800", color: C.text, textAlign: "center" }}>{t.appName}</Text>
          <Text style={{ fontSize: 14, color: C.textSecond, textAlign: "center", marginTop: 6, paddingHorizontal: 20, lineHeight: 20 }}>{t.tagline}</Text>
        </View>

        <Text style={{ fontSize: 11, fontWeight: "700", color: C.textMuted, letterSpacing: 2, textTransform: "uppercase", textAlign: "center", marginBottom: 14 }}>{t.choosePortal}</Text>

        {/* Public portal card */}
        <TouchableOpacity onPress={onPickPublic} activeOpacity={0.85}
          style={[styles.portalCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={styles.row}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(26,107,58,0.1)", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 22 }}>🌍</Text>
            </View>
            <View style={{ backgroundColor: "rgba(26,107,58,0.1)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: "rgba(26,107,58,0.25)" }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: COLORS.brand[500] }}>{t.publicAccess}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 18, fontWeight: "700", color: C.text, marginTop: 12 }}>{t.publicPortal}</Text>
          <Text style={{ fontSize: 13, color: C.textSecond, marginTop: 4, lineHeight: 19 }}>{t.publicDesc}</Text>
          <View style={[styles.row, { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border }]}>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {["RISK MAP", "SYMPTOMS", "HELP"].map(lbl => (
                <View key={lbl} style={{ backgroundColor: C.bg, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 5 }}>
                  <Text style={{ fontSize: 9, fontWeight: "700", color: C.textMuted }}>{lbl}</Text>
                </View>
              ))}
            </View>
            <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.brand[500] }}>{t.enter} →</Text>
          </View>
        </TouchableOpacity>

        {/* Pro portal card */}
        <TouchableOpacity onPress={onPickPro} activeOpacity={0.85}
          style={[styles.portalCard, { backgroundColor: "#0F172A", borderColor: "#1E293B", marginTop: 12 }]}>
          <View style={styles.row}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(239,68,68,0.15)", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 22 }}>🛡️</Text>
            </View>
            <View style={{ backgroundColor: "rgba(239,68,68,0.15)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#F87171" }}>🔒 {t.secureLogin}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#F1F5F9", marginTop: 12 }}>{t.proPortal}</Text>
          <Text style={{ fontSize: 13, color: "#94A3B8", marginTop: 4, lineHeight: 19 }}>{t.proDesc}</Text>
          <View style={[styles.row, { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: "#1E293B" }]}>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {["DGHS", "CHW", "EPI", "VECTOR"].map(lbl => (
                <View key={lbl} style={{ backgroundColor: "#1E293B", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 5 }}>
                  <Text style={{ fontSize: 9, fontWeight: "700", color: "#94A3B8" }}>{lbl}</Text>
                </View>
              ))}
            </View>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#34D399" }}>{t.signIn} →</Text>
          </View>
        </TouchableOpacity>

        {/* Stats row */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 24 }}>
          {stats.map((s, i) => (
            <View key={i} style={{ flex: 1, minWidth: "40%", backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border }}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: C.text }}>{s.value}</Text>
              <Text style={{ fontSize: 11, fontWeight: "600", color: C.textSecond, marginTop: 2 }}>{s.label}</Text>
              <Text style={{ fontSize: 10, color: C.textMuted, marginTop: 1 }}>{s.sub}</Text>
            </View>
          ))}
        </View>

        <Text style={{ textAlign: "center", fontSize: 10, color: C.textMuted, marginTop: 24, marginBottom: 8 }}>DengueSense BD · v1.0 · BEAR Summit 2026</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================================
//  ── LAYER 1: PUBLIC PORTAL ──────────────────────────────────────────────────
// ============================================================================

// ─── Public Tab Bar ──────────────────────────────────────────────────────────
const PublicTabBar = ({ tab, setTab, t, dark }) => {
  const C = dark ? COLORS.dark : COLORS.light;
  const tabs = [
    { key: "home",    icon: "🏠" },
    { key: "check",   icon: "🩺" },
    { key: "prevent", icon: "🛡️" },
    { key: "report",  icon: "📋" },
    { key: "help",    icon: "❓" },
  ];
  return (
    <View style={{ flexDirection: "row", backgroundColor: C.navBg, borderTopWidth: 1, borderTopColor: C.border, paddingBottom: Platform.OS === "ios" ? 20 : 8, paddingTop: 4 }}>
      {tabs.map(({ key, icon }) => {
        const active = tab === key;
        return (
          <TouchableOpacity key={key} onPress={() => setTab(key)} activeOpacity={0.7}
            style={{ flex: 1, alignItems: "center", paddingVertical: 6 }}>
            <Text style={{ fontSize: 18 }}>{icon}</Text>
            <Text style={{ fontSize: 10, fontWeight: active ? "700" : "500", color: active ? COLORS.brand[500] : C.textMuted, marginTop: 2 }}>
              {t.nav[key]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ─── Public Header ───────────────────────────────────────────────────────────
const PublicHeader = ({ t, lang, setLang, dark, setDark, onSwitchPortal }) => (
  <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.brand[500] }}>
    <Text style={{ fontSize: 16, fontWeight: "800", color: "#fff", flex: 1 }}>🦟 {t.appName}</Text>
    <TouchableOpacity onPress={() => setLang(lang === "en" ? "bn" : "en")} style={[styles.ctrlBtn, { borderColor: "rgba(255,255,255,0.4)", backgroundColor: "rgba(255,255,255,0.15)", marginRight: 8 }]}>
      <Text style={{ fontSize: 11, fontWeight: "700", color: "#fff" }}>{lang === "en" ? "বাং" : "EN"}</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => setDark(!dark)} style={[styles.ctrlBtn, { borderColor: "rgba(255,255,255,0.4)", backgroundColor: "rgba(255,255,255,0.15)", marginRight: 8 }]}>
      <Text style={{ fontSize: 14 }}>{dark ? "☀️" : "🌙"}</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={onSwitchPortal} style={[styles.ctrlBtn, { borderColor: "rgba(255,255,255,0.4)", backgroundColor: "rgba(255,255,255,0.15)" }]}>
      <Text style={{ fontSize: 10, fontWeight: "700", color: "#fff" }}>PRO</Text>
    </TouchableOpacity>
  </View>
);

// ─── Public Home Screen ──────────────────────────────────────────────────────
const PublicHomeScreen = ({ t, risk, setRisk, dark, setTab }) => {
  const C = dark ? COLORS.dark : COLORS.light;
  const h = t.home;
  const riskKey = { low: "safe", med: "warn", high: "danger" }[risk];
  const riskColors = COLORS.risk[riskKey];
  const riskLabel = { low: h.riskLow, med: h.riskMed, high: h.riskHigh }[risk];
  const riskDesc = h.riskDesc[risk];
  const maxCases = Math.max(...WEEKLY_DATA.map(d => d.cases));

  const quickActions = [
    { icon: "🩺", label: h.checkSymptoms,  tab: "check",   bg: dark ? "rgba(59,130,246,0.15)" : "#EFF6FF", border: "#BFDBFE" },
    { icon: "🛡️", label: h.preventTips,    tab: "prevent", bg: dark ? "rgba(22,163,74,0.15)" : "#F0FDF4", border: "#BBF7D0" },
    { icon: "📋", label: h.reportCase,      tab: "report",  bg: dark ? "rgba(168,85,247,0.15)" : "#FAF5FF", border: "#E9D5FF" },
    { icon: "❓", label: h.getHelp,         tab: "help",    bg: dark ? "rgba(245,158,11,0.15)" : "#FFFBEB", border: "#FDE68A" },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
      {/* Alert banner */}
      <View style={{ flexDirection: "row", alignItems: "flex-start", padding: 12, borderRadius: 12, backgroundColor: dark ? "rgba(217,119,6,0.18)" : "#FFF9C4", borderWidth: 1, borderColor: "#FDE68A", marginBottom: 14 }}>
        <Text style={{ fontSize: 14, marginRight: 8 }}>⚠️</Text>
        <Text style={{ fontSize: 13, color: dark ? "#FDE68A" : "#92400E", flex: 1, lineHeight: 18 }}>{h.alertBanner}</Text>
      </View>

      {/* Risk card */}
      <View style={{ backgroundColor: riskColors.soft, borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: riskColors.border }}>
        <Text style={{ fontSize: 10, fontWeight: "700", color: C.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>{h.riskTitle}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: riskColors.bg, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}>{risk === "low" ? "✓" : risk === "med" ? "!" : "!!"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: riskColors.text }}>{riskLabel}</Text>
            <Text style={{ fontSize: 12, color: C.textSecond, marginTop: 3, lineHeight: 17 }}>{riskDesc}</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
          {["low","med","high"].map(r => (
            <TouchableOpacity key={r} onPress={() => setRisk(r)} style={{ flex: 1, paddingVertical: 6, borderRadius: 9, alignItems: "center", backgroundColor: risk === r ? (r==="low"?"#16A34A":r==="med"?"#D97706":"#DC2626") : "rgba(0,0,0,0.08)" }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: risk === r ? "#fff" : C.textSecond }}>{r==="low"?"Low":r==="med"?"Med":"High"}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quick actions */}
      <Text style={{ fontSize: 10, fontWeight: "700", color: C.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>{h.quickActions}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        {quickActions.map(({ icon, label, tab, bg, border }) => (
          <TouchableOpacity key={tab} onPress={() => setTab(tab)} activeOpacity={0.8}
            style={{ width: (SCREEN_WIDTH - 42) / 2, backgroundColor: bg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: border, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 22 }}>{icon}</Text>
            <Text style={{ fontSize: 12, fontWeight: "600", color: C.text, flex: 1, lineHeight: 16 }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Weekly chart */}
      <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border }}>
        <Text style={{ fontSize: 10, fontWeight: "700", color: C.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>{h.weeklyStats}</Text>
        <MiniBarChart data={WEEKLY_DATA} maxVal={maxCases} theme={dark ? "dark" : "light"} />
      </View>
    </ScrollView>
  );
};

// ─── Symptom Checker ─────────────────────────────────────────────────────────
const SymptomCheckerScreen = ({ t, dark }) => {
  const C = dark ? COLORS.dark : COLORS.light;
  const c = t.check;
  const [selected, setSelected] = useState(new Set());
  const [warnings, setWarnings] = useState(new Set());
  const [duration, setDuration] = useState("");
  const [result, setResult] = useState(null);

  const toggle = (set, setFn, key) => {
    setFn(prev => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
    setResult(null);
  };

  const checkNow = () => {
    if (warnings.size > 0) { setResult("warn"); return; }
    const n = selected.size;
    if (n === 0) { setResult("none"); return; }
    setResult(n >= 5 ? "high" : n >= 3 ? "med" : "low");
  };
  const clear = () => { setSelected(new Set()); setWarnings(new Set()); setDuration(""); setResult(null); };

  const resultMap = {
    none: { bg: dark ? "#262626" : "#F5F5F5", text: C.textSecond, msg: c.noSymptoms },
    low:  { bg: COLORS.risk.safe.soft,   text: COLORS.risk.safe.text,   msg: c.resultLow },
    med:  { bg: COLORS.risk.warn.soft,   text: COLORS.risk.warn.text,   msg: c.resultMed },
    high: { bg: COLORS.risk.danger.soft, text: COLORS.risk.danger.text, msg: c.resultHigh },
    warn: { bg: COLORS.risk.danger.soft, text: COLORS.risk.danger.text, msg: c.resultWarn },
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "800", color: C.text }}>{c.title}</Text>
      <Text style={{ fontSize: 13, color: C.textSecond, marginTop: 3, marginBottom: 16 }}>{c.subtitle}</Text>

      {/* Duration */}
      <Text style={{ fontSize: 13, fontWeight: "600", color: C.text, marginBottom: 8 }}>{c.duration}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {c.durationOpts.map(opt => (
            <TouchableOpacity key={opt} onPress={() => setDuration(opt)}
              style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: duration === opt ? COLORS.brand[500] : C.border, backgroundColor: duration === opt ? COLORS.brand[500] : C.card }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: duration === opt ? "#fff" : C.textSecond }}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Symptoms */}
      {c.symptoms.map((sym, i) => {
        const sel = selected.has(i);
        return (
          <TouchableOpacity key={i} onPress={() => toggle(selected, setSelected, i)}
            style={{ flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: sel ? COLORS.brand[400] : C.border, backgroundColor: sel ? (dark ? "rgba(26,107,58,0.2)" : COLORS.brand[50]) : C.card, marginBottom: 8 }}>
            <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: sel ? COLORS.brand[500] : C.border, backgroundColor: sel ? COLORS.brand[500] : "transparent", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
              {sel && <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>✓</Text>}
            </View>
            <Text style={{ fontSize: 13, color: C.text, flex: 1 }}>{sym}</Text>
          </TouchableOpacity>
        );
      })}

      {/* Warning signs */}
      <View style={{ backgroundColor: dark ? "rgba(220,38,38,0.18)" : "#FEF2F2", borderRadius: 16, padding: 14, marginTop: 6, marginBottom: 8, borderWidth: 1, borderColor: "#FECACA" }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#DC2626", marginBottom: 10 }}>⚠️ {c.warningSymptoms}</Text>
        {c.warningSigns.map((ws, i) => {
          const sel = warnings.has(i);
          return (
            <TouchableOpacity key={i} onPress={() => toggle(warnings, setWarnings, i)}
              style={{ flexDirection: "row", alignItems: "center", padding: 10, borderRadius: 10, borderWidth: 1.5, borderColor: sel ? "#DC2626" : C.border, backgroundColor: sel ? (dark ? "rgba(220,38,38,0.35)" : "#FEE2E2") : C.card, marginBottom: 6 }}>
              <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: sel ? "#DC2626" : C.border, backgroundColor: sel ? "#DC2626" : "transparent", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                {sel && <Text style={{ color: "#fff", fontSize: 9, fontWeight: "700" }}>✓</Text>}
              </View>
              <Text style={{ fontSize: 12, color: C.text, flex: 1 }}>{ws}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Result */}
      {result && (
        <View style={{ padding: 14, borderRadius: 12, backgroundColor: resultMap[result].bg, marginBottom: 10 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: resultMap[result].text }}>{resultMap[result].msg}</Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={{ flexDirection: "row", gap: 10, paddingBottom: 24 }}>
        <TouchableOpacity onPress={checkNow} style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: COLORS.brand[500], alignItems: "center" }}>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>{c.btnCheck}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={clear} style={{ paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, alignItems: "center" }}>
          <Text style={{ color: C.textSecond, fontWeight: "600", fontSize: 14 }}>{c.btnClear}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// ─── Prevention Screen ───────────────────────────────────────────────────────
const PreventionScreen = ({ t, dark }) => {
  const C = dark ? COLORS.dark : COLORS.light;
  const p = t.prevent;
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "800", color: C.text }}>{p.title}</Text>
      <Text style={{ fontSize: 13, color: C.textSecond, marginTop: 3, marginBottom: 16 }}>{p.subtitle}</Text>

      {p.categories.map((cat, i) => (
        <View key={i} style={{ backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: "hidden", marginBottom: 10 }}>
          <TouchableOpacity onPress={() => setOpenIdx(openIdx === i ? -1 : i)}
            style={{ flexDirection: "row", alignItems: "center", padding: 16 }}>
            <Text style={{ fontSize: 22, marginRight: 12 }}>{cat.icon}</Text>
            <Text style={{ fontSize: 14, fontWeight: "700", color: C.text, flex: 1 }}>{cat.title}</Text>
            <Text style={{ fontSize: 12, color: C.textMuted }}>{openIdx === i ? "▲" : "▼"}</Text>
          </TouchableOpacity>
          {openIdx === i && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 8 }}>
              {cat.tips.map((tip, j) => (
                <View key={j} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                  <Text style={{ color: COLORS.brand[500], fontSize: 14, marginTop: 1 }}>•</Text>
                  <Text style={{ fontSize: 13, color: C.textSecond, flex: 1, lineHeight: 18 }}>{tip}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
};

// ─── Report Screen ───────────────────────────────────────────────────────────
const ReportScreen = ({ t, dark }) => {
  const C = dark ? COLORS.dark : COLORS.light;
  const r = t.report;
  const [form, setForm] = useState({ name: "", age: "", gender: "", area: "", division: "", hospitalised: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const inputStyle = { backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: C.text, marginTop: 4 };
  const labelStyle = { fontSize: 10, fontWeight: "700", color: C.textMuted, letterSpacing: 1.2, textTransform: "uppercase" };

  if (submitted) return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: C.bg }}>
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.risk.safe.soft, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <Text style={{ fontSize: 30 }}>✓</Text>
      </View>
      <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.risk.safe.text, textAlign: "center", marginBottom: 20 }}>{r.success}</Text>
      <TouchableOpacity onPress={() => { setSubmitted(false); setForm({ name:"",age:"",gender:"",area:"",division:"",hospitalised:"",notes:"" }); }}
        style={{ paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14, backgroundColor: COLORS.brand[500] }}>
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>New Report</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "800", color: C.text }}>{r.title}</Text>
      <Text style={{ fontSize: 13, color: C.textSecond, marginTop: 3, marginBottom: 18 }}>{r.subtitle}</Text>

      <View style={{ gap: 14 }}>
        <View><Text style={labelStyle}>{r.labels.name}</Text><TextInput style={inputStyle} value={form.name} onChangeText={v => update("name", v)} placeholder="—" placeholderTextColor={C.textMuted} /></View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}><Text style={labelStyle}>{r.labels.age}</Text><TextInput style={inputStyle} value={form.age} onChangeText={v => update("age", v)} keyboardType="numeric" placeholder="32" placeholderTextColor={C.textMuted} /></View>
          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>{r.labels.gender}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {r.genders.map(g => (
                  <TouchableOpacity key={g} onPress={() => update("gender", g)}
                    style={{ paddingHorizontal: 10, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: form.gender === g ? COLORS.brand[500] : C.border, backgroundColor: form.gender === g ? COLORS.brand[500] : C.card }}>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: form.gender === g ? "#fff" : C.textSecond }}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
        <View><Text style={labelStyle}>{r.labels.area}</Text><TextInput style={inputStyle} value={form.area} onChangeText={v => update("area", v)} placeholder="e.g. Mirpur-10" placeholderTextColor={C.textMuted} /></View>
        <View>
          <Text style={labelStyle}>{r.labels.division}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {r.divisions.map(d => (
                <TouchableOpacity key={d} onPress={() => update("division", d)}
                  style={{ paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: form.division === d ? COLORS.brand[500] : C.border, backgroundColor: form.division === d ? COLORS.brand[500] : C.card }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: form.division === d ? "#fff" : C.textSecond }}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
        <View>
          <Text style={labelStyle}>{r.labels.hospitalised}</Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
            {[["yes", r.yes], ["no", r.no]].map(([val, label]) => (
              <TouchableOpacity key={val} onPress={() => update("hospitalised", val)}
                style={{ flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: form.hospitalised === val ? COLORS.brand[500] : C.border, backgroundColor: form.hospitalised === val ? COLORS.brand[500] : C.card, alignItems: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: form.hospitalised === val ? "#fff" : C.textSecond }}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View><Text style={labelStyle}>{r.labels.notes}</Text><TextInput style={[inputStyle, { height: 80, textAlignVertical: "top" }]} value={form.notes} onChangeText={v => update("notes", v)} multiline /></View>
      </View>

      {error ? <Text style={{ fontSize: 13, color: COLORS.risk.danger.text, fontWeight: "600", marginTop: 10 }}>{error}</Text> : null}

      <TouchableOpacity onPress={() => {
        if (!form.age || !form.area || !form.division) { setError(r.required); return; }
        setError(""); setSubmitted(true);
      }} style={{ marginTop: 20, marginBottom: 30, paddingVertical: 15, borderRadius: 14, backgroundColor: COLORS.brand[500], alignItems: "center" }}>
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>{r.labels.submit}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ─── Help Screen ─────────────────────────────────────────────────────────────
const HelpScreen = ({ t, dark }) => {
  const C = dark ? COLORS.dark : COLORS.light;
  const h = t.help;
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "800", color: C.text }}>{h.title}</Text>
      <Text style={{ fontSize: 13, color: C.textSecond, marginTop: 3, marginBottom: 18 }}>{h.subtitle}</Text>

      {/* Emergency contacts */}
      <Text style={{ fontSize: 10, fontWeight: "700", color: C.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>{h.emergency}</Text>
      {h.contacts.map((c, i) => (
        <TouchableOpacity key={i} onPress={() => Linking.openURL(`tel:${c.number.replace(/[^0-9]/g, "")}`)}>
          <PressableRow theme={dark ? "dark" : "light"} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 18 }}>📞</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: C.text }}>{c.label}</Text>
              <Text style={{ fontSize: 11, color: C.textSecond, marginTop: 1 }}>{c.desc}</Text>
            </View>
            <Text style={{ fontSize: 14, fontWeight: "800", color: COLORS.brand[500] }}>{c.number}</Text>
          </PressableRow>
        </TouchableOpacity>
      ))}

      {/* FAQs */}
      <Text style={{ fontSize: 10, fontWeight: "700", color: C.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 10, marginBottom: 10 }}>{h.faqTitle}</Text>
      {h.faqs.map((faq, i) => (
        <View key={i} style={{ backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: "hidden", marginBottom: 8 }}>
          <TouchableOpacity onPress={() => setOpenFaq(openFaq === i ? null : i)}
            style={{ flexDirection: "row", alignItems: "flex-start", padding: 14, gap: 10 }}>
            <Text style={{ color: COLORS.brand[500], fontWeight: "700", fontSize: 14 }}>Q</Text>
            <Text style={{ fontSize: 13, fontWeight: "600", color: C.text, flex: 1 }}>{faq.q}</Text>
            <Text style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{openFaq === i ? "▲" : "▼"}</Text>
          </TouchableOpacity>
          {openFaq === i && (
            <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
              <Text style={{ fontSize: 13, color: C.textSecond, lineHeight: 19 }}>{faq.a}</Text>
            </View>
          )}
        </View>
      ))}

      {/* Hospitals */}
      <Text style={{ fontSize: 10, fontWeight: "700", color: C.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 10, marginBottom: 10 }}>{h.hospitals}</Text>
      {h.hospitalList.map((hosp, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.border, marginBottom: 8, gap: 12 }}>
          <Text style={{ fontSize: 22 }}>🏥</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: C.text }}>{hosp.name}</Text>
            <Text style={{ fontSize: 11, color: C.textSecond, marginTop: 2 }}>{hosp.beds}</Text>
          </View>
          <Text style={{ fontSize: 12, fontWeight: "700", color: COLORS.brand[500] }}>{hosp.dist}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

// ─── Public Portal Container ─────────────────────────────────────────────────
const PublicPortal = ({ t, lang, setLang, dark, setDark, onSwitchPortal }) => {
  const [tab, setTab] = useState("home");
  const [risk, setRisk] = useState("med");
  const C = dark ? COLORS.dark : COLORS.light;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <PublicHeader t={t} lang={lang} setLang={setLang} dark={dark} setDark={setDark} onSwitchPortal={onSwitchPortal} />
      <View style={{ flex: 1 }}>
        {tab === "home"    && <PublicHomeScreen t={t} risk={risk} setRisk={setRisk} dark={dark} setTab={setTab} />}
        {tab === "check"   && <SymptomCheckerScreen t={t} dark={dark} />}
        {tab === "prevent" && <PreventionScreen t={t} dark={dark} />}
        {tab === "report"  && <ReportScreen t={t} dark={dark} />}
        {tab === "help"    && <HelpScreen t={t} dark={dark} />}
      </View>
      <PublicTabBar tab={tab} setTab={setTab} t={t} dark={dark} />
    </View>
  );
};

// ============================================================================
//  ── LAYER 2: HEALTHCARE PROFESSIONAL PORTAL ─────────────────────────────────
// ============================================================================

// ─── Pro Login ───────────────────────────────────────────────────────────────
const ProLogin = ({ t, onLogin, onBack }) => {
  const pt = t.pro;
  const [role, setRole] = useState("Epidemiologist");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = () => {
    if (!email || !pwd) { setErr("Email and password required"); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin({ role, email }); }, 900);
  };

  const inputStyle = { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "#334155", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#F1F5F9", marginTop: 5 };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#020617" }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 12 }}>
        <TouchableOpacity onPress={onBack} style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <Text style={{ fontSize: 14, color: "#94A3B8" }}>← {t.back}</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#F1F5F9" }}>DengueSense</Text>
            <Text style={{ fontSize: 10, fontWeight: "700", color: "#10B981", letterSpacing: 2 }}>BD · DGHS</Text>
          </View>
          <View style={{ backgroundColor: "rgba(239,68,68,0.15)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" }}>
            <Text style={{ fontSize: 10, fontWeight: "700", color: "#F87171" }}>🔒 RESTRICTED</Text>
          </View>
        </View>

        <Text style={{ fontSize: 22, fontWeight: "700", color: "#F1F5F9" }}>{pt.secureLogin || "Secure Sign-in"}</Text>
        <Text style={{ fontSize: 13, color: "#94A3B8", marginTop: 4, marginBottom: 24 }}>Authorized DGHS personnel only</Text>

        {/* Role selector */}
        <Text style={{ fontSize: 10, fontWeight: "700", color: "#94A3B8", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>{pt.role}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
          {["DGHS Officer","Epidemiologist","CHW","Vector Officer"].map(r => (
            <TouchableOpacity key={r} onPress={() => setRole(r)}
              style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: role === r ? "#10B981" : "#334155", backgroundColor: role === r ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)" }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: role === r ? "#34D399" : "#94A3B8" }}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ fontSize: 10, fontWeight: "700", color: "#94A3B8", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>{pt.email}</Text>
        <TextInput style={inputStyle} value={email} onChangeText={setEmail} placeholder="name@dghs.gov.bd" placeholderTextColor="#475569" autoCapitalize="none" keyboardType="email-address" />

        <Text style={{ fontSize: 10, fontWeight: "700", color: "#94A3B8", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4, marginTop: 14 }}>{pt.password}</Text>
        <View style={{ position: "relative" }}>
          <TextInput style={inputStyle} value={pwd} onChangeText={setPwd} secureTextEntry={!showPwd} placeholder="••••••••" placeholderTextColor="#475569" />
          <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={{ position: "absolute", right: 14, top: 14 }}>
            <Text style={{ fontSize: 18, color: "#475569" }}>{showPwd ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>

        {err ? <Text style={{ color: "#F87171", fontSize: 13, marginTop: 10 }}>{err}</Text> : null}

        <TouchableOpacity onPress={submit} disabled={loading}
          style={{ marginTop: 20, paddingVertical: 15, borderRadius: 14, backgroundColor: loading ? "#065F46" : "#059669", alignItems: "center" }}>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>{loading ? "Authenticating…" : pt.signIn || "Sign in"}</Text>
        </TouchableOpacity>

        <View style={{ marginTop: 18, padding: 12, borderRadius: 12, backgroundColor: "rgba(59,130,246,0.1)", borderWidth: 1, borderColor: "rgba(59,130,246,0.25)" }}>
          <Text style={{ fontSize: 11, color: "#93C5FD" }}><Text style={{ fontWeight: "700" }}>Demo:</Text> Use any email + password — this is a frontend simulation.</Text>
        </View>

        <Text style={{ fontSize: 10, color: "#475569", marginTop: 14, lineHeight: 15 }}>
          Activity is monitored under DGHS IT-Sec Policy. Unauthorized access is a punishable offence under the Digital Security Act 2018.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Pro Overview (Risk Map) ─────────────────────────────────────────────────
const ProOverview = ({ wards, t }) => {
  const pt = t.pro;
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? wards : wards.filter(w => w.level === filter);
  const counts = ["Critical","High","Moderate","Low"].map(l => ({ level: l, count: wards.filter(w => w.level === l).length }));

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "800", color: COLORS.pro.text, marginBottom: 4 }}>{pt.overview}</Text>
      <Text style={{ fontSize: 12, color: COLORS.pro.muted, marginBottom: 16 }}>Real-time ward-level dengue risk · 48 Dhaka wards</Text>

      {/* Level filter pills */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        {counts.map(({ level, count }) => {
          const lc = COLORS.level[level];
          const active = filter === level;
          return (
            <TouchableOpacity key={level} onPress={() => setFilter(filter === level ? "all" : level)}
              style={{ flex: 1, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: active ? lc.border : COLORS.pro.border, backgroundColor: active ? lc.soft : COLORS.pro.card, alignItems: "center" }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: lc.bg, marginBottom: 4 }} />
              <Text style={{ fontSize: 9, fontWeight: "700", color: COLORS.pro.muted, textTransform: "uppercase" }}>{pt[level]}</Text>
              <Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.pro.text }}>{count}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Ward grid */}
      <View style={{ backgroundColor: COLORS.pro.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.pro.border, padding: 12 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {filtered.map(w => {
            const lc = COLORS.level[w.level];
            return (
              <View key={w.id} style={{ width: (SCREEN_WIDTH - 56) / 4, padding: 8, borderRadius: 10, backgroundColor: lc.soft, borderWidth: 1, borderColor: lc.border, alignItems: "center" }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: lc.bg, marginBottom: 3 }} />
                <Text style={{ fontSize: 8, fontWeight: "600", color: COLORS.pro.muted, textAlign: "center" }} numberOfLines={1}>{w.name}</Text>
                <Text style={{ fontSize: 14, fontWeight: "800", color: lc.text }}>{w.score}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <Text style={{ fontSize: 10, color: COLORS.pro.muted, marginTop: 10 }}>🕐 Last updated 12 min ago · MODIS + DGHS line list</Text>
    </ScrollView>
  );
};

// ─── Pro Forecast ─────────────────────────────────────────────────────────────
const ProForecast = ({ wards, t }) => {
  const topAtRisk = [...wards].sort((a, b) => b.outbreakProb - a.outbreakProb).slice(0, 8);
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "800", color: COLORS.pro.text, marginBottom: 4 }}>{t.pro.forecast}</Text>
      <Text style={{ fontSize: 12, color: COLORS.pro.muted, marginBottom: 16 }}>ST-GNN model · 14-day lead time · AUROC 0.91</Text>

      <View style={{ backgroundColor: "rgba(16,185,129,0.08)", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "rgba(16,185,129,0.3)", marginBottom: 16 }}>
        <Text style={{ fontSize: 12, fontWeight: "700", color: "#34D399", marginBottom: 4 }}>🔮 AI PREDICTION SUMMARY</Text>
        <Text style={{ fontSize: 13, color: COLORS.pro.muted, lineHeight: 19 }}>Model forecasts a 72% probability of outbreak escalation in northern Dhaka clusters over the next 14 days. Pre-emptive vector control is recommended in 6 wards.</Text>
      </View>

      <Text style={{ fontSize: 11, fontWeight: "700", color: COLORS.pro.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>HIGHEST OUTBREAK PROBABILITY</Text>
      {topAtRisk.map((w, i) => {
        const lc = COLORS.level[w.level];
        return (
          <View key={w.id} style={{ backgroundColor: COLORS.pro.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.pro.border, marginBottom: 8, flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.pro.muted, width: 28 }}>#{i+1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.pro.text }}>{w.name}</Text>
              <Text style={{ fontSize: 11, color: COLORS.pro.muted, marginTop: 2 }}>Risk score: {w.score} · Cases/7d: {w.cases7d} · Conf: {w.confidence}%</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: lc.text }}>{w.outbreakProb}%</Text>
              <Text style={{ fontSize: 9, color: COLORS.pro.muted }}>outbreak prob.</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

// ─── Pro CHW Reports ─────────────────────────────────────────────────────────
const ProCHWReports = ({ wards, t }) => {
  const topChw = [...wards].sort((a, b) => b.chwSignal - a.chwSignal).slice(0, 10);
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "800", color: COLORS.pro.text, marginBottom: 4 }}>{t.pro.chw}</Text>
      <Text style={{ fontSize: 12, color: COLORS.pro.muted, marginBottom: 16 }}>8,400 Shasthya Sheba workers · real-time field signals</Text>

      <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
        {[["Total CHWs","8,400","Active nationwide"],["Signals today","2,341","Field reports"],["High-signal wards","14","Require review"]].map((s,i)=>(
          <View key={i} style={{ flex: 1, backgroundColor: COLORS.pro.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.pro.border }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#34D399" }}>{s[1]}</Text>
            <Text style={{ fontSize: 10, fontWeight: "600", color: COLORS.pro.muted }}>{s[0]}</Text>
            <Text style={{ fontSize: 9, color: "#475569", marginTop: 1 }}>{s[2]}</Text>
          </View>
        ))}
      </View>

      {topChw.map((w, i) => {
        const lc = COLORS.level[w.level];
        const sig = w.chwSignal;
        const sigColor = sig > 75 ? "#DC2626" : sig > 55 ? "#D97706" : "#16A34A";
        return (
          <View key={w.id} style={{ backgroundColor: COLORS.pro.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.pro.border, marginBottom: 8, flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.pro.text }}>{w.name}</Text>
              <Text style={{ fontSize: 11, color: COLORS.pro.muted, marginTop: 2 }}>Pop: {(w.population/1000).toFixed(0)}k · {w.cases7d} cases / 7d</Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <View style={{ backgroundColor: lc.soft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: lc.border }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: lc.text }}>{w.level}</Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: "700", color: sigColor }}>Signal: {sig}</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

// ─── Pro Alert Centre ─────────────────────────────────────────────────────────
const ProAlertCentre = ({ t }) => {
  const proAlerts = [
    { severity: "Critical", title: "Outbreak threshold breached — Mirpur cluster", area: "Mirpur-1, Mirpur-2, Mirpur-6", time: "18 min ago", msg: "Confirmed case-count exceeds 150/100k for 3rd consecutive week. Immediate fogging and blood-drive deployment authorized." },
    { severity: "High", title: "Vector index spike — Badda ward", area: "Badda, Rampura", time: "1h 12m ago", msg: "Larval survey index jumped from 32 to 78 following heavy rainfall. Container index 0.62. Emergency fogging scheduled 06:00 BST." },
    { severity: "High", title: "Hospital capacity warning", area: "Dhaka North", time: "3h ago", msg: "Dengue ward occupancy at DMCH: 94%. Overflow protocol activated. Redirect non-critical cases to Mugda MCH." },
    { severity: "Moderate", title: "Unusual serotype 3 detection", area: "Wari, Sutrapur", time: "8h ago", msg: "Lab confirmation of DENV-3 in 4 recent samples from Old Dhaka cluster. Population may lack immunity. Enhanced surveillance advised." },
  ];
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "800", color: COLORS.pro.text, marginBottom: 4 }}>{t.pro.alertCentre}</Text>
      <Text style={{ fontSize: 12, color: COLORS.pro.muted, marginBottom: 16 }}>Operational alerts for authorized DGHS personnel</Text>
      {proAlerts.map((a, i) => {
        const lc = COLORS.level[a.severity];
        return (
          <View key={i} style={{ backgroundColor: COLORS.pro.card, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: lc.bg, borderWidth: 1, borderColor: COLORS.pro.border, padding: 14, marginBottom: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.pro.text, flex: 1, marginRight: 10 }}>{a.title}</Text>
              <View style={{ backgroundColor: lc.soft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                <Text style={{ fontSize: 9, fontWeight: "700", color: lc.text }}>{a.severity.toUpperCase()}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 8 }}>
              <Text style={{ fontSize: 11, color: COLORS.pro.muted }}>📍 {a.area}</Text>
              <Text style={{ fontSize: 11, color: COLORS.pro.muted }}>🕐 {a.time}</Text>
            </View>
            <Text style={{ fontSize: 12, color: COLORS.pro.muted, lineHeight: 18 }}>{a.msg}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
};

// ─── Pro Analytics ────────────────────────────────────────────────────────────
const ProAnalytics = ({ wards, t }) => {
  const levelCounts = ["Critical","High","Moderate","Low"].map(l => ({ level: l, count: wards.filter(w => w.level === l).length }));
  const maxCount = Math.max(...levelCounts.map(l => l.count));
  const totalCases = wards.reduce((a, w) => a + w.cases7d, 0);
  const avgScore = Math.round(wards.reduce((a, w) => a + w.score, 0) / wards.length);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "800", color: COLORS.pro.text, marginBottom: 4 }}>{t.pro.analytics}</Text>
      <Text style={{ fontSize: 12, color: COLORS.pro.muted, marginBottom: 16 }}>Aggregate epidemiological analysis · 48 wards</Text>

      {/* KPI row */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
        {[["Total Cases/7d", totalCases.toLocaleString(), "Dhaka-wide"], ["Avg Risk Score", avgScore, "/100"], ["Critical Wards", levelCounts[0].count, "wards"]].map((s,i)=>(
          <View key={i} style={{ flex: 1, backgroundColor: COLORS.pro.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.pro.border }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: i === 0 ? "#F87171" : i === 1 ? "#FBBF24" : "#34D399" }}>{s[1]}</Text>
            <Text style={{ fontSize: 9, fontWeight: "700", color: COLORS.pro.muted, marginTop: 2 }}>{s[0]}</Text>
            <Text style={{ fontSize: 9, color: "#475569", marginTop: 1 }}>{s[2]}</Text>
          </View>
        ))}
      </View>

      {/* Level distribution bars */}
      <View style={{ backgroundColor: COLORS.pro.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.pro.border, marginBottom: 16 }}>
        <Text style={{ fontSize: 11, fontWeight: "700", color: COLORS.pro.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>WARD LEVEL DISTRIBUTION</Text>
        {levelCounts.map(({ level, count }) => {
          const lc = COLORS.level[level];
          const pct = count / maxCount;
          return (
            <View key={level} style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: lc.text, width: 68 }}>{level}</Text>
              <View style={{ flex: 1, height: 14, borderRadius: 7, backgroundColor: "rgba(255,255,255,0.06)" }}>
                <View style={{ width: `${pct * 100}%`, height: 14, borderRadius: 7, backgroundColor: lc.bg }} />
              </View>
              <Text style={{ fontSize: 12, fontWeight: "700", color: COLORS.pro.text, width: 22, textAlign: "right" }}>{count}</Text>
            </View>
          );
        })}
      </View>

      {/* National trend bars */}
      <View style={{ backgroundColor: COLORS.pro.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.pro.border }}>
        <Text style={{ fontSize: 11, fontWeight: "700", color: COLORS.pro.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>NATIONAL WEEKLY TREND</Text>
        <View style={{ flexDirection: "row", alignItems: "flex-end", height: 80, gap: 4 }}>
          {WEEKLY_DATA.map((d, i) => {
            const isLast = i === WEEKLY_DATA.length - 1;
            const pct = d.cases / WEEKLY_DATA[WEEKLY_DATA.length - 1].cases;
            return (
              <View key={d.week} style={{ flex: 1, alignItems: "center", gap: 3 }}>
                <View style={{ width: "100%", height: Math.max(6, Math.round(pct * 68)), borderRadius: 4, backgroundColor: isLast ? "#DC2626" : "#10B981", opacity: isLast ? 1 : 0.5 + (i / WEEKLY_DATA.length) * 0.5 }} />
                <Text style={{ fontSize: 8, color: COLORS.pro.muted }}>{d.week}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

// ─── Pro Settings ─────────────────────────────────────────────────────────────
const ProSettings = ({ user, onLogout, t, lang, setLang }) => {
  const [smsOn, setSmsOn] = useState(true);
  const [pushOn, setPushOn] = useState(true);
  const [emailOn, setEmailOn] = useState(false);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "800", color: COLORS.pro.text, marginBottom: 4 }}>{t.pro.settings}</Text>
      <Text style={{ fontSize: 12, color: COLORS.pro.muted, marginBottom: 20 }}>Account & notification preferences</Text>

      {/* User info */}
      <View style={{ backgroundColor: COLORS.pro.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.pro.border, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#065F46", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#fff" }}>{user.email?.[0]?.toUpperCase() || "U"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.pro.text }}>{user.email}</Text>
          <Text style={{ fontSize: 11, color: COLORS.pro.muted, marginTop: 1 }}>{user.role} · DGHS</Text>
        </View>
      </View>

      {/* Notifications */}
      <View style={{ backgroundColor: COLORS.pro.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.pro.border, marginBottom: 16 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.pro.text, marginBottom: 12 }}>Notifications</Text>
        {[["SMS via Grameenphone", "Critical alerts only", smsOn, setSmsOn],
          ["Push notifications", "Mobile app · all alerts", pushOn, setPushOn],
          ["Email digest", "Daily summary · 08:00 BST", emailOn, setEmailOn]].map(([label, desc, val, setVal], i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: COLORS.pro.border }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.pro.text }}>{label}</Text>
              <Text style={{ fontSize: 11, color: COLORS.pro.muted, marginTop: 1 }}>{desc}</Text>
            </View>
            <Switch value={val} onValueChange={setVal} trackColor={{ false: "#334155", true: "#059669" }} thumbColor="#fff" />
          </View>
        ))}
      </View>

      {/* Language */}
      <View style={{ backgroundColor: COLORS.pro.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.pro.border, marginBottom: 20 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.pro.text, marginBottom: 12 }}>Language</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[["en","English"],["bn","বাংলা"]].map(([k, label]) => (
            <TouchableOpacity key={k} onPress={() => setLang(k)}
              style={{ flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: lang === k ? "#10B981" : COLORS.pro.border, backgroundColor: lang === k ? "rgba(16,185,129,0.12)" : "transparent", alignItems: "center" }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: lang === k ? "#34D399" : COLORS.pro.muted }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity onPress={onLogout} style={{ paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: "#DC2626", alignItems: "center", marginBottom: 30 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#DC2626" }}>↩ {t.pro.logout}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ─── Pro Tab Bar ──────────────────────────────────────────────────────────────
const ProTabBar = ({ section, setSection, t }) => {
  const tabs = [
    { key: "map",     icon: "🗺️", label: "Map" },
    { key: "forecast",icon: "🤖", label: "AI" },
    { key: "chw",     icon: "👥", label: "CHW" },
    { key: "alerts",  icon: "🔔", label: "Alerts" },
    { key: "analytics",icon:"📊", label: "Stats" },
    { key: "settings",icon: "⚙️", label: "Settings" },
  ];
  return (
    <View style={{ flexDirection: "row", backgroundColor: COLORS.pro.card, borderTopWidth: 1, borderTopColor: COLORS.pro.border, paddingBottom: Platform.OS === "ios" ? 20 : 8, paddingTop: 4 }}>
      {tabs.map(({ key, icon, label }) => {
        const active = section === key;
        return (
          <TouchableOpacity key={key} onPress={() => setSection(key)} activeOpacity={0.7}
            style={{ flex: 1, alignItems: "center", paddingVertical: 6 }}>
            <Text style={{ fontSize: 16 }}>{icon}</Text>
            <Text style={{ fontSize: 9, fontWeight: active ? "700" : "500", color: active ? "#34D399" : "#64748B", marginTop: 2 }}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ─── Pro Portal Container ─────────────────────────────────────────────────────
const ProPortal = ({ wards, user, onLogout, t, lang, setLang }) => {
  const [section, setSection] = useState("map");
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.pro.bg }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.pro.card, borderBottomWidth: 1, borderBottomColor: COLORS.pro.border }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "800", color: COLORS.pro.text }}>DengueSense BD</Text>
          <Text style={{ fontSize: 9, fontWeight: "700", color: "#10B981", letterSpacing: 2 }}>PROFESSIONAL · DGHS</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity onPress={() => setLang(lang === "en" ? "bn" : "en")} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: COLORS.pro.border }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: COLORS.pro.muted }}>{lang === "en" ? "বাং" : "EN"}</Text>
          </TouchableOpacity>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#065F46", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#fff" }}>{user.email?.[0]?.toUpperCase() || "U"}</Text>
          </View>
        </View>
      </View>

      {/* Role badge */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "rgba(16,185,129,0.06)", borderBottomWidth: 1, borderBottomColor: COLORS.pro.border }}>
        <Text style={{ fontSize: 11, color: "#34D399" }}>🔐 Signed in as <Text style={{ fontWeight: "700" }}>{user.role}</Text> · {user.email}</Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {section === "map"      && <ProOverview wards={wards} t={t} />}
        {section === "forecast" && <ProForecast wards={wards} t={t} />}
        {section === "chw"      && <ProCHWReports wards={wards} t={t} />}
        {section === "alerts"   && <ProAlertCentre t={t} />}
        {section === "analytics"&& <ProAnalytics wards={wards} t={t} />}
        {section === "settings" && <ProSettings user={user} onLogout={onLogout} t={t} lang={lang} setLang={setLang} />}
      </View>

      <ProTabBar section={section} setSection={setSection} t={t} />
    </View>
  );
};

// ============================================================================
//  ROOT APP
// ============================================================================
export default function DengueSenseBDApp() {
  const [view, setView] = useState("landing"); // landing | public | proLogin | pro
  const [lang, setLang] = useState("en");
  const [dark, setDark] = useState(false);
  const [user, setUser] = useState(null);

  const wards = useMemo(() => buildWards(), []);
  const t = STRINGS[lang];

  // Derive theme-safe bg for StatusBar
  const statusBg = view === "pro" || view === "proLogin" ? "#020617" : dark ? COLORS.dark.bg : COLORS.light.bg;

  return (
    <>
      <StatusBar
        barStyle={view === "public" ? "light-content" : dark ? "light-content" : "dark-content"}
        backgroundColor={view === "public" ? COLORS.brand[500] : statusBg}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: statusBg }} edges={["top"]}>
        {view === "landing" && (
          <LandingScreen
            t={t} lang={lang} setLang={setLang} dark={dark} setDark={setDark}
            onPickPublic={() => setView("public")}
            onPickPro={() => setView("proLogin")}
          />
        )}
        {view === "public" && (
          <PublicPortal
            t={t} lang={lang} setLang={setLang} dark={dark} setDark={setDark}
            onSwitchPortal={() => setView("landing")}
          />
        )}
        {view === "proLogin" && (
          <ProLogin
            t={t}
            onLogin={(u) => { setUser(u); setView("pro"); }}
            onBack={() => setView("landing")}
          />
        )}
        {view === "pro" && user && (
          <ProPortal
            wards={wards} user={user} t={t} lang={lang} setLang={setLang}
            onLogout={() => { setUser(null); setView("landing"); }}
          />
        )}
      </SafeAreaView>
    </>
  );
}

// ============================================================================
//  SHARED STYLESHEETS
// ============================================================================
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ctrlBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 36,
    minHeight: 36,
  },
  portalCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
  },
});
