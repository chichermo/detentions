'use client';

import { useState, useEffect } from 'react';
import { Save, FileText, Trash2, Plus } from 'lucide-react';
import { Detention } from '@/types';

interface DetentionTemplate {
  id: string;
  name: string;
  template: Partial<Detention>;
  createdAt: string;
}

const STORAGE_KEY = 'nablijven_templates';

export function getTemplates(): DetentionTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveTemplate(name: string, template: Partial<Detention>): string {
  const templates = getTemplates();
  const newTemplate: DetentionTemplate = {
    id: `template-${Date.now()}`,
    name,
    template,
    createdAt: new Date().toISOString(),
  };
  templates.push(newTemplate);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  return newTemplate.id;
}

export function deleteTemplate(id: string): void {
  const templates = getTemplates();
  const filtered = templates.filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

interface DetentionTemplateManagerProps {
  onSelectTemplate: (template: Partial<Detention>) => void;
  currentDetention?: Partial<Detention>;
}

export default function DetentionTemplateManager({ onSelectTemplate, currentDetention }: DetentionTemplateManagerProps) {
  const [templates, setTemplates] = useState<DetentionTemplate[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    setTemplates(getTemplates());
  };

  const handleSave = () => {
    if (!templateName.trim() || !currentDetention) return;
    saveTemplate(templateName, currentDetention);
    setTemplateName('');
    setShowSaveDialog(false);
    loadTemplates();
  };

  const handleDelete = (id: string) => {
    if (confirm('Weet je zeker dat je deze template wilt verwijderen?')) {
      deleteTemplate(id);
      loadTemplates();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {templates.length > 0 && (
        <div className="relative">
          <button className="btn-secondary text-sm px-3 py-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </button>
          <div className="absolute right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 min-w-[200px]">
            <div className="p-2 border-b border-slate-700">
              <h4 className="text-sm font-semibold text-slate-200">Templates</h4>
            </div>
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-2 hover:bg-slate-700 group"
              >
                <button
                  onClick={() => onSelectTemplate(template.template)}
                  className="flex-1 text-left text-sm text-slate-200 hover:text-indigo-400"
                >
                  {template.name}
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentDetention && (
        <button
          onClick={() => setShowSaveDialog(true)}
          className="btn-secondary text-sm px-3 py-2 flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Opslaan als Template
        </button>
      )}

      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Template Opslaan</h3>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Naam van de template"
              className="input-field mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={handleSave} className="btn-primary flex-1">
                Opslaan
              </button>
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setTemplateName('');
                }}
                className="btn-secondary"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
