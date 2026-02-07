'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Zap, Brain, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-teal-900">
      {/* Navigation */}
      <nav className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-teal-400" />
              <span className="text-xl font-bold text-white">ClaimGuard AI</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" className="text-white/80 hover:text-white">
                  Admin
                </Button>
              </Link>
              <Link href="/submit">
                <Button className="bg-teal-500 hover:bg-teal-600">
                  File a Claim
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Insurance Claims
              <span className="block text-teal-400">Processed in Seconds</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Upload a photo of your damage. Our AI analyzes it instantly.
              Get approved in under 60 seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/submit">
                <Button size="lg" className="bg-teal-500 hover:bg-teal-600 text-lg px-8">
                  Start Your Claim
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <p className="text-gray-400 text-sm">No login required • Demo mode available</p>
            </div>
          </motion.div>
        </div>

        {/* Floating Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="max-w-4xl mx-auto mt-16 grid grid-cols-3 gap-4"
        >
          {[
            { label: 'Processing Time', value: '<60s', icon: Clock },
            { label: 'AI Accuracy', value: '94%', icon: Brain },
            { label: 'Fraud Detection', value: 'Real-time', icon: Shield },
          ].map((stat, i) => (
            <Card key={i} className="bg-white/10 border-white/20 backdrop-blur">
              <CardContent className="p-4 text-center">
                <stat.icon className="w-6 h-6 text-teal-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Upload Photos',
                description: 'Take photos of the damage with your phone and upload them.',
                icon: '📸',
              },
              {
                step: '02',
                title: 'AI Analysis',
                description: 'Our Gemini AI analyzes damage severity and detects fraud.',
                icon: '🤖',
              },
              {
                step: '03',
                title: 'Instant Decision',
                description: 'Get approved immediately or know next steps within seconds.',
                icon: '✅',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-white/5 border-white/10 h-full">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-4">{item.icon}</div>
                    <p className="text-teal-400 font-mono text-sm mb-2">Step {item.step}</p>
                    <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-gray-400">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Zap className="w-12 h-12 text-teal-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to file your claim?
          </h2>
          <p className="text-gray-300 mb-8">
            Experience the future of insurance claims processing.
          </p>
          <Link href="/submit">
            <Button size="lg" className="bg-teal-500 hover:bg-teal-600">
              Get Started Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-gray-400 text-sm">
          <p>© 2024 ClaimGuard AI. Built for hackathon demo.</p>
          <p>Powered by Gemini 2.0 Flash</p>
        </div>
      </footer>
    </div>
  );
}
