'use client';

import { useState, useRef } from 'react';
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
  const draggedIdRef = useRef<string | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    draggedIdRef.current = detentions[index].id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedIndex === null || draggedIndex === dropIndex || draggedIdRef.current === null) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      draggedIdRef.current = null;
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
    draggedIdRef.current = null;
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    draggedIdRef.current = null;
  };

  return (
    <>
      {detentions.map((detention, index) => {
        const isDragging = draggedIndex === index;
        
        return (
          <div
            key={detention.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            style={{ display: 'contents' }}
          >
            {children(detention, index, isDragging)}
          </div>
        );
      })}
    </>
  );
}
