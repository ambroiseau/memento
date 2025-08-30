import { useState } from 'react';
import { Button } from './ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import toast from 'react-hot-toast';

interface GenerateAlbumButtonProps {
  familyId: string;
  userId: string;
}

export function GenerateAlbumButton({ familyId, userId }: GenerateAlbumButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAlbum = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    
    try {
      // Get current month date range
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const start = startOfMonth.toISOString().split('T')[0]; // YYYY-MM-DD
      const end = endOfMonth.toISOString().split('T')[0]; // YYYY-MM-DD

      // Call the PDF renderer service
      const response = await fetch(`${import.meta.env.VITE_PDF_RENDERER_URL}/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          family_id: familyId,
          start,
          end,
          requested_by: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.ok && result.pdf_url) {
        toast.success('Album generated successfully!');
        
        // Open PDF in new tab
        window.open(result.pdf_url, '_blank');
      } else {
        throw new Error(result.error || 'Failed to generate album');
      }
    } catch (error) {
      console.error('Error generating album:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('HTTP 404') || errorMessage.includes('Failed to fetch')) {
        toast.error('PDF service is not available. Please check if the service is running.');
      } else {
        toast.error('Failed to generate album. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={generateAlbum}
      disabled={isGenerating}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileText className="w-4 h-4" />
      )}
      {isGenerating ? 'Generating...' : 'Generate Album'}
    </Button>
  );
}
