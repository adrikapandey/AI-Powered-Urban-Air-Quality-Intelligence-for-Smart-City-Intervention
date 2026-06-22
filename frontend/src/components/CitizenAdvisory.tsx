import type { Station } from "../types";
import { AlertCircle, Languages } from "lucide-react";

interface CitizenAdvisoryProps {
  station: Station | null;
  language: "en" | "hi" | "pb";
  onChangeLanguage: (lang: "en" | "hi" | "pb") => void;
  simulatedMitigatedAqi: number | null;
}

export const CitizenAdvisory: React.FC<CitizenAdvisoryProps> = ({
  station,
  language,
  onChangeLanguage,
  simulatedMitigatedAqi
}) => {
  if (!station) return null;

  const currentAqi = simulatedMitigatedAqi !== null ? simulatedMitigatedAqi : station.telemetry.aqi;

  // Translation mapping depending on AQI severity
  const getSeverity = (aqi: number) => {
    if (aqi <= 100) return "MODERATE";
    if (aqi <= 200) return "POOR";
    if (aqi <= 300) return "VERY_POOR";
    return "SEVERE";
  };

  const severity = getSeverity(currentAqi);

  const ADVISORIES = {
    MODERATE: {
      en: {
        title: "Air Quality Satisfactory/Moderate",
        message: "Air quality is acceptable. However, highly sensitive people should consider reducing prolonged heavy outdoor exertion.",
        schools: "Schools running normally. Outdoor activities permitted.",
        hospitals: "Normal operations. Keep windows ventilated."
      },
      hi: {
        title: "वायु गुणवत्ता संतोषजनक/सामान्य",
        message: "वायु गुणवत्ता स्वीकार्य है। हालांकि, अत्यधिक संवेदनशील लोगों को बाहरी गतिविधियों को थोड़ा कम करने पर विचार करना चाहिए।",
        schools: "स्कूल सामान्य रूप से चल रहे हैं। बाहरी गतिविधियों की अनुमति है।",
        hospitals: "सामान्य संचालन। खिड़कियों को हवादार रखें।"
      },
      pb: {
        title: "ਹਵਾ ਦੀ ਗੁਣਵੱਤਾ ਤਸੱਲੀਬਖਸ਼/ਸਧਾਰਨ",
        message: "ਹਵਾ ਦੀ ਗੁਣਵੱਤਾ ਸਵੀਕਾਰਯੋਗ ਹੈ। ਹਾਲਾਂਕਿ, ਬਹੁਤ ਜ਼ਿਆਦਾ ਸੰਵੇਦਨਸ਼ੀਲ ਲੋਕਾਂ ਨੂੰ ਬਾਹਰੀ ਗਤੀਵਿਧੀਆਂ ਨੂੰ ਥੋੜਾ ਘਟਾਉਣ 'ਤੇ ਵਿਚਾਰ ਕਰਨਾ ਚਾਹੀਦਾ ਹੈ।",
        schools: "ਸਕੂਲ ਆਮ ਵਾਂਗ ਚੱਲ ਰਹੇ ਹਨ। ਬਾਹਰੀ ਗਤੀਵਿਧੀਆਂ ਦੀ ਇਜਾਜ਼ਤ ਹੈ।",
        hospitals: "ਆਮ ਕੰਮਕਾਜ। ਖਿੜਕੀਆਂ ਨੂੰ ਹਵਾਦਾਰ ਰੱਖੋ।"
      }
    },
    POOR: {
      en: {
        title: "Air Quality Poor",
        message: "High PM2.5 levels. Outdoor workers and elderly should limit outdoor exposure. Active children should take breaks.",
        schools: "Limit outdoor physical education classes to 15 mins max.",
        hospitals: "Activate HEPA filters in geriatric and pediatric wards."
      },
      hi: {
        title: "वायु गुणवत्ता खराब",
        message: "उच्च PM2.5 स्तर। बाहरी श्रमिकों और बुजुर्गों को बाहर जाने से बचना चाहिए। सक्रिय बच्चों को विश्राम करना चाहिए।",
        schools: "बाहरी शारीरिक शिक्षा कक्षाओं को अधिकतम 15 मिनट तक सीमित करें।",
        hospitals: "जेरियाट्रिक और बाल चिकित्सा वार्डों में HEPA फिल्टर चालू करें।"
      },
      pb: {
        title: "ਹਵਾ ਦੀ ਗੁਣਵੱਤਾ ਖਰਾਬ",
        message: "ਉੱਚ PM2.5 ਪੱਧਰ। ਬਾਹਰੀ ਕਾਮਿਆਂ ਅਤੇ ਬਜ਼ੁਰਗਾਂ ਨੂੰ ਬਾਹਰ ਜਾਣ ਤੋਂ ਬਚਣਾ ਚਾਹੀਦਾ ਹੈ। ਸਰਗਰਮ ਬੱਚਿਆਂ ਨੂੰ ਆਰਾਮ ਕਰਨਾ ਚਾਹੀਦਾ ਹੈ।",
        schools: "ਬਾਹਰੀ ਸਰੀਰਕ ਸਿੱਖਿਆ ਦੀਆਂ ਕਲਾਸਾਂ ਨੂੰ ਵੱਧ ਤੋਂ ਵੱਧ 15 ਮਿੰਟ ਤੱਕ ਸੀਮਤ ਕਰੋ।",
        hospitals: "ਬਾਲ ਰੋਗ ਅਤੇ ਬਜ਼ੁਰਗਾਂ ਦੇ ਵਾਰਡਾਂ ਵਿੱਚ HEPA ਫਿਲਟਰ ਚਾਲੂ ਕਰੋ।"
      }
    },
    VERY_POOR: {
      en: {
        title: "Air Quality Very Poor",
        message: "Significant respiratory risk. Wearing N95 masks is strongly recommended. Avoid morning walks and outdoor exercise.",
        schools: "All school outdoor sports activities suspended. Move classes indoors.",
        hospitals: "Emergency nebulizer bays established. Staff alerted for dyspnea cases."
      },
      hi: {
        title: "वायु गुणवत्ता बहुत खराब",
        message: "महत्वपूर्ण श्वसन जोखिम। N95 मास्क पहनने की दृढ़ता से सलाह दी जाती है। सुबह की सैर और बाहरी व्यायाम से बचें।",
        schools: "स्कूल की सभी बाहरी खेल गतिविधियाँ स्थगित। कक्षाओं को अंदर आयोजित करें।",
        hospitals: "आपातकालीन नेबुलाइज़र वार्ड स्थापित। सांस लेने में कठिनाई के मामलों के लिए कर्मचारी सतर्क।"
      },
      pb: {
        title: "ਹਵਾ ਦੀ ਗੁਣਵੱਤਾ ਬਹੁਤ ਖਰਾਬ",
        message: "ਸਾਹ ਲੈਣ ਦਾ ਵੱਡਾ ਖਤਰਾ। N95 ਮਾਸਕ ਪਾਉਣ ਦੀ ਸਖਤ ਸਲਾਹ ਦਿੱਤੀ ਜਾਂਦੀ ਹੈ। ਸਵੇਰ ਦੀ ਸੈਰ ਅਤੇ ਬਾਹਰੀ ਕਸਰਤ ਤੋਂ ਬਚੋ।",
        schools: "ਸਕੂਲ ਦੀਆਂ ਸਾਰੀਆਂ ਬਾਹਰੀ ਖੇਡ ਗਤੀਵਿਧੀਆਂ ਮੁਲਤਵੀ। ਕਲਾਸਾਂ ਅੰਦਰ ਲਗਾਓ।",
        hospitals: "ਐਮਰਜੈਂਸੀ ਨੇਬੂਲਾਈਜ਼ਰ ਵਾਰਡ ਸਥਾਪਿਤ। ਸਾਹ ਲੈਣ ਵਿੱਚ ਤਕਲੀਫ਼ ਦੇ ਮਾਮਲਿਆਂ ਲਈ ਸਟਾਫ਼ ਸੁਚੇਤ।"
      }
    },
    SEVERE: {
      en: {
        title: "Air Quality Severe (Emergency)",
        message: "Extreme health hazard. Breathing ambient air is equivalent to smoking 20 cigarettes/day. Keep indoor air scrubbed. Non-essential outdoor transit forbidden.",
        schools: "CRITICAL: Physical classes suspended. Mandatory transition to Online / Work-From-Home mode.",
        hospitals: "OVERFLOW WARDS ACTIVE: Respiratory admissions up 300%. Oxygen concentrators deployed."
      },
      hi: {
        title: "वायु गुणवत्ता गंभीर (आपातकाल)",
        message: "अत्यधिक स्वास्थ्य खतरा। बाहरी हवा में सांस लेना प्रतिदिन 20 सिगरेट पीने के बराबर है। इनडोर वायु को स्वच्छ रखें। गैर-आवश्यक बाहरी यात्रा निषिद्ध।",
        schools: "गंभीर: भौतिक कक्षाएं निलंबित। ऑनलाइन / वर्क-फ्रॉम-होम मोड में अनिवार्य संक्रमण।",
        hospitals: "अतिप्रवाह वार्ड सक्रिय: श्वसन संबंधी दाखिले 300% बढ़े। ऑक्सीजन कंसंट्रेटर तैनात।"
      },
      pb: {
        title: "ਹਵਾ ਦੀ ਗੁਣਵੱਤਾ ਗੰਭੀਰ (ਐਮਰਜੈਂਸੀ)",
        message: "ਅਤਿਅੰਤ ਸਿਹਤ ਖਤਰਾ। ਬਾਹਰੀ ਹਵਾ ਵਿੱਚ ਸਾਹ ਲੈਣਾ ਰੋਜ਼ਾਨਾ 20 ਸਿਗਰਟਾਂ ਪੀਣ ਦੇ ਬਰਾਬਰ ਹੈ। ਘਰਾਂ ਦੇ ਅੰਦਰ ਦੀ ਹਵਾ ਸਾਫ਼ ਰੱਖੋ। ਗੈਰ-ਜ਼ਰੂਰੀ ਬਾਹਰੀ ਯਾਤਰਾ ਦੀ ਮਨਾਹੀ।",
        schools: "ਗੰਭੀਰ: ਭੌਤਿਕ ਕਲਾਸਾਂ ਮੁਅੱਤਲ। ਆਨਲਾਈਨ / ਵਰਕ-ਫਰਾਮ-ਹੋਮ ਮੋਡ ਵਿੱਚ ਲਾਜ਼ਮੀ ਤਬਦੀਲੀ।",
        hospitals: "ਓਵਰਫਲੋ ਵਾਰਡ ਸਰਗਰਮ: ਸਾਹ ਦੇ ਮਰੀਜ਼ਾਂ ਦੀ ਗਿਣਤੀ 300% ਵਧੀ। ਆਕਸੀਜਨ ਕੰਸੰਟਰੇਟਰ ਤਾਇਨਾਤ।"
      }
    }
  };

  const activeAdvisory = ADVISORIES[severity][language];

  // Helper to color alert banners
  const getBannerStyles = (level: string) => {
    switch (level) {
      case "SEVERE":
        return {
          background: "linear-gradient(135deg, rgba(153, 27, 27, 0.2) 0%, rgba(139, 92, 246, 0.05) 100%)",
          borderColor: "rgba(153, 27, 27, 0.5)",
          color: "#fca5a5"
        };
      case "VERY_POOR":
        return {
          background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)",
          borderColor: "rgba(239, 68, 68, 0.3)",
          color: "#fca5a5"
        };
      case "POOR":
        return {
          background: "linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)",
          borderColor: "rgba(249, 115, 22, 0.3)",
          color: "#fed7aa"
        };
      default:
        return {
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(139, 92, 246, 0.05) 100%)",
          borderColor: "rgba(16, 185, 129, 0.3)",
          color: "#a7f3d0"
        };
    }
  };

  const bannerStyle = getBannerStyles(severity);

  return (
    <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Title & Language Toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "1.05rem" }}>
          <Languages size={16} style={{ color: "var(--color-secondary)" }} />
          Citizen Risk Advisory
        </h2>
        
        <div className="lang-toggle-container">
          <button 
            className={`lang-btn ${language === "en" ? "active" : ""}`}
            onClick={() => onChangeLanguage("en")}
          >
            EN
          </button>
          <button 
            className={`lang-btn ${language === "hi" ? "active" : ""}`}
            onClick={() => onChangeLanguage("hi")}
          >
            हिन्दी
          </button>
          <button 
            className={`lang-btn ${language === "pb" ? "active" : ""}`}
            onClick={() => onChangeLanguage("pb")}
          >
            ਪੰਜਾਬੀ
          </button>
        </div>
      </div>

      {/* Main warning card */}
      <div 
        className="alert-banner"
        style={{ 
          margin: 0,
          background: bannerStyle.background,
          borderColor: bannerStyle.borderColor,
          color: bannerStyle.color,
          animation: severity === "SEVERE" ? "border-flash-red 2s infinite" : undefined
        }}
      >
        <AlertCircle size={20} style={{ minWidth: "20px", marginTop: "2px" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <strong style={{ fontSize: "0.85rem" }}>{activeAdvisory.title}</strong>
          <span style={{ fontSize: "0.8rem", lineHeight: "1.4" }}>{activeAdvisory.message}</span>
        </div>
      </div>

      {/* Localized vulnerability details */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div 
          style={{ 
            padding: "10px", 
            borderRadius: "8px", 
            background: "rgba(255,255,255,0.01)", 
            border: "1px solid var(--border-light)",
            display: "flex",
            flexDirection: "column",
            gap: "2px"
          }}
        >
          <span style={{ fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--text-muted)" }}>
            School Safety Directive
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-main)" }}>
            {activeAdvisory.schools}
          </span>
        </div>

        <div 
          style={{ 
            padding: "10px", 
            borderRadius: "8px", 
            background: "rgba(255,255,255,0.01)", 
            border: "1px solid var(--border-light)",
            display: "flex",
            flexDirection: "column",
            gap: "2px"
          }}
        >
          <span style={{ fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--text-muted)" }}>
            Hospital Protocol Update
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-main)" }}>
            {activeAdvisory.hospitals}
          </span>
        </div>
      </div>

      {/* Citizen Advisory Note */}
      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontStyle: "italic", borderTop: "1px solid var(--border-light)", paddingTop: "10px", textAlign: "center" }}>
        Broadcast feeds are automatically pushed to public digital boards, local radio stations, and regional IVR telephone lines.
      </div>
    </div>
  );
};
