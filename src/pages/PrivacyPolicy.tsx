import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Eye, Database, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function PrivacyPolicy() {
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
                                <Shield className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Last Updated: January 15, 2026
                                </p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="prose dark:prose-invert max-w-none space-y-6">
                        <section>
                            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                File Viewer ("we", "our", or "the Service") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our file viewing service.
                            </p>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold flex items-center gap-2 mb-3">
                                <Database className="w-5 h-5" />
                                2. Information We Collect
                            </h2>

                            <h3 className="text-lg font-medium mb-2 mt-4">2.1 Automatically Collected Information</h3>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                When you use the Service, we automatically collect:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li><strong>Session Information:</strong> Session ID, session duration, timestamps</li>
                                <li><strong>Device Information:</strong> Browser type, operating system, device fingerprint</li>
                                <li><strong>Network Information:</strong> IP address, geolocation data</li>
                                <li><strong>Usage Data:</strong> Files accessed, view duration, interaction patterns</li>
                                <li><strong>Performance Data:</strong> Load times, errors, technical diagnostics</li>
                            </ul>

                            <h3 className="text-lg font-medium mb-2 mt-4">2.2 File Access Information</h3>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                We collect information about files you access:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>File names and paths (when provided)</li>
                                <li>File types and formats</li>
                                <li>Access timestamps</li>
                                <li>File metadata (size, modification date)</li>
                                <li>View history and recent files</li>
                            </ul>

                            <h3 className="text-lg font-medium mb-2 mt-4">2.3 Security Event Logging</h3>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                For security purposes, we log:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Attempted security violations (copy, download, screenshot attempts)</li>
                                <li>Authentication and authorization events</li>
                                <li>Suspicious behavior patterns</li>
                                <li>Access control violations</li>
                                <li>Audit trail information</li>
                            </ul>

                            <h3 className="text-lg font-medium mb-2 mt-4">2.4 File Content</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                <strong>Important:</strong> Files you view are processed in your browser and are NOT uploaded to our servers unless explicitly required for specific features. File content remains on your device or the file server you're accessing.
                            </p>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold flex items-center gap-2 mb-3">
                                <Eye className="w-5 h-5" />
                                3. How We Use Your Information
                            </h2>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                We use collected information for:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li><strong>Service Operation:</strong> To provide, maintain, and improve the Service</li>
                                <li><strong>Security Monitoring:</strong> To detect and prevent security violations, unauthorized access, and fraudulent activities</li>
                                <li><strong>Audit Compliance:</strong> To maintain audit logs for compliance and accountability</li>
                                <li><strong>User Experience:</strong> To personalize your experience (e.g., file history, preferences)</li>
                                <li><strong>Technical Support:</strong> To diagnose technical issues and provide support</li>
                                <li><strong>Analytics:</strong> To understand usage patterns and improve features</li>
                                <li><strong>Legal Compliance:</strong> To comply with legal obligations and enforce our Terms of Service</li>
                            </ul>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">4. Information Sharing and Disclosure</h2>

                            <h3 className="text-lg font-medium mb-2 mt-4">4.1 We Share Information With:</h3>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li><strong>Administrators:</strong> Organization administrators can access audit logs and security events</li>
                                <li><strong>Content Owners:</strong> File owners may view access logs for their content</li>
                                <li><strong>Service Providers:</strong> Third-party services that help us operate the Service (with appropriate data protection agreements)</li>
                                <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
                            </ul>

                            <h3 className="text-lg font-medium mb-2 mt-4">4.2 We Do NOT:</h3>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Sell your personal information to third parties</li>
                                <li>Share your information for marketing purposes without consent</li>
                                <li>Disclose file content to unauthorized parties</li>
                            </ul>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold flex items-center gap-2 mb-3">
                                <Lock className="w-5 h-5" />
                                5. Data Security
                            </h2>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                We implement security measures including:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Encryption in transit (TLS/SSL)</li>
                                <li>Secure session management</li>
                                <li>Access controls and authentication</li>
                                <li>Regular security audits</li>
                                <li>Security monitoring and logging</li>
                                <li>Incident response procedures</li>
                            </ul>
                            <p className="text-muted-foreground leading-relaxed mt-3">
                                However, no method of transmission over the Internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
                            </p>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                We retain information for different periods based on its type:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li><strong>Session Data:</strong> Duration of session plus 30 days</li>
                                <li><strong>Audit Logs:</strong> 1-7 years depending on compliance requirements</li>
                                <li><strong>Security Events:</strong> Retained indefinitely for security analysis</li>
                                <li><strong>File History:</strong> Stored locally in your browser until cleared</li>
                                <li><strong>Anonymous Analytics:</strong> Aggregated indefinitely</li>
                            </ul>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">7. Your Rights and Choices</h2>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                Depending on your location, you may have rights to:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li><strong>Access:</strong> Request access to your personal information</li>
                                <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                                <li><strong>Deletion:</strong> Request deletion of your information (subject to legal retention requirements)</li>
                                <li><strong>Objection:</strong> Object to certain processing activities</li>
                                <li><strong>Data Portability:</strong> Request a copy of your data in portable format</li>
                                <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing where applicable</li>
                            </ul>
                            <p className="text-muted-foreground leading-relaxed mt-3">
                                Note: Some information (e.g., security audit logs) may be retained even after account deletion due to legal and security requirements.
                            </p>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">8. Cookies and Tracking</h2>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                We use browser storage mechanisms including:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li><strong>LocalStorage:</strong> For file history, preferences, and session data</li>
                                <li><strong>SessionStorage:</strong> For temporary session information</li>
                                <li><strong>Cookies:</strong> For authentication and session management</li>
                            </ul>
                            <p className="text-muted-foreground leading-relaxed mt-3">
                                You can clear this data through your browser settings, but this may affect Service functionality.
                            </p>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">9. Children's Privacy</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                The Service is not intended for users under 13 years of age. We do not knowingly collect information from children under 13. If you believe we have collected information from a child, please contact us immediately.
                            </p>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">10. International Data Transfers</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with applicable data protection laws.
                            </p>
                        </section>

                        <Separator />

                        <section>
                            <h2 className="text-xl font-semibold mb-3">11. Changes to This Policy</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last Updated" date. Material changes will be communicated through the Service or via email where appropriate.
                            </p>
                        </section>

                        <Separator />

                        <div className="mt-8 p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                By using File Viewer, you acknowledge that you have read and understood this Privacy Policy and consent to the collection and use of information as described herein.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6 flex justify-center gap-4 text-sm text-muted-foreground">
                    <Link to="/terms-of-service" className="hover:text-primary transition-colors">
                        Terms of Service
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
