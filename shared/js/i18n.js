/**
 * i18n.js — Arabic/English dictionary, RTL handling, WMO weather codes,
 * number & date formatting. Arabic is the primary locale, English is the
 * fallback; the visitor's browser decides unless a choice was stored.
 */

export const DICT = {
  en: {
    "brand.tagline": "Precipitation intelligence & rain radar",
    "nav.overview": "Overview",
    "nav.radar": "Radar",
    "nav.cities": "Cities",
    "nav.guides": "Guides",
    "nav.about": "About",
    "nav.quakes": "Earthquakes",
    "nav.marine": "Marine",
    "nav.air": "Air quality",

    "action.skip": "Skip to content",
    "action.search": "Search city",
    "action.searchPlaceholder": "Search a Libyan or world city…",
    "action.searchHint": "Type at least 2 characters",
    "action.noResults": "No matching city found",
    "action.locate": "Locate me",
    "action.locating": "Locating…",
    "action.refresh": "Refresh",
    "action.retry": "Try again",
    "action.share": "Share",
    "action.copy": "Copy link",
    "action.copied": "Link copied",
    "action.close": "Close",
    "action.viewAll": "View all",
    "action.fullscreen": "Fullscreen",
    "action.play": "Play",
    "action.pause": "Pause",
    "action.more": "More",
    "action.readMore": "Read guide",
    "action.backToCities": "All cities",
    "action.openRepo": "Source code",

    "label.language": "Language",
    "label.theme": "Theme",
    "label.themeLight": "Light",
    "label.themeDark": "Dark",
    "label.themeSystem": "System",
    "label.units": "Units",
    "label.menu": "Menu",

    "wx.now": "Now",
    "wx.today": "Today",
    "wx.tomorrow": "Tomorrow",
    "wx.feelsLike": "Feels like",
    "wx.humidity": "Humidity",
    "wx.wind": "Wind",
    "wx.windGust": "Gusts",
    "wx.pressure": "Pressure",
    "wx.visibility": "Visibility",
    "wx.uvIndex": "UV index",
    "wx.cloudCover": "Cloud cover",
    "wx.dewPoint": "Dew point",
    "wx.precipitation": "Precipitation",
    "wx.rain": "Rain",
    "wx.showers": "Showers",
    "wx.probability": "Chance",
    "wx.sunrise": "Sunrise",
    "wx.sunset": "Sunset",
    "wx.dayLength": "Daylight",
    "wx.temperature": "Temperature",
    "wx.high": "High",
    "wx.low": "Low",
    "wx.hourly": "Hour by hour",
    "wx.daily": "Next 7 days",
    "wx.details": "Details",
    "wx.updated": "Updated",
    "wx.stale": "Showing cached data",
    "wx.direction": "Direction",
    "wx.pressureTrend": "Pressure",
    "wx.rainToday": "Rain today",

    "rain.now": "Raining now",
    "rain.dry": "No rain right now",
    "rain.noneExpected": "No significant rain expected",
    "rain.total24h": "Rain next 24h",
    "rain.total7d": "Rain next 7 days",
    "rain.wetDays": "Wet days",
    "rain.wettest": "Wettest day",
    "rain.probMax": "Peak chance",
    "rain.peakHour": "Peak hour",
    "rain.radar": "Rain radar",
    "rain.radarLive": "Live radar",
    "rain.radarPast": "Past",
    "rain.radarNowcast": "Forecast",
    "rain.radarUnavailable": "Radar is unavailable right now",
    "rain.radarNote": "RainViewer composite radar · updates every 10 minutes",
    "rain.legend": "Light",
    "rain.legendHeavy": "Heavy",
    "rain.intensity": "Intensity",
    "rain.accumulation": "Accumulation",
    "rain.wetMeter": "Atmospheric moisture",
    "rain.drySpell": "Dry spell",
    "rain.compare": "Compared with yesterday",
    "rain.mm": "mm",
    "rain.mmh": "mm/h",
    "rain.chance": "chance",

    "wx.conditions": "Conditions",
    "wx.airQuality": "Air quality",
    "wx.aqi": "AQI",
    "wx.pm25": "PM2.5",
    "wx.pm10": "PM10",
    "wx.dust": "Dust",
    "wx.sea": "Sea state",
    "wx.waveHeight": "Wave height",
    "wx.wavePeriod": "Wave period",
    "wx.seaTemp": "Sea temperature",
    "wx.quakes": "Earthquakes",
    "wx.quakesSub": "USGS catalog around Libya",
    "wx.quakesRadius": "Search radius",
    "wx.magnitude": "Magnitude",
    "wx.depth": "Depth",
    "wx.distance": "Distance",
    "wx.quakesEmpty": "No earthquakes above magnitude 2.5 in the selected window",
    "wx.quakesNote": "Source: U.S. Geological Survey (USGS). Data may lag by a few minutes.",
    "wx.lastQuake": "Latest event",
    "wx.strongest": "Strongest",
    "wx.aqiGood": "Good",
    "wx.aqiModerate": "Moderate",
    "wx.aqiSensitive": "Unhealthy for sensitive groups",
    "wx.aqiUnhealthy": "Unhealthy",
    "wx.aqiVery": "Very unhealthy",
    "wx.aqiHazardous": "Hazardous",
    "wx.uvLow": "Low",
    "wx.uvModerate": "Moderate",
    "wx.uvHigh": "High",
    "wx.uvVeryHigh": "Very high",
    "wx.uvExtreme": "Extreme",
    "wx.seaLight": "Calm",
    "wx.seaSlight": "Slight",
    "wx.seaModerate": "Moderate",
    "wx.seaRough": "Rough",
    "wx.seaVeryRough": "Very rough",

    "cities.title": "Libyan cities",
    "cities.sub": "Live conditions across the country",
    "cities.world": "World watch",
    "cities.region": "Region",
    "cities.allTitle": "Weather for every Libyan city",
    "cities.allSub": "Pick a city for a dedicated forecast page",

    "city.weather": "Weather in",
    "city.climate": "Climate",
    "city.climateOf": "Climate of",
    "city.liveNow": "Right now",
    "city.forecast7": "7-day forecast",
    "city.nearby": "Nearby cities",
    "city.pageIntro": "Live conditions, hourly precipitation and a 7-day outlook for",
    "city.seoLine": "Updated every 10 minutes from Open-Meteo, with no API key and no tracking.",

    "guides.title": "Field guides",
    "guides.sub": "How to read the sky over Libya",
    "guides.minRead": "min read",
    "guides.updated": "Updated",
    "guides.allTitle": "Guides & explainers",
    "guides.allSub": "Practical meteorology for Libya, written for everyone",

    "footer.sources": "Data sources",
    "footer.product": "Product",
    "footer.about": "About this project",
    "footer.cross": "Also from us",
    "footer.rights": "All rights reserved.",
    "footer.built": "Built with open data — no API keys, no trackers.",
    "footer.privacy": "Privacy",
    "footer.terms": "Terms",

    "error.title": "Something went wrong",
    "error.body": "We could not reach the weather service. Check your connection and try again.",
    "error.offline": "You appear to be offline",
    "error.offlineBody": "The last successful reading is kept on this device.",
    "error.cityNotFound": "City not found",
    "error.geoDenied": "Location permission was denied — showing Tripoli instead.",
    "error.radar": "Radar tiles could not be loaded.",

    "units.c": "°C",
    "units.f": "°F",
    "units.kmh": "km/h",
    "units.mph": "mph",
    "units.mm": "mm",
    "units.in": "in",
    "units.km": "km",
    "units.mi": "mi",
    "units.hpa": "hPa",

    "meta.homeTitle": "Live weather, rain radar and earthquake watch",
    "about.title": "About",
    "about.lede": "Two products, one open repository, zero API keys.",
    "privacy.title": "Privacy",
    "privacy.lede": "We do not use accounts, advertising or third-party trackers.",
  },

  ar: {
    "brand.tagline": "استخبارات الهطول ورادار الأمطار",
    "nav.overview": "نظرة عامة",
    "nav.radar": "الرادار",
    "nav.cities": "المدن",
    "nav.guides": "الأدلة",
    "nav.about": "عن الموقع",
    "nav.quakes": "الزلازل",
    "nav.marine": "البحر",
    "nav.air": "جودة الهواء",

    "action.skip": "تخطَّ إلى المحتوى",
    "action.search": "ابحث عن مدينة",
    "action.searchPlaceholder": "ابحث عن مدينة ليبية أو عالمية…",
    "action.searchHint": "اكتب حرفين على الأقل",
    "action.noResults": "لا توجد مدينة مطابقة",
    "action.locate": "حدّد موقعي",
    "action.locating": "جارٍ تحديد الموقع…",
    "action.refresh": "تحديث",
    "action.retry": "إعادة المحاولة",
    "action.share": "مشاركة",
    "action.copy": "نسخ الرابط",
    "action.copied": "تم نسخ الرابط",
    "action.close": "إغلاق",
    "action.viewAll": "عرض الكل",
    "action.fullscreen": "ملء الشاشة",
    "action.play": "تشغيل",
    "action.pause": "إيقاف",
    "action.more": "المزيد",
    "action.readMore": "اقرأ الدليل",
    "action.backToCities": "كل المدن",
    "action.openRepo": "الكود المصدري",

    "label.language": "اللغة",
    "label.theme": "المظهر",
    "label.themeLight": "فاتح",
    "label.themeDark": "داكن",
    "label.themeSystem": "النظام",
    "label.units": "الوحدات",
    "label.menu": "القائمة",

    "wx.now": "الآن",
    "wx.today": "اليوم",
    "wx.tomorrow": "غدًا",
    "wx.feelsLike": "الإحساس الفعلي",
    "wx.humidity": "الرطوبة",
    "wx.wind": "الرياح",
    "wx.windGust": "هبات",
    "wx.pressure": "الضغط",
    "wx.visibility": "الرؤية",
    "wx.uvIndex": "الأشعة فوق البنفسجية",
    "wx.cloudCover": "الغطاء السحابي",
    "wx.dewPoint": "نقطة الندى",
    "wx.precipitation": "الهطول",
    "wx.rain": "مطر",
    "wx.showers": "زخات",
    "wx.probability": "الاحتمال",
    "wx.sunrise": "الشروق",
    "wx.sunset": "الغروب",
    "wx.dayLength": "طول النهار",
    "wx.temperature": "الحرارة",
    "wx.high": "العليا",
    "wx.low": "الصغرى",
    "wx.hourly": "ساعة بساعة",
    "wx.daily": "7 أيام القادمة",
    "wx.details": "التفاصيل",
    "wx.updated": "آخر تحديث",
    "wx.stale": "بيانات محفوظة",
    "wx.direction": "الاتجاه",
    "wx.pressureTrend": "الضغط",
    "wx.rainToday": "أمطار اليوم",

    "rain.now": "تمطر الآن",
    "rain.dry": "لا أمطار الآن",
    "rain.noneExpected": "لا يُتوقع هطول ذو دلالة",
    "rain.total24h": "أمطار 24 ساعة",
    "rain.total7d": "أمطار 7 أيام",
    "rain.wetDays": "أيام ممطرة",
    "rain.wettest": "أغزر يوم",
    "rain.probMax": "أعلى احتمال",
    "rain.peakHour": "ساعة الذروة",
    "rain.radar": "رادار الأمطار",
    "rain.radarLive": "رادار مباشر",
    "rain.radarPast": "سابق",
    "rain.radarNowcast": "توقع",
    "rain.radarUnavailable": "الرادار غير متاح حاليًا",
    "rain.radarNote": "رادار RainViewer المركّب · يتحدث كل 10 دقائق",
    "rain.legend": "خفيف",
    "rain.legendHeavy": "غزير",
    "rain.intensity": "الشدة",
    "rain.accumulation": "التراكم",
    "rain.wetMeter": "رطوبة الغلاف الجوي",
    "rain.drySpell": "فترة جفاف",
    "rain.compare": "مقارنة بالأمس",
    "rain.mm": "مم",
    "rain.mmh": "مم/س",
    "rain.chance": "احتمال",

    "wx.conditions": "الأحوال",
    "wx.airQuality": "جودة الهواء",
    "wx.aqi": "مؤشر الهواء",
    "wx.pm25": "جسيمات 2.5",
    "wx.pm10": "جسيمات 10",
    "wx.dust": "غبار",
    "wx.sea": "حالة البحر",
    "wx.waveHeight": "ارتفاع الموج",
    "wx.wavePeriod": "دورة الموج",
    "wx.seaTemp": "حرارة البحر",
    "wx.quakes": "الزلازل",
    "wx.quakesSub": "كتالوج USGS حول ليبيا",
    "wx.quakesRadius": "نطاق البحث",
    "wx.magnitude": "القوة",
    "wx.depth": "العمق",
    "wx.distance": "المسافة",
    "wx.quakesEmpty": "لا زلازل فوق 2.5 درجة في النطاق المحدد",
    "wx.quakesNote": "المصدر: هيئة المسح الجيولوجي الأمريكية (USGS). قد تتأخر البيانات دقائق.",
    "wx.lastQuake": "أحدث حدث",
    "wx.strongest": "الأقوى",
    "wx.aqiGood": "جيد",
    "wx.aqiModerate": "متوسط",
    "wx.aqiSensitive": "غير صحي للفئات الحساسة",
    "wx.aqiUnhealthy": "غير صحي",
    "wx.aqiVery": "ضار جدًا",
    "wx.aqiHazardous": "خطير",
    "wx.uvLow": "منخفض",
    "wx.uvModerate": "متوسط",
    "wx.uvHigh": "مرتفع",
    "wx.uvVeryHigh": "مرتفع جدًا",
    "wx.uvExtreme": "شديد",
    "wx.seaLight": "هادئ",
    "wx.seaSlight": "خفيف",
    "wx.seaModerate": "معتدل",
    "wx.seaRough": "مضطرب",
    "wx.seaVeryRough": "شديد الاضطراب",

    "cities.title": "المدن الليبية",
    "cities.sub": "الأحوال المباشرة في كل أنحاء البلاد",
    "cities.world": "مرصد عالمي",
    "cities.region": "المنطقة",
    "cities.allTitle": "الطقس في كل مدينة ليبية",
    "cities.allSub": "اختر مدينة للحصول على صفحة توقعات مخصصة",

    "city.weather": "الطقس في",
    "city.climate": "المناخ",
    "city.climateOf": "مناخ",
    "city.liveNow": "الآن",
    "city.forecast7": "توقعات 7 أيام",
    "city.nearby": "مدن قريبة",
    "city.pageIntro": "الأحوال المباشرة والهطول ساعة بساعة وتوقعات 7 أيام لـ",
    "city.seoLine": "تُحدَّث كل 10 دقائق من Open-Meteo، بدون مفتاح API وبدون تتبع.",

    "guides.title": "أدلة ميدانية",
    "guides.sub": "كيف تقرأ السماء فوق ليبيا",
    "guides.minRead": "دقيقة قراءة",
    "guides.updated": "آخر تحديث",
    "guides.allTitle": "الأدلة والشروح",
    "guides.allSub": "أرصاد عملية لليبيا مكتوبة للجميع",

    "footer.sources": "مصادر البيانات",
    "footer.product": "المنتج",
    "footer.about": "عن المشروع",
    "footer.cross": "من منتجاتنا",
    "footer.rights": "جميع الحقوق محفوظة.",
    "footer.built": "مبني على بيانات مفتوحة — بلا مفاتيح API وبلا متتبعات.",
    "footer.privacy": "الخصوصية",
    "footer.terms": "الشروط",

    "error.title": "حدث خطأ ما",
    "error.body": "لم نتمكن من الوصول إلى خدمة الطقس. تحقق من اتصالك ثم حاول مجددًا.",
    "error.offline": "يبدو أنك غير متصل",
    "error.offlineBody": "آخر قراءة ناجحة محفوظة على هذا الجهاز.",
    "error.cityNotFound": "لم يتم العثور على المدينة",
    "error.geoDenied": "تم رفض إذن الموقع — نعرض طرابلس بدلًا من ذلك.",
    "error.radar": "تعذّر تحميل بلاطات الرادار.",

    "units.c": "°م",
    "units.f": "°ف",
    "units.kmh": "كم/س",
    "units.mph": "ميل/س",
    "units.mm": "مم",
    "units.in": "إنش",
    "units.km": "كم",
    "units.mi": "ميل",
    "units.hpa": "هكتوباسكال",

    "meta.homeTitle": "الطقس المباشر ورادار الأمطار ورصد الزلازل",
    "about.title": "عن الموقع",
    "about.lede": "منتجان، مستودع مفتوح واحد، وبلا أي مفاتيح API.",
    "privacy.title": "الخصوصية",
    "privacy.lede": "لا حسابات، ولا إعلانات، ولا متتبعات خارجية.",
  },
};

const state = { lang: null };

export function detectLang() {
  try {
    const stored = localStorage.getItem("wx.lang");
    if (stored === "ar" || stored === "en") return stored;
  } catch (e) {
    /* ignore */
  }
  const list =
    (navigator.languages && navigator.languages.length && navigator.languages) ||
    [navigator.language || "ar"];
  for (const tag of list) {
    if (/^ar\b/i.test(tag)) return "ar";
    if (/^en\b/i.test(tag)) return "en";
  }
  return "ar";
}

export function getLang() {
  if (!state.lang) state.lang = detectLang();
  return state.lang;
}

export function isRtl() {
  return getLang() === "ar";
}

export function setLang(lang, { silent = false } = {}) {
  if (lang !== "ar" && lang !== "en") return;
  state.lang = lang;
  try {
    localStorage.setItem("wx.lang", lang);
  } catch (e) {
    /* ignore */
  }
  if (typeof document !== "undefined") {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === "ar" ? "rtl" : "ltr";
    applyI18n();
    if (!silent) window.dispatchEvent(new CustomEvent("wx:lang", { detail: { lang } }));
  }
}

export function toggleLang() {
  setLang(getLang() === "ar" ? "en" : "ar");
}

export function t(key, vars) {
  const lang = getLang();
  let value = (DICT[lang] && DICT[lang][key]) || (DICT.en && DICT.en[key]) || key;
  if (vars) {
    for (const k of Object.keys(vars)) {
      value = value.replace(new RegExp("\\{" + k + "\\}", "g"), String(vars[k]));
    }
  }
  return value;
}

export function applyI18n(root) {
  if (typeof document === "undefined") return;
  const scope = root || document;
  scope.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  scope.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
  });
  scope.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
  });
  scope.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
  });
  scope.querySelectorAll("[data-lang-label]").forEach((el) => {
    el.textContent = getLang() === "ar" ? "EN" : "ع";
  });
}

export function initI18n() {
  state.lang = detectLang();
  const html = document.documentElement;
  html.lang = state.lang;
  html.dir = state.lang === "ar" ? "rtl" : "ltr";
  applyI18n();
  return state.lang;
}

/* ------------------------------------------------------------------ format */
const locale = () => (getLang() === "ar" ? "ar-LY-u-nu-latn" : "en-GB");

export function num(value, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat(locale(), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(value));
}

export function temp(value, unit = "C") {
  if (value === null || value === undefined) return "—";
  const v = unit === "F" ? (Number(value) * 9) / 5 + 32 : Number(value);
  return `${Math.round(v)}°`;
}

export function tempUnit(unit = "C") {
  return t(unit === "F" ? "units.f" : "units.c");
}

export function time(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale(), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function dateLong(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale(), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function dateShort(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale(), { day: "numeric", month: "short" }).format(d);
}

export function weekday(value, style = "short") {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale(), { weekday: style }).format(d);
}

export function relative(ts) {
  const diff = Math.round((Number(ts) - Date.now()) / 60000);
  const abs = Math.abs(diff);
  const unit =
    abs < 60
      ? ["minute", "دقيقة", "minutes", "دقائق"]
      : abs < 1440
        ? ["hour", "ساعة", "hours", "ساعات"]
        : ["day", "يوم", "days", "أيام"];
  const value = abs < 60 ? abs : abs < 1440 ? Math.round(abs / 60) : Math.round(abs / 1440);
  if (getLang() === "ar") {
    if (diff === 0) return "الآن";
    return diff < 0 ? `قبل ${num(value)} ${unit[3]}` : `بعد ${num(value)} ${unit[1]}`;
  }
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  return rtf.format(diff < 0 ? -value : value, unit[0]);
}

/* ---------------------------------------------------------------- WMO codes */
export const WMO = {
  0: { en: "Clear sky", ar: "صحو", icon: "sun" },
  1: { en: "Mainly clear", ar: "صحو غالبًا", icon: "sun-cloud" },
  2: { en: "Partly cloudy", ar: "غائم جزئيًا", icon: "sun-cloud" },
  3: { en: "Overcast", ar: "غائم", icon: "cloud" },
  45: { en: "Fog", ar: "ضباب", icon: "fog" },
  48: { en: "Freezing fog", ar: "ضباب متجمد", icon: "fog" },
  51: { en: "Light drizzle", ar: "رذاذ خفيف", icon: "drizzle" },
  53: { en: "Drizzle", ar: "رذاذ", icon: "drizzle" },
  55: { en: "Dense drizzle", ar: "رذاذ كثيف", icon: "drizzle" },
  56: { en: "Freezing drizzle", ar: "رذاذ متجمد", icon: "drizzle" },
  57: { en: "Dense freezing drizzle", ar: "رذاذ متجمد كثيف", icon: "drizzle" },
  61: { en: "Light rain", ar: "مطر خفيف", icon: "rain" },
  63: { en: "Moderate rain", ar: "مطر معتدل", icon: "rain" },
  65: { en: "Heavy rain", ar: "مطر غزير", icon: "rain-heavy" },
  66: { en: "Freezing rain", ar: "مطر متجمد", icon: "rain" },
  67: { en: "Heavy freezing rain", ar: "مطر متجمد غزير", icon: "rain-heavy" },
  71: { en: "Light snow", ar: "ثلج خفيف", icon: "snow" },
  73: { en: "Snow", ar: "ثلج", icon: "snow" },
  75: { en: "Heavy snow", ar: "ثلج غزير", icon: "snow" },
  77: { en: "Snow grains", ar: "حبيبات ثلج", icon: "snow" },
  80: { en: "Light showers", ar: "زخات خفيفة", icon: "showers" },
  81: { en: "Showers", ar: "زخات مطر", icon: "showers" },
  82: { en: "Violent showers", ar: "زخات عنيفة", icon: "rain-heavy" },
  85: { en: "Snow showers", ar: "زخات ثلج", icon: "snow" },
  86: { en: "Heavy snow showers", ar: "زخات ثلج غزيرة", icon: "snow" },
  95: { en: "Thunderstorm", ar: "عاصفة رعدية", icon: "storm" },
  96: { en: "Thunderstorm with hail", ar: "عاصفة رعدية مع برَد", icon: "storm" },
  99: { en: "Severe thunderstorm with hail", ar: "عاصفة رعدية شديدة مع برَد", icon: "storm" },
};

export function wmo(code) {
  const entry = WMO[code] || { en: "Unknown", ar: "غير معروف", icon: "cloud" };
  return {
    code,
    icon: entry.icon,
    text: getLang() === "ar" ? entry.ar : entry.en,
    en: entry.en,
    ar: entry.ar,
  };
}

export function isWetCode(code) {
  return code !== null && code !== undefined && WMO[code] !== undefined;
}

const WIND_AR = [
  "شمالية",
  "شمالية شرقية",
  "شرقية",
  "جنوبية شرقية",
  "جنوبية",
  "جنوبية غربية",
  "غربية",
  "شمالية غربية",
];
const WIND_EN = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

export function windDir(deg) {
  if (deg === null || deg === undefined || Number.isNaN(Number(deg))) return "—";
  const idx = Math.round((((Number(deg) % 360) + 360) % 360) / 45) % 8;
  return getLang() === "ar" ? WIND_AR[idx] : WIND_EN[idx];
}

export function aqiLevel(value) {
  const v = Number(value);
  if (!Number.isFinite(v)) return { key: "na", text: "—", tone: "muted" };
  let key;
  if (v <= 20) key = "wx.aqiGood";
  else if (v <= 40) key = "wx.aqiModerate";
  else if (v <= 60) key = "wx.aqiSensitive";
  else if (v <= 80) key = "wx.aqiUnhealthy";
  else if (v <= 100) key = "wx.aqiVery";
  else key = "wx.aqiHazardous";
  const tone = v <= 20 ? "good" : v <= 40 ? "warn" : v <= 60 ? "warn" : "danger";
  return { key, text: t(key), tone, value: v };
}

export function uvLevel(value) {
  const v = Number(value);
  if (!Number.isFinite(v)) return { text: "—", key: "wx.uvLow" };
  const key =
    v < 3
      ? "wx.uvLow"
      : v < 6
        ? "wx.uvModerate"
        : v < 8
          ? "wx.uvHigh"
          : v < 11
            ? "wx.uvVeryHigh"
            : "wx.uvExtreme";
  return { text: t(key), key };
}

export function seaState(height) {
  const v = Number(height);
  const key =
    !Number.isFinite(v) || v < 0.3
      ? "wx.seaLight"
      : v < 0.8
        ? "wx.seaSlight"
        : v < 1.8
          ? "wx.seaModerate"
          : v < 3.5
            ? "wx.seaRough"
            : "wx.seaVeryRough";
  return { key, text: t(key) };
}

/* --------------------------------------------------------------- unit system */
export function readUnits() {
  try {
    const raw = JSON.parse(localStorage.getItem("wx.units") || "null");
    if (raw && raw.temp) return raw;
  } catch (e) {
    /* ignore */
  }
  return { temp: "C", wind: "kmh", precip: "mm" };
}

export function saveUnits(units) {
  try {
    localStorage.setItem("wx.units", JSON.stringify(units));
  } catch (e) {
    /* ignore */
  }
}

export function convertTemp(celsius, units = readUnits()) {
  return units.temp === "F" ? (Number(celsius) * 9) / 5 + 32 : Number(celsius);
}

export function convertWind(kmh, units = readUnits()) {
  return units.wind === "mph" ? Number(kmh) * 0.621371 : Number(kmh);
}

export function convertPrecip(mm, units = readUnits()) {
  return units.precip === "in" ? Number(mm) / 25.4 : Number(mm);
}

export function convertDistance(km, units = readUnits()) {
  return units.wind === "mph" ? Number(km) * 0.621371 : Number(km);
}

export function precipDigits(mm) {
  return Number(mm) >= 10 ? 0 : 1;
}
