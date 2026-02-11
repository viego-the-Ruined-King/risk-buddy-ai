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
  forms: {
    risk: {
      title: string;
      subtitle: string;
      assessmentTitle: string;
      assessmentTitlePlaceholder: string;
      description: string;
      descriptionPlaceholder: string;
      activityType: string;
      activityTypePlaceholder: string;
      location: string;
      locationPlaceholder: string;
      assessRisks: string;
      analyzing: string;
      missingInfo: string;
      missingInfoDesc: string;
      assessmentComplete: string;
      assessmentFailed: string;
    };
    hazid: {
      title: string;
      subtitle: string;
      studyTitle: string;
      studyTitlePlaceholder: string;
      executiveSummary: string;
      executiveSummaryPlaceholder: string;
      purpose: string;
      purposePlaceholder: string;
      scope: string;
      scopePlaceholder: string;
      advancedInputs: string;
      processDesignParameters: string;
      processDesignPlaceholder: string;
      materialHazardData: string;
      materialHazardPlaceholder: string;
      keyInstrumentList: string;
      keyInstrumentPlaceholder: string;
      organizationalContext: string;
      organizationalContextPlaceholder: string;
      generateStudy: string;
      generating: string;
      generatingShort: string;
    };
    hazop: {
      title: string;
      subtitle: string;
      studyDetails: string;
      parameters: string;
      pnidInfo: string;
      nodes: string;
      studyTitle: string;
      studyTitlePlaceholder: string;
      facilityType: string;
      facilityTypePlaceholder: string;
      lifecyclePhase: string;
      lifecyclePhasePlaceholder: string;
      studyDescription: string;
      studyDescriptionPlaceholder: string;
      purposeLabel: string;
      purposePlaceholder: string;
      inScope: string;
      inScopePlaceholder: string;
      outOfScope: string;
      outOfScopePlaceholder: string;
      flowParameters: string;
      pressureParameters: string;
      temperatureParameters: string;
      levelComposition: string;
      normal: string;
      min: string;
      max: string;
      units: string;
      design: string;
      mawp: string;
      levelNormal: string;
      levelHigh: string;
      levelLow: string;
      compositionPhase: string;
      pnidNumbers: string;
      pnidNumbersPlaceholder: string;
      equipmentLines: string;
      equipmentLinesPlaceholder: string;
      controlLoops: string;
      controlLoopsPlaceholder: string;
      uploadPnid: string;
      defineNodes: string;
      addNode: string;
      noNodes: string;
      noNodesHint: string;
      nodeDescription: string;
      nodeDescriptionPlaceholder: string;
      boundaryFrom: string;
      boundaryFromPlaceholder: string;
      boundaryTo: string;
      boundaryToPlaceholder: string;
      operatingMode: string;
      operatingModePlaceholder: string;
      newStudy: string;
      generateStudy: string;
      generatingStudy: string;
      validationError: string;
      validationErrorDesc: string;
    };
    lopa: {
      title: string;
      subtitle: string;
      linkHazop: string;
      selectHazopStudy: string;
      selectHazopStudyPlaceholder: string;
      selectDeviation: string;
      selectDeviationPlaceholder: string;
      noHighRiskDeviations: string;
      hazopNode: string;
      deviation: string;
      consequences: string;
      initialRisk: string;
      scenarioTitle: string;
      scenarioTitlePlaceholder: string;
      equipmentNumber: string;
      equipmentNumberPlaceholder: string;
      consequenceCategory: string;
      severityLevel: string;
      severityPlaceholder: string;
      generateLopa: string;
      generatingLopa: string;
      validationError: string;
      validationErrorDesc: string;
    };
    fileUpload: {
      attachments: string;
      attachmentsDesc: string;
      clickToUpload: string;
      orDragDrop: string;
      fileTypes: string;
      processingFiles: string;
      invalidFileType: string;
      fileTooLarge: string;
      tooManyFiles: string;
    };
  };
  results: {
    risk: {
      title: string;
      hazardsIdentified: string;
      save: string;
      update: string;
      export: string;
      generateMore: string;
      saving: string;
      generating: string;
      hazardDescription: string;
      whoHarmed: string;
      consequencesCol: string;
      likelihood: string;
      lScore: string;
      severity: string;
      sScore: string;
      riskLevel: string;
      lxs: string;
      existingControls: string;
      proposedControls: string;
      residualLikelihood: string;
      rlScore: string;
      residualSeverity: string;
      rsScore: string;
      residualRiskLevel: string;
      rlxs: string;
      actions: string;
      viewBowTie: string;
    };
    hazid: {
      title: string;
      hazards: string;
      save: string;
      update: string;
      generateMore: string;
      exportExcel: string;
      exportShort: string;
      saving: string;
      generating: string;
      hNo: string;
      guideword: string;
      hazardDescription: string;
      sourceLocation: string;
      possibleCauses: string;
      topEvent: string;
      consequencesCol: string;
      initialRisk: string;
      mah: string;
      existingControls: string;
      currentRisk: string;
      recommendations: string;
      residualRisk: string;
      actionParty: string;
      targetDate: string;
      viewBowTie: string;
    };
    hazop: {
      title: string;
      deviations: string;
      generateMore: string;
      save: string;
      update: string;
      exportExcel: string;
      exportShort: string;
      saving: string;
      generating: string;
      nodeId: string;
      nodeDescription: string;
      deviationId: string;
      parameter: string;
      guideword: string;
      deviationCol: string;
      designIntent: string;
      assessFor: string;
      possibleCauses: string;
      consequencesUnmitigated: string;
      initialRisk: string;
      existingSafeguards: string;
      currentRisk: string;
      recommendations: string;
      residualRisk: string;
      actionParty: string;
      remarks: string;
      targetDate: string;
      lopaRequired: string;
      startLopa: string;
      viewBowTie: string;
      l: string;
      s: string;
      r: string;
    };
    lopa: {
      title: string;
      acceptable: string;
      requiresProtection: string;
      totalIel: string;
      tmel: string;
      requiredSil: string;
      pfdTarget: string;
      save: string;
      update: string;
      exportCsv: string;
      saving: string;
      worksheetTitle: string;
      perEgpc: string;
      scenarioNumber: string;
      equipmentNumber: string;
      scenarioTitle: string;
      consequenceDesc: string;
      tmelLabel: string;
      initiatingEvents: string;
      initiatingEvent: string;
      frequency: string;
      source: string;
      ipls: string;
      type: string;
      iplDescription: string;
      pfd: string;
      conditionalModifiers: string;
      timeAtRisk: string;
      ignitionProbability: string;
      vulnerability: string;
      ielCalculation: string;
      ielFormula: string;
      ief: string;
      iplsProduct: string;
      pec: string;
      pcm: string;
      iel: string;
      totalMitigated: string;
      sifRequirements: string;
      pfdSafety: string;
      pfdEnvironment: string;
      pfdFinancial: string;
      silRequired: string;
      recommendationsTitle: string;
      noRecommendations: string;
      notesAssumptions: string;
      noNotes: string;
      linkedHazop: string;
      deviationId: string;
      reference: string;
    };
  };
  history: {
    noStudies: string;
    noStudiesHint: string;
    continueStudy: string;
    open: string;
    deleteStudy: string;
    deleteConfirm: string;
    cancel: string;
    delete: string;
    hazardsCount: string;
    previousLopa: string;
    newStudy: string;
    noPreviousLopa: string;
    load: string;
    deleteLopaTitle: string;
    deleteLopaConfirm: string;
    linkedToHazop: string;
    loadingStudies: string;
  };
  common: {
    success: string;
    error: string;
    saved: string;
    deleted: string;
    none: string;
  };
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
      title: "Semi-Quantitative Risk Assessment",
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
        title: "Semi-Quantitative Risk Assessment",
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
  forms: {
    risk: {
      title: "Risk Assessment",
      subtitle: "Enter activity details to identify potential hazards",
      assessmentTitle: "Risk Assessment Title",
      assessmentTitlePlaceholder: "e.g., Warehouse Operations Safety Review",
      description: "Description",
      descriptionPlaceholder: "Provide detailed description of the activity...",
      activityType: "Activity Type",
      activityTypePlaceholder: "e.g., Material Handling",
      location: "Location",
      locationPlaceholder: "e.g., Main Warehouse",
      assessRisks: "Assess Risks",
      analyzing: "Analyzing...",
      missingInfo: "Missing Information",
      missingInfoDesc: "Please fill in all fields before submitting.",
      assessmentComplete: "Assessment Complete",
      assessmentFailed: "Assessment Failed",
    },
    hazid: {
      title: "HAZID Study Details",
      subtitle: "Enter the study information to generate a comprehensive hazard identification analysis",
      studyTitle: "HAZID Study Title",
      studyTitlePlaceholder: "Enter the study title",
      executiveSummary: "Executive Summary",
      executiveSummaryPlaceholder: "Provide a brief executive summary",
      purpose: "Purpose",
      purposePlaceholder: "Describe the purpose of this HAZID study",
      scope: "Scope",
      scopePlaceholder: "Define the scope of this HAZID study",
      advancedInputs: "Advanced Inputs (Optional)",
      processDesignParameters: "Process Design Parameters",
      processDesignPlaceholder: "Enter operating pressure, temperature ranges, flow rates, design basis...",
      materialHazardData: "Material Hazard Data",
      materialHazardPlaceholder: "Enter MSDS information, flammability, toxicity, corrosivity data...",
      keyInstrumentList: "Key Instrument List",
      keyInstrumentPlaceholder: "List critical instruments, SIS, safety interlocks, alarms...",
      organizationalContext: "Organizational/Human Factor Context",
      organizationalContextPlaceholder: "Describe shift patterns, training levels, staffing, fatigue factors...",
      generateStudy: "Generate HAZID Study",
      generating: "Generating HAZID Study...",
      generatingShort: "Generating...",
    },
    hazop: {
      title: "HAZOP Study Input",
      subtitle: "IEC 61882 / EGPC-PSM-GL-005 Compliant Analysis",
      studyDetails: "Study Details",
      parameters: "Parameters",
      pnidInfo: "P&ID Info",
      nodes: "Nodes",
      studyTitle: "Study Title *",
      studyTitlePlaceholder: "e.g., Gas Compression System HAZOP",
      facilityType: "Facility Type",
      facilityTypePlaceholder: "e.g., Offshore Platform, Refinery, Gas Plant...",
      lifecyclePhase: "Lifecycle Phase",
      lifecyclePhasePlaceholder: "e.g., Detailed Design, Operation, Commissioning...",
      studyDescription: "Study Description",
      studyDescriptionPlaceholder: "Describe the system or process being studied...",
      purposeLabel: "Purpose",
      purposePlaceholder: "State the purpose of this HAZOP study...",
      inScope: "In Scope",
      inScopePlaceholder: "What is included in this study...",
      outOfScope: "Out of Scope",
      outOfScopePlaceholder: "What is excluded from this study...",
      flowParameters: "Flow Parameters",
      pressureParameters: "Pressure Parameters",
      temperatureParameters: "Temperature Parameters",
      levelComposition: "Level & Composition",
      normal: "Normal",
      min: "Min",
      max: "Max",
      units: "Units",
      design: "Design",
      mawp: "MAWP",
      levelNormal: "Level Normal",
      levelHigh: "Level High",
      levelLow: "Level Low",
      compositionPhase: "Composition/Phase",
      pnidNumbers: "P&ID Numbers",
      pnidNumbersPlaceholder: "e.g., P-101, P-102, P-103...",
      equipmentLines: "Equipment and Line Descriptions",
      equipmentLinesPlaceholder: "Describe main equipment, vessels, pumps, compressors, heat exchangers...",
      controlLoops: "Control Loops",
      controlLoopsPlaceholder: "Describe relevant control loops, instruments, and interlocks...",
      uploadPnid: "Upload P&ID Images (Optional)",
      defineNodes: "Define process nodes for analysis. Each node will be evaluated against HAZOP guidewords.",
      addNode: "Add Node",
      noNodes: "No nodes defined yet.",
      noNodesHint: 'Click "Add Node" to define process nodes, or leave empty for AI to suggest nodes.',
      nodeDescription: "Node Description",
      nodeDescriptionPlaceholder: "e.g., Feed Gas Inlet Header",
      boundaryFrom: "Boundary From",
      boundaryFromPlaceholder: "e.g., Battery Limit",
      boundaryTo: "Boundary To",
      boundaryToPlaceholder: "e.g., Inlet Separator V-101",
      operatingMode: "Operating Mode",
      operatingModePlaceholder: "e.g., Normal, Startup, Shutdown...",
      newStudy: "New Study",
      generateStudy: "Generate HAZOP Study",
      generatingStudy: "Generating HAZOP Worksheet...",
      validationError: "Validation Error",
      validationErrorDesc: "Please enter a study title.",
    },
    lopa: {
      title: "LOPA Input Data",
      subtitle: "Layer of Protection Analysis per EGPC-PSM-GL-015",
      linkHazop: "Link to HAZOP Scenario (Optional)",
      selectHazopStudy: "Select HAZOP Study",
      selectHazopStudyPlaceholder: "Select a HAZOP study...",
      selectDeviation: "Select High-Risk Deviation",
      selectDeviationPlaceholder: "Select a deviation...",
      noHighRiskDeviations: "No high-risk deviations found",
      hazopNode: "HAZOP Node",
      deviation: "Deviation",
      consequences: "Consequences",
      initialRisk: "Initial Risk",
      scenarioTitle: "Scenario Title *",
      scenarioTitlePlaceholder: "e.g., High pressure in reactor vessel",
      equipmentNumber: "Equipment Number",
      equipmentNumberPlaceholder: "e.g., V-101",
      consequenceCategory: "Consequence Category",
      severityLevel: "Severity Level (EGPC) *",
      severityPlaceholder: "Select severity...",
      generateLopa: "Generate LOPA Analysis",
      generatingLopa: "Generating LOPA Analysis...",
      validationError: "Validation Error",
      validationErrorDesc: "Please provide a scenario title and severity level.",
    },
    fileUpload: {
      attachments: "Attachments (Optional)",
      attachmentsDesc: "Upload P&IDs, equipment photos, site layouts, or process diagrams for AI analysis",
      clickToUpload: "Click to upload",
      orDragDrop: "or drag and drop",
      fileTypes: "PNG, JPG, WEBP, PDF",
      processingFiles: "Processing files...",
      invalidFileType: "Invalid file type",
      fileTooLarge: "File too large",
      tooManyFiles: "Too many files",
    },
  },
  results: {
    risk: {
      title: "Assessment Results",
      hazardsIdentified: "hazards identified",
      save: "Save",
      update: "Update",
      export: "Export",
      generateMore: "Generate 10 More",
      saving: "Saving...",
      generating: "Generating...",
      hazardDescription: "Hazard Description",
      whoHarmed: "Who Might Be Harmed",
      consequencesCol: "Consequences",
      likelihood: "Likelihood",
      lScore: "L Score",
      severity: "Severity",
      sScore: "S Score",
      riskLevel: "Risk Level",
      lxs: "L×S",
      existingControls: "Existing Controls",
      proposedControls: "Proposed Controls (with International Standards)",
      residualLikelihood: "Residual Likelihood",
      rlScore: "R-L Score",
      residualSeverity: "Residual Severity",
      rsScore: "R-S Score",
      residualRiskLevel: "Residual Risk Level",
      rlxs: "R-L×S",
      actions: "Actions",
      viewBowTie: "View Bow Tie Diagram",
    },
    hazid: {
      title: "HAZID Study Results",
      hazards: "hazards",
      save: "Save",
      update: "Update",
      generateMore: "Generate 15 More",
      exportExcel: "Export to Excel",
      exportShort: "Export",
      saving: "Saving...",
      generating: "Generating...",
      hNo: "H-No",
      guideword: "Guideword",
      hazardDescription: "Hazard Description",
      sourceLocation: "Source Location",
      possibleCauses: "Possible Causes",
      topEvent: "Top Event",
      consequencesCol: "Consequences",
      initialRisk: "Initial Risk",
      mah: "MAH",
      existingControls: "Existing Controls",
      currentRisk: "Current Risk",
      recommendations: "Recommendations",
      residualRisk: "Residual Risk",
      actionParty: "Action Party",
      targetDate: "Target Date",
      viewBowTie: "View Bow Tie Diagram",
    },
    hazop: {
      title: "HAZOP Worksheet",
      deviations: "deviations",
      generateMore: "Generate 10 More",
      save: "Save",
      update: "Update",
      exportExcel: "Export to Excel",
      exportShort: "Export",
      saving: "Saving...",
      generating: "Generating...",
      nodeId: "Node ID",
      nodeDescription: "Node Description",
      deviationId: "Deviation ID",
      parameter: "Parameter",
      guideword: "Guideword",
      deviationCol: "Deviation",
      designIntent: "Design Intent",
      assessFor: "Assess For",
      possibleCauses: "Possible Causes",
      consequencesUnmitigated: "Consequences (Unmitigated)",
      initialRisk: "Initial Risk",
      existingSafeguards: "Existing Safeguards",
      currentRisk: "Current Risk",
      recommendations: "Recommendations",
      residualRisk: "Residual Risk",
      actionParty: "Action Party",
      remarks: "Remarks",
      targetDate: "Target Date",
      lopaRequired: "LOPA Required",
      startLopa: "Start LOPA",
      viewBowTie: "Bow Tie",
      l: "L",
      s: "S",
      r: "R",
    },
    lopa: {
      title: "LOPA Result",
      acceptable: "ACCEPTABLE",
      requiresProtection: "REQUIRES ADDITIONAL PROTECTION",
      totalIel: "Total IEL",
      tmel: "TMEL",
      requiredSil: "Required SIL",
      pfdTarget: "PFD Target",
      save: "Save",
      update: "Update",
      exportCsv: "Export to CSV",
      saving: "Saving...",
      worksheetTitle: "LOPA Worksheet - Annex D Format",
      perEgpc: "Per EGPC-PSM-GL-015",
      scenarioNumber: "Scenario Number",
      equipmentNumber: "Equipment Number",
      scenarioTitle: "Scenario Title",
      consequenceDesc: "Consequence Description / Category",
      tmelLabel: "Target Mitigated Event Likelihood (TMEL)",
      initiatingEvents: "Initiating Events",
      initiatingEvent: "Initiating Event",
      frequency: "Frequency (per year)",
      source: "Source",
      ipls: "Layers of Protection (IPLs)",
      type: "Type",
      iplDescription: "Description",
      pfd: "PFD",
      conditionalModifiers: "Conditional Modifiers",
      timeAtRisk: "Time at Risk",
      ignitionProbability: "Ignition Probability",
      vulnerability: "Vulnerability",
      ielCalculation: "IEL Calculation",
      ielFormula: "IEL = IEF × Π(PFD of IPLs) × PEC × PCM",
      ief: "IEF",
      iplsProduct: "IPLs Product",
      pec: "PEC",
      pcm: "PCM",
      iel: "IEL",
      totalMitigated: "Total Mitigated Event Frequency:",
      sifRequirements: "SIF Requirements",
      pfdSafety: "PFD Target (Safety)",
      pfdEnvironment: "PFD Target (Environment)",
      pfdFinancial: "PFD Target (Financial)",
      silRequired: "SIL Required",
      recommendationsTitle: "Recommendations",
      noRecommendations: "No additional recommendations.",
      notesAssumptions: "Notes and Assumptions",
      noNotes: "No additional notes.",
      linkedHazop: "Linked to HAZOP",
      deviationId: "Deviation ID",
      reference: "Reference: EGPC-PSM-GL-015 - Layer of Protection Analysis (LOPA) Guideline, Rev 0, Nov 2022",
    },
  },
  history: {
    noStudies: "No saved studies yet.",
    noStudiesHint: "Generate a study to save it here.",
    continueStudy: "Continue",
    open: "Open",
    deleteStudy: "Delete Study",
    deleteConfirm: 'Are you sure you want to delete "{title}"? This action cannot be undone.',
    cancel: "Cancel",
    delete: "Delete",
    hazardsCount: "hazards",
    previousLopa: "Previous LOPA Studies",
    newStudy: "New Study",
    noPreviousLopa: "No previous LOPA studies found.",
    load: "Load",
    deleteLopaTitle: "Delete LOPA Study?",
    deleteLopaConfirm: 'This will permanently delete "{title}". This action cannot be undone.',
    linkedToHazop: "Linked to HAZOP",
    loadingStudies: "Loading studies...",
  },
  common: {
    success: "Success",
    error: "Error",
    saved: "Saved",
    deleted: "Deleted",
    none: "None",
  },
};