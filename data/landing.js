// Icon names as strings - mapped to components in page.jsx
// This avoids React component serialization issues in Next.js

// Why Wealnex - 3 Core Value Props
export const whyWealnexData = [
  {
    iconName: "Key",
    title: "Consent-First Design",
    description: "You control exactly what data is shared, when, and with whom.",
  },
  {
    iconName: "Brain",
    title: "AI-Driven Insights",
    description: "Smart analysis that turns your financial data into actionable intelligence.",
  },
  {
    iconName: "Shield",
    title: "Bank-Grade Security",
    description: "AES-256 encryption with zero credential storage.",
  },
];

// How It Works - AA Flow (4 Steps)
export const howItWorksData = [
  {
    step: 1,
    iconName: "Lock",
    title: "Secure Consent",
    subtitle: "AA Framework",
    description: "Grant read-only access through RBI-regulated consent flow.",
  },
  {
    step: 2,
    iconName: "ArrowRightLeft",
    title: "Encrypted Data Fetch",
    subtitle: "FIP Integration",
    description: "Your bank data is fetched securely via Account Aggregator.",
  },
  {
    step: 3,
    iconName: "Cpu",
    title: "Local AI Processing",
    subtitle: "On-Device",
    description: "AI analysis runs locally — your data never leaves your control.",
  },
  {
    step: 4,
    iconName: "Lightbulb",
    title: "Actionable Insights",
    subtitle: "Intelligence",
    description: "Receive personalized recommendations to optimize finances.",
  },
];

// Features Grid (6 Cards)
export const featuresData = [
  {
    iconName: "CreditCard",
    title: "Account Aggregation",
    description: "Connect multiple bank accounts through RBI AA framework.",
    tag: "AA",
  },
  {
    iconName: "Receipt",
    title: "Smart Receipt OCR",
    description: "Extract expense data automatically from receipts.",
    tag: "AI",
  },
  {
    iconName: "PieChart",
    title: "Budget Intelligence",
    description: "AI-powered budget recommendations based on spending patterns.",
    tag: "AI",
  },
  {
    iconName: "Wallet",
    title: "Multi-Account Support",
    description: "Manage all your bank accounts and cards in one place.",
    tag: null,
  },
  {
    iconName: "Zap",
    title: "Automated Insights",
    description: "Get real-time alerts and spending analysis.",
    tag: "AI",
  },
  {
    iconName: "Play",
    title: "Demo Mode",
    description: "Try the full experience with sandbox data — no bank login needed.",
    tag: "Sandbox",
  },
];

// Security & Compliance
export const securityData = [
  {
    iconName: "ShieldCheck",
    title: "AES-256 Encryption",
    description: "Military-grade encryption for all data in transit and at rest.",
  },
  {
    iconName: "FileKey",
    title: "No Credential Storage",
    description: "We never store your banking passwords or credentials.",
  },
  {
    iconName: "Shield",
    title: "RBI AA Compliant",
    description: "Built on the official RBI Account Aggregator framework.",
  },
  {
    iconName: "Eye",
    title: "Read-Only Access",
    description: "View-only permissions — we cannot initiate transactions.",
  },
];

// Footer Links
export const footerData = {
  product: [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Demo", href: "/dashboard" },
  ],
  security: [
    { label: "Privacy Policy", href: "#" },
    { label: "Security", href: "#security" },
    { label: "Compliance", href: "#security" },
  ],
  techStack: [
    { label: "RBI AA Framework", href: "https://sahamati.org.in" },
    { label: "Next.js", href: "https://nextjs.org" },
    { label: "Prisma", href: "https://prisma.io" },
  ],
  social: [
    { label: "GitHub", href: "https://github.com/DoomsCoder" },
  ],
};