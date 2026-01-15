import { Shield, Eye, Database, Lock } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface PrivacyPolicyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PrivacyPolicyDialog({ open, onOpenChange }: PrivacyPolicyDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <Shield className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold">Privacy Policy</DialogTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Last Updated: January 15, 2026
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
                    <div className="prose dark:prose-invert max-w-none space-y-6">
                        <section>
                            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                File Viewer is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information.
                            </p>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold flex items-center gap-2 mb-3">
                                <Database className="w-5 h-5" />
                                2. Information We Collect
                            </h2>

                            <h3 className="text-lg font-medium mb-2 mt-4">2.1 Automatically Collected Information</h3>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li><strong>Session Information:</strong> Session ID, session duration, timestamps</li>
                                <li><strong>Device Information:</strong> Browser type, operating system, device fingerprint</li>
                                <li><strong>Usage Data:</strong> Files accessed, view duration, interaction patterns</li>
                            </ul>

                            <h3 className="text-lg font-medium mb-2 mt-4">2.2 Security Event Logging</h3>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Attempted security violations</li>
                                <li>Authentication and authorization events</li>
                                <li>Suspicious behavior patterns</li>
                            </ul>

                            <h3 className="text-lg font-medium mb-2 mt-4">2.3 File Content</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                <strong>Important:</strong> Files you view are processed in your browser and are NOT uploaded to our servers. File content remains on your device.
                            </p>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold flex items-center gap-2 mb-3">
                                <Eye className="w-5 h-5" />
                                3. How We Use Your Information
                            </h2>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li><strong>Service Operation:</strong> To provide and maintain the Service</li>
                                <li><strong>Security Monitoring:</strong> To detect and prevent security violations</li>
                                <li><strong>Audit Compliance:</strong> To maintain audit logs for compliance</li>
                                <li><strong>Analytics:</strong> To understand usage patterns and improve features</li>
                            </ul>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold flex items-center gap-2 mb-3">
                                <Lock className="w-5 h-5" />
                                4. Data Security
                            </h2>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                We implement security measures including:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Encryption in transit (TLS/SSL)</li>
                                <li>Secure session management</li>
                                <li>Access controls and authentication</li>
                                <li>Security monitoring and logging</li>
                            </ul>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">5. Data Retention</h2>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li><strong>Session Data:</strong> Duration of session plus 30 days</li>
                                <li><strong>Audit Logs:</strong> 1-7 years depending on compliance requirements</li>
                                <li><strong>File History:</strong> Stored locally in your browser until cleared</li>
                            </ul>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Depending on your location, you may have rights to access, correct, delete, or object to processing of your personal information.
                            </p>
                        </section>

                        <Separator />

                        <div className="mt-8 p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                By using File Viewer, you acknowledge that you have read and understood this Privacy Policy.
                            </p>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
