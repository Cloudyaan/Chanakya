
import React from 'react';
import { WindowsUpdate } from '@/utils/types';
import { ClockIcon, MonitorIcon, InfoIcon, ExternalLink, CheckCircle2, AlertTriangle } from 'lucide-react';
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

interface WindowsUpdateDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  update: WindowsUpdate | null;
}

const WindowsUpdateDetailsDialog = ({ isOpen, onOpenChange, update }: WindowsUpdateDetailsDialogProps) => {
  if (!update) return null;

  const getStatusBadge = (status: string | null | undefined) => {
    if (!status) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
    
    switch (status.toLowerCase()) {
      case 'released':
        return <Badge variant="outline" className="flex gap-1 items-center bg-green-100 text-green-800 border-green-300">
          <CheckCircle2 size={12} />
          Released
        </Badge>;
      case 'investigating':
        return <Badge variant="outline" className="flex gap-1 items-center bg-amber-100 text-amber-800 border-amber-300">
          <AlertTriangle size={12} />
          Investigating
        </Badge>;
      default:
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">
          {status}
        </Badge>;
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString || 'N/A';
    }
  };

  const formatDescription = (description: string | undefined) => {
    if (!description) return <p className="text-gray-500 italic">No description available.</p>;
    
    const isHtml = /<[a-z][\s\S]*>/i.test(description);
    
    if (isHtml) {
      return <div dangerouslySetInnerHTML={{ __html: description }} className="prose prose-sm max-w-none" />;
    }
    
    const sections = description.split(/(?:\r?\n){2,}/);
    
    return sections.map((section, index) => {
      const isHeadline = (
        (section.length < 100 && section.toUpperCase() === section) || 
        (section.length < 100 && section.trim().endsWith(':')) || 
        (section.length < 100 && /^[A-Z][A-Za-z\s\-,]+[:\.]?/.test(section))
      );
      
      if (isHeadline) {
        return <h3 key={index} className="text-base font-bold text-gray-800 mt-4 mb-2">{section}</h3>;
      }
      
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
      
      return <p key={index} className="mb-3 text-gray-700">{section}</p>;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            {getStatusBadge(update.status)}
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 flex items-center gap-1">
              <MonitorIcon size={12} />
              {update.productName || 'Windows Update'}
            </Badge>
          </div>
          <DialogTitle className="text-xl">
            {update.title || 'Windows Update'}
          </DialogTitle>
          <DialogDescription className="flex justify-between items-center mt-2">
            <span className="font-mono text-xs">
              ID: {update.id || 'Unknown'}
            </span>
            <span className="text-sm flex items-center gap-1">
              <ClockIcon size={14} />
              Date: {formatDate(update.startDate)}
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6 prose prose-sm max-w-none overflow-auto max-h-[60vh] px-2">
          {formatDescription(update.description)}
        </div>
        
        {update.webViewUrl && (
          <div className="mt-4 flex justify-start">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(update.webViewUrl, '_blank', 'noopener,noreferrer')}
              className="flex items-center gap-1"
            >
              <ExternalLink size={14} />
              View in Microsoft Portal
            </Button>
          </div>
        )}
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WindowsUpdateDetailsDialog;
