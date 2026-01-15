import { ShieldCheck, FileSignature, AlertTriangle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NDADialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function NDADialog({ open, onOpenChange }: NDADialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold">
                                Non-Disclosure Agreement (NDA)
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Confidentiality and Data Protection Agreement
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
                    <div className="prose dark:prose-invert max-w-none space-y-6">
                        <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                            <AlertDescription className="text-amber-900 dark:text-amber-200">
                                <strong>Legal Notice:</strong> This is a legally binding document. By accessing protected content, you agree to maintain strict confidentiality.
                            </AlertDescription>
                        </Alert>

                        <section>
                            <h2 className="text-xl font-semibold flex items-center gap-2 mb-3">
                                <FileSignature className="w-5 h-5" />
                                Agreement Overview
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                By accessing any protected or confidential content through this Service, you automatically agree to the terms of this Agreement.
                            </p>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">1. Definition of Confidential Information</h2>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                "Confidential Information" means any and all information accessed through the Service, including but not limited to:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Documents, files, images, videos, and any digital content viewed</li>
                                <li>Business plans, strategies, financial information, and projections</li>
                                <li>Technical data, source code, algorithms, and designs</li>
                                <li>Trade secrets, proprietary methods, and know-how</li>
                                <li>Any information marked as "Confidential," "Proprietary," or "Restricted"</li>
                            </ul>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">2. Obligations of Confidentiality</h2>

                            <h3 className="text-lg font-medium mb-2 mt-4">2.1 Non-Disclosure</h3>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Maintain the confidentiality of all Confidential Information</li>
                                <li>Not disclose to any third party</li>
                                <li>Take all reasonable precautions to prevent unauthorized disclosure</li>
                            </ul>

                            <h3 className="text-lg font-medium mb-2 mt-4">2.2 Non-Reproduction</h3>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Not copy, duplicate, or reproduce any Confidential Information</li>
                                <li>Not take screenshots, screen recordings, or photographs</li>
                                <li>Not print, download, or save copies (except as explicitly permitted)</li>
                            </ul>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">3. Security Measures</h2>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Access from secure, private locations only</li>
                                <li>Use secure devices with up-to-date security software</li>
                                <li>Immediately report any suspected unauthorized access</li>
                                <li>Comply with all security controls implemented by the Service</li>
                            </ul>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">4. Monitoring and Audit</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                You acknowledge that all access to Confidential Information is logged and monitored. Security events and violations are recorded and may be used as evidence.
                            </p>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">5. Consequences of Breach</h2>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Breach may cause irreparable harm</li>
                                <li>Entitled to seek injunctive relief</li>
                                <li>You may be liable for damages and costs</li>
                                <li>Access will be immediately terminated upon breach</li>
                            </ul>
                        </section>

                        <Separator />

                        <div className="mt-8 p-6 bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-bold text-red-900 dark:text-red-200 mb-2">
                                        ACKNOWLEDGMENT
                                    </h3>
                                    <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">
                                        By accessing content, you agree to be legally bound by this NDA and will maintain strict confidentiality of all accessed information.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
