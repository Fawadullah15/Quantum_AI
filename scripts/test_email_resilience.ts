// Standalone Email Resilience & Template Verification Test
import {
  sendEmailDetailed,
  ADMIN_NOTIFICATION_EMAIL,
  getContactAdminEmailHtml,
  getCareerAdminEmailHtml,
  getPartnershipAdminEmailHtml,
  getGenericAdminEmailHtml,
} from '../lib/email';
import { buildNotificationEmailContent } from '../lib/notifications';

async function runEmailResilienceTests() {
  console.log('================================================================');
  console.log('  QUANTUM AI EMAIL SYSTEM & TEMPLATE RESILIENCE SUITE');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      throw new Error(`Assertion failed for: ${testName}`);
    }
  }

  // 1. Recipient Target Verification
  console.log('[Test Group 1: Configuration & Recipient Targets]');
  assert(ADMIN_NOTIFICATION_EMAIL === 'quantumai.cmp@gmail.com', 'ADMIN_NOTIFICATION_EMAIL defaults strictly to quantumai.cmp@gmail.com');

  // 2. Unconfigured / Missing Credentials Graceful Handling
  console.log('\n[Test Group 2: Graceful Error Handling on Missing Transport]');
  const unconfiguredResult = await sendEmailDetailed({
    to: 'quantumai.cmp@gmail.com',
    subject: '[Test] Graceful Failure Test',
    html: '<p>Testing non-crashing behavior without transport credentials</p>',
  });
  assert(unconfiguredResult.success === false, 'Returns success: false when no credentials are present');
  assert(unconfiguredResult.status === 'FAILED', 'Returns status: "FAILED"');
  assert(typeof unconfiguredResult.error === 'string' && unconfiguredResult.error.length > 0, 'Provides descriptive error message for admin panel');
  assert(unconfiguredResult.error?.includes('GMAIL_USER') || unconfiguredResult.error?.includes('RESEND_API_KEY'), 'Diagnostic mentions required environment variables');

  // 3. Contact Form HTML Template & Content Builder
  console.log('\n[Test Group 3: Contact Form Email Content & Template]');
  const contactParams = {
    type: 'CONTACT',
    title: 'New Contact Message from Arthur Pendelton',
    senderName: 'Arthur Pendelton',
    senderEmail: 'arthur@pendelton-dynamics.com',
    preview: 'Interested in partnering on quantum financial forecasting systems.',
    details: {
      name: 'Arthur Pendelton',
      email: 'arthur@pendelton-dynamics.com',
      phone: '+1 800 555 0199',
      company: 'Pendelton Dynamics',
      projectType: 'Quantum Algorithm Optimization',
      budget: '$100,000+',
      message: 'Interested in partnering on quantum financial forecasting systems.',
    },
  };
  const contactBuilt = buildNotificationEmailContent(contactParams);
  assert(contactBuilt.subject.includes('[Quantum AI] New Contact Message'), 'Contact subject contains proper prefix and name');
  assert(contactBuilt.html.includes('Arthur Pendelton'), 'Contact HTML contains sender name');
  assert(contactBuilt.html.includes('arthur@pendelton-dynamics.com'), 'Contact HTML contains sender email');
  assert(contactBuilt.html.includes('Pendelton Dynamics'), 'Contact HTML contains company name');
  assert(contactBuilt.html.includes('Quantum Algorithm Optimization'), 'Contact HTML contains project type');
  assert(contactBuilt.html.includes('$100,000+'), 'Contact HTML contains budget');
  assert(contactBuilt.html.includes('Quantum AI Central Email Dispatch'), 'Contact HTML has branded Quantum AI footer');

  // 4. Career Application HTML Template & Content Builder
  console.log('\n[Test Group 4: Career Application Email Content & Template]');
  const careerParams = {
    type: 'CAREER',
    title: 'New Career Application: Dr. Elena Rostova',
    senderName: 'Dr. Elena Rostova',
    senderEmail: 'elena@quantumai-test.dev',
    preview: '10+ years specializing in quantum circuits and quantum error correction.',
    referenceId: 'QA-CAR-4402',
    details: {
      referenceId: 'QA-CAR-4402',
      fullName: 'Dr. Elena Rostova',
      email: 'elena@quantumai-test.dev',
      phone: '+44 20 7946 0912',
      currentLocation: 'London, UK (Remote/Relocation)',
      position: 'Staff Quantum Software Engineer',
      experienceLevel: 'Staff / Principal (10+ yrs)',
      workType: 'Full Time',
      skills: 'Qiskit, Cirq, Rust, PyTorch, CUDA-Q',
      introduction: '10+ years specializing in quantum circuits and quantum error correction.',
      whyQuantumAI: 'Quantum AI is the global forefront of high-performance quantum algorithms.',
      linkedinUrl: 'https://linkedin.com/in/elena-rostova-test',
      portfolioUrl: 'https://elena-rostova.dev',
      resumeUrl: 'https://blob.vercel-storage.com/cv-elena-rostova.pdf',
    },
  };
  const careerBuilt = buildNotificationEmailContent(careerParams);
  assert(careerBuilt.subject.includes('[Quantum AI] New Career Application'), 'Career subject contains prefix');
  assert(careerBuilt.subject.includes('QA-CAR-4402'), 'Career subject contains reference ID');
  assert(careerBuilt.html.includes('Staff Quantum Software Engineer'), 'Career HTML contains position title');
  assert(careerBuilt.html.includes('Qiskit, Cirq, Rust'), 'Career HTML contains candidate skills');
  assert(careerBuilt.html.includes('cv-elena-rostova.pdf'), 'Career HTML contains CV/Resume link');
  assert(careerBuilt.html.includes('https://linkedin.com/in/elena-rostova-test'), 'Career HTML contains LinkedIn URL');

  // 5. Partnership Application HTML Template & Content Builder
  console.log('\n[Test Group 5: Partnership Application Email Content & Template]');
  const partnerParams = {
    type: 'PARTNERSHIP',
    title: 'New Partnership: Quantum Compute Alliance',
    senderName: 'Marcus Vance',
    senderEmail: 'marcus@nexar-quantum.io',
    preview: 'Strategic joint development proposal for hybrid AI algorithms.',
    referenceId: 'QA-PTR-9931',
    details: {
      referenceId: 'QA-PTR-9931',
      fullName: 'Marcus Vance',
      email: 'marcus@nexar-quantum.io',
      phone: '+1 (415) 555-0144',
      company: 'Nexar Quantum Systems',
      website: 'https://nexar-quantum.io',
      country: 'United States',
      partnershipType: 'Technology Integration Partnership',
      subject: 'Quantum Compute Alliance',
      message: 'Strategic joint development proposal for hybrid AI algorithms.',
      budgetRange: '$500,000 - $1,000,000',
      preferredContactMethod: 'Encrypted Email / Video Conference',
      attachmentUrl: 'https://blob.vercel-storage.com/nexar-proposal.pdf',
    },
  };
  const partnerBuilt = buildNotificationEmailContent(partnerParams);
  assert(partnerBuilt.subject.includes('[Quantum AI] New Partnership Application'), 'Partnership subject contains prefix');
  assert(partnerBuilt.subject.includes('QA-PTR-9931'), 'Partnership subject contains reference ID');
  assert(partnerBuilt.html.includes('Nexar Quantum Systems'), 'Partnership HTML contains company');
  assert(partnerBuilt.html.includes('Technology Integration Partnership'), 'Partnership HTML contains partnership type');
  assert(partnerBuilt.html.includes('nexar-proposal.pdf'), 'Partnership HTML contains attachment link');
  assert(partnerBuilt.html.includes('$500,000 - $1,000,000'), 'Partnership HTML contains budget range');

  console.log('\n================================================================');
  console.log(`  ALL ${passedTests}/${totalTests} RESILIENCE & TEMPLATE TESTS PASSED!`);
  console.log('================================================================\n');
}

runEmailResilienceTests().catch((e) => {
  console.error('Test suite failed:', e);
  process.exit(1);
});
