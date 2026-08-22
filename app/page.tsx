"use client";

import { useEffect, useMemo, useState } from "react";
import { init, isTMA, miniApp, themeParams, viewport } from "@tma.js/sdk-react";

type Locale = "ar" | "en";
type View = "home" | "explore" | "saved" | "ranking" | "profile";
type IconName =
  | "home"
  | "search"
  | "bookmark"
  | "ranking"
  | "profile"
  | "shield"
  | "clock"
  | "signal"
  | "arrow"
  | "bell"
  | "globe"
  | "spark"
  | "check"
  | "close";

type Campaign = {
  id: string;
  monogram: string;
  name: string;
  nameAr: string;
  summary: string;
  summaryAr: string;
  category: "free" | "testnet" | "quest";
  stage: "early" | "new";
  risk: "low" | "medium";
  time: string;
  difficulty: "easy" | "medium";
  network: string;
  score: string;
  accent: string;
  tutorial: { en: string; ar: string }[];
};

const campaigns: Campaign[] = [
  {
    id: "demo-orbit",
    monogram: "O",
    name: "Orbit Alpha",
    nameAr: "أوربت ألفا",
    summary: "A sample testnet campaign used to demonstrate the ARKHÉON review experience.",
    summaryAr: "حملة شبكة تجريبية نموذجية لعرض تجربة المراجعة داخل ARKHÉON.",
    category: "testnet",
    stage: "early",
    risk: "low",
    time: "~ 6 min",
    difficulty: "easy",
    network: "Testnet",
    score: "8.8",
    accent: "violet",
    tutorial: [
      { en: "Review the campaign summary and safety notes.", ar: "راجع ملخص الحملة وملاحظات الأمان." },
      { en: "Confirm that the destination is marked as reviewed.", ar: "تأكد من أن الوجهة تحمل حالة تمت مراجعتها." },
      { en: "Open the official task page when it becomes available.", ar: "افتح صفحة المهمة الرسمية عندما تصبح متاحة." },
    ],
  },
  {
    id: "demo-nova",
    monogram: "N",
    name: "Nova Quest",
    nameAr: "نوفا كويست",
    summary: "A free social quest example with transparent time and cost labels.",
    summaryAr: "مثال لمهمة اجتماعية مجانية مع توضيح الوقت والتكلفة بشفافية.",
    category: "quest",
    stage: "new",
    risk: "low",
    time: "~ 4 min",
    difficulty: "easy",
    network: "Off-chain",
    score: "8.4",
    accent: "cyan",
    tutorial: [
      { en: "Read the eligibility and region information.", ar: "اقرأ معلومات الأهلية والمنطقة." },
      { en: "Check every official source before continuing.", ar: "تحقق من كل مصدر رسمي قبل المتابعة." },
      { en: "Complete only the tasks you understand.", ar: "أكمل فقط المهام التي تفهمها." },
    ],
  },
  {
    id: "demo-zenith",
    monogram: "Z",
    name: "Zenith Early",
    nameAr: "زينيث المبكر",
    summary: "An early-signal sample showing how unconfirmed opportunities will be presented.",
    summaryAr: "إشارة مبكرة نموذجية توضح كيفية عرض الفرص غير المؤكدة.",
    category: "free",
    stage: "early",
    risk: "medium",
    time: "~ 8 min",
    difficulty: "medium",
    network: "Research",
    score: "7.9",
    accent: "gold",
    tutorial: [
      { en: "Understand that an early signal is not a confirmed airdrop.", ar: "تذكر أن الإشارة المبكرة ليست إيردروبًا مؤكدًا." },
      { en: "Review the confidence and freshness indicators.", ar: "راجع مؤشرات الثقة وحداثة المعلومات." },
      { en: "Wait for ARKHÉON verification before taking action.", ar: "انتظر تحقق ARKHÉON قبل اتخاذ أي إجراء." },
    ],
  },
];

const copy = {
  ar: {
    brand: "ARKHÉON AIRDROP",
    demo: "وضع تجريبي",
    demoNotice: "واجهة تجريبية — لا توجد فرص أو روابط حقيقية بعد",
    greeting: "مساء الخير",
    headline: "اكتشف الفرص مبكرًا.",
    subhead: "فرص واضحة، مجانية أولًا، ومراجعة بعناية.",
    search: "ابحث عن مشروع أو شبكة",
    freeFirst: "مجاني أولًا",
    freeFirstSub: "ابدأ بدون رأس مال كلما أمكن",
    featured: "فرص مجانية",
    seeAll: "عرض الكل",
    forYou: "مختارة لك",
    home: "الرئيسية",
    explore: "استكشف",
    saved: "المحفوظة",
    ranking: "الترتيب",
    profile: "الملف",
    free: "مجاني",
    early: "مبكر",
    new: "جديد",
    testnet: "شبكة تجريبية",
    quest: "مهام",
    potential: "محتمل",
    all: "الكل",
    risk: "المخاطر",
    low: "منخفضة",
    medium: "متوسطة",
    cost: "التكلفة",
    time: "الوقت",
    difficulty: "الصعوبة",
    easy: "سهلة",
    score: "تقييم ARKHÉON",
    view: "عرض الفرصة",
    detail: "تفاصيل الفرصة",
    overview: "نظرة عامة",
    network: "الشبكة",
    status: "الحالة",
    earlySignal: "إشارة مبكرة",
    lastVerified: "آخر مراجعة: عرض تجريبي",
    tutorial: "الدليل السريع",
    tutorialSub: "أكمل الخطوات بنفسك. لن نضع علامة دون إجراء منك.",
    start: "ابدأ الإيردروب",
    unavailable: "غير متاح مؤقتًا — المراجعة الأمنية جارية",
    security: "لن تطلب ARKHÉON أبدًا عبارة الاسترداد أو المفتاح الخاص.",
    savedTitle: "فرصك المحفوظة",
    savedEmpty: "لم تحفظ أي فرصة بعد.",
    savedEmptySub: "استخدم رمز الحفظ للعودة إلى الفرص المهمة.",
    rankingTitle: "ترتيب المستكشفين",
    rankingSub: "نموذج للترتيب المحلي في المملكة العربية السعودية.",
    pointsNote: "نقاط ARKHÉON للسمعة والتفاعل، وليست عملة أو استثمارًا.",
    profileTitle: "ملفك في ARKHÉON",
    telegramUser: "مستخدم تيليغرام",
    memberStatus: "عضو جديد",
    points: "النقاط",
    referrals: "الإحالات",
    started: "بدأت",
    language: "اللغة",
    safetyCenter: "مركز الأمان",
    notifications: "الإشعارات",
    comingSoon: "قريبًا مع الحساب الآمن",
    back: "رجوع",
    noResults: "لا توجد نتائج مطابقة.",
  },
  en: {
    brand: "ARKHÉON AIRDROP",
    demo: "DEMO MODE",
    demoNotice: "Demo interface — no real opportunities or links yet",
    greeting: "Good evening",
    headline: "Discover opportunities early.",
    subhead: "Clear opportunities, free first, carefully reviewed.",
    search: "Search project or network",
    freeFirst: "Free first",
    freeFirstSub: "Start without capital whenever possible",
    featured: "Free opportunities",
    seeAll: "See all",
    forYou: "Selected for you",
    home: "Home",
    explore: "Explore",
    saved: "Saved",
    ranking: "Ranking",
    profile: "Profile",
    free: "Free",
    early: "Early",
    new: "New",
    testnet: "Testnet",
    quest: "Quests",
    potential: "Potential",
    all: "All",
    risk: "Risk",
    low: "Low",
    medium: "Medium",
    cost: "Cost",
    time: "Time",
    difficulty: "Difficulty",
    easy: "Easy",
    score: "ARKHÉON Score",
    view: "View opportunity",
    detail: "Opportunity details",
    overview: "Overview",
    network: "Network",
    status: "Status",
    earlySignal: "Early signal",
    lastVerified: "Last reviewed: demo display",
    tutorial: "Quick tutorial",
    tutorialSub: "Complete steps yourself. We never mark progress without your action.",
    start: "Start airdrop",
    unavailable: "Temporarily unavailable — security review in progress",
    security: "ARKHÉON will never ask for your seed phrase or private key.",
    savedTitle: "Your saved opportunities",
    savedEmpty: "You have not saved an opportunity yet.",
    savedEmptySub: "Use the bookmark icon to keep important opportunities nearby.",
    rankingTitle: "Explorer ranking",
    rankingSub: "A sample of the Saudi Arabia local ranking.",
    pointsNote: "ARKHÉON Points represent reputation and activity—not currency or an investment.",
    profileTitle: "Your ARKHÉON profile",
    telegramUser: "Telegram user",
    memberStatus: "New member",
    points: "Points",
    referrals: "Referrals",
    started: "Started",
    language: "Language",
    safetyCenter: "Safety center",
    notifications: "Notifications",
    comingSoon: "Coming with secure accounts",
    back: "Back",
    noResults: "No matching opportunities.",
  },
} as const;

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-7h5v7"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    bookmark: <path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-3.7L6 21Z"/>,
    ranking: <><path d="M5 21V11h4v10"/><path d="M10 21V4h4v17"/><path d="M15 21v-7h4v7"/></>,
    profile: <><circle cx="12" cy="8" r="4"/><path d="M4.8 21a7.2 7.2 0 0 1 14.4 0"/></>,
    shield: <><path d="M12 3 20 6v5.5c0 4.8-3.2 8.2-8 10.5-4.8-2.3-8-5.7-8-10.5V6Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    signal: <><path d="M5 16.5a10 10 0 0 1 14 0"/><path d="M8 19a5.7 5.7 0 0 1 8 0"/><circle cx="12" cy="21" r="1" fill="currentColor" stroke="none"/></>,
    arrow: <><path d="M5 12h14"/><path d="m14 7 5 5-5 5"/></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8h18c0-1-3-1-3-8"/><path d="M10 21h4"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
    spark: <><path d="m12 2 1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    close: <><path d="m6 6 12 12"/><path d="m18 6-12 12"/></>,
  };
  return (
    <svg aria-hidden="true" className="icon" fill="none" height={size} viewBox="0 0 24 24" width={size}>
      {paths[name]}
    </svg>
  );
}

function LogoMark() {
  return (
    <span className="logo-mark" aria-hidden="true">
      <svg viewBox="0 0 44 44">
        <path d="M22 4 37.6 13v18L22 40 6.4 31V13Z" />
        <path d="m14 29 8-15 8 15M17.2 24h9.6" />
      </svg>
    </span>
  );
}

function AppHeader({ locale, setLocale }: { locale: Locale; setLocale: (locale: Locale) => void }) {
  const t = copy[locale];
  return (
    <header className="app-header">
      <div className="brand-lockup">
        <LogoMark />
        <div>
          <strong>{t.brand}</strong>
          <span>{t.demo}</span>
        </div>
      </div>
      <div className="header-actions">
        <button
          aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
          className="language-toggle"
          onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
          type="button"
        >
          <Icon name="globe" size={17} />
          {locale === "ar" ? "EN" : "عربي"}
        </button>
        <button aria-label={t.notifications} className="icon-button" type="button">
          <Icon name="bell" size={19} />
          <span className="notification-dot" />
        </button>
      </div>
    </header>
  );
}

function DemoBanner({ locale }: { locale: Locale }) {
  return (
    <div className="demo-banner" role="status">
      <span className="demo-pulse" />
      <strong>{copy[locale].demo}</strong>
      <span>{copy[locale].demoNotice}</span>
    </div>
  );
}

function CampaignCard({
  campaign,
  locale,
  isSaved,
  onOpen,
  onSave,
}: {
  campaign: Campaign;
  locale: Locale;
  isSaved: boolean;
  onOpen: () => void;
  onSave: () => void;
}) {
  const t = copy[locale];
  const title = locale === "ar" ? campaign.nameAr : campaign.name;
  const risk = campaign.risk === "low" ? t.low : t.medium;
  const difficulty = campaign.difficulty === "easy" ? t.easy : t.medium;
  return (
    <article className="campaign-card">
      <div className="card-topline">
        <div className={`project-avatar ${campaign.accent}`}><span>{campaign.monogram}</span></div>
        <div className="project-title">
          <strong>{title}</strong>
          <span>{campaign.network}</span>
        </div>
        <button
          aria-label={isSaved ? "Remove bookmark" : "Save opportunity"}
          aria-pressed={isSaved}
          className={`save-button ${isSaved ? "saved" : ""}`}
          onClick={onSave}
          type="button"
        >
          <Icon name="bookmark" size={18} />
        </button>
      </div>

      <div className="tag-row">
        <span className="tag demo-tag">DEMO</span>
        <span className="tag free-tag">{t.free}</span>
        <span className="tag early-tag">{campaign.stage === "early" ? t.early : t.new}</span>
      </div>

      <div className="metric-grid">
        <div><span>{t.risk}</span><strong className={campaign.risk === "low" ? "positive" : "caution"}>{risk}</strong></div>
        <div><span>{t.cost}</span><strong>$0 <small>DEMO</small></strong></div>
        <div><span>{t.time}</span><strong>{campaign.time}</strong></div>
        <div><span>{t.difficulty}</span><strong>{difficulty}</strong></div>
      </div>

      <div className="score-row">
        <div>
          <span>{t.score}</span>
          <strong>{campaign.score}<small>/10 DEMO</small></strong>
        </div>
        <div className="score-track"><span style={{ width: `${Number(campaign.score) * 10}%` }} /></div>
      </div>

      <button className="view-button" onClick={onOpen} type="button">
        {t.view}
        <span className="arrow-direction"><Icon name="arrow" size={18} /></span>
      </button>
    </article>
  );
}

function CampaignList({
  items,
  locale,
  savedIds,
  onOpen,
  onSave,
}: {
  items: Campaign[];
  locale: Locale;
  savedIds: string[];
  onOpen: (campaign: Campaign) => void;
  onSave: (id: string) => void;
}) {
  if (!items.length) {
    return (
      <div className="empty-state compact-empty">
        <span className="empty-icon"><Icon name="search" size={25} /></span>
        <strong>{copy[locale].noResults}</strong>
      </div>
    );
  }
  return (
    <div className="card-grid">
      {items.map((campaign) => (
        <CampaignCard
          campaign={campaign}
          isSaved={savedIds.includes(campaign.id)}
          key={campaign.id}
          locale={locale}
          onOpen={() => onOpen(campaign)}
          onSave={() => onSave(campaign.id)}
        />
      ))}
    </div>
  );
}

function HomeView({
  locale,
  savedIds,
  onOpen,
  onSave,
  onExplore,
}: {
  locale: Locale;
  savedIds: string[];
  onOpen: (campaign: Campaign) => void;
  onSave: (id: string) => void;
  onExplore: () => void;
}) {
  const t = copy[locale];
  return (
    <>
      <section className="hero-panel">
        <div className="hero-orbit" aria-hidden="true"><span /><span /><span /></div>
        <p>{t.greeting}</p>
        <h1>{t.headline}</h1>
        <p className="hero-copy">{t.subhead}</p>
        <div className="free-first-callout">
          <span className="callout-icon"><Icon name="spark" size={20} /></span>
          <div><strong>{t.freeFirst}</strong><span>{t.freeFirstSub}</span></div>
          <span className="callout-count">03 <small>DEMO</small></span>
        </div>
      </section>

      <button className="search-launcher" onClick={onExplore} type="button">
        <Icon name="search" size={19} />
        <span>{t.search}</span>
        <kbd>⌘ K</kbd>
      </button>

      <div className="category-strip" aria-label="Categories">
        {[
          ["spark", t.free], ["signal", t.early], ["clock", t.testnet], ["check", t.quest], ["shield", t.potential],
        ].map(([icon, label], index) => (
          <button className={index === 0 ? "active" : ""} key={label} onClick={onExplore} type="button">
            <Icon name={icon as IconName} size={17} />{label}
          </button>
        ))}
      </div>

      <section className="content-section">
        <div className="section-heading">
          <div><span className="eyebrow">FREE-FIRST</span><h2>{t.featured}</h2></div>
          <button onClick={onExplore} type="button">{t.seeAll}<Icon name="arrow" size={16} /></button>
        </div>
        <CampaignList items={campaigns.slice(0, 2)} locale={locale} onOpen={onOpen} onSave={onSave} savedIds={savedIds} />
      </section>
    </>
  );
}

function ExploreView({
  locale,
  savedIds,
  onOpen,
  onSave,
}: {
  locale: Locale;
  savedIds: string[];
  onOpen: (campaign: Campaign) => void;
  onSave: (id: string) => void;
}) {
  const t = copy[locale];
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const results = useMemo(() => campaigns.filter((campaign) => {
    const haystack = `${campaign.name} ${campaign.nameAr} ${campaign.network}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesFilter = filter === "all" || campaign.category === filter || campaign.stage === filter;
    return matchesQuery && matchesFilter;
  }), [query, filter]);
  return (
    <section className="page-view">
      <div className="page-heading"><span className="eyebrow">DISCOVERY</span><h1>{t.explore}</h1><p>{t.subhead}</p></div>
      <label className="search-field">
        <Icon name="search" size={19} />
        <input onChange={(event) => setQuery(event.target.value)} placeholder={t.search} type="search" value={query} />
        {query && <button aria-label="Clear search" onClick={() => setQuery("")} type="button"><Icon name="close" size={17} /></button>}
      </label>
      <div className="filter-row">
        {[
          ["all", t.all], ["free", t.free], ["early", t.early], ["testnet", t.testnet], ["quest", t.quest],
        ].map(([value, label]) => (
          <button className={filter === value ? "active" : ""} key={value} onClick={() => setFilter(value)} type="button">{label}</button>
        ))}
      </div>
      <div className="results-label"><strong>{results.length.toString().padStart(2, "0")}</strong><span>{t.forYou}</span><em>DEMO</em></div>
      <CampaignList items={results} locale={locale} onOpen={onOpen} onSave={onSave} savedIds={savedIds} />
    </section>
  );
}

function SavedView({
  locale,
  savedIds,
  onOpen,
  onSave,
  onExplore,
}: {
  locale: Locale;
  savedIds: string[];
  onOpen: (campaign: Campaign) => void;
  onSave: (id: string) => void;
  onExplore: () => void;
}) {
  const t = copy[locale];
  const items = campaigns.filter((campaign) => savedIds.includes(campaign.id));
  return (
    <section className="page-view">
      <div className="page-heading"><span className="eyebrow">WATCHLIST</span><h1>{t.savedTitle}</h1><p>{items.length ? `${items.length} ${t.demo}` : t.savedEmptySub}</p></div>
      {items.length ? (
        <CampaignList items={items} locale={locale} onOpen={onOpen} onSave={onSave} savedIds={savedIds} />
      ) : (
        <div className="empty-state">
          <span className="empty-icon"><Icon name="bookmark" size={27} /></span>
          <strong>{t.savedEmpty}</strong><p>{t.savedEmptySub}</p>
          <button onClick={onExplore} type="button">{t.explore}<Icon name="arrow" size={17} /></button>
        </div>
      )}
    </section>
  );
}

function RankingView({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const leaders = [
    { rank: "01", name: locale === "ar" ? "مستكشف ٠٠١" : "Explorer 001", points: "2,480" },
    { rank: "02", name: locale === "ar" ? "مستكشف ٠٠٢" : "Explorer 002", points: "2,210" },
    { rank: "03", name: locale === "ar" ? "مستكشف ٠٠٣" : "Explorer 003", points: "1,970" },
    { rank: "04", name: locale === "ar" ? "مستكشف ٠٠٤" : "Explorer 004", points: "1,640" },
  ];
  return (
    <section className="page-view">
      <div className="page-heading"><span className="eyebrow">SAUDI ARABIA · DEMO</span><h1>{t.rankingTitle}</h1><p>{t.rankingSub}</p></div>
      <div className="ranking-hero">
        <div className="ranking-orb"><Icon name="ranking" size={30} /></div>
        <span>{t.demo}</span><strong>TOP 100</strong><small>SAUDI ARABIA</small>
      </div>
      <div className="leader-list">
        {leaders.map((leader, index) => (
          <div className="leader-row" key={leader.rank}>
            <strong className={`rank-number rank-${index + 1}`}>{leader.rank}</strong>
            <span className="leader-avatar">{leader.name.slice(-1)}</span>
            <div><strong>{leader.name}</strong><span>{t.demo}</span></div>
            <p><strong>{leader.points}</strong><span>{t.points}</span></p>
          </div>
        ))}
      </div>
      <div className="info-card"><Icon name="shield" size={20} /><p>{t.pointsNote}</p></div>
    </section>
  );
}

function ProfileView({ locale, setLocale }: { locale: Locale; setLocale: (locale: Locale) => void }) {
  const t = copy[locale];
  return (
    <section className="page-view">
      <div className="page-heading"><span className="eyebrow">TELEGRAM · DEMO</span><h1>{t.profileTitle}</h1><p>{t.comingSoon}</p></div>
      <div className="profile-card">
        <div className="profile-avatar"><LogoMark /></div>
        <div><strong>{t.telegramUser}</strong><span>@telegram_user · {t.demo}</span></div>
        <em>{t.memberStatus}</em>
      </div>
      <div className="profile-stats">
        <div><strong>—</strong><span>{t.points}</span></div>
        <div><strong>0</strong><span>{t.referrals}</span></div>
        <div><strong>0</strong><span>{t.started}</span></div>
      </div>
      <div className="settings-list">
        <button onClick={() => setLocale(locale === "ar" ? "en" : "ar")} type="button">
          <span className="setting-icon"><Icon name="globe" size={19} /></span>
          <div><strong>{t.language}</strong><span>{locale === "ar" ? "العربية" : "English"}</span></div>
          <Icon name="arrow" size={17} />
        </button>
        <button type="button">
          <span className="setting-icon"><Icon name="shield" size={19} /></span>
          <div><strong>{t.safetyCenter}</strong><span>{t.comingSoon}</span></div>
          <Icon name="arrow" size={17} />
        </button>
        <button type="button">
          <span className="setting-icon"><Icon name="bell" size={19} /></span>
          <div><strong>{t.notifications}</strong><span>{t.comingSoon}</span></div>
          <Icon name="arrow" size={17} />
        </button>
      </div>
      <div className="security-statement"><Icon name="shield" size={22} /><p>{t.security}</p></div>
    </section>
  );
}

function CampaignDetail({
  campaign,
  locale,
  isSaved,
  onBack,
  onSave,
}: {
  campaign: Campaign;
  locale: Locale;
  isSaved: boolean;
  onBack: () => void;
  onSave: () => void;
}) {
  const t = copy[locale];
  const [completed, setCompleted] = useState<number[]>([]);
  const title = locale === "ar" ? campaign.nameAr : campaign.name;
  const summary = locale === "ar" ? campaign.summaryAr : campaign.summary;
  const toggleStep = (index: number) => setCompleted((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
  return (
    <section className="detail-view">
      <div className="detail-toolbar">
        <button className="back-button" onClick={onBack} type="button"><Icon name="arrow" size={19} />{t.back}</button>
        <span>{t.detail}</span>
        <button aria-label="Save opportunity" aria-pressed={isSaved} className={`save-button ${isSaved ? "saved" : ""}`} onClick={onSave} type="button"><Icon name="bookmark" size={18} /></button>
      </div>
      <div className={`detail-identity detail-${campaign.accent}`}>
        <div className="detail-glow" />
        <div className={`project-avatar large ${campaign.accent}`}>{campaign.monogram}</div>
        <div className="tag-row"><span className="tag demo-tag">DEMO</span><span className="tag free-tag">{t.free}</span><span className="tag early-tag">{campaign.stage === "early" ? t.early : t.new}</span></div>
        <h1>{title}</h1><p>{summary}</p>
        <span className="verified-time"><Icon name="clock" size={15} />{t.lastVerified}</span>
      </div>
      <div className="detail-score-row">
        <div><span>{t.risk}</span><strong className={campaign.risk === "low" ? "positive" : "caution"}>{campaign.risk === "low" ? t.low : t.medium}</strong></div>
        <div><span>{t.cost}</span><strong>$0 <small>DEMO</small></strong></div>
        <div><span>{t.time}</span><strong>{campaign.time}</strong></div>
        <div><span>{t.score}</span><strong>{campaign.score}<small>/10</small></strong></div>
      </div>
      <section className="detail-section">
        <div className="detail-section-title"><span>01</span><div><h2>{t.overview}</h2><p>{t.demoNotice}</p></div></div>
        <div className="overview-list">
          <div><span>{t.network}</span><strong>{campaign.network}</strong></div>
          <div><span>{t.status}</span><strong>{t.earlySignal}</strong></div>
          <div><span>{t.difficulty}</span><strong>{campaign.difficulty === "easy" ? t.easy : t.medium}</strong></div>
          <div><span>{t.cost}</span><strong>$0 · DEMO</strong></div>
        </div>
      </section>
      <section className="detail-section tutorial-section">
        <div className="detail-section-title"><span>02</span><div><h2>{t.tutorial}</h2><p>{t.tutorialSub}</p></div></div>
        <div className="tutorial-list">
          {campaign.tutorial.map((step, index) => {
            const done = completed.includes(index);
            return (
              <button className={done ? "completed" : ""} key={step.en} onClick={() => toggleStep(index)} type="button">
                <span className="step-check">{done ? <Icon name="check" size={17} /> : index + 1}</span>
                <p>{locale === "ar" ? step.ar : step.en}</p>
              </button>
            );
          })}
        </div>
      </section>
      <div className="security-statement"><Icon name="shield" size={22} /><p>{t.security}</p></div>
      <div className="sticky-action">
        <button aria-disabled="true" disabled type="button"><Icon name="shield" size={19} />{t.start}</button>
        <span>{t.unavailable}</span>
      </div>
    </section>
  );
}

function BottomNavigation({ active, locale, onChange }: { active: View; locale: Locale; onChange: (view: View) => void }) {
  const t = copy[locale];
  const items: { id: View; label: string; icon: IconName }[] = [
    { id: "home", label: t.home, icon: "home" },
    { id: "explore", label: t.explore, icon: "search" },
    { id: "saved", label: t.saved, icon: "bookmark" },
    { id: "ranking", label: t.ranking, icon: "ranking" },
    { id: "profile", label: t.profile, icon: "profile" },
  ];
  return (
    <nav aria-label="Primary navigation" className="bottom-navigation">
      {items.map((item) => (
        <button aria-current={active === item.id ? "page" : undefined} className={active === item.id ? "active" : ""} key={item.id} onClick={() => onChange(item.id)} type="button">
          <span><Icon name={item.icon} size={20} /></span><small>{item.label}</small>
        </button>
      ))}
    </nav>
  );
}

export default function Home() {
  const [locale, setLocale] = useState<Locale>("ar");
  const [activeView, setActiveView] = useState<View>("home");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    const savedLocale = window.localStorage.getItem("arkheon-locale");
    const savedCampaigns = window.localStorage.getItem("arkheon-saved-demo");
    queueMicrotask(() => {
      if (savedLocale === "ar" || savedLocale === "en") setLocale(savedLocale);
      if (savedCampaigns) {
        try { setSavedIds(JSON.parse(savedCampaigns)); } catch { setSavedIds([]); }
      }
    });
    if (isTMA()) {
      init();
      themeParams.mount();
      miniApp.mount();
      miniApp.bindCssVars();
      miniApp.ready();
      void viewport.mount().then(() => {
        viewport.bindCssVars();
        viewport.expand();
      }).catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    window.localStorage.setItem("arkheon-locale", locale);
  }, [locale]);

  const toggleSaved = (id: string) => {
    setSavedIds((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      window.localStorage.setItem("arkheon-saved-demo", JSON.stringify(next));
      return next;
    });
  };

  const switchView = (view: View) => {
    setSelectedCampaign(null);
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="arkheon-app" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <div className="app-shell">
        <AppHeader locale={locale} setLocale={setLocale} />
        <DemoBanner locale={locale} />
        <div className="app-content">
          {selectedCampaign ? (
            <CampaignDetail campaign={selectedCampaign} isSaved={savedIds.includes(selectedCampaign.id)} locale={locale} onBack={() => setSelectedCampaign(null)} onSave={() => toggleSaved(selectedCampaign.id)} />
          ) : (
            <>
              {activeView === "home" && <HomeView locale={locale} onExplore={() => switchView("explore")} onOpen={setSelectedCampaign} onSave={toggleSaved} savedIds={savedIds} />}
              {activeView === "explore" && <ExploreView locale={locale} onOpen={setSelectedCampaign} onSave={toggleSaved} savedIds={savedIds} />}
              {activeView === "saved" && <SavedView locale={locale} onExplore={() => switchView("explore")} onOpen={setSelectedCampaign} onSave={toggleSaved} savedIds={savedIds} />}
              {activeView === "ranking" && <RankingView locale={locale} />}
              {activeView === "profile" && <ProfileView locale={locale} setLocale={setLocale} />}
            </>
          )}
        </div>
        {!selectedCampaign && <BottomNavigation active={activeView} locale={locale} onChange={switchView} />}
      </div>
    </main>
  );
}
