import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  ShieldCheck,
  Activity,
  BookOpen,
  ChevronLeft,
  CheckCircle2,
  Info,
  Menu,
  X,
  ArrowUpRight,
  ClipboardCheck,
  Sparkles,
} from "lucide-react";
import "./styles.css";

if ("serviceWorker" in navigator)
  window.addEventListener("load", () =>
    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }),
  );

type A = {
  age: string;
  smoking: string;
  alcohol: string;
  family: string;
  symptoms: string;
};

type AssessmentResult = {
  risk_level?: string;
  risk_score?: number;
  factors?: string[];
  recommendations?: string[];
  disclaimer?: string;
  error?: string;
};

type RiskTone = "low" | "medium" | "high";
type KnowledgeFilter =
  | "全部"
  | "基础认识"
  | "风险因素"
  | "症状识别"
  | "筛查原则"
  | "预防建议"
  | "就医提示";

type KnowledgeTopic = {
  id: string;
  title: string;
  category: Exclude<KnowledgeFilter, "全部">;
  icon: "book" | "shield" | "activity";
  core: string;
  points: string[];
  highlight?: string;
  sources: string[];
};

const API_BASE = import.meta.env.PROD
  ? (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
    "https://shi-guan-ai.onrender.com"
  : (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
    "http://localhost:8000";

console.info("[esophageal-screening] API_BASE_URL:", API_BASE);

const qs = [
  {
    key: "age",
    title: "基本信息",
    label: "您的年龄段",
    options: ["40岁以下", "40–59岁", "60岁及以上"],
  },
  {
    key: "smoking",
    title: "生活方式",
    label: "吸烟情况",
    options: ["从不吸烟", "曾经吸烟，已戒", "目前吸烟"],
  },
  {
    key: "alcohol",
    title: "生活方式",
    label: "饮酒情况",
    options: ["不饮酒", "偶尔饮酒", "经常饮酒"],
  },
  {
    key: "family",
    title: "家族史 / 既往史",
    label: "直系亲属是否有食管癌病史？",
    options: ["没有", "不清楚", "有"],
  },
  {
    key: "symptoms",
    title: "相关症状",
    label: "近期是否有持续吞咽不适、进行性吞咽困难或体重下降？",
    options: ["没有", "有其中一项", "有多项或持续加重"],
  },
];

const actionPath = [
  "查看本次风险评估结果",
  "关注主要风险因素和相关症状",
  "根据个人情况咨询医疗专业人员",
  "如符合筛查条件，再由医疗机构进行进一步评估",
];

const actionPlans: Record<
  RiskTone,
  { label: string; summary: string; items: string[] }
> = {
  low: {
    label: "风险较低：以日常健康管理为重点",
    summary: "当前结果提示风险较低，仍建议持续关注自身健康变化。",
    items: [
      "保持健康生活方式。",
      "关注相关症状变化。",
      "按照个人实际情况进行常规健康管理。",
    ],
  },
  medium: {
    label: "风险中等：结合个人情况进一步咨询",
    summary: "当前结果提示需要继续关注自身风险因素，并结合个人情况进行判断。",
    items: [
      "结合年龄、家族史、吸烟饮酒等因素进行进一步健康咨询。",
      "如符合相关筛查条件，可咨询医疗机构了解是否需要进一步筛查。",
      "网页结果不等同于临床筛查结论。",
    ],
  },
  high: {
    label: "风险较高：建议及时咨询专业人员",
    summary: "当前结果提示需要更积极地关注个人风险，建议及时获得专业意见。",
    items: [
      "建议及时咨询医疗专业人员，结合个人情况进一步评估。",
      "如符合相关高风险人群筛查条件，可进一步咨询医疗机构。",
      "本风险评估不是诊断。",
    ],
  },
};

const knowledgeFilters: KnowledgeFilter[] = [
  "全部",
  "基础认识",
  "风险因素",
  "症状识别",
  "筛查原则",
  "预防建议",
  "就医提示",
];

const knowledgeTopics: KnowledgeTopic[] = [
  {
    id: "basics",
    title: "认识食管癌",
    category: "基础认识",
    icon: "book",
    core: "食管癌发生在连接咽部与胃的食管，早期可能没有明显症状。",
    points: [
      "食管是连接咽部与胃的消化道。",
      "持续关注吞咽变化和体重变化，有助于及时咨询专业人员。",
    ],
    highlight: "风险评估用于健康沟通，不代表临床诊断。",
    sources: ["WHO Cancer fact sheet", "国家卫生健康委《食管癌诊疗指南》（2022年版）"],
  },
  {
    id: "risk-factors",
    title: "需要关注的因素",
    category: "风险因素",
    icon: "shield",
    core: "年龄增长、吸烟、饮酒、家族史及长期摄入过烫食物等因素可能增加风险。",
    points: [
      "关注年龄、吸烟、饮酒和食管癌家族史等情况。",
      "也要留意长期摄入过烫食物等生活因素。",
    ],
    highlight: "风险因素不等于已经患病。",
    sources: ["WHO/IARC", "国家卫生健康委《食管癌诊疗指南》（2022年版）"],
  },
  {
    id: "symptoms-screening",
    title: "症状与筛查",
    category: "症状识别",
    icon: "activity",
    core: "进行性吞咽困难等情况应及时就医，筛查方式和频率应结合个人风险判断。",
    points: [
      "留意进行性吞咽困难、吞咽疼痛等变化。",
      "持续胸骨后不适、原因不明的体重下降等情况应及时就医。",
      "筛查方式和频率应由专业医疗人员结合个人风险判断。",
    ],
    sources: ["中国抗癌协会《食管癌筛查与早诊早治指南》", "WHO"],
  },
  {
    id: "prevention",
    title: "日常预防",
    category: "预防建议",
    icon: "shield",
    core: "戒烟限酒，避免经常食用过烫食物，并保持健康生活方式。",
    points: [
      "增加蔬菜水果和全谷食物纤维。",
      "保持健康体重。",
      "按医嘱处理长期反流等问题。",
    ],
    sources: ["WHO Cancer prevention recommendations", "中国居民膳食指南（2022）"],
  },
  {
    id: "consultation",
    title: "什么时候需要咨询",
    category: "就医提示",
    icon: "book",
    core: "吞咽困难持续或逐渐加重，或出现黑便、呕血、明显消瘦等情况，应尽快前往医疗机构。",
    points: [
      "关注吞咽困难是否持续或逐渐加重。",
      "出现黑便、呕血、明显消瘦等情况时及时就医。",
      "平台评估不能替代检查。",
    ],
    highlight: "如有明显或持续不适，请优先咨询医疗专业人员。",
    sources: ["国家卫生健康委《食管癌诊疗指南》（2022年版）"],
  },
  {
    id: "boundaries",
    title: "信息边界",
    category: "基础认识",
    icon: "activity",
    core: "本页面用于健康教育和风险沟通，具体建议请以正规医疗机构和专业人员的最新意见为准。",
    points: [
      "指南会更新，具体建议需要结合个人情况理解。",
      "本内容仅作科普，不构成医疗建议。",
    ],
    highlight: "本平台提供健康科普与风险评估信息，不构成医学诊断或治疗建议。",
    sources: ["内容核对：2026-09-18"],
  },
];

const knowledgeSources = Array.from(
  new Set(knowledgeTopics.flatMap((topic) => topic.sources)),
);

function getRiskTone(riskLevel?: string): RiskTone {
  const normalized = riskLevel?.toLowerCase() ?? "";
  if (normalized.includes("高") || normalized.includes("high")) return "high";
  if (
    normalized.includes("中") ||
    normalized.includes("moderate") ||
    normalized.includes("medium")
  )
    return "medium";
  return "low";
}

function TopicIcon({ icon }: { icon: KnowledgeTopic["icon"] }) {
  if (icon === "shield") return <ShieldCheck size={22} />;
  if (icon === "activity") return <Activity size={22} />;
  return <BookOpen size={22} />;
}

function App() {
  const [page, setPage] = useState<"home" | "assessment" | "result">("home");
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState<A>({
    age: "",
    smoking: "",
    alcohol: "",
    family: "",
    symptoms: "",
  });
  const [result, setResult] = useState<AssessmentResult>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [knowledgeFilter, setKnowledgeFilter] =
    useState<KnowledgeFilter>("全部");
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const goHome = () => {
    setPage("home");
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToKnowledge = () => {
    setPage("home");
    setKnowledgeFilter("全部");
    setMobileNavOpen(false);
    window.setTimeout(() => {
      document
        .getElementById("health-education")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const restartAssessment = () => {
    setPage("assessment");
    setStep(0);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openAssessment = () => {
    setPage("assessment");
    setStep(0);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setResult(undefined);
    try {
      const requestUrl = `${API_BASE}/api/assessment`;
      const requestBody = {
        age: String(ans.age),
        smoking: String(ans.smoking),
        alcohol: String(ans.alcohol),
        family: String(ans.family),
        symptoms: String(ans.symptoms),
      };
      console.info(
        "[esophageal-screening] request start:",
        requestUrl,
        requestBody,
      );
      const response = await fetch(requestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      console.info(
        "[esophageal-screening] response status:",
        response.status,
        response.statusText,
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload: unknown = await response.json();
      console.info("[esophageal-screening] response body:", payload);
      if (!payload || typeof payload !== "object")
        throw new Error("响应不是 JSON 对象");
      const data = payload as Record<string, unknown>;
      if (
        typeof data.risk_level !== "string" ||
        typeof data.risk_score !== "number" ||
        !Array.isArray(data.factors) ||
        !Array.isArray(data.recommendations)
      )
        throw new Error("响应字段不完整");
      setResult({
        risk_level: data.risk_level,
        risk_score: data.risk_score,
        disclaimer:
          typeof data.disclaimer === "string" ? data.disclaimer : undefined,
        factors: data.factors.filter(
          (item): item is string => typeof item === "string",
        ),
        recommendations: data.recommendations.filter(
          (item): item is string => typeof item === "string",
        ),
      });
    } catch (error) {
      console.error("[esophageal-screening] assessment failed:", error);
      setResult({ error: "暂时无法获取评估结果，请检查网络连接后重试。" });
    } finally {
      setIsSubmitting(false);
      setPage("result");
    }
  };

  const factors = result?.factors ?? [];
  const recommendations = result?.recommendations ?? [];
  const riskTone = getRiskTone(result?.risk_level);
  const actionPlan = actionPlans[riskTone];
  const visibleKnowledgeTopics =
    knowledgeFilter === "全部"
      ? knowledgeTopics
      : knowledgeTopics.filter((topic) => topic.category === knowledgeFilter);

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <button className="brand" onClick={goHome} aria-label="返回首页">
            <span className="mark"><span>+</span></span>
            <span className="brand-copy">
              <strong>食管健康</strong>
              <span>智能早筛与健康管理</span>
            </span>
          </button>
          <nav className={mobileNavOpen ? "is-open" : ""}>
            <button onClick={goHome}>首页</button>
            <button onClick={openAssessment}>风险评估</button>
            <button onClick={goToKnowledge}>健康知识</button>
            <button onClick={() => { setPage("home"); setMobileNavOpen(false); window.setTimeout(() => document.getElementById("about-platform")?.scrollIntoView({ behavior: "smooth" }), 0); }}>关于平台</button>
          </nav>
          <div className="header-actions">
            <span className="tag"><ShieldCheck size={15} /> 健康风险提示</span>
            <button className="header-cta" onClick={openAssessment}>开始评估 <ArrowUpRight size={16} /></button>
          </div>
          <button className="mobile-menu" onClick={() => setMobileNavOpen(!mobileNavOpen)} aria-label={mobileNavOpen ? "关闭菜单" : "打开菜单"} aria-expanded={mobileNavOpen}>
            {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>
      {page === "home" && (
        <main>
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow"><span className="eyebrow-dot" /> 食管健康 · 智能早筛</p>
              <h1>关注食管健康<br /><em>从一次科学评估开始</em></h1>
              <p className="lead">基于个人健康信息进行风险提示与健康管理建议，帮助识别需要进一步关注的情况。</p>
              <div className="hero-actions">
                <button className="primary" onClick={openAssessment}>开始风险评估 <ArrowRight size={18} /></button>
                <button className="secondary" onClick={goToKnowledge}>了解食管健康 <ArrowUpRight size={17} /></button>
              </div>
              <p className="small"><ShieldCheck size={14} /> 健康教育与风险提示工具 · 不替代医生诊断</p>
            </div>
            <div className="hero-visual" aria-label="食管健康风险评估流程">
              <div className="hero-orbit orbit-one" />
              <div className="hero-orbit orbit-two" />
              <div className="hero-panel">
                <div className="hero-panel-top">
                  <span className="hero-icon"><Activity size={21} /></span>
                  <span className="status-dot">在线</span>
                </div>
                <p className="panel-label">食管健康风险评估</p>
                <h2>从了解自己开始</h2>
                <div className="hero-metrics">
                  <div><strong>05</strong><span>项健康信息</span></div>
                  <div><strong>02</strong><span>分钟完成</span></div>
                  <div><strong>03</strong><span>层风险提示</span></div>
                </div>
                <div className="hero-panel-footer"><span>个性化健康建议</span><ArrowUpRight size={16} /></div>
              </div>
              <div className="hero-float"><ClipboardCheck size={17} /><span>清晰 · 可解释</span></div>
            </div>
          </section>

          <section className="capabilities section-shell" aria-labelledby="capability-title">
            <div className="section-intro">
              <p className="section-kicker">PLATFORM CAPABILITIES</p>
              <h2 id="capability-title">把健康信息，变成下一步行动</h2>
              <p>围绕风险提示、结果解释和健康教育，建立更容易理解的食管健康管理体验。</p>
            </div>
            <div className="capability-grid">
              {[
                ["01", "风险评估", "基于个人健康信息进行风险提示", <ClipboardCheck size={20} />],
                ["02", "结果解释", "展示主要影响因素与风险评分", <Sparkles size={20} />],
                ["03", "健康建议", "根据评估结果提供下一步行动提示", <ArrowUpRight size={20} />],
                ["04", "健康科普", "系统了解相关风险因素与筛查知识", <BookOpen size={20} />],
              ].map(([number, title, text, icon]) => (
                <article className="capability-card" key={String(number)}>
                  <div className="capability-top"><span>{number}</span><span className="capability-icon">{icon}</span></div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="why-section section-shell">
            <div className="why-mark"><Activity size={23} /></div>
            <div>
              <p className="section-kicker">WHY IT MATTERS</p>
              <h2>为什么值得关注？</h2>
              <p>食管健康变化有时并不典型，了解相关风险因素、留意持续或进行性加重的症状，有助于更早做出健康管理上的关注和咨询。</p>
            </div>
            <div className="why-points">
              <span>早期症状可能不典型</span><span>部分人群风险因素更集中</span><span>及时关注，理性咨询</span>
            </div>
          </section>

          <section className="knowledge-center" id="health-education">
            <div className="knowledge-heading">
              <div>
                <p className="eyebrow">HEALTH EDUCATION CENTER</p>
                <h2>食管癌防治科普知识中心</h2>
                <p>
                  从基础认识、风险因素到症状与就医提示，按主题了解食管健康相关信息。
                </p>
              </div>
              <div className="knowledge-heading-mark">
                <BookOpen size={26} />
                <span>健康科普</span>
              </div>
            </div>

            <div className="knowledge-filters" aria-label="知识主题筛选">
              {knowledgeFilters.map((filter) => (
                <button
                  className={knowledgeFilter === filter ? "active" : ""}
                  key={filter}
                  onClick={() => {
                    setKnowledgeFilter(filter);
                    setExpandedTopic(null);
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="knowledge-grid">
              {visibleKnowledgeTopics.map((topic) => {
                const isExpanded = expandedTopic === topic.id;
                return (
                  <article
                    className={`knowledge-card${isExpanded ? " expanded" : ""}`}
                    key={topic.id}
                  >
                    <button
                      className="knowledge-card-trigger"
                      aria-expanded={isExpanded}
                      onClick={() =>
                        setExpandedTopic(isExpanded ? null : topic.id)
                      }
                    >
                      <span className="knowledge-card-icon">
                        <TopicIcon icon={topic.icon} />
                      </span>
                      <span className="knowledge-card-title">
                        <strong>{topic.title}</strong>
                        {isExpanded && <small>当前阅读</small>}
                      </span>
                      <span className="knowledge-card-action">
                        {isExpanded ? "收起" : "展开"}
                      </span>
                    </button>
                    <div className="knowledge-card-summary">
                      <span>核心结论</span>
                      <p>{topic.core}</p>
                    </div>
                    {isExpanded && (
                      <div className="knowledge-card-details">
                        <div>
                          <p className="knowledge-detail-label">重点内容</p>
                          <ul>
                            {topic.points.map((point) => (
                              <li key={point}>
                                <CheckCircle2 size={16} />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        {topic.highlight && (
                          <p className="knowledge-highlight">
                            <strong>重点提示</strong>
                            {topic.highlight}
                          </p>
                        )}
                        <p className="knowledge-card-sources">
                          来源：{topic.sources.join("；")}
                        </p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            <section className="knowledge-sources">
              <div>
                <p className="section-kicker">REFERENCES</p>
                <h2>信息来源</h2>
              </div>
              <ul>
                {knowledgeSources.map((source) => (
                  <li key={source}>{source}</li>
                ))}
              </ul>
            </section>
          </section>

          <section className="boundary section-shell" id="about-platform">
            <div className="boundary-heading">
              <span className="boundary-icon"><ShieldCheck size={20} /></span>
              <div><p className="section-kicker">INFORMATION BOUNDARY</p><h2>信息使用边界</h2></div>
            </div>
            <div className="boundary-copy">
              <p>本平台提供的是健康风险提示与科普信息，不构成疾病诊断、治疗建议或医学结论。</p>
              <p>如存在持续、明显或进行性加重的相关症状，应及时咨询专业医疗人员。</p>
            </div>
          </section>
          <footer className="site-footer">
            <div><strong>食管健康智能早筛与健康管理平台</strong><span>健康教育 · 风险提示 · 科普服务</span></div>
            <div className="footer-meta"><span>信息边界：研究 / 演示原型，不用于临床诊断</span><span>参考来源：WHO / IARC · 国家卫生健康委相关指南 · 中国抗癌协会相关指南 · 中国居民膳食指南</span></div>
          </footer>
        </main>
      )}
      {page === "assessment" && (
        <main className="assessment">
          <div className="assessment-intro">
            <p className="eyebrow"><span className="eyebrow-dot" /> 健康风险提示</p>
            <h1>用 5 步了解自己的食管健康</h1>
            <p>请选择最符合您当前情况的选项。评估结果用于健康沟通，不代表临床诊断。</p>
          </div>
          <div className="progress">
            <div className="progress-heading"><span>评估进度</span><b>STEP {String(step + 1).padStart(2, "0")} / 05</b></div>
            <div className="step-track">{qs.map((item, index) => <span key={item.key} className={index <= step ? "active" : ""}><i>{index + 1}</i><small>{item.title.split(" / ")[0]}</small></span>)}</div>
            <div className="progress-bar"><i style={{ width: `${((step + 1) / qs.length) * 100}%` }} /></div>
          </div>
          <section className="question">
            <p className="eyebrow">{qs[step].title}</p>
            <h2>{qs[step].label}</h2>
            <p className="muted">请选择最符合您当前情况的选项</p>
            <div className="options">
              {qs[step].options.map((o) => (
                <button
                  className={
                    ans[qs[step].key as keyof A] === o ? "selected" : ""
                  }
                  onClick={() => setAns({ ...ans, [qs[step].key]: o })}
                  key={o}
                >
                  {o}
                  <span>●</span>
                </button>
              ))}
            </div>
            <div className="actions">
              {step > 0 && (
                <button className="back" onClick={() => setStep(step - 1)}>
                  <ChevronLeft size={17} />
                  上一步
                </button>
              )}
              {step < qs.length - 1 ? (
                <button
                  className="primary"
                  disabled={!ans[qs[step].key as keyof A]}
                  onClick={() => setStep(step + 1)}
                >
                  下一步 <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  className="primary"
                  disabled={!ans[qs[step].key as keyof A] || isSubmitting}
                  onClick={submit}
                >
                  {isSubmitting ? "正在生成评估结果…" : "生成评估结果"}
                  <ArrowRight size={18} />
                </button>
              )}
            </div>
          </section>
        </main>
      )}
      {page === "result" && (
        <main className="result">
          <div className="result-heading">
            <p className="eyebrow"><span className="eyebrow-dot" /> ASSESSMENT RESULT</p>
            <h1>食管健康风险评估</h1>
            <p className="result-intro">
              以下内容根据您填写的信息生成，用于健康风险沟通和科普参考。
            </p>
          </div>

          {result?.error ? (
            <section className="result-error" role="alert">
              <Info size={22} />
              <div>
                <h2>评估暂未完成</h2>
                <p>{result.error}</p>
              </div>
            </section>
          ) : (
            <>
              <section className={`result-summary risk-${riskTone}`}>
                <div className="summary-copy">
                  <p className="section-kicker">评估结论</p>
                  <h2>本次评估提示</h2>
                  <span className="risk-badge">{result?.risk_level || "暂无"}</span>
                </div>
                <div className="score-block">
                  <span>风险分数</span>
                  <strong>
                    {typeof result?.risk_score === "number"
                      ? result.risk_score
                      : "暂无"}
                  </strong>
                  <small>风险提示分数 · 非患病概率</small>
                </div>
                <p className="assessment-note">
                  <Info size={16} />
                  结果说明：本结果用于健康风险提示，不代表临床诊断。
                </p>
              </section>

              <section className="report-section">
                <div className="section-heading">
                  <div>
                    <p className="section-kicker">RESULT DETAILS</p>
                    <h2>主要影响因素</h2>
                  </div>
                  <ShieldCheck size={22} />
                </div>
                {factors.length > 0 ? (
                  <div className="factor-list">
                    {factors.map((factor) => (
                      <span className="factor-chip" key={factor}>
                        <CheckCircle2 size={16} />
                        {factor}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">暂未发现明显风险因素</p>
                )}
              </section>

              <section className="report-section">
                <div className="section-heading">
                  <div>
                    <p className="section-kicker">HEALTH GUIDANCE</p>
                    <h2>建议关注</h2>
                  </div>
                  <BookOpen size={22} />
                </div>
                {recommendations.length > 0 ? (
                  <ul className="recommendation-list">
                    {recommendations.map((recommendation) => (
                      <li key={recommendation}>
                        <CheckCircle2 size={18} />
                        <span>{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-state">暂无健康建议</p>
                )}
              </section>

              <section className={`action-plan action-plan-${riskTone}`}>
                <div className="section-heading">
                  <div>
                    <p className="section-kicker">NEXT ACTION</p>
                    <h2>筛查与健康管理建议</h2>
                  </div>
                  <Activity size={22} />
                </div>
                <div className="action-plan-intro">
                  <span className="action-level">{actionPlan.label}</span>
                  <p>{actionPlan.summary}</p>
                </div>
                <ul className="action-plan-list">
                  {actionPlan.items.map((item) => (
                    <li key={item}>
                      <CheckCircle2 size={18} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="action-path">
                <div className="section-heading">
                  <div>
                    <p className="section-kicker">HEALTH EDUCATION PATH</p>
                    <h2>下一步怎么做</h2>
                  </div>
                  <ArrowRight size={22} />
                </div>
                <ol className="path-list">
                  {actionPath.map((item, index) => (
                    <li key={item}>
                      <span className="path-number">{index + 1}</span>
                      <div>
                        <strong>第{index + 1}步</strong>
                        <span>{item}</span>
                      </div>
                      {index < actionPath.length - 1 && (
                        <span className="path-arrow" aria-hidden="true">
                          ↓
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
                <p className="action-path-note">
                  以上内容用于健康教育参考，不构成强制医疗流程。
                </p>
              </section>

              <section className="urgent-consultation">
                <div className="urgent-icon">
                  <Info size={20} />
                </div>
                <div>
                  <h2>什么时候应该及时咨询医疗人员</h2>
                  <p>
                    如果吞咽困难持续或逐渐加重，或出现黑便、呕血、明显消瘦等情况，请尽快前往医疗机构。平台评估不能替代检查。
                  </p>
                </div>
              </section>
            </>
          )}

          <section className="next-step">
            <div>
              <p className="section-kicker">NEXT STEP</p>
              <h2>重新开始评估</h2>
              <p>如需更新信息，可以重新完成这 5 步风险评估。</p>
            </div>
            <button className="primary" onClick={restartAssessment}>
              重新评估 <ArrowRight size={18} />
            </button>
          </section>

          <div className="notice result-boundary">
            本工具用于健康风险沟通和科普，不等同于医学诊断，也不代表临床诊断结果。如有持续或明显不适，建议咨询专业医疗人员。
          </div>
        </main>
      )}
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
