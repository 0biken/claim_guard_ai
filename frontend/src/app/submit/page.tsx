import { ClaimForm } from '@/components/claim-form';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
    title: 'Submit a Claim - ClaimGuard AI',
    description: 'File your insurance claim in under 60 seconds with AI-powered processing.',
};

export default function SubmitPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-2">
                            <Shield className="w-8 h-8 text-teal-600" />
                            <span className="text-xl font-bold text-gray-900">ClaimGuard AI</span>
                        </Link>
                        <Link href="/">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Home
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="py-8 px-4">
                <div className="max-w-2xl mx-auto">
                    {/* Page Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">File Your Claim</h1>
                        <p className="text-gray-600 mt-2">
                            Complete the form below and upload photos of the damage.
                            Our AI will process your claim instantly.
                        </p>
                    </div>

                    {/* Claim Form */}
                    <ClaimForm />

                    {/* Trust Indicators */}
                    <div className="mt-8 p-4 bg-teal-50 rounded-lg">
                        <div className="flex items-center gap-3 text-sm text-teal-700">
                            <Shield className="w-5 h-5 flex-shrink-0" />
                            <p>
                                Your data is encrypted and secure. We never share your information without your consent.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
