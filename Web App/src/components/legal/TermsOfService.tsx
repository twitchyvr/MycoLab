// ============================================================================
// TERMS OF SERVICE PAGE
// Required for OAuth providers (Google, etc.)
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';

export const TermsOfService: React.FC = () => {
  const lastUpdated = 'December 16, 2025';
  const appName = 'Sporely';
  const companyName = 'Sporely';
  const contactEmail = 'support@sporely.co';
  const websiteUrl = 'https://www.sporely.co';

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
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-zinc-500 mb-8">Last updated: {lastUpdated}</p>

        <div className="prose prose-invert prose-zinc max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Agreement to Terms</h2>
            <p>
              By accessing or using {appName}, you agree to be bound by these Terms of Service and our Privacy Policy.
              If you do not agree to these terms, please do not use our service.
            </p>
            <p className="mt-4">
              {appName} is a mycology laboratory management application designed to help cultivators track cultures,
              grows, recipes, inventory, and analyze performance data for mushroom cultivation operations.
            </p>
          </section>

          {/* Eligibility */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Eligibility</h2>
            <p>
              You must be at least 13 years old to use {appName}. By using our service, you represent and warrant that
              you meet this age requirement and have the legal capacity to enter into these terms.
            </p>
          </section>

          {/* Account Registration */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Account Registration</h2>
            <p className="mb-4">When you create an account, you agree to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Promptly notify us of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
            <p className="mt-4">
              You may use {appName} without creating an account (local storage mode), but some features like cloud
              sync require registration.
            </p>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Acceptable Use</h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use {appName} for any illegal purpose or in violation of any laws</li>
              <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
              <li>Interfere with or disrupt the service or servers</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Use automated systems to access the service without permission</li>
              <li>Reverse engineer or attempt to extract source code</li>
              <li>Use the service to cultivate illegal substances</li>
            </ul>
          </section>

          {/* Your Content */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Your Content and Data</h2>
            <p className="mb-4">
              You retain ownership of all data you enter into {appName}, including:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Culture records and observations</li>
              <li>Grow tracking data and yields</li>
              <li>Recipes and formulations</li>
              <li>Inventory and supplier information</li>
              <li>Notes and documentation</li>
            </ul>
            <p>
              By using our service, you grant us a limited license to store, process, and display your content
              solely to provide the {appName} service to you.
            </p>
          </section>

          {/* Service Availability */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Service Availability</h2>
            <p>
              We strive to maintain {appName}'s availability but do not guarantee uninterrupted access. The service
              may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control.
            </p>
            <p className="mt-4">
              {appName} supports offline functionality through local storage. Your data remains accessible even
              without an internet connection.
            </p>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Intellectual Property</h2>
            <p>
              {appName}, including its design, features, and content (excluding your data), is owned by {companyName}
              and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative
              works without our written permission.
            </p>
          </section>

          {/* Disclaimer of Warranties */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Disclaimer of Warranties</h2>
            <p className="mb-4">
              {appName} is provided "as is" and "as available" without warranties of any kind, either express or
              implied, including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Merchantability or fitness for a particular purpose</li>
              <li>Accuracy or completeness of information</li>
              <li>Uninterrupted or error-free operation</li>
              <li>Security of your data (though we implement reasonable safeguards)</li>
            </ul>
            <p className="bg-amber-950/30 border border-amber-800 rounded-lg p-4">
              <strong className="text-amber-300">Important:</strong> {appName} is a laboratory management tool.
              It does not provide cultivation advice, and you are solely responsible for ensuring your activities
              comply with all applicable laws and regulations in your jurisdiction.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, {companyName} shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, including but not limited to loss of data, profits, or
              business opportunities, arising from your use of {appName}.
            </p>
            <p className="mt-4">
              Our total liability for any claims arising from these terms or your use of the service shall not
              exceed the amount you paid us (if any) in the twelve months preceding the claim.
            </p>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless {companyName} and its officers, directors, employees, and
              agents from any claims, damages, losses, or expenses (including legal fees) arising from your use
              of {appName} or violation of these terms.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">11. Termination</h2>
            <p className="mb-4">
              You may stop using {appName} at any time. We may suspend or terminate your access if you violate
              these terms or engage in conduct that we determine is harmful to other users or our service.
            </p>
            <p>
              Upon termination, you may export your data. We will retain your data for a reasonable period to
              allow retrieval, after which it may be deleted.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">12. Changes to Terms</h2>
            <p>
              We may modify these terms from time to time. We will notify you of significant changes by posting
              a notice in the application or sending an email. Your continued use of {appName} after changes
              become effective constitutes acceptance of the new terms.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">13. Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with the laws of the United States,
              without regard to conflict of law principles. Any disputes shall be resolved in the courts of
              competent jurisdiction.
            </p>
          </section>

          {/* Severability */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">14. Severability</h2>
            <p>
              If any provision of these terms is found to be unenforceable, the remaining provisions will continue
              in full force and effect.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">15. Contact Us</h2>
            <p className="mb-4">
              If you have questions about these Terms of Service, please contact us:
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
            <Link to="/privacy" className="text-zinc-400 hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-emerald-400 hover:underline">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfService;
