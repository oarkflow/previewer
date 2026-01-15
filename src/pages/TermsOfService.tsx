import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Shield, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <Link to="/">
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Viewer
                    </Button>
                </Link>

                <Card className="shadow-lg">
                    <CardHeader className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <Scale className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-3xl font-bold">Terms of Service</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Last Updated: January 15, 2026
                                </p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="prose dark:prose-invert max-w-none space-y-6">
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
                                File Viewer is a secure file viewing and preview application that allows users to view various file formats including documents, images, videos, code files, and more. The Service may include:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>File preview capabilities for multiple formats</li>
                                <li>Security features including watermarking, screenshot resistance, and access controls</li>
                                <li>Audit logging and security monitoring</li>
                                <li>File history and recent access tracking</li>
                                <li>Export and conversion features (where enabled)</li>
                            </ul>
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
                                <li>Not attempt to reverse engineer or decompile the Service</li>
                                <li>Respect intellectual property rights of content owners</li>
                                <li>Maintain the confidentiality of any sensitive information accessed</li>
                                <li>Not share access credentials with unauthorized parties</li>
                            </ul>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold flex items-center gap-2 mb-3">
                                <Shield className="w-5 h-5" />
                                4. Security and Protected Content
                            </h2>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                Files viewed through the Service may be subject to security controls including:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li><strong>Copy Protection:</strong> Preventing text selection and copying</li>
                                <li><strong>Download Restrictions:</strong> Blocking unauthorized downloads</li>
                                <li><strong>Screenshot Resistance:</strong> Visual deterrents and content blurring</li>
                                <li><strong>Print Prevention:</strong> Blocking print functionality</li>
                                <li><strong>Watermarking:</strong> Visible or invisible watermarks on content</li>
                                <li><strong>Session Monitoring:</strong> Tracking and logging access activities</li>
                            </ul>
                            <p className="text-muted-foreground leading-relaxed mt-3">
                                You agree not to attempt to bypass, disable, or circumvent these security measures. Violation of security controls may result in immediate termination of access and potential legal action.
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
                                <li>Use OCR or screen capture tools to extract content</li>
                                <li>Share, redistribute, or republish content accessed through the Service</li>
                                <li>Attempt to download or save protected files through any means</li>
                                <li>Use the Service to distribute malware, viruses, or malicious code</li>
                                <li>Interfere with or disrupt the Service or servers</li>
                                <li>Access the Service using unauthorized means or credentials</li>
                            </ul>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">6. Intellectual Property</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                All content accessed through the Service remains the property of its respective owners. The Service itself, including its design, features, and functionality, is owned by File Viewer and is protected by intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to use the Service solely for its intended purpose.
                            </p>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">7. Privacy and Data Collection</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Your use of the Service is subject to our <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>. We may collect and log information including file access history, security events, session data, and device information for security monitoring and service improvement purposes.
                            </p>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">8. Security Logging and Monitoring</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                The Service actively monitors and logs user activities for security purposes. This includes but is not limited to: access attempts, security violations, suspicious behavior, copy/download attempts, and session information. These logs may be reviewed by administrators and used as evidence in case of policy violations.
                            </p>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">9. Termination</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We reserve the right to suspend or terminate your access to the Service at any time, with or without notice, for any violation of these Terms or for any other reason at our sole discretion. Upon termination, your right to access the Service immediately ceases.
                            </p>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">10. Disclaimers</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. We do not warrant that the Service will be uninterrupted, error-free, or completely secure. While we implement security measures, no system is 100% secure, and we cannot guarantee absolute protection against unauthorized access or data breaches.
                            </p>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">11. Limitation of Liability</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                To the maximum extent permitted by law, File Viewer and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or other intangibles, resulting from your use or inability to use the Service.
                            </p>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">12. Indemnification</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                You agree to indemnify and hold harmless File Viewer, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses arising from your use of the Service or violation of these Terms.
                            </p>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">13. Changes to Terms</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting to the Service. Your continued use of the Service after changes are posted constitutes acceptance of the modified Terms.
                            </p>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">14. Governing Law</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the appropriate courts.
                            </p>
                        </section>

                        <Separator />

                        <div className="mt-8 p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                By using File Viewer, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6 flex justify-center gap-4 text-sm text-muted-foreground">
                    <Link to="/privacy-policy" className="hover:text-primary transition-colors">
                        Privacy Policy
                    </Link>
                    <span>•</span>
                    <Link to="/nda" className="hover:text-primary transition-colors">
                        NDA Agreement
                    </Link>
                </div>
            </div>
        </div>
    );
}
