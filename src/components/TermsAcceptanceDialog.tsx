import { useEffect, useState } from 'react';
import { AlertTriangle, FileCheck, Shield } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TermsOfServiceDialog } from './legal/TermsOfServiceDialog';
import { PrivacyPolicyDialog } from './legal/PrivacyPolicyDialog';
import { NDADialog } from './legal/NDADialog';

const ACCEPTANCE_KEY = 'ufv_legal_acceptance';

interface LegalAcceptance {
    accepted: boolean;
    timestamp: number;
    version: string;
}

export function TermsAcceptanceDialog() {
    const [open, setOpen] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [acceptPrivacy, setAcceptPrivacy] = useState(false);
    const [acceptNDA, setAcceptNDA] = useState(false);

    // Dialog states for viewing individual documents
    const [showTerms, setShowTerms] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showNDA, setShowNDA] = useState(false);

    useEffect(() => {
        // Check if user has already accepted terms
        const stored = localStorage.getItem(ACCEPTANCE_KEY);
        if (stored) {
            try {
                const acceptance: LegalAcceptance = JSON.parse(stored);
                // Check if acceptance is still valid (version matches)
                if (acceptance.accepted && acceptance.version === '1.0') {
                    return;
                }
            } catch {
                // Invalid stored data, show dialog
            }
        }
        // Show dialog if no valid acceptance found
        setOpen(true);
    }, []);

    const handleAccept = () => {
        if (!acceptTerms || !acceptPrivacy || !acceptNDA) {
            return;
        }

        const acceptance: LegalAcceptance = {
            accepted: true,
            timestamp: Date.now(),
            version: '1.0',
        };

        localStorage.setItem(ACCEPTANCE_KEY, JSON.stringify(acceptance));
        setOpen(false);
    };

    const handleDecline = () => {
        // Redirect away or show message
        alert('You must accept the terms to use this service.');
        // Could redirect to a "terms declined" page
    };

    const allAccepted = acceptTerms && acceptPrivacy && acceptNDA;

    return (
        <>
            {/* Legal Document Dialogs */}
            <TermsOfServiceDialog open={showTerms} onOpenChange={setShowTerms} />
            <PrivacyPolicyDialog open={showPrivacy} onOpenChange={setShowPrivacy} />
            <NDADialog open={showNDA} onOpenChange={setShowNDA} />

            {/* Main Acceptance Dialog */}
            <Dialog open={open} onOpenChange={() => { }}>
                <DialogContent className="max-w-2xl max-h-[90vh]" onInteractOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <FileCheck className="w-6 h-6 text-primary" />
                            </div>
                            <DialogTitle className="text-2xl">Legal Agreement Required</DialogTitle>
                        </div>
                        <DialogDescription className="text-base">
                            Before using File Viewer, you must read and accept our legal agreements.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[50vh] pr-4">
                        <div className="space-y-6">
                            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-amber-900 dark:text-amber-200">
                                        <p className="font-medium mb-1">Important Notice</p>
                                        <p>
                                            This service handles sensitive and confidential information. By proceeding, you agree
                                            to maintain strict confidentiality and comply with all security measures.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Terms of Service */}
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id="terms"
                                        checked={acceptTerms}
                                        onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                                        className="mt-1"
                                    />
                                    <div className="flex-1">
                                        <label
                                            htmlFor="terms"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            I have read and agree to the{' '}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setShowTerms(true);
                                                }}
                                                className="text-primary hover:underline"
                                            >
                                                Terms of Service
                                            </button>
                                        </label>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Includes usage policies, prohibited activities, and user responsibilities
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Privacy Policy */}
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id="privacy"
                                        checked={acceptPrivacy}
                                        onCheckedChange={(checked) => setAcceptPrivacy(checked as boolean)}
                                        className="mt-1"
                                    />
                                    <div className="flex-1">
                                        <label
                                            htmlFor="privacy"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            I have read and agree to the{' '}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setShowPrivacy(true);
                                                }}
                                                className="text-primary hover:underline"
                                            >
                                                Privacy Policy
                                            </button>
                                        </label>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Covers data collection, usage, security monitoring, and audit logging
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* NDA */}
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id="nda"
                                        checked={acceptNDA}
                                        onCheckedChange={(checked) => setAcceptNDA(checked as boolean)}
                                        className="mt-1"
                                    />
                                    <div className="flex-1">
                                        <label
                                            htmlFor="nda"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            I have read and agree to the{' '}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setShowNDA(true);
                                                }}
                                                className="text-primary hover:underline"
                                            >
                                                Non-Disclosure Agreement (NDA)
                                            </button>
                                        </label>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Legally binding confidentiality obligations for all accessed content
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-muted rounded-lg">
                                <div className="flex items-start gap-3">
                                    <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-muted-foreground">
                                        <p className="font-medium mb-1">Security & Monitoring</p>
                                        <p>
                                            All access is logged and monitored. Security violations will be recorded and may
                                            result in immediate termination of access and potential legal action.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={handleDecline} className="w-full sm:w-auto">
                            Decline
                        </Button>
                        <Button onClick={handleAccept} disabled={!allAccepted} className="w-full sm:w-auto">
                            Accept All & Continue
                        </Button>
                    </DialogFooter>

                    <p className="text-xs text-center text-muted-foreground mt-2">
                        By clicking "Accept All & Continue", you acknowledge that you understand and agree to all terms
                    </p>
                </DialogContent>
            </Dialog>
        </>
    );
}
