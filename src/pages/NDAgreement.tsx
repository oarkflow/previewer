import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, FileSignature, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function NDAgreement() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <Link to="/">
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Viewer
                    </Button>
                </Link>

                <Alert className="mb-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                    <AlertDescription className="text-amber-900 dark:text-amber-200">
                        <strong>Legal Notice:</strong> This Non-Disclosure Agreement (NDA) is a legally binding document. By accessing protected content through this service, you agree to maintain strict confidentiality.
                    </AlertDescription>
                </Alert>

                <Card className="shadow-lg">
                    <CardHeader className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <ShieldCheck className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-3xl font-bold">
                                    Non-Disclosure Agreement (NDA)
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Confidentiality and Data Protection Agreement
                                    <br />
                                    Effective Date: January 15, 2026
                                </p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="prose dark:prose-invert max-w-none space-y-6">
                        <section>
                            <h2 className="text-xl font-semibold flex items-center gap-2 mb-3">
                                <FileSignature className="w-5 h-5" />
                                Agreement Overview
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                This Non-Disclosure Agreement ("Agreement") is entered into by and between the content provider ("Disclosing Party") and you, the user accessing the content ("Receiving Party"), through File Viewer ("the Service"). By accessing any protected or confidential content through this Service, you automatically agree to the terms of this Agreement.
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
                                <li>Customer lists, vendor information, and business relationships</li>
                                <li>Trade secrets, proprietary methods, and know-how</li>
                                <li>Personal data, medical records, and sensitive personal information</li>
                                <li>Internal communications, memos, and discussions</li>
                                <li>Any information marked as "Confidential," "Proprietary," or "Restricted"</li>
                                <li>Any information that a reasonable person would understand to be confidential</li>
                            </ul>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">2. Obligations of Confidentiality</h2>

                            <h3 className="text-lg font-medium mb-2 mt-4">2.1 Non-Disclosure</h3>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                You agree to:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Maintain the confidentiality of all Confidential Information</li>
                                <li>Not disclose, reveal, or communicate any Confidential Information to any third party</li>
                                <li>Not discuss Confidential Information in public or unsecured locations</li>
                                <li>Take all reasonable precautions to prevent unauthorized disclosure</li>
                                <li>Use the same degree of care you would use to protect your own confidential information, but no less than reasonable care</li>
                            </ul>

                            <h3 className="text-lg font-medium mb-2 mt-4">2.2 Non-Use</h3>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                You agree to use Confidential Information solely for the purpose of viewing it through the Service and NOT to:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Use the information for any commercial purpose</li>
                                <li>Use the information to compete with or disadvantage the Disclosing Party</li>
                                <li>Derive any products, services, or benefits from the information</li>
                                <li>Reverse engineer, decompile, or extract information</li>
                                <li>Create derivative works based on the information</li>
                            </ul>

                            <h3 className="text-lg font-medium mb-2 mt-4">2.3 Non-Reproduction</h3>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                You specifically agree NOT to:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Copy, duplicate, or reproduce any Confidential Information</li>
                                <li>Take screenshots, screen recordings, or photographs</li>
                                <li>Print, download, or save copies (except as explicitly permitted)</li>
                                <li>Transcribe, memorize for reproduction, or reconstruct from memory</li>
                                <li>Use OCR, screen capture, or any extraction tools</li>
                                <li>Share access credentials or sessions with others</li>
                            </ul>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">3. Permitted Disclosures</h2>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                You may disclose Confidential Information only:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>With prior written consent from the Disclosing Party</li>
                                <li>To the extent required by law, court order, or government authority (with advance notice to Disclosing Party if legally permitted)</li>
                                <li>To your legal counsel under attorney-client privilege (who must also be bound by confidentiality)</li>
                            </ul>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">4. Exceptions to Confidential Information</h2>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                Information is NOT considered Confidential if it:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Was publicly known before disclosure</li>
                                <li>Becomes publicly available through no fault of yours</li>
                                <li>Was independently developed by you without reference to the Confidential Information</li>
                                <li>Was rightfully received from a third party without confidentiality obligations</li>
                            </ul>
                            <p className="text-muted-foreground leading-relaxed mt-3">
                                <strong>Note:</strong> The burden of proof for any exception rests with you.
                            </p>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">5. Security Measures</h2>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                You agree to:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Access Confidential Information only from secure, private locations</li>
                                <li>Use secure devices with up-to-date security software</li>
                                <li>Not access from public computers, shared devices, or unsecured networks</li>
                                <li>Immediately report any suspected unauthorized access or disclosure</li>
                                <li>Comply with all security controls implemented by the Service</li>
                                <li>Lock your device when stepping away during active viewing sessions</li>
                                <li>Close sessions completely when finished</li>
                            </ul>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">6. Term and Termination</h2>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                This Agreement:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Becomes effective upon your first access to Confidential Information</li>
                                <li>Remains in effect indefinitely for information accessed during the term</li>
                                <li>Survives termination of your access to the Service</li>
                                <li>Continues until the information is no longer confidential by exception (see Section 4)</li>
                            </ul>
                            <p className="text-muted-foreground leading-relaxed mt-3">
                                Upon termination of access or upon request:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>You must cease all use of Confidential Information</li>
                                <li>Delete any authorized copies in your possession</li>
                                <li>Confirm destruction of materials in writing if requested</li>
                            </ul>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">7. Monitoring and Audit</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                You acknowledge and agree that:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>All access to Confidential Information is logged and monitored</li>
                                <li>Security events, violations, and suspicious activities are recorded</li>
                                <li>Audit logs may be reviewed and used as evidence of compliance or breach</li>
                                <li>The Disclosing Party may audit your compliance with this Agreement</li>
                                <li>Device fingerprints and session data are collected for security purposes</li>
                            </ul>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">8. Consequences of Breach</h2>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                You acknowledge that:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Breach of this Agreement may cause irreparable harm to the Disclosing Party</li>
                                <li>Monetary damages may be insufficient to remedy a breach</li>
                                <li>The Disclosing Party is entitled to seek injunctive relief and specific performance</li>
                                <li>You may be liable for actual damages, consequential damages, and costs</li>
                                <li>Criminal penalties may apply for certain violations (e.g., trade secret theft)</li>
                                <li>Your access will be immediately terminated upon breach</li>
                                <li>You may be personally liable even if acting on behalf of an organization</li>
                            </ul>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">9. No Rights Granted</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                This Agreement does NOT grant you any rights, title, interest, or license in the Confidential Information. All rights remain with the Disclosing Party. You receive only a limited right to view information for the permitted purpose.
                            </p>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">10. Return of Materials</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Upon request or termination of access, you must immediately:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Return or destroy all Confidential Information in your possession</li>
                                <li>Delete all copies from your devices and storage systems</li>
                                <li>Provide written certification of compliance if requested</li>
                            </ul>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">11. Legal and Compliance</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                This Agreement shall be governed by applicable laws. You consent to the exclusive jurisdiction of appropriate courts for any disputes arising from this Agreement. This Agreement may be enforced in any jurisdiction where a breach occurs.
                            </p>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">12. Entire Agreement</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                This NDA, together with the Terms of Service and Privacy Policy, constitutes the entire agreement regarding confidentiality. This Agreement supersedes any prior oral or written agreements on the subject matter.
                            </p>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">13. Amendment</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                This Agreement may be modified at any time. Continued access to Confidential Information after modifications constitutes acceptance of the modified terms. Material changes will be communicated through the Service.
                            </p>
                        </section>

                        <Separator />

                        <div className="mt-8 p-6 bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-bold text-red-900 dark:text-red-200 mb-2">
                                        ACKNOWLEDGMENT AND ACCEPTANCE
                                    </h3>
                                    <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">
                                        By accessing any content through File Viewer, you acknowledge that:
                                    </p>
                                    <ul className="list-disc pl-6 mt-2 space-y-1 text-sm text-red-800 dark:text-red-300">
                                        <li>You have read and understood this Non-Disclosure Agreement</li>
                                        <li>You agree to be legally bound by its terms</li>
                                        <li>You understand the consequences of breach</li>
                                        <li>You accept monitoring and audit provisions</li>
                                        <li>You will maintain strict confidentiality of all accessed information</li>
                                    </ul>
                                    <p className="text-sm font-semibold text-red-900 dark:text-red-200 mt-3">
                                        IF YOU DO NOT AGREE, YOU MUST NOT ACCESS ANY CONFIDENTIAL CONTENT.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6 flex justify-center gap-4 text-sm text-muted-foreground">
                    <Link to="/terms-of-service" className="hover:text-primary transition-colors">
                        Terms of Service
                    </Link>
                    <span>•</span>
                    <Link to="/privacy-policy" className="hover:text-primary transition-colors">
                        Privacy Policy
                    </Link>
                </div>
            </div>
        </div>
    );
}
