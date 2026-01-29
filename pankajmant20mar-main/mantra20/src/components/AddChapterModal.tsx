import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { createChapter } from '../lib/api/chapters';
import { toast } from 'react-hot-toast';

interface AddChapterModalProps {
  novelId: string;
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
  lastChapterNumber: number;
}

export default function AddChapterModal({ 
  novelId, 
  isOpen, 
  onClose, 
  onAdd,
  lastChapterNumber 
}: AddChapterModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a chapter title');
      return;
    }

    try {
      setLoading(true);
      const result = await createChapter({
        novel_id: novelId,
        title: formData.title.trim(),
        content: formData.content.trim(),
        chapter_number: lastChapterNumber + 1
      });

      if (!result.success) throw new Error(result.error);
      
      onAdd();
      onClose();
    } catch (error: any) {
      console.error('Error adding chapter:', error);
      toast.error(error.message || 'Failed to add chapter');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
          disabled={loading}
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6">Add New Chapter</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Chapter Title</label>
            <input
              type="text"
              required
              disabled={loading}
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Content</label>
            <textarea
              required
              disabled={loading}
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 h-96"
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Adding Chapter...
                </>
              ) : (
                'Add Chapter'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}