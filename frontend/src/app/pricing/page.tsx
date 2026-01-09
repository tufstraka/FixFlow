import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Zap, ArrowLeft, CheckCircle2, Building2,
  Coins, Shield, TrendingUp, GitBranch,
  HelpCircle, DollarSign, Award, Percent
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing - Simple 2.5% Platform Fee',
  description: 'FixFlow charges a simple 2.5% platform fee only when bounties are successfully claimed. No hidden costs, no subscriptions, no upfront fees.',
  openGraph: {
    title: 'Pricing | FixFlow',
    description: 'Simple, transparent pricing. 2.5% fee only on successful bounty payouts.',
    type: 'website',
  },
  alternates: {
    canonical: '/pricing',
  },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              We only make money when you successfully claim bounties. No subscriptions, no hidden fees.
            </p>
          </div>
        </div>
      </div>

      {/* Main Pricing Card */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="max-w-xl mx-auto mb-16">
          <div className="card p-10 border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-6">
              <Percent className="w-8 h-8 text-primary-600" />
            </div>

            <div className="flex items-baseline justify-center gap-2 mb-4">
              <span className="text-6xl font-bold text-primary-600">2.5%</span>
            </div>
            <div className="text-xl text-gray-600 mb-8">
              Platform fee on successful bounty claims
            </div>

            <div className="space-y-4 text-left mb-8">
              {[
                'Fee only charged when bounty is claimed',
                'No fee for cancelled or expired bounties',
                'Full refund if bounty is never claimed',
                'Gas fees covered by FixFlow',
                'No subscription or setup costs',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success-500 flex-shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>

            {/* Example Calculation */}
            <div className="p-5 rounded-xl bg-white border border-primary-200">
              <h4 className="font-semibold text-gray-900 mb-3">Example Payment</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bounty Amount:</span>
                  <span className="font-medium">100 MNEE ($100)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform Fee (2.5%):</span>
                  <span className="font-medium text-gray-500">-2.50 MNEE</span>
                </div>
                <div className="flex justify-between border-t border-primary-200 pt-2 mt-2">
                  <span className="text-gray-900 font-semibold">Developer Receives:</span>
                  <span className="font-bold text-primary-600">97.50 MNEE ($97.50)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why We Charge */}
        <div className="card p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            What Your 2.5% Supports
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-xl bg-secondary-100 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-secondary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Secure Escrow</h3>
              <p className="text-sm text-gray-600">
                Audited smart contracts ensure funds are held securely until work is verified and approved.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-xl bg-accent-100 flex items-center justify-center mx-auto mb-4">
                <GitBranch className="w-7 h-7 text-accent-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">GitHub Integration</h3>
              <p className="text-sm text-gray-600">
                Our bot monitors PRs 24/7, verifies test results, and automatically releases payments.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Platform Development</h3>
              <p className="text-sm text-gray-600">
                Continuous improvements, new features, and 24/7 infrastructure to keep the platform running.
              </p>
            </div>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Pay Only for Results</h3>
                <p className="text-sm text-gray-600">
                  No retainers, no hourly rates. The platform fee is only charged when a developer 
                  successfully claims a bounty by fixing the issue.
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Funds Protected</h3>
                <p className="text-sm text-gray-600">
                  Your bounty funds are held in a secure smart contract. Cancel anytime before 
                  claim for a full refund.
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">No Gas Fees</h3>
                <p className="text-sm text-gray-600">
                  FixFlow covers all Ethereum gas costs. Neither bounty creators nor developers 
                  pay transaction fees.
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Transparent On-Chain</h3>
                <p className="text-sm text-gray-600">
                  All transactions are recorded on the Ethereum blockchain. Verify any payment 
                  on Etherscan.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'When is the platform fee charged?',
                a: 'The 2.5% fee is only charged when a bounty is successfully claimed. If a bounty expires or is cancelled, there are no fees—the full amount is refunded to the creator.'
              },
              {
                q: 'Who pays the Ethereum gas fees?',
                a: 'FixFlow covers all gas fees. Neither bounty creators nor developers pay any gas costs for creating, claiming, or cancelling bounties.'
              },
              {
                q: 'Is there a minimum bounty amount?',
                a: 'The minimum bounty is 1 MNEE (approximately $1). There\'s no maximum limit, though larger bounties may have additional verification steps.'
              },
              {
                q: 'What if my bounty is never claimed?',
                a: 'You can cancel an unclaimed bounty at any time and receive a full refund. No fees are charged for cancelled or expired bounties.'
              },
              {
                q: 'Are there any subscription or setup fees?',
                a: 'No. Installing the FixFlow GitHub App is free. You only pay when bounties are successfully claimed.'
              },
            ].map((faq, i) => (
              <div key={i} className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                  {faq.q}
                </h3>
                <p className="text-gray-600 pl-8">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="card-glass p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            Install the FixFlow GitHub App on your repositories and start creating 
            bounties for bug fixes today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/projects" className="btn-primary btn-lg">
              <Building2 className="w-5 h-5" />
              Set Up Your Project
            </Link>
            <Link href="/bounties" className="btn-secondary btn-lg">
              <Coins className="w-5 h-5" />
              Explore Bounties
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
              <span className="font-semibold text-gray-900">FixFlow</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/for-teams" className="hover:text-gray-900 transition-colors">For Teams</Link>
              <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
              <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}