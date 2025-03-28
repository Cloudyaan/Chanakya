
import React from 'react';
import { TenantUpdate } from '@/utils/types';
import { ClockIcon, InfoIcon, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface UpdateDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  update: TenantUpdate | null;
}

const UpdateDetailsDialog = ({ isOpen, onOpenChange, update }: UpdateDetailsDialogProps) => {
  if (!update) return null;

  const getBadgeVariant = (actionType: string | undefined) => {
    if (!actionType) return 'default';
    if (actionType === 'Action Required') return 'destructive';
    if (actionType === 'Plan for Change') return 'purple';
    return 'default';
  };

  const getBadgeIcon = (actionType: string | undefined) => {
    if (actionType === 'Action Required') return <AlertTriangle size={12} />;
    return <InfoIcon size={12} />;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  const formatDescription = (description: string) => {
    if (!description) return "";
    
    // Split by common headline indicators
    const sections = description.split(/(?:\r?\n){2,}/);
    
    return sections.map((section, index) => {
      // Enhanced headline detection
      const isHeadline = (
        (section.length < 100 && section.toUpperCase() === section) || 
        (section.length < 100 && section.trim().endsWith(':')) || 
        (section.length < 100 && /^[A-Z][A-Za-z\s\-,]+[:\.]?/.test(section))
      );
      
      if (isHeadline) {
        return <h3 key={index} className="text-base font-bold text-gray-800 mt-4 mb-2">{section}</h3>;
      }
      
      // Enhanced bullet point detection and formatting
      if (
        section.trim().startsWith('•') || 
        section.trim().startsWith('-') || 
        /^\s*[\-•]\s/.test(section) ||
        section.includes('\n•') ||
        section.includes('\n-')
      ) {
        const listItems = section.split(/\r?\n/).filter(item => item.trim());
        return (
          <ul key={index} className="list-disc pl-5 my-2 space-y-1">
            {listItems.map((item, i) => (
              <li key={i} className="mb-2">{item.replace(/^[•\-\s]+/, '').trim()}</li>
            ))}
          </ul>
        );
      }
      
      // Regular paragraph
      return <p key={index} className="mb-3 text-gray-700">{section}</p>;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge 
              variant={getBadgeVariant(update.actionType)}
              className="flex gap-1 items-center"
            >
              {getBadgeIcon(update.actionType)}
              {update.actionType || 'Informational'}
            </Badge>
            {update.actionType === 'Plan for Change' ? (
              <Badge variant="purple">
                {update.category || 'General'}
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {update.category || 'General'}
              </Badge>
            )}
          </div>
          <DialogTitle className="text-xl">
            {update.title}
          </DialogTitle>
          <DialogDescription className="flex justify-between items-center mt-2">
            <span className="font-mono text-xs">
              ID: {update.messageId || update.id}
            </span>
            <span className="text-sm flex items-center gap-1">
              <ClockIcon size={14} />
              Last updated: {formatDate(update.publishedDate)}
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6 prose prose-sm max-w-none overflow-auto max-h-[60vh] px-2">
          {formatDescription(update.description)}
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateDetailsDialog;
