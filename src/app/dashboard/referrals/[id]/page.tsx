'use client';
import { notFound } from 'next/navigation';
import { db } from '@/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  File,
  User,
  HeartPulse,
  CalendarDays,
  Mail,
  Timeline,
  MessageSquare,
  Sparkles,
  Lightbulb,
  Loader2,
  Tag,
  Clock,
  ArrowLeft,
  Stethoscope,
  Building,
  ClipboardList,
  Info,
  Briefcase,
  UserPlus
} from 'lucide-react';
import StatusBadge from '@/components/referrals/status-badge';
import { formatDate } from '@/lib/utils';
import type { Referral, ReferralStatus } from '@/lib/types';
import { addInternalNote, updateReferralStatus } from '@/lib/actions';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useEffect, useState, useOptimistic, startTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';


function SubmitButton({ text, icon: Icon }: { text: string, icon?: React.ElementType }) {
    const { pending } = useFormStatus();
    return (
      <Button type="submit" disabled={pending} size="sm">
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (Icon && <Icon className="mr-2 h-4 w-4" />)}
        {text}
      </Button>
    );
}

export default function ReferralDetailPage({ params }: { params: { id:string } }) {
  const [referral, setReferral] = useState<Referral | null>(null);

  useEffect(() => {
    const fetchReferral = async () => {
      const data = await db.getReferralById(params.id);
      if (data) setReferral(data as Referral);
    };
    fetchReferral();
  }, [params.id]);

  const [optimisticReferral, setOptimisticReferral] = useOptimistic(
    referral,
    (state, { note, status }: { note?: string, status?: ReferralStatus }) => {
        if (!state) return null;
        const now = new Date();
        const newState = { ...state, updatedAt: now };
        if (note) {
            newState.internalNotes = [
                ...state.internalNotes,
                { id: `optimistic-${Date.now()}`, content: note, author: 'You', createdAt: now }
            ];
        }
        if (status) {
            newState.status = status;
            newState.statusHistory = [...state.statusHistory, { status, changedAt: now }];
        }
        return newState;
    }
  );

  const { toast } = useToast();
  const [noteState, noteFormAction, isNotePending] = useActionState(addInternalNote.bind(null, params.id), { message: '', success: false });

  if (!optimisticReferral) {
    return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );
  }

  const handleStatusChange = async (status: ReferralStatus) => {
    startTransition(() => {
        setOptimisticReferral({ status });
    });
    await updateReferralStatus(params.id, status);
    toast({ title: "Status Updated", description: `Referral status changed to ${status.replace('_', ' ').toLowerCase()}.` });
  };
  
  const handleDownload = (docUrl: string, docName: string) => {
    const link = document.createElement("a");
    link.href = docUrl;
    link.download = docName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const servicesMap = {
    skilledNursing: 'Skilled Nursing (SN)',
    physicalTherapy: 'Physical Therapy (PT)',
    occupationalTherapy: 'Occupational Therapy (OT)',
    speechTherapy: 'Speech Therapy (ST)',
    homeHealthAide: 'Home Health Aide (HHA)',
    medicalSocialWorker: 'Medical Social Worker (MSW)',
    providerAttendant: 'Provider Attendant Services (Medicaid)',
    other: 'Other'
  };

  const getServiceLabel = (serviceId: string): string => {
    return servicesMap[serviceId as keyof typeof servicesMap] || serviceId;
  };
  
  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
      </Link>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Referral Details</CardTitle>
                    <CardDescription>
                        Referral ID: {optimisticReferral.id} | Received: {formatDate(optimisticReferral.createdAt)}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-muted/30">
                            <CardHeader>
                                <CardTitle className="text-xl font-semibold flex items-center gap-2"><User className="text-primary"/> Patient Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <p><strong>Name:</strong> {optimisticReferral.patientName}</p>
                                <p><strong>DOB:</strong> {formatDate(optimisticReferral.patientDOB, 'yyyy-MM-dd')}</p>
                                <p><strong>Primary Insurance:</strong> {optimisticReferral.patientInsurance}</p>
                                <p><strong>Member ID:</strong> {optimisticReferral.memberId || 'Not Provided'}</p>
                            </CardContent>
                        </Card>
                         <Card className="bg-muted/30">
                            <CardHeader>
                                <CardTitle className="text-xl font-semibold flex items-center gap-2"><Building className="text-primary"/> Referrer Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <p><strong>Organization:</strong> {optimisticReferral.referrerName}</p>
                                <p><strong>Contact:</strong> {optimisticReferral.contactPerson}</p>
                                <p><strong>Phone:</strong> {optimisticReferral.referrerContact}</p>
                                <p><strong>Email:</strong> {optimisticReferral.confirmationEmail}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Separator />
                    
                    <div>
                        <h3 className="text-xl font-semibold flex items-center gap-2 mb-4"><Stethoscope className="text-primary"/> Services & Diagnosis</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div>
                                <h4 className="font-bold mb-2">Services Needed:</h4>
                                <ul className="list-disc list-inside space-y-1">
                                   {optimisticReferral.servicesNeeded?.map(service => <li key={service}>{getServiceLabel(service)}</li>)}
                                </ul>
                            </div>
                             <div>
                                <h4 className="font-bold mb-2">Diagnosis:</h4>
                                <p>{optimisticReferral.diagnosis}</p>
                            </div>
                        </div>
                    </div>
                    
                    {optimisticReferral.aiSummary && (
                        <>
                        <Separator />
                        <div>
                            <h3 className="text-xl font-semibold flex items-center gap-2 mb-4"><Sparkles className="text-primary" /> AI-Powered Suggestions</h3>
                             <h4 className="font-semibold flex items-center gap-2 mt-4"><Tag className="h-4 w-4"/> Suggested Categories</h4>
                            <div className="flex flex-wrap gap-2">
                                {optimisticReferral.aiSummary.suggestedCategories.map(cat => <Badge key={cat} variant="secondary">{cat}</Badge>)}
                            </div>
                            <h4 className="font-semibold flex items-center gap-2 mt-4"><Lightbulb className="h-4 w-4"/> Reasoning</h4>
                            <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">{optimisticReferral.aiSummary.reasoning}</p>
                        </div>
                        </>
                    )}


                    <Separator />
                    <div>
                        <h3 className="text-xl font-semibold flex items-center gap-2 mb-4"><File className="text-primary"/> Uploaded Files</h3>
                        {optimisticReferral.documents.length > 0 ? (
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                {optimisticReferral.documents.map(doc => (
                                    <li key={doc.id} className="flex items-center justify-between p-3 rounded-md bg-muted">
                                        <span className="font-medium">{doc.name}</span>
                                        <Button variant="ghost" size="sm" onClick={() => handleDownload(doc.url, doc.name)}>
                                            Download
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-center text-muted-foreground py-4">No files uploaded.</p>}
                    </div>
                </CardContent>
            </Card>

        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><HeartPulse className="text-primary" /> Manage Referral</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Change Status</Label>
                <Select onValueChange={(value) => handleStatusChange(value as ReferralStatus)} value={optimisticReferral.status}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECEIVED">Received</SelectItem>
                    <SelectItem value="IN_REVIEW">In Review</SelectItem>
                    <SelectItem value="ACCEPTED">Accepted</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="text-primary" /> Internal Notes</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {optimisticReferral.internalNotes.length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {optimisticReferral.internalNotes.slice().reverse().map(note => (
                      <div key={note.id} className="text-sm p-3 bg-muted rounded-md">
                        <p className="text-foreground">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">{note.author} - {formatDate(note.createdAt, "PPp")}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No internal notes yet.</p>
                )}
                <Separator />
                <form action={async (formData) => {
                    const note = formData.get('note') as string;
                    if (!note) return;
                    startTransition(() => setOptimisticReferral({ note }));
                    const form = formData.entries.length > 0 ? formData : new FormData();
                    if (!form.has('note')) form.append('note', note);
                    await noteFormAction(form);
                    (document.getElementById('note-textarea') as HTMLTextAreaElement).value = '';
                }} className="space-y-2">
                  <Textarea name="note" id="note-textarea" placeholder="Add a new note..." required />
                  <Button type="submit" disabled={isNotePending} size="sm">
                    {isNotePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                    Add Note
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Timeline className="text-primary" /> Status History</CardTitle></CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {optimisticReferral.statusHistory.slice().reverse().map((item, index) => (
                        <li key={index} className="flex items-start gap-4">
                             <div className="flex flex-col items-center">
                                <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center ring-4 ring-background" />
                                {index < optimisticReferral.statusHistory.length -1 && <div className="w-px h-full bg-border flex-1" />}
                            </div>
                            <div>
                                <StatusBadge status={item.status} />
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(item.changedAt, "PPp")}</p>
                                {item.notes && <p className="text-xs text-muted-foreground mt-1">Note: {item.notes}</p>}
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
