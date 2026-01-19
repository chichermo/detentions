'use client';

import { useState } from 'react';
import { GripVertical } from 'lucide-react';
import { Detention } from '@/types';

interface DragDropDetentionsProps {
  detentions: Detention[];
  onReorder: (reorderedDetentions: Detention[]) => void;
  children: (detention: Detention, index: number, isDragging: boolean) => React.ReactNode;
}

export default function DragDropDetentions({
  detentions,
  onReorder,
  children,
}: DragDropDetentionsProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newDetentions = [...detentions];
    const draggedItem = newDetentions[draggedIndex];
    
    // Remove dragged item
    newDetentions.splice(draggedIndex, 1);
    
    // Insert at new position
    newDetentions.splice(dropIndex, 0, draggedItem);
    
    // Update numbers
    newDetentions.forEach((detention, index) => {
      detention.number = index + 1;
    });

    onReorder(newDetentions);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-2">
      {detentions.map((detention, index) => (
        <div
          key={detention.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={`
            relative transition-all duration-200
            ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
            ${dragOverIndex === index ? 'scale-105 border-indigo-500' : ''}
          `}
        >
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full pr-2 cursor-move text-slate-500 hover:text-indigo-400">
            <GripVertical className="h-5 w-5" />
          </div>
          {children(detention, index, draggedIndex === index)}
        </div>
      ))}
    </div>
  );
}
