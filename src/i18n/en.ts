export interface GuideStep {
  title: string;
  subtitle: string;
  items: string[];
}

export interface TranslationKeys {
  appName: string;
  appTagline: string;
  modules: string;
  collapse: string;
  copyright: string;
  signOut: string;
  studyHistory: string;
  loading: string;
  openGuide: string;
  nav: {
    riskAssessment: string;
    riskAssessmentDesc: string;
    hazidStudy: string;
    hazidStudyDesc: string;
    hazopStudy: string;
    hazopStudyDesc: string;
    lopaStudy: string;
    lopaStudyDesc: string;
  };
  auth: {
    welcomeBack: string;
    createAccount: string;
    signInDescription: string;
    signUpDescription: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    signIn: string;
    signUp: string;
    signingIn: string;
    creatingAccount: string;
    noAccount: string;
    hasAccount: string;
    loginFailed: string;
    invalidCredentials: string;
    accountExists: string;
    accountExistsDesc: string;
    signUpFailed: string;
    welcomeBackToast: string;
    loginSuccess: string;
    accountCreated: string;
    signUpSuccess: string;
  };
  pages: {
    riskAssessment: { title: string; subtitle: string };
    hazid: { title: string; subtitle: string };
    hazop: { title: string; subtitle: string };
    lopa: { title: string; subtitle: string; backToHazop: string; previousStudies: string };
  };
  notFound: { title: string; message: string; returnHome: string };
  guide: {
    skip: string;
    previous: string;
    next: string;
    getStarted: string;
    steps: GuideStep[];
  };
  language: string;
  english: string;
  arabic: string;
}

export const en: TranslationKeys = {
  appName: "W.O.L.F AI",
  appTagline: "Risk Management System",
  modules: "Modules",
  collapse: "Collapse",
  copyright: "All rights reserved.",
  signOut: "Sign Out",
  studyHistory: "Study History",
  loading: "Loading...",
  openGuide: "Open guide",
  nav: {
    riskAssessment: "Risk Assessment",
    riskAssessmentDesc: "AI-powered risk analysis",
    hazidStudy: "HAZID Study",
    hazidStudyDesc: "Hazard identification",
    hazopStudy: "HAZOP Study",
    hazopStudyDesc: "IEC 61882 HAZOP analysis",
    lopaStudy: "LOPA Study",
    lopaStudyDesc: "Layer of Protection Analysis",
  },
  auth: {
    welcomeBack: "Welcome Back",
    createAccount: "Create Account",
    signInDescription: "Sign in to access your risk assessments",
    signUpDescription: "Sign up to start creating risk assessments",
    email: "Email",
    emailPlaceholder: "Enter your email",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    signIn: "Sign In",
    signUp: "Sign Up",
    signingIn: "Signing in...",
    creatingAccount: "Creating account...",
    noAccount: "Don't have an account? Sign up",
    hasAccount: "Already have an account? Sign in",
    loginFailed: "Login Failed",
    invalidCredentials: "Invalid email or password. Please check your credentials and try again.",
    accountExists: "Account Exists",
    accountExistsDesc: "An account with this email already exists. Please log in instead.",
    signUpFailed: "Sign Up Failed",
    welcomeBackToast: "Welcome back!",
    loginSuccess: "You have successfully logged in.",
    accountCreated: "Account Created!",
    signUpSuccess: "You have successfully signed up. Welcome!",
  },
  pages: {
    riskAssessment: {
      title: "Risk Assessment",
      subtitle: "AI-powered hazard identification using EGPC Corporate Risk Matrix",
    },
    hazid: {
      title: "HAZID Study",
      subtitle: "Professional Hazard Identification aligned with EGPC Standards",
    },
    hazop: {
      title: "HAZOP Study",
      subtitle: "IEC 61882 / EGPC-PSM-GL-005 Compliant HAZOP Analysis",
    },
    lopa: {
      title: "LOPA Study",
      subtitle: "Layer of Protection Analysis per EGPC-PSM-GL-015",
      backToHazop: "Back to HAZOP",
      previousStudies: "Previous LOPA Studies",
    },
  },
  notFound: {
    title: "404",
    message: "Oops! Page not found",
    returnHome: "Return to Home",
  },
  guide: {
    skip: "Skip",
    previous: "Previous",
    next: "Next",
    getStarted: "Get Started",
    steps: [
      {
        title: "Welcome to W.O.L.F AI",
        subtitle: "Your AI-powered Risk Management System",
        items: [
          "W.O.L.F AI helps you conduct professional risk assessments using AI and EGPC standards.",
          "Navigate between modules using the sidebar (desktop) or bottom navigation (mobile).",
          "All your studies are saved automatically and can be loaded from Study History on each page.",
          "Export your results to Excel or PDF from any study's results section.",
        ],
      },
      {
        title: "Risk Assessment",
        subtitle: "AI-powered hazard identification using EGPC Corporate Risk Matrix",
        items: [
          "Fill in the activity details: title, description, activity type, and location.",
          "Optionally upload supporting documents (PDF, images) for more accurate analysis.",
          "Click 'Assess Risks' and the AI will identify hazards with likelihood, severity, and risk rankings.",
          "Review the results table with risk matrix, bow-tie diagrams, and recommended controls.",
          "Save your study and export to Excel for reporting and record-keeping.",
        ],
      },
      {
        title: "HAZID Study",
        subtitle: "Professional Hazard Identification aligned with EGPC Standards",
        items: [
          "Enter the study title, executive summary, purpose, and scope of the study.",
          "Provide process design parameters, material hazard data, and key instrument lists.",
          "Upload P&IDs or process documents for the AI to analyze.",
          "Click 'Generate HAZID' — AI identifies hazards with initial, current, and residual risk rankings.",
          "Review the HAZID worksheet, edit entries inline, and export the full report to Excel.",
        ],
      },
      {
        title: "HAZOP Study",
        subtitle: "IEC 61882 / EGPC-PSM-GL-005 Compliant HAZOP Analysis",
        items: [
          "Define the study: title, description, purpose, scope (in/out), facility type, and lifecycle phase.",
          "Set operating parameters (flow, pressure, temperature, level) and P&ID information.",
          "Define process nodes with boundaries and operating modes for systematic analysis.",
          "Click 'Generate HAZOP' — AI creates deviations with causes, consequences, safeguards, and risk rankings.",
          "From HAZOP results, you can directly start a LOPA analysis for any high-risk deviation.",
        ],
      },
      {
        title: "LOPA Study",
        subtitle: "Layer of Protection Analysis per EGPC-PSM-GL-015",
        items: [
          "Start from a HAZOP deviation or create a standalone scenario with title and equipment number.",
          "Define the consequence category (People, Environment, Assets) and severity level.",
          "Click 'Generate LOPA' — AI calculates initiating events, IPLs, and conditional modifiers.",
          "Review the LOPA worksheet with IEL calculations, SIL requirements, and PFD targets.",
          "Check recommendations for additional protection layers if risk is not tolerable.",
        ],
      },
    ],
  },
  language: "Language",
  english: "English",
  arabic: "العربية",
};
