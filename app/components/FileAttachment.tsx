'use client';

import { useState, useEffect } from 'react';
import { Upload, X, File, Download, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface FileAttachmentProps {
  recordId: string;
  recordType: 'detention' | 'student';
  onUploadComplete?: () => void;
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
}

export default function FileAttachment({ recordId, recordType, onUploadComplete }: FileAttachmentProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAttachments = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('record_id', recordId)
        .eq('record_type', recordType)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      console.error('Error loading attachments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !supabase) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${recordType}-${recordId}-${Date.now()}.${fileExt}`;
      const filePath = `${recordType}/${recordId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('attachments')
        .insert({
          id: `attachment-${Date.now()}`,
          record_id: recordId,
          record_type: recordType,
          name: file.name,
          url: publicUrl,
          size: file.size,
          uploaded_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      await loadAttachments();
      onUploadComplete?.();
    } catch (error: any) {
      console.error('Error uploading file:', error);
      alert('Fout bij uploaden van bestand: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId: string, filePath: string) => {
    if (!confirm('Weet je zeker dat je dit bestand wilt verwijderen?')) return;
    if (!supabase) return;

    try {
      const { error: deleteError } = await supabase.storage
        .from('attachments')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      const { error: dbError } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachmentId);

      if (dbError) throw dbError;

      await loadAttachments();
    } catch (error: any) {
      console.error('Error deleting file:', error);
      alert('Fout bij verwijderen van bestand: ' + error.message);
    }
  };

  useState(() => {
    loadAttachments();
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!supabase) {
    return (
      <div className="card p-4">
        <p className="text-sm text-slate-400">Bestandsbijlagen zijn niet beschikbaar (Supabase niet geconfigureerd)</p>
      </div>
    );
  }

  return (
    <div className="card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-100">Bijlagen</h3>
        <label className="btn-secondary cursor-pointer flex items-center gap-2 text-sm">
          <Upload className="h-4 w-4" />
          Upload
          <input
            type="file"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">Laden...</p>
      ) : attachments.length === 0 ? (
        <p className="text-slate-400 text-sm">Geen bijlagen</p>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <File className="h-5 w-5 text-indigo-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{attachment.name}</p>
                  <p className="text-xs text-slate-400">{formatFileSize(attachment.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 p-2"
                  title="Downloaden"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  onClick={() => handleDelete(attachment.id, attachment.url)}
                  className="text-red-400 hover:text-red-300 p-2"
                  title="Verwijderen"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
