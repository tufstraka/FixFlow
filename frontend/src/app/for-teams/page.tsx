import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Zap, ArrowRight, Building2, Code2, Users, Rocket,
  CheckCircle2, TrendingUp, Shield, Clock, Target,
  GitBranch, Bug, DollarSign, Award, BarChart3,
  Workflow, ArrowLeft, Play
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'For Teams - Accelerate Bug Fixes with Bounties',
  description: 'FixFlow helps engineering teams resolve bugs faster by automatically creating bounties for failing tests. Attract external contributors and reduce your bug backlog.',
  openGraph: {
    title: 'FixFlow for Engineering Teams',
    description: 'Automate bug bounties for your CI/CD pipeline. Fix bugs faster with financial incentives.',
    type: 'website',
  },
  alternates: {
    canonical: '/for-teams',
  },
};

export default function ForTeamsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-100/60 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-32 w-80 h-80 bg-secondary-100/50 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                bg-primary-100 text-primary-700 text-sm font-medium mb-6">
                <Building2 className="w-4 h-4" />
                For Engineering Teams
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
                Turn failing tests into{' '}
                <span className="text-gradient-primary">opportunities</span>
              </h1>

              <p className="text-xl text-gray-500 mb-8 leading-relaxed">
                When your CI detects a bug, FixFlow automatically creates a bounty. 
                Attract skilled developers worldwide to fix issues while your team 
                focuses on building features.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/projects" className="btn-primary btn-lg group">
                  <span>Install GitHub App</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/bounties" className="btn-secondary btn-lg">
                  <Play className="w-5 h-5" />
                  See Live Bounties
                </Link>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-500" />
                  <span>5-minute setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-500" />
                  <span>Pay only for results</span>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="card-glass p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                The Bug Fix Challenge
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Bug className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">78%</div>
                    <p className="text-sm text-gray-500">of developer time spent on maintenance vs new features</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">23 days</div>
                    <p className="text-sm text-gray-500">average time to fix non-critical bugs in backlogs</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary-600">&lt;48 hours</div>
                    <p className="text-sm text-gray-500">average fix time with FixFlow bounties</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Markets */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Built for Teams Who Ship Fast
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Whether you're a startup or enterprise, FixFlow helps you maintain quality 
              while shipping faster.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Startups */}
            <div className="card-hover p-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 
                flex items-center justify-center mb-6 shadow-lg">
                <Rocket className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Startups</h3>
              <p className="text-gray-600 mb-6">
                Small teams that can't afford to stop building for every bug. Let the 
                community help while you focus on product-market fit.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-500" />
                  No hiring needed
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-500" />
                  Pay per fix, not per hour
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-500" />
                  24/7 global talent pool
                </li>
              </ul>
            </div>

            {/* Open Source */}
            <div className="card-hover p-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary-500 to-secondary-600 
                flex items-center justify-center mb-6 shadow-lg">
                <Code2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Open Source Projects</h3>
              <p className="text-gray-600 mb-6">
                Fund bug fixes for your OSS project. Attract new contributors and 
                reward the community for keeping your project healthy.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-500" />
                  Attract new contributors
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-500" />
                  Reward your community
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-500" />
                  Transparent on-chain payments
                </li>
              </ul>
            </div>

            {/* Enterprise */}
            <div className="card-hover p-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 
                flex items-center justify-center mb-6 shadow-lg">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Enterprise Teams</h3>
              <p className="text-gray-600 mb-6">
                Reduce bug backlog without expanding headcount. Use bounties as a 
                flexible capacity lever for maintenance work.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-500" />
                  Reduce bug backlog faster
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-500" />
                  Flexible cost structure
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-500" />
                  Audit-friendly blockchain records
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How FixFlow Works for Teams
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Set up once, then let automation handle the rest. Your bugs get fixed 
              while you focus on what matters.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              {[
                {
                  step: 1,
                  icon: GitBranch,
                  title: 'Install the GitHub App',
                  description: 'Add FixFlow to your repository. Configure bounty amounts and escalation rules in a simple YAML file.',
                  color: 'primary'
                },
                {
                  step: 2,
                  icon: Bug,
                  title: 'Tests Fail → Bounty Created',
                  description: 'When your CI detects a failing test, FixFlow automatically creates an issue with a bounty attached.',
                  color: 'secondary'
                },
                {
                  step: 3,
                  icon: Users,
                  title: 'Developers Fix & Submit PRs',
                  description: 'Skilled developers worldwide see the bounty and submit fixes. Our bot verifies tests pass.',
                  color: 'accent'
                },
                {
                  step: 4,
                  icon: DollarSign,
                  title: 'Automatic Payment on Merge',
                  description: 'When you merge the PR, payment is automatically released to the developer. No invoices, no delays.',
                  color: 'primary'
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-xl bg-${item.color}-100 
                      flex items-center justify-center flex-shrink-0`}>
                      <item.icon className={`w-6 h-6 text-${item.color}-600`} />
                    </div>
                    {i < 3 && <div className="w-0.5 h-full bg-gray-200 my-2" />}
                  </div>
                  <div className="pb-8">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-bold text-${item.color}-600 
                        bg-${item.color}-100 px-2 py-0.5 rounded`}>
                        STEP {item.step}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Configuration Example */}
            <div className="card p-6 bg-gray-900 text-white rounded-xl">
              <div className="flex items-center gap-2 mb-4 text-gray-400 text-sm">
                <Workflow className="w-4 h-4" />
                .fixflow.yml
              </div>
              <pre className="text-sm font-mono overflow-x-auto">
{`# FixFlow Configuration
bounty:
  # Initial bounty amount in MNEE (≈ USD)
  initial_amount: 25
  
  # Maximum after escalation
  max_amount: 100
  
  # Escalation schedule
  escalation:
    - after: 24h
      amount: 35
    - after: 72h
      amount: 50
    - after: 1w
      amount: 100

# Which test failures trigger bounties
triggers:
  - test_failure
  - ci_failure

# Labels to add to bounty issues
labels:
  - bounty
  - help-wanted
  - good-first-issue`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Why Engineering Teams Choose FixFlow
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Clock,
                title: 'Ship Faster',
                description: 'Stop context-switching. External contributors handle bugs while your team builds features.',
                stat: '3x',
                statLabel: 'faster bug resolution'
              },
              {
                icon: DollarSign,
                title: 'Pay for Results',
                description: 'No retainers, no hourly rates. Pay only when the bug is actually fixed and merged.',
                stat: '2.5%',
                statLabel: 'platform fee only'
              },
              {
                icon: Shield,
                title: 'Quality Assured',
                description: 'CI must pass before payment. You review and approve every PR before it merges.',
                stat: '100%',
                statLabel: 'test verification'
              },
              {
                icon: BarChart3,
                title: 'Predictable Costs',
                description: 'Set bounty limits and max amounts. Never spend more than you budget for bug fixes.',
                stat: 'Custom',
                statLabel: 'budget controls'
              },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <item.icon className="w-8 h-8 text-primary-400 mb-4" />
                <div className="text-3xl font-bold text-white mb-1">{item.stat}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-4">{item.statLabel}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="card-glass p-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
              bg-primary-100 text-primary-700 text-sm font-medium mb-6">
              <Award className="w-4 h-4" />
              Simple Pricing
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              2.5% Platform Fee
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
              We only charge when bounties are successfully claimed. No subscription, 
              no setup fees, no minimum commitment.
            </p>

            <div className="grid sm:grid-cols-3 gap-6 mb-8">
              <div className="p-4 rounded-xl bg-white border border-gray-200">
                <CheckCircle2 className="w-6 h-6 text-success-500 mx-auto mb-2" />
                <div className="font-medium text-gray-900">Free to install</div>
                <div className="text-sm text-gray-500">No upfront costs</div>
              </div>
              <div className="p-4 rounded-xl bg-white border border-gray-200">
                <CheckCircle2 className="w-6 h-6 text-success-500 mx-auto mb-2" />
                <div className="font-medium text-gray-900">Gas fees covered</div>
                <div className="text-sm text-gray-500">We pay Ethereum gas</div>
              </div>
              <div className="p-4 rounded-xl bg-white border border-gray-200">
                <CheckCircle2 className="w-6 h-6 text-success-500 mx-auto mb-2" />
                <div className="font-medium text-gray-900">Refunds available</div>
                <div className="text-sm text-gray-500">Cancel unclaimed bounties</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/pricing" className="btn-secondary btn-lg">
                View Full Pricing
              </Link>
              <Link href="/projects" className="btn-primary btn-lg">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
              <span className="font-semibold text-gray-900">FixFlow</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/pricing" className="hover:text-gray-900 transition-colors">Pricing</Link>
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