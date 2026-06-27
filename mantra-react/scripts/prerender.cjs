const fs = require('fs');
const path = require('path');

const distPath = path.resolve(__dirname, '../dist');
const indexPath = path.resolve(distPath, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('Error: dist/index.html does not exist. Run vite build first.');
  process.exit(1);
}

const template = fs.readFileSync(indexPath, 'utf8');

const pages = [
  {
    route: 'privacy',
    title: 'Mantra Novels - Privacy Policy',
    description: 'Read the Privacy Policy of Mantra Novels, DPDP Act 2023 compliant. Learn how we collect, process, and protect your personal data.',
    body: `
      <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 3rem 1.5rem; color: #F3F4F6; background-color: #0B0F19; line-height: 1.75; box-sizing: border-box;">
        <h1 style="font-size: 2.25rem; font-weight: 800; color: #F9FAFB; margin-top: 0; margin-bottom: 0.5rem; border-bottom: 1px solid #1F2937; padding-bottom: 1rem;">Privacy Policy</h1>
        <p style="font-size: 0.875rem; color: #9CA3AF; margin-bottom: 2rem;">DPDP Act 2023 Compliant &bull; Last Updated: January 30, 2026</p>
        
        <div style="background-color: #111827; border: 1px solid #1F2937; border-radius: 1rem; padding: 1.25rem; margin-bottom: 2rem;">
          <p style="margin: 0; font-size: 0.95rem;">This Privacy Policy complies with the <strong>Digital Personal Data Protection Act, 2023</strong> (DPDP Act) of India.</p>
        </div>

        <h2 style="font-size: 1.5rem; font-weight: 700; color: #F9FAFB; margin-top: 2rem; margin-bottom: 1rem;">1. Data Fiduciary Information</h2>
        <p><strong>Mantra Novels</strong> is the Data Fiduciary for your personal data. You can contact us for any privacy inquiries at:</p>
        <p>Email: <a href="mailto:privacy@mantranovels.com" style="color: #0EA5E9; text-decoration: none;">privacy@mantranovels.com</a></p>

        <h2 style="font-size: 1.5rem; font-weight: 700; color: #F9FAFB; margin-top: 2rem; margin-bottom: 1rem;">2. Personal Data We Collect</h2>
        <p>We collect and process the following categories of personal data in connection with your platform usage:</p>
        <ul style="padding-left: 1.5rem; margin-bottom: 1.5rem;">
          <li style="margin-bottom: 0.5rem;"><strong>Account Registration Details:</strong> Username, email address, password hash, and date of birth (for age verification).</li>
          <li style="margin-bottom: 0.5rem;"><strong>Reader Activity Data:</strong> Bookmark records, reading history, comments, and general platform interaction.</li>
          <li style="margin-bottom: 0.5rem;"><strong>Author Payout Details:</strong> Stellar wallet addresses, transaction history, and payout records.</li>
          <li style="margin-bottom: 0.5rem;"><strong>Device and Technical Information:</strong> IP addresses, browser types, device information, and security logs.</li>
        </ul>

        <h2 style="font-size: 1.5rem; font-weight: 700; color: #F9FAFB; margin-top: 2rem; margin-bottom: 1rem;">3. Purposes of Processing</h2>
        <p>We process your personal data under consent or legitimate uses for the following purposes:</p>
        <ul style="padding-left: 1.5rem; margin-bottom: 1.5rem;">
          <li>Providing and maintaining platform reading services.</li>
          <li>Managing creator monetization accounts and coordinating payouts.</li>
          <li>Monitoring and ensuring platform security and child safety.</li>
          <li>Resolving grievances and complying with legal obligations.</li>
        </ul>

        <h2 style="font-size: 1.5rem; font-weight: 700; color: #F9FAFB; margin-top: 2rem; margin-bottom: 1rem;">4. Your Rights (Data Principal Rights)</h2>
        <p>Under the DPDP Act 2023, you hold key rights regarding your personal data:</p>
        <ul style="padding-left: 1.5rem; margin-bottom: 1.5rem;">
          <li><strong>Right to Access:</strong> Request a summary of personal data held by us.</li>
          <li><strong>Right to Correction & Erasure:</strong> Correct, update, or request deletion of your personal data.</li>
          <li><strong>Right to Grievance Redressal:</strong> File complaints with our Grievance Redressal Officer.</li>
          <li><strong>Right to Withdraw Consent:</strong> Revoke consent for processing at any time.</li>
        </ul>

        <h2 style="font-size: 1.5rem; font-weight: 700; color: #F9FAFB; margin-top: 2rem; margin-bottom: 1rem;">5. Children's Privacy Guidelines</h2>
        <p>Mantra Novels enforces strict safety policies. You must be at least 13 years old to create a general account, and 18+ to access Mature rating content. Parents or legal guardians may contact us to request the erasure of minor data collected inadvertently.</p>
      </div>
    `
  },
  {
    route: 'terms',
    title: 'Mantra Novels - Terms of Service',
    description: 'Read the Terms of Service for Mantra Novels. Learn about eligibility, user-generated content, creator monetization in Stellar Lumens (XLM), and guidelines.',
    body: `
      <div style="font-family: 'Inter', sans-serif; max-width: 800px; margin: 0 auto; padding: 3rem 1.5rem; color: #F3F4F6; background-color: #0B0F19; line-height: 1.75; box-sizing: border-box;">
        <h1 style="font-size: 2.25rem; font-weight: 800; color: #F9FAFB; margin-top: 0; margin-bottom: 0.5rem; border-bottom: 1px solid #1F2937; padding-bottom: 1rem;">Terms of Service</h1>
        <p style="font-size: 0.875rem; color: #9CA3AF; margin-bottom: 2rem;">Last Updated: January 30, 2026</p>
        
        <p>Welcome to Mantra Novels. By accessing or using our platform, you agree to comply with and be bound by these Terms of Service. Please read them carefully.</p>

        <h2 style="font-size: 1.5rem; font-weight: 700; color: #F9FAFB; margin-top: 2rem; margin-bottom: 1rem;">1. Eligibility Requirements</h2>
        <p>To use Mantra Novels services, you must fulfill the following criteria:</p>
        <ul style="padding-left: 1.5rem; margin-bottom: 1.5rem;">
          <li>Be at least 13 years old for general platform access.</li>
          <li>Be at least 18 years old to access Mature (18+) content.</li>
          <li>Be at least 18 years old to participate in the author monetization program.</li>
          <li>Possess full legal capability to enter into a binding contract.</li>
        </ul>

        <h2 style="font-size: 1.5rem; font-weight: 700; color: #F9FAFB; margin-top: 2rem; margin-bottom: 1rem;">2. Account Creation & Security</h2>
        <p>You must provide accurate and complete registration data. You are solely responsible for protecting your account credentials and for all activities that occur under your account. Multiple accounts per person are prohibited.</p>

        <h2 style="font-size: 1.5rem; font-weight: 700; color: #F9FAFB; margin-top: 2rem; margin-bottom: 1rem;">3. User Content & Licensing</h2>
        <p>Authors retain ownership of all stories and chapters published on Mantra Novels. However, by submitting content, you grant us a worldwide, non-exclusive, royalty-free license to host, format, display, promote, and distribute your content across our platform.</p>

        <h2 style="font-size: 1.5rem; font-weight: 700; color: #F9FAFB; margin-top: 2rem; margin-bottom: 1rem;">4. Creator Monetization Guidelines</h2>
        <p>Authors can choose to monetize their publications. Payments are calculated based on user readership metrics and advertising revenue share. Withdrawals are processed in Stellar Lumens (XLM) cryptocurrency. The minimum withdrawal threshold is 10 XLM. Cryptocurrency values are subject to market volatility.</p>

        <h2 style="font-size: 1.5rem; font-weight: 700; color: #F9FAFB; margin-top: 2rem; margin-bottom: 1rem;">5. Prohibited Conduct</h2>
        <p>Users must not engage in copyright violations, plagiarism, harassment, system manipulation (including artificial view/vote inflation), botting, or sharing explicit or illegal content involving minors. Violations will result in permanent account suspension.</p>
      </div>
    `
  },
  {
    route: 'faq',
    title: 'Mantra Novels - Frequently Asked Questions (FAQ)',
    description: 'Find answers to common questions about reading, publishing, voting in contests, and earning on Mantra Novels.',
    body: `
      <div style="font-family: 'Inter', sans-serif; max-width: 800px; margin: 0 auto; padding: 3rem 1.5rem; color: #F3F4F6; background-color: #0B0F19; line-height: 1.75; box-sizing: border-box;">
        <h1 style="font-size: 2.25rem; font-weight: 800; color: #F9FAFB; margin-top: 0; margin-bottom: 0.5rem; border-bottom: 1px solid #1F2937; padding-bottom: 1rem;">Frequently Asked Questions (FAQ)</h1>
        <p style="font-size: 0.875rem; color: #9CA3AF; margin-bottom: 2rem;">Help Center &bull; Frequently Asked Questions</p>

        <h2 style="font-size: 1.35rem; font-weight: 700; color: #F9FAFB; margin-top: 2rem; margin-bottom: 0.5rem;">Q: What is Mantra Novels?</h2>
        <p>Mantra Novels is a digital publishing and reading community connecting independent authors and avid readers. We focus on providing premium tools for novelists to share and monetize their work.</p>

        <h2 style="font-size: 1.35rem; font-weight: 700; color: #F9FAFB; margin-top: 2rem; margin-bottom: 0.5rem;">Q: Can I read stories for free?</h2>
        <p>Yes! Mantra Novels offers thousands of chapters that are completely free to read. You can browse rankings, add stories to your library, and rate chapters to support creators.</p>

        <h2 style="font-size: 1.35rem; font-weight: 700; color: #F9FAFB; margin-top: 2rem; margin-bottom: 0.5rem;">Q: How can I write and publish my own novel?</h2>
        <p>Create an account, navigate to the Author Dashboard, and click "Create Novel". Fill in your details (title, cover, genres, synopsis) and publish your first chapter. It will instantly become visible in our "New Arrivals" and search catalog.</p>

        <h2 style="font-size: 1.35rem; font-weight: 700; color: #F9FAFB; margin-top: 2rem; margin-bottom: 0.5rem;">Q: How do authors earn on the platform?</h2>
        <p>Mantra Novels operates a creator monetization program. Authors earn revenue from chapter view metrics and ad revenue share, which is paid out in Stellar Lumens (XLM) to their linked crypto wallets.</p>
      </div>
    `
  },
  {
    route: 'contact',
    title: 'Mantra Novels - Contact Us',
    description: 'Get in touch with the Mantra Novels team. Reach out for general inquiries, technical support, author monetization, or report issues.',
    body: `
      <div style="font-family: 'Inter', sans-serif; max-width: 800px; margin: 0 auto; padding: 3rem 1.5rem; color: #F3F4F6; background-color: #0B0F19; line-height: 1.75; box-sizing: border-box;">
        <h1 style="font-size: 2.25rem; font-weight: 800; color: #F9FAFB; margin-top: 0; margin-bottom: 0.5rem; border-bottom: 1px solid #1F2937; padding-bottom: 1rem;">Contact Us</h1>
        <p style="font-size: 0.875rem; color: #9CA3AF; margin-bottom: 2rem;">Customer Support & Inquiries</p>

        <p>If you have any questions, require technical support, need assistance with your author dashboard, or want to report platform issues, please contact us. Our team responds to most requests within 24 to 48 hours.</p>

        <h2 style="font-size: 1.5rem; font-weight: 700; color: #F9FAFB; margin-top: 2rem; margin-bottom: 1rem;">Support Channels</h2>
        <ul style="padding-left: 1.5rem; margin-bottom: 1.5rem;">
          <li style="margin-bottom: 0.75rem;"><strong>General Support:</strong> For standard questions, bug reports, and account help, email <a href="mailto:support@mantranovels.com" style="color: #0EA5E9; text-decoration: none;">support@mantranovels.com</a></li>
          <li style="margin-bottom: 0.75rem;"><strong>Privacy Concerns:</strong> For DPDP Act data rights, erasure requests, or cookies inquiries, email <a href="mailto:privacy@mantranovels.com" style="color: #0EA5E9; text-decoration: none;">privacy@mantranovels.com</a></li>
          <li style="margin-bottom: 0.75rem;"><strong>Copyright Infringement:</strong> To submit copyright or DMCA violation claims, email <a href="mailto:copyright@mantranovels.com" style="color: #0EA5E9; text-decoration: none;">copyright@mantranovels.com</a></li>
        </ul>
      </div>
    `
  },
  {
    route: 'dmca',
    title: 'Mantra Novels - DMCA Copyright Policy',
    description: 'Read the DMCA Copyright Policy for Mantra Novels. Learn how to submit copyright infringement notices and how we protect intellectual property.',
    body: `
      <div style="font-family: 'Inter', sans-serif; max-width: 800px; margin: 0 auto; padding: 3rem 1.5rem; color: #F3F4F6; background-color: #0B0F19; line-height: 1.75; box-sizing: border-box;">
        <h1 style="font-size: 2.25rem; font-weight: 800; color: #F9FAFB; margin-top: 0; margin-bottom: 0.5rem; border-bottom: 1px solid #1F2937; padding-bottom: 1rem;">DMCA Copyright Policy</h1>
        <p style="font-size: 0.875rem; color: #9CA3AF; margin-bottom: 2rem;">Digital Millennium Copyright Act Notice</p>

        <p>Mantra Novels respects the intellectual property rights of others. In accordance with the DMCA, we respond quickly to clear notices of alleged copyright infringement.</p>

        <h2 style="font-size: 1.5rem; font-weight: 700; color: #F9FAFB; margin-top: 2rem; margin-bottom: 1rem;">Filing a DMCA Infringement Claim</h2>
        <p>If you believe content hosted on our platform infringes your copyright, please send a written claim to our Designated Copyright Agent at <strong>copyright@mantranovels.com</strong>.</p>
        <p>Your notification must include the following details:</p>
        <ul style="padding-left: 1.5rem; margin-bottom: 1.5rem;">
          <li>A physical or electronic signature of the copyright owner or authorized agent.</li>
          <li>Clear identification of the copyrighted work claimed to have been infringed.</li>
          <li>Exact location of the infringing material on our platform (such as the specific URL link to the novel or chapter).</li>
          <li>Your contact details including mailing address, phone number, and email.</li>
          <li>A statement of good faith belief that the disputed use is not authorized by the owner or the law.</li>
          <li>A statement under penalty of perjury that the info provided is accurate.</li>
        </ul>
      </div>
    `
  },
  {
    route: 'cookies',
    title: 'Mantra Novels - Cookie Policy',
    description: 'Read the Cookie Policy of Mantra Novels. Learn how we use cookies to personalize content, analyze traffic, and enhance your reading experience.',
    body: `
      <div style="font-family: 'Inter', sans-serif; max-width: 800px; margin: 0 auto; padding: 3rem 1.5rem; color: #F3F4F6; background-color: #0B0F19; line-height: 1.75; box-sizing: border-box;">
        <h1 style="font-size: 2.25rem; font-weight: 800; color: #F9FAFB; margin-top: 0; margin-bottom: 0.5rem; border-bottom: 1px solid #1F2937; padding-bottom: 1rem;">Cookie Policy</h1>
        <p style="font-size: 0.875rem; color: #9CA3AF; margin-bottom: 2rem;">Last Updated: January 30, 2026</p>

        <p>Mantra Novels uses cookies and similar storage technologies to support platform operations, analyze traffic statistics, and deliver targeted advertising through networks like Google AdSense.</p>

        <h2 style="font-size: 1.5rem; font-weight: 700; color: #F9FAFB; margin-top: 2rem; margin-bottom: 1rem;">How We Use Cookies</h2>
        <ul style="padding-left: 1.5rem; margin-bottom: 1.5rem;">
          <li style="margin-bottom: 0.75rem;"><strong>Essential Cookies:</strong> Critical cookies required to handle user session login status and secure authentication.</li>
          <li style="margin-bottom: 0.75rem;"><strong>Analytical Cookies:</strong> Used to track platform performance metrics, page load speeds, and popular pages to improve user experience.</li>
          <li style="margin-bottom: 0.75rem;"><strong>Advertising Cookies:</strong> Cookies used by networks like Google AdSense to personalize ads and evaluate ad campaigns.</li>
        </ul>
      </div>
    `
  },
  {
    route: 'content-policy',
    title: 'Mantra Novels - Content Guidelines',
    description: 'Read the Content Policy and Publishing Guidelines for Mantra Novels. Learn what content is allowed, age rating rules, and community standards.',
    body: `
      <div style="font-family: 'Inter', sans-serif; max-width: 800px; margin: 0 auto; padding: 3rem 1.5rem; color: #F3F4F6; background-color: #0B0F19; line-height: 1.75; box-sizing: border-box;">
        <h1 style="font-size: 2.25rem; font-weight: 800; color: #F9FAFB; margin-top: 0; margin-bottom: 0.5rem; border-bottom: 1px solid #1F2937; padding-bottom: 1rem;">Content Guidelines & Policy</h1>
        <p style="font-size: 0.875rem; color: #9CA3AF; margin-bottom: 2rem;">Platform Publishing Standards</p>

        <p>To ensure a high-quality reading experience and maintain community safety, all novels, chapters, comments, and profile information published on Mantra Novels must comply with these guidelines.</p>

        <h2 style="font-size: 1.5rem; font-weight: 700; color: #F9FAFB; margin-top: 2rem; margin-bottom: 1rem;">Allowed & Encouraged Content</h2>
        <p>We welcome original stories, including web fictions, light novels, and serialized books across all popular genres (Fantasy, Romance, Wuxia, Sci-Fi, System, Adventure, and Action).</p>

        <h2 style="font-size: 1.5rem; font-weight: 700; color: #F9FAFB; margin-top: 2rem; margin-bottom: 1rem;">Prohibited Content Types</h2>
        <ul style="padding-left: 1.5rem; margin-bottom: 1.5rem;">
          <li style="margin-bottom: 0.5rem;"><strong>Plagiarism:</strong> Uploading or copying works that you do not own or hold licenses to distribute.</li>
          <li style="margin-bottom: 0.5rem;"><strong>Violence & Hate:</strong> Story content promoting hate speech or depicting excessive violence.</li>
          <li style="margin-bottom: 0.5rem;"><strong>Illegal Activities:</strong> Content depicting or facilitating fraud, illegal transactions, or scams.</li>
          <li style="margin-bottom: 0.5rem;"><strong>Child Exploitation:</strong> Sexual depiction of minors is strictly banned and reported instantly.</li>
        </ul>
      </div>
    `
  },
  {
    route: 'acceptable-use',
    title: 'Mantra Novels - Acceptable Use Policy',
    description: 'Read the Acceptable Use Policy for Mantra Novels. Learn about restricted behaviors, platform integrity, and usage guidelines.',
    body: `
      <div style="font-family: 'Inter', sans-serif; max-width: 800px; margin: 0 auto; padding: 3rem 1.5rem; color: #F3F4F6; background-color: #0B0F19; line-height: 1.75; box-sizing: border-box;">
        <h1 style="font-size: 2.25rem; font-weight: 800; color: #F9FAFB; margin-top: 0; margin-bottom: 0.5rem; border-bottom: 1px solid #1F2937; padding-bottom: 1rem;">Acceptable Use Policy</h1>
        <p style="font-size: 0.875rem; color: #9CA3AF; margin-bottom: 2rem;">Platform Usage Terms</p>

        <p>This Acceptable Use Policy specifies rules governing what is allowed when interacting with Mantra Novels services, databases, and website pages.</p>

        <h2 style="font-size: 1.5rem; font-weight: 700; color: #F9FAFB; margin-top: 2rem; margin-bottom: 1rem;">System Integrity</h2>
        <p>You agree not to bypass security protections, distribute spyware or malware, use unauthorized scraping scripts, or overwhelm our hosting bandwidth. Any attempt to artificially manipulate views, reviews, ratings, or contest votes is strictly prohibited.</p>
      </div>
    `
  },
  {
    route: 'child-safety',
    title: 'Mantra Novels - Child Safety Policy',
    description: 'Read the Child Safety Policy for Mantra Novels. Learn how we protect minors, age verification rules, and report violations.',
    body: `
      <div style="font-family: 'Inter', sans-serif; max-width: 800px; margin: 0 auto; padding: 3rem 1.5rem; color: #F3F4F6; background-color: #0B0F19; line-height: 1.75; box-sizing: border-box;">
        <h1 style="font-size: 2.25rem; font-weight: 800; color: #F9FAFB; margin-top: 0; margin-bottom: 0.5rem; border-bottom: 1px solid #1F2937; padding-bottom: 1rem;">Child Safety Policy</h1>
        <p style="font-size: 0.875rem; color: #9CA3AF; margin-bottom: 2rem;">Protecting Minors and Young Readers</p>

        <p>Mantra Novels maintains a strictly controlled reading environment to protect children and minors. We enforce strict policies to ensure minor safety.</p>

        <h2 style="font-size: 1.5rem; font-weight: 700; color: #F9FAFB; margin-top: 2rem; margin-bottom: 1rem;">Enforcement Protocols</h2>
        <p>Users must confirm they are at least 13 years old to register. Content rated 18+ (Mature) is locked behind a strict age validation overlay. We maintain zero tolerance for any content depicting or facilitating child abuse, exploitation, or grooming. If we detect violations, accounts are terminated and reported to global child safety organizations and law enforcement.</p>
      </div>
    `
  },
  {
    route: 'grievance-redressal',
    title: 'Mantra Novels - Grievance Redressal',
    description: 'Contact our Grievance Redressal Officer at Mantra Novels. Submit complaints regarding content, privacy, security, or DPDP Act compliance.',
    body: `
      <div style="font-family: 'Inter', sans-serif; max-width: 800px; margin: 0 auto; padding: 3rem 1.5rem; color: #F3F4F6; background-color: #0B0F19; line-height: 1.75; box-sizing: border-box;">
        <h1 style="font-size: 2.25rem; font-weight: 800; color: #F9FAFB; margin-top: 0; margin-bottom: 0.5rem; border-bottom: 1px solid #1F2937; padding-bottom: 1rem;">Grievance Redressal</h1>
        <p style="font-size: 0.875rem; color: #9CA3AF; margin-bottom: 2rem;">Complaints Desk (DPDP Act 2023 Compliant)</p>

        <p>Under the Digital Personal Data Protection Act, 2023 (DPDP Act), and other applicable guidelines, Mantra Novels has set up a dedicated Grievance Officer to process and address user complaints.</p>

        <h2 style="font-size: 1.5rem; font-weight: 700; color: #F9FAFB; margin-top: 2rem; margin-bottom: 1rem;">How to Submit a Grievance</h2>
        <p>If you have any complaints regarding data misuse, privacy violations, offensive user content, or system issues, please reach out to our Grievance Desk:</p>
        <p>Email: <a href="mailto:grievances@mantranovels.com" style="color: #0EA5E9; text-decoration: none;">grievances@mantranovels.com</a></p>
        <p>We confirm receipt of all filed complaints within 24 hours and investigate/resolve them within the legally mandated time frame (maximum 15 days).</p>
      </div>
    `
  },
  {
    route: 'ranking',
    title: 'Mantra Novels - Story Rankings & Leaderboard',
    description: 'Check out the daily and weekly rankings of the best web novels on Mantra. Find the most popular stories voted by readers.',
    body: `
      <div style="font-family: 'Inter', sans-serif; max-width: 800px; margin: 0 auto; padding: 3rem 1.5rem; color: #F3F4F6; background-color: #0B0F19; line-height: 1.75; box-sizing: border-box;">
        <h1 style="font-size: 2.25rem; font-weight: 800; color: #F9FAFB; margin-top: 0; margin-bottom: 0.5rem; border-bottom: 1px solid #1F2937; padding-bottom: 1rem;">Story Rankings</h1>
        <p style="font-size: 0.875rem; color: #9CA3AF; margin-bottom: 2rem;">Trending Web Novels and Leaderboards</p>

        <p>Discover the top stories and web novels voted by readers in the Mantra Novels community. Read daily chapters, track trending statistics, and vote for your favorite stories.</p>

        <h2 style="font-size: 1.5rem; font-weight: 700; color: #F9FAFB; margin-top: 2rem; margin-bottom: 1rem;">Weekly Leaderboard standings</h2>
        <p>Our dynamic leaderboard tracks trending stories based on views, reader votes, and contest activity. Check back daily to see updates and support independent writers by reading their books.</p>
      </div>
    `
  }
];

// Load and append static blog pages dynamically for SEO pre-rendering
try {
  const blogsData = require('../src/data/blogsData.json');
  const blogs = blogsData.blogs;

  const getBlogImage = (id) => {
    const imagesPool = [
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop&q=80", // Fountain pen
      "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800&auto=format&fit=crop&q=80", // Magical book
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=80", // Celestial book
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&auto=format&fit=crop&q=80", // Library
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80", // Typewriter
      "https://images.unsplash.com/photo-1516414447565-b14be0adf13e?w=800&auto=format&fit=crop&q=80", // Vintage journal
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&auto=format&fit=crop&q=80", // Cozy library
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80", // Book close up
      "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=800&auto=format&fit=crop&q=80", // Reading outside
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80", // Starlit mountain
      "https://images.unsplash.com/photo-1513001900722-370f803f498d?w=800&auto=format&fit=crop&q=80", // Sky clouds
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80", // Gold gradient
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop&q=80", // Blockchain
      "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&auto=format&fit=crop&q=80", // Stellar coins
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80", // Cyber/tech
      "https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=800&auto=format&fit=crop&q=80", // Ethereal temple
      "https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=800&auto=format&fit=crop&q=80", // Cultivation valley
      "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80", // Forest
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80", // Cosmic vortex
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80", // Trees light rays
      "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800&auto=format&fit=crop&q=80", // Mountain peak
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&auto=format&fit=crop&q=80", // Abstract art
      "https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=800&auto=format&fit=crop&q=80", // Crypto waves
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80", // Charts dashboard
      "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80", // Digital net grid
      "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&auto=format&fit=crop&q=80", // Team work
      "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&auto=format&fit=crop&q=80", // Cafe friends
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80", // Coworkers
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80", // Celebration
      "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=80", // Hearts shape hands
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop&q=80", // Blogging laptop
      "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&auto=format&fit=crop&q=80", // Keyboard coding
      "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&auto=format&fit=crop&q=80", // Reading students
      "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=800&auto=format&fit=crop&q=80", // Sit outdoor reading
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80", // Books piles
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&auto=format&fit=crop&q=80"  // Opened book glow
    ];
    const charSum = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return imagesPool[charSum % imagesPool.length];
  };
  
  // 1. Append the main Blogs list page
  pages.push({
    route: 'blogs',
    title: 'Mantra Blogs - Web Novel Writing Guides & Recommendations',
    description: 'Explore writing tutorials, wuxia cultivation rank guides, litrpg progression tips, novel recommendations, and creator updates on Mantra Novels.',
    body: `
      <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 900px; margin: 0 auto; padding: 3rem 1.5rem; color: #F3F4F6; background-color: #0B0F19; line-height: 1.75; box-sizing: border-box;">
        <h1 style="font-size: 2.25rem; font-weight: 800; color: #F9FAFB; margin-top: 0; margin-bottom: 0.5rem; border-bottom: 1px solid #1F2937; padding-bottom: 1rem;">Mantra Novels Blog</h1>
        <p style="font-size: 1.125rem; color: #9CA3AF; margin-bottom: 2rem;">Writing tutorials, cultivation guides, and recommendations.</p>
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          ${blogs.map(post => `
            <div style="border: 1px solid #1F2937; border-radius: 1rem; padding: 1.5rem; background-color: #111827; display: flex; flex-direction: column; gap: 1rem; overflow: hidden;">
              <img src="${getBlogImage(post.id)}" alt="" style="width: 100%; height: 200px; object-fit: cover;" />
              <div style="padding: 0 0.5rem;">
                <span style="font-size: 0.75rem; color: #0EA5E9; font-weight: bold; text-transform: uppercase;">${post.category}</span>
                <h2 style="font-size: 1.5rem; font-weight: 700; margin: 0.5rem 0;"><a href="/blog/${post.id}" style="color: #F9FAFB; text-decoration: none;">${post.title}</a></h2>
                <p style="font-size: 0.875rem; color: #9CA3AF; margin-bottom: 1rem;">${post.description}</p>
                <a href="/blog/${post.id}" style="color: #0EA5E9; text-decoration: none; font-size: 0.875rem; font-weight: bold;">Read Article &rarr;</a>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `
  });

  // 2. Append each individual Blog detail page
  blogs.forEach(post => {
    pages.push({
      route: `blog/${post.id}`,
      title: `${post.title} | Mantra Blog`,
      description: post.description,
      body: `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 3rem 1.5rem; color: #F3F4F6; background-color: #0B0F19; line-height: 1.75; box-sizing: border-box;">
          <a href="/blogs" style="color: #0EA5E9; text-decoration: none; font-size: 0.875rem; font-weight: bold;">&larr; Back to Blogs</a>
          <div style="margin-top: 1.5rem; margin-bottom: 2rem;">
            <span style="font-size: 0.75rem; color: #0EA5E9; font-weight: bold; text-transform: uppercase; border: 1px solid rgba(14,165,233,0.3); padding: 0.25rem 0.5rem; border-radius: 0.25rem;">${post.category}</span>
            <h1 style="font-size: 2.25rem; font-weight: 800; color: #F9FAFB; margin-top: 1rem; margin-bottom: 0.5rem; line-height: 1.2;">${post.title}</h1>
            <p style="font-size: 0.875rem; color: #9CA3AF; margin: 0.5rem 0;">Published by <strong>${post.author}</strong> on <strong>${post.publishDate}</strong> &bull; ${post.readTime}</p>
          </div>
          <div style="width: 100%; height: 320px; margin-bottom: 2rem; border-radius: 1rem; overflow: hidden;">
            <img src="${getBlogImage(post.id)}" alt="" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <hr style="border-color: #1F2937; margin-bottom: 2rem;" />
          <div style="font-size: 1rem; color: #D1D5DB; line-height: 1.8;">
            ${post.content}
          </div>
          <div style="margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #1F2937;">
            <p style="font-size: 0.875rem; color: #9CA3AF;">Tags: ${post.tags.map(t => `<span style="background-color: #111827; border: 1px solid #1F2937; padding: 0.15rem 0.4rem; border-radius: 0.25rem; margin-right: 0.5rem; font-size: 0.75rem;">#${t}</span>`).join('')}</p>
          </div>
        </div>
      `
    });
  });

} catch (err) {
  console.error('Failed to load dynamic blog posts for pre-rendering:', err);
}

pages.forEach(page => {
  const targetDir = path.resolve(distPath, page.route);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  let html = template;
  
  // Replace Title
  html = html.replace(
    /<title>Mantra Novels - Read & Write Web Novels Online<\/title>/i,
    `<title>${page.title}</title>`
  );

  // Replace Description
  html = html.replace(
    /<meta name="description" content="[^"]*"/i,
    `<meta name="description" content="${page.description}"`
  );

  // Replace body shell inside #root
  const rootStart = html.indexOf('<div id="root">');
  if (rootStart !== -1) {
    const shellStart = html.indexOf('<div class="seo-fallback-shell"', rootStart);
    if (shellStart !== -1) {
      const scriptTagIndex = html.indexOf('<script type="module" src="/src/main.tsx"></script>');
      if (scriptTagIndex !== -1) {
        const lastDivIndex = html.lastIndexOf('</div>', scriptTagIndex);
        if (lastDivIndex > shellStart) {
          const beforeShell = html.substring(0, shellStart);
          const afterShell = html.substring(lastDivIndex); // Keeps the closing </div> of #root
          html = beforeShell + page.body + afterShell;
        }
      }
    }
  }

  const outputPath = path.resolve(targetDir, 'index.html');
  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`Pre-rendered: ${outputPath}`);
});
console.log('All static pages successfully pre-rendered!');
