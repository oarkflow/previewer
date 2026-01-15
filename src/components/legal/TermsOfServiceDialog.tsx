import { FileText, Scale } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface TermsOfServiceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TermsOfServiceDialog({ open, onOpenChange }: TermsOfServiceDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <Scale className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold">Terms of Service</DialogTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Last Updated: January 15, 2026
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
                    <div className="prose dark:prose-invert max-w-none space-y-6">
                        <section>
                            <h2 className="text-xl font-semibold flex items-center gap-2 mb-3">
                                <FileText className="w-5 h-5" />
                                1. Acceptance of Terms
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                By accessing or using File Viewer ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you must not use the Service.
                            </p>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                File Viewer is a secure file viewing and preview application that allows users to view various file formats including documents, images, videos, code files, and more.
                            </p>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">3. User Responsibilities</h2>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                When using the Service, you agree to:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Use the Service only for lawful purposes</li>
                                <li>Not attempt to bypass or circumvent security features</li>
                                <li>Not use automated tools to scrape, download, or extract content</li>
                                <li>Respect intellectual property rights of content owners</li>
                                <li>Maintain the confidentiality of any sensitive information accessed</li>
                            </ul>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">4. Security and Protected Content</h2>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                Files viewed through the Service may be subject to security controls. You agree not to attempt to bypass, disable, or circumvent these security measures.
                            </p>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">5. Prohibited Activities</h2>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                You must not:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Take screenshots, screen recordings, or photographs of protected content</li>
                                <li>Share, redistribute, or republish content accessed through the Service</li>
                                <li>Use the Service to distribute malware, viruses, or malicious code</li>
                                <li>Interfere with or disrupt the Service or servers</li>
                            </ul>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">6. Privacy and Data Collection</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Your use of the Service is subject to our Privacy Policy. We may collect and log information for security monitoring and service improvement purposes.
                            </p>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">7. Disclaimers</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. We do not warrant that the Service will be uninterrupted, error-free, or completely secure.
                            </p>
                        </section>

                        <Separator />

                        <div className="mt-8 p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                By using File Viewer, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                            </p>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
