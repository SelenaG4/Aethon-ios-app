// The English dictionary is the master shape: every other language must
// provide exactly these keys (src/lib/i18n/engine.tsx types TranslationKey
// off this file, and de/fr/it are each typed as Record<TranslationKey,
// string>, so a missing or extra key in any of them fails npx tsc --noEmit).
export const en = {
  // ---------------------------------------------------------------------
  // common — shared across many screens
  // ---------------------------------------------------------------------
  'common.back': 'Back',
  'common.save': 'Save',
  'common.saving': 'Saving…',
  'common.cancel': 'Cancel',
  'common.yes': 'Yes',
  'common.no': 'No',
  'common.optional': 'Optional',
  'common.tryAgain': 'Try again',
  'common.goodMorning': 'Good morning',
  'common.goodAfternoon': 'Good afternoon',
  'common.goodEvening': 'Good evening',
  'common.switchView': 'Switch view',

  // ---------------------------------------------------------------------
  // chooser — RootNavigator's role chooser
  // ---------------------------------------------------------------------
  'chooser.brand': 'Aethon',
  'chooser.title': 'Choose a view',
  'chooser.carer': 'Carer',
  'chooser.resident': 'Resident',
  'chooser.familyOrManagement': 'Family or management',
  'chooser.styleGuide': 'Style guide',
  'chooser.loadError': 'Could not load Aethon',

  // ---------------------------------------------------------------------
  // carerTabs — CarerNavigator's bottom tabs
  // ---------------------------------------------------------------------
  'carerTabs.clients': 'Clients',
  'carerTabs.toCheck': 'To check',
  'carerTabs.handover': 'Handover',
  'carerTabs.profile': 'Profile',

  // ---------------------------------------------------------------------
  // clients — ClientsScreen
  // ---------------------------------------------------------------------
  'clients.startShift': 'Start shift',
  'clients.endShift': 'End shift',
  'clients.searchPlaceholder': 'Search',
  'clients.notesToCheckOne': '{{count}} note to check',
  'clients.notesToCheckOther': '{{count}} notes to check',
  'clients.escalationsAwaitingOne': '{{count}} escalation awaiting outcome',
  'clients.escalationsAwaitingOther': '{{count}} escalations awaiting outcome',
  'clients.loadError': 'Could not load clients',
  'clients.emptyTitle': 'No clients found',
  'clients.transcribing': 'Transcribing',
  'clients.transcriptionUnavailable': 'Transcription unavailable',
  'clients.needsChecking': 'Needs checking',
  'clients.noNotesYet': 'No notes yet',
  'clients.lastNoteToday': 'Last note: today {{time}}',
  'clients.lastNoteYesterday': 'Last note: yesterday {{time}}',
  'clients.lastNoteDate': 'Last note: {{date}}',

  // ---------------------------------------------------------------------
  // clientProfile — ClientProfileScreen (profile/notes/history tabs)
  // ---------------------------------------------------------------------
  'clientProfile.logObservation': 'Log observation',
  'clientProfile.recordNote': 'Record note',
  'clientProfile.baselineRecorded': 'Baseline recorded',
  'clientProfile.escalationRecorded': 'Escalation recorded',
  'clientProfile.tabProfile': 'Profile',
  'clientProfile.tabNotes': 'Notes',
  'clientProfile.tabHistory': 'History',
  'clientProfile.loadError': 'Could not load this client',
  'clientProfile.baselineNotRecorded': 'Baseline not yet recorded',
  'clientProfile.age': 'Age {{age}}',
  'clientProfile.room': 'Room {{room}}',
  'clientProfile.livingSituation': 'Living situation',
  'clientProfile.change': 'Change',
  'clientProfile.since': 'Since {{date}}',
  'clientProfile.previouslyUntil': 'Previously {{stage}} until {{date}}',
  'clientProfile.baselineAtEnrolment': 'Baseline at enrolment',
  'clientProfile.baselineFieldAge': 'Age',
  'clientProfile.baselineFieldLivesAlone': 'Lives alone',
  'clientProfile.baselineFieldConditions': 'Long-term conditions',
  'clientProfile.baselineFieldMobility': 'Mobility aid',
  'clientProfile.baselineFieldSupport': 'Support in place',
  'clientProfile.baselineRecordedAt': 'Recorded {{date}}',
  'clientProfile.recentObservations': 'Recent observations',
  'clientProfile.flaggedToAskAbout': 'Flagged to ask about: {{items}}',
  'clientProfile.noObservationsYet': 'No observations recorded yet',
  'clientProfile.mood': 'Mood',
  'clientProfile.last14Days': 'Last 14 days',
  'clientProfile.weight': 'Weight',
  'clientProfile.weightSummary':
    'First recorded {{firstValue}} kg on {{firstDate}}, most recent {{lastValue}} kg on {{lastDate}}',
  'clientProfile.pain': 'Pain',
  'clientProfile.allergies': 'Allergies',
  'clientProfile.noneRecorded': 'None recorded',
  'clientProfile.inHerOwnWords': 'In her own words',
  'clientProfile.noGoalsYet': 'No goals recorded yet',
  'clientProfile.medicationsCount': 'Medications ({{count}})',
  'clientProfile.medicationFootnote': 'Reference only. Not a medication administration record.',
  'clientProfile.physician': 'Physician',
  'clientProfile.raiseWithPhysician': 'Raise with physician',
  'clientProfile.contacts': 'Contacts',
  'clientProfile.noNotesRecordedYet': 'No notes recorded yet',
  'clientProfile.reviewNote': 'Review note',
  'clientProfile.raisedWithPhysicianOn': 'Raised with physician on {{date}}',
  'clientProfile.whatHappened': 'What happened?',
  'clientProfile.transcribing': 'Transcribing',
  'clientProfile.transcriptionUnavailable': 'Transcription unavailable. Tap to type the note.',
  'clientProfile.needsChecking': 'Needs checking',
  'clientProfile.transitions': 'Transitions',
  'clientProfile.noTransitionsRecorded': 'No transitions recorded',
  'clientProfile.transitionSince': 'Since {{date}}',
  'clientProfile.transitionRecorded': 'Recorded {{date}}',
  'clientProfile.careStage.independent': 'Living independently',
  'clientProfile.careStage.family_supported': 'Supported by family',
  'clientProfile.careStage.professionally_supported': 'Professional care at home',
  'clientProfile.careStage.residential': 'In a care facility',
  'clientProfile.mobility.none': 'None',
  'clientProfile.mobility.stick': 'Walking stick',
  'clientProfile.mobility.frame': 'Walking frame',
  'clientProfile.mobility.wheelchair': 'Wheelchair',
  'clientProfile.outcome.physicianReviewedChange': 'Physician reviewed, change made',
  'clientProfile.outcome.physicianReviewedNoChange': 'Physician reviewed, no change',
  'clientProfile.outcome.raisedNoResponse': 'Raised, no response yet',
  'clientProfile.outcome.notRaised': 'Not raised in the end',
  'clientProfile.visitType.medication': 'Medication',
  'clientProfile.visitType.personalCare': 'Personal care',
  'clientProfile.visitType.socialVisit': 'Social visit',
  'clientProfile.visitType.healthCheck': 'Health check',
  'clientProfile.task.medicationAdministered': 'Medication administered',
  'clientProfile.task.mealSupported': 'Meal supported',
  'clientProfile.task.mobilityAssisted': 'Mobility assisted',
  'clientProfile.task.personalCareAssisted': 'Personal care assisted',
  'clientProfile.task.fluidsEncouraged': 'Fluids encouraged',

  // ---------------------------------------------------------------------
  // baseline — BaselineScreen
  // ---------------------------------------------------------------------
  'baseline.title': 'Baseline',
  'baseline.fieldAge': 'Age',
  'baseline.agePlaceholder': 'Age',
  'baseline.fieldLivesAlone': 'Lives alone',
  'baseline.fieldConditions': 'Long-term conditions',
  'baseline.fieldMobility': 'Mobility aid',
  'baseline.fieldSupport': 'Support already in place',
  'baseline.supportPlaceholder': 'Family visits twice a week',
  'baseline.mobility.none': 'None',
  'baseline.mobility.stick': 'Walking stick',
  'baseline.mobility.frame': 'Walking frame',
  'baseline.mobility.wheelchair': 'Wheelchair',

  // ---------------------------------------------------------------------
  // careStage — CareStageModal
  // ---------------------------------------------------------------------
  'careStage.questionStage': 'What is the situation now?',
  'careStage.questionTiming': 'Roughly when did this change?',
  'careStage.questionNote': 'What changed?',
  'careStage.notePlaceholder': 'Optional',
  'careStage.stage.independent': 'Living independently',
  'careStage.stage.family_supported': 'Supported by family',
  'careStage.stage.professionally_supported': 'Professional care at home',
  'careStage.stage.residential': 'In a care facility',
  'careStage.timing.thisMonth': 'This month',
  'careStage.timing.lastMonth': 'Last month',
  'careStage.timing.twoToThreeMonths': 'Two to three months ago',
  'careStage.timing.longerAgo': 'Longer ago',

  // ---------------------------------------------------------------------
  // escalation — EscalationScreen
  // ---------------------------------------------------------------------
  'escalation.title': 'Raise with physician',
  'escalation.to': 'To {{name}}',
  'escalation.recentNotes': 'Recent notes',
  'escalation.noRecentNotes': 'No recent notes',
  'escalation.noTranscriptYet': '(no transcript yet)',
  'escalation.reason': 'Reason',
  'escalation.reasonPlaceholder': 'What should the physician know?',
  'escalation.reasonRequired': 'Please give a reason',
  'escalation.openEmail': 'Open email',
  'escalation.copySummary': 'Copy summary',
  'escalation.copied': 'Copied',
  'escalation.emailSubject': 'Aethon: {{name}} - physician review requested',
  'escalation.emailCarer': 'Carer: {{name}}',
  'escalation.emailDate': 'Date: {{date}}',
  'escalation.emailReason': 'Reason: {{reason}}',
  'escalation.emailRecentNotesHeading': 'Recent visit notes:',
  'escalation.emailFooterLine1': 'Generated by Aethon, a care coordination tool.',
  'escalation.emailFooterLine2': 'This is not a clinical alerting system. Please reply to the carer.',

  // ---------------------------------------------------------------------
  // noteReview — NoteReviewScreen
  // ---------------------------------------------------------------------
  'noteReview.reviewLabel': 'Check and correct if needed',
  'noteReview.transcriptPlaceholder': 'Type the note',
  'noteReview.addDetail': 'Add detail (optional)',
  'noteReview.visitType': 'Visit type',
  'noteReview.tasks': 'Tasks',
  'noteReview.worthAsking': 'Worth asking about next visit',
  'noteReview.worthAskingCaption':
    'Not an assessment. These are common, usually treatable, and rarely raised by the person themselves.',
  'noteReview.askAboutHearing': 'Ask about hearing',
  'noteReview.askAboutVision': 'Ask about vision',
  'noteReview.askAboutContinence': 'Ask about continence',
  'noteReview.confirmNote': 'Confirm note',
  'noteReview.loadError': 'Could not load this note',

  // ---------------------------------------------------------------------
  // voiceNote — VoiceNoteScreen
  // ---------------------------------------------------------------------
  'voiceNote.transcribedOnDevice': 'Transcribed on this device',
  'voiceNote.startRecording': 'Start recording',
  'voiceNote.stopRecording': 'Stop recording',
  'voiceNote.tapToRecord': 'Tap to record',
  'voiceNote.idleHint': 'Speak normally. Up to two minutes.',
  'voiceNote.tapToStop': 'Tap to stop',
  'voiceNote.noteSaved': 'Note saved',
  'voiceNote.couldNotStart': 'Could not start recording',

  // ---------------------------------------------------------------------
  // observation — ObservationScreen (carer/resident/family modes)
  // ---------------------------------------------------------------------
  'observation.moodCarer': 'Mood',
  'observation.moodResident': 'How are you feeling today?',
  'observation.moodOption': 'Mood {{value}} of 5',
  'observation.sleepCarer': 'Sleep quality',
  'observation.sleepResident': 'How did you sleep?',
  'observation.sleepOption': 'Sleep quality {{value}} of 5',
  'observation.painQuestion': 'Any pain today?',
  'observation.painOption': 'Pain {{value}} of 10',
  'observation.noPainToday': 'No pain today',
  'observation.weight': 'Weight',
  'observation.observationsCarer': 'Observations',
  'observation.observationsResident': 'Anything else?',
  'observation.save': 'Save',
  'observation.saving': 'Saving…',
  'observation.saved': 'Observation saved',

  // ---------------------------------------------------------------------
  // toCheck — ToCheckScreen
  // ---------------------------------------------------------------------
  'toCheck.title': 'To check',
  'toCheck.subtitle': 'Notes and escalations waiting on you',
  'toCheck.loadError': 'Could not load your to-check list',
  'toCheck.nothingToCheck': 'Nothing to check',
  'toCheck.escalationsAwaitingOutcome': 'Escalations awaiting outcome',
  'toCheck.notesWaiting': 'Notes waiting to be checked',
  'toCheck.needsChecking': 'Needs checking',
  'toCheck.transcriptionUnavailable': 'Transcription unavailable. Tap to type the note.',

  // ---------------------------------------------------------------------
  // handover — HandoverScreen + src/lib/handover.ts export text
  // ---------------------------------------------------------------------
  'handover.title': 'Shift handover',
  'handover.ongoing': 'ongoing',
  'handover.timeColumn': 'Time',
  'handover.rangeOngoing': '{{time}} – ongoing',
  'handover.rangeLast12Hours': 'Last 12 hours, since {{time}}',
  'handover.clientsSeen': 'Clients seen',
  'handover.notesRecorded': 'Notes recorded',
  'handover.escalationsOpen': 'Escalations open',
  'handover.noVisitsRecorded': 'No visits recorded this shift',
  'handover.notes': 'Notes',
  'handover.openEscalations': 'Open escalations',
  'handover.footer': 'Care coordination summary. Not an official medical record.',
  'handover.copyAsText': 'Copy as text',
  'handover.copied': 'Copied',
  'handover.exportPdf': 'Export PDF',
  'handover.exporting': 'Exporting…',
  'handover.closeShift': 'Close shift',
  'handover.exportError': 'Could not export PDF',
  'handover.loadError': 'Could not load the handover',
  'handover.visitFallback': 'Visit',
  'handover.pdfTitle': 'Shift handover',
  'handover.pdfClientsSeenHeading': 'Clients seen',
  'handover.pdfNotesHeading': 'Notes',
  'handover.pdfOpenEscalationsHeading': 'Open escalations',

  // ---------------------------------------------------------------------
  // profile — ProfileScreen (carer, now also hosts language settings)
  // ---------------------------------------------------------------------
  'profile.title': 'Profile',
  'profile.language': 'Language',

  // ---------------------------------------------------------------------
  // familyPortal — FamilyPortalScreen
  // ---------------------------------------------------------------------
  'familyPortal.title': 'Family or management',
  'familyPortal.subtitle': 'Please use the web portal',
  'familyPortal.openInSafari': 'Open in Safari',

  // ---------------------------------------------------------------------
  // residentOnboarding — ResidentOnboarding.tsx
  // ---------------------------------------------------------------------
  'residentOnboarding.skip': 'Skip',
  'residentOnboarding.welcomeTitle': 'AETHON',
  'residentOnboarding.welcomeSubtitle': 'Welcome',
  'residentOnboarding.getStarted': 'Get started',
  'residentOnboarding.nameQuestion': 'What is your name?',
  'residentOnboarding.namePlaceholder': 'Your name',
  'residentOnboarding.thatIsMyName': 'That is my name',
  'residentOnboarding.remindersQuestion': 'Shall we remind you about your medication?',
  'residentOnboarding.remindersBody': 'A gentle reminder at the right time each day.',
  'residentOnboarding.yesRemindMe': 'Yes, remind me',
  'residentOnboarding.notNow': 'Not now',
  'residentOnboarding.contactsQuestion': 'Who should we contact if you need help?',
  'residentOnboarding.contactsBody': 'If you use the assistance button, we contact them.',
  'residentOnboarding.emergencyDisclaimer': 'This is not an emergency service. In a medical emergency call {{number}}.',
  'residentOnboarding.theseAreCorrect': 'These are correct',
  'residentOnboarding.goalsQuestion': 'What do you want to keep doing yourself?',
  'residentOnboarding.goalsBody': 'There are no wrong answers.',
  'residentOnboarding.goalPlaceholder1': 'Cook my own dinner',
  'residentOnboarding.goalPlaceholder2': 'Get to the market on Thursdays',
  'residentOnboarding.goalPlaceholder3': 'Look after my own tablets',
  'residentOnboarding.familyCanSee': 'My family can see this',
  'residentOnboarding.doneTitle': 'Aethon is ready',
  'residentOnboarding.openAethon': 'Open Aethon',

  // ---------------------------------------------------------------------
  // residentHome — ResidentHomeScreen.tsx
  // ---------------------------------------------------------------------
  'residentHome.loadError': 'Could not load your home screen',
  'residentHome.medicationsToday': 'Your medications today',
  'residentHome.daysInARow': '{{count}} days in a row',
  'residentHome.allDoneToday': 'All done today',
  'residentHome.medicationFootnote': 'Reference only. Not a medication administration record.',
  'residentHome.takenToday': ', taken today',
  'residentHome.messagesFromFamily': 'Messages from your family',
  'residentHome.noNewMessages': 'No new messages',
  'residentHome.markMessageSeen': 'Mark message from {{name}} as seen',
  'residentHome.howAreYouToday': 'How are you today?',
  'residentHome.moodOption': 'Mood {{value}} of 5',
  'residentHome.thankYou': 'Thank you',
  'residentHome.whatMattersToYou': 'What matters to you',
  'residentHome.iNeedHelp': 'I need help',
  'residentHome.switchView': 'Switch view',
  'residentHome.language': 'Language',

  // ---------------------------------------------------------------------
  // acknowledge — AcknowledgeScreen.tsx
  // ---------------------------------------------------------------------
  'acknowledge.scheduledFor': 'Scheduled for {{time}}',
  'acknowledge.iTookIt': 'I took it',
  'acknowledge.iSkippedIt': 'I skipped it',
  'acknowledge.recorded': 'Recorded',
  'acknowledge.loadError': 'Could not load this medication',

  // ---------------------------------------------------------------------
  // assistance — AssistanceModal.tsx
  // ---------------------------------------------------------------------
  'assistance.title': 'Send a request for help?',
  'assistance.contactLineNight': 'It is night time. We will contact {{name}} now.',
  'assistance.contactLineDay': 'We will contact {{name}} now.',
  'assistance.smallPrint': 'This is not an emergency service. In a medical emergency call {{number}}.',
  'assistance.yesINeedHelp': 'Yes, I need help',
  'assistance.noIAmFine': 'No, I am fine',
  'assistance.close': 'Close',
  'assistance.delivered': 'We have contacted {{name}}.',
  'assistance.notDelivered':
    'We could not reach {{name}} through the app. Please telephone them, or call {{number}} in an emergency.',
} as const
