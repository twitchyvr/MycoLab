// ============================================================================
// PRIVACY POLICY PAGE
// Required for OAuth providers (Google, etc.)
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
  const lastUpdated = 'December 16, 2025';
  const appName = 'MycoLab';
  const companyName = 'MycoLab';
  const contactEmail = 'privacy@theautomationguru.com';
  const websiteUrl = 'https://mycolab.theautomationguru.com';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white hover:text-emerald-400 transition-colors">
            <span className="text-2xl">🍄</span>
            <span className="font-bold text-xl">{appName}</span>
          </Link>
          <Link to="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
            ← Back to App
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-zinc-500 mb-8">Last updated: {lastUpdated}</p>

        <div className="prose prose-invert prose-zinc max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
            <p>
              Welcome to {appName}. We respect your privacy and are committed to protecting your personal data.
              This privacy policy explains how we collect, use, and safeguard your information when you use our
              mycology laboratory management application.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Information We Collect</h2>

            <h3 className="text-lg font-medium text-zinc-200 mb-2">2.1 Account Information</h3>
            <p className="mb-4">When you create an account, we may collect:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Email address</li>
              <li>Name (if provided)</li>
              <li>Profile information you choose to add</li>
              <li>Authentication data from third-party providers (Google, etc.)</li>
            </ul>

            <h3 className="text-lg font-medium text-zinc-200 mb-2">2.2 Usage Data</h3>
            <p className="mb-4">We automatically collect certain information when you use {appName}:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Device information (browser type, operating system)</li>
              <li>Log data (access times, pages viewed)</li>
              <li>Application usage patterns</li>
            </ul>

            <h3 className="text-lg font-medium text-zinc-200 mb-2">2.3 Laboratory Data</h3>
            <p>
              The core function of {appName} is to help you manage your mycology laboratory. This includes data you
              enter about cultures, grows, recipes, inventory, and observations. This data is yours and is stored
              to provide our services to you.
            </p>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide and maintain the {appName} service</li>
              <li>Authenticate your identity and secure your account</li>
              <li>Sync your data across devices (if you enable cloud sync)</li>
              <li>Improve and optimize our application</li>
              <li>Communicate with you about service updates</li>
              <li>Respond to your requests and support inquiries</li>
            </ul>
          </section>

          {/* Data Storage and Security */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Data Storage and Security</h2>
            <p className="mb-4">
              Your data is stored securely using industry-standard practices:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li><strong>Local Storage:</strong> Data can be stored locally in your browser for offline access</li>
              <li><strong>Cloud Storage:</strong> If you enable cloud sync, data is stored in Supabase (PostgreSQL) with encryption at rest</li>
              <li><strong>Authentication:</strong> We use Supabase Auth with secure session management</li>
              <li><strong>Encryption:</strong> All data in transit is encrypted using TLS/SSL</li>
            </ul>
            <p>
              We implement appropriate technical and organizational measures to protect your personal data against
              unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Third-Party Services</h2>
            <p className="mb-4">{appName} uses the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Supabase:</strong> Database and authentication services.
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline ml-1">
                  Supabase Privacy Policy
                </a>
              </li>
              <li>
                <strong>Google OAuth:</strong> Optional sign-in method.
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline ml-1">
                  Google Privacy Policy
                </a>
              </li>
              <li>
                <strong>Cloudflare:</strong> Security and performance services.
                <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline ml-1">
                  Cloudflare Privacy Policy
                </a>
              </li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Data Sharing</h2>
            <p className="mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share your
              information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights, privacy, safety, or property</li>
              <li>With service providers who assist in operating our application (under strict confidentiality)</li>
            </ul>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your data</li>
              <li><strong>Export:</strong> Export your laboratory data in a portable format</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing</li>
            </ul>
            <p>
              To exercise these rights, please contact us at{' '}
              <a href={`mailto:${contactEmail}`} className="text-emerald-400 hover:underline">
                {contactEmail}
              </a>
            </p>
          </section>

          {/* Cookies and Local Storage */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Cookies and Local Storage</h2>
            <p className="mb-4">
              {appName} uses browser local storage to:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Store your application data for offline access</li>
              <li>Remember your preferences and settings</li>
              <li>Maintain your authentication session</li>
            </ul>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Children's Privacy</h2>
            <p>
              {appName} is not intended for use by children under the age of 13. We do not knowingly collect
              personal information from children under 13. If you believe we have collected information from
              a child under 13, please contact us immediately.
            </p>
          </section>

          {/* Changes to This Policy */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any changes by posting
              the new policy on this page and updating the "Last updated" date. We encourage you to review this
              policy periodically.
            </p>
          </section>

          {/* Contact Us */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">11. Contact Us</h2>
            <p className="mb-4">
              If you have questions about this privacy policy or our data practices, please contact us:
            </p>
            <ul className="list-none space-y-1">
              <li>
                <strong>Email:</strong>{' '}
                <a href={`mailto:${contactEmail}`} className="text-emerald-400 hover:underline">
                  {contactEmail}
                </a>
              </li>
              <li>
                <strong>Website:</strong>{' '}
                <a href={websiteUrl} className="text-emerald-400 hover:underline">
                  {websiteUrl}
                </a>
              </li>
            </ul>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-12">
        <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-500">© {new Date().getFullYear()} {companyName}. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="text-emerald-400 hover:underline">Privacy Policy</Link>
            <Link to="/terms" className="text-zinc-400 hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
