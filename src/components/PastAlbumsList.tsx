import { useState, useEffect } from 'react';
import { Download, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface RenderJob {
  id: string;
  period_start: string;
  period_end: string;
  status: 'running' | 'succeeded' | 'failed';
  pdf_url?: string;
  page_count?: number;
  requested_at: string;
  finished_at?: string;
}

interface PastAlbumsListProps {
  familyId: string;
}

export function PastAlbumsList({ familyId }: PastAlbumsListProps) {
  const [albums, setAlbums] = useState<RenderJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPastAlbums();
  }, [familyId]);

  const loadPastAlbums = async () => {
    try {
      setIsLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('render_jobs')
        .select('*')
        .eq('family_id', familyId)
        .order('requested_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setAlbums(data || []);
    } catch (err) {
      console.error('Error loading past albums:', err);
      setError('Failed to load past albums');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPeriod = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
      return startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    
    return `${startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Clock className="w-4 h-4" />;
      case 'succeeded':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-yellow-100 text-yellow-800';
      case 'succeeded':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownload = (pdfUrl: string) => {
    window.open(pdfUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-pink-500 mx-auto"></div>
        <p className="text-gray-500 mt-4">Loading past albums...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <Button onClick={loadPastAlbums} variant="outline" className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  if (albums.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No albums yet</h3>
        <p className="text-gray-500">Generate your first album to see it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {albums.map((album) => (
        <Card key={album.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {formatPeriod(album.period_start, album.period_end)}
              </CardTitle>
              <Badge className={getStatusColor(album.status)}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(album.status)}
                  {album.status}
                </div>
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                <p>Requested: {formatDate(album.requested_at)}</p>
                {album.finished_at && (
                  <p>Completed: {formatDate(album.finished_at)}</p>
                )}
                {album.page_count && (
                  <p>{album.page_count} pages</p>
                )}
              </div>
              {album.status === 'succeeded' && album.pdf_url && (
                <Button
                  onClick={() => handleDownload(album.pdf_url!)}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
