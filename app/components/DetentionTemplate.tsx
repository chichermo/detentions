'use client';

import { useState, useEffect, useRef } from 'react';
import { Save, FileText, Trash2, ChevronDown } from 'lucide-react';
import { Detention } from '@/types';
import Modal from '@/app/components/ui/Modal';

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
  const filtered = templates.filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

interface DetentionTemplateManagerProps {
  onSelectTemplate: (template: Partial<Detention>) => void;
  currentDetention?: Partial<Detention>;
}

export default function DetentionTemplateManager({
  onSelectTemplate,
  currentDetention,
}: DetentionTemplateManagerProps) {
  const [templates, setTemplates] = useState<DetentionTemplate[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTemplates(getTemplates());
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleSave = () => {
    if (!templateName.trim() || !currentDetention) return;
    saveTemplate(templateName.trim(), currentDetention);
    setTemplateName('');
    setShowSaveDialog(false);
    setTemplates(getTemplates());
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Weet je zeker dat je deze template wilt verwijderen?')) {
      deleteTemplate(id);
      setTemplates(getTemplates());
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {templates.length > 0 && (
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="btn-secondary text-sm px-3 py-2 flex items-center gap-2"
            aria-expanded={menuOpen}
            aria-haspopup="listbox"
          >
            <FileText className="h-4 w-4" aria-hidden />
            Templates ({templates.length})
            <ChevronDown className={`h-4 w-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>
          {menuOpen && (
            <ul className="dropdown-menu right-0 left-auto min-w-[220px]" role="listbox">
              {templates.map((template) => (
                <li key={template.id} className="group flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTemplate(template.template);
                      setMenuOpen(false);
                    }}
                    className="dropdown-item flex-1"
                  >
                    {template.name}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(template.id, e)}
                    className="p-2 text-[var(--coral)] opacity-70 group-hover:opacity-100 shrink-0"
                    aria-label={`Template ${template.name} verwijderen`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {currentDetention && (
        <button
          type="button"
          onClick={() => {
            setMenuOpen(false);
            setShowSaveDialog(true);
          }}
          className="btn-secondary text-sm px-3 py-2 flex items-center gap-2"
        >
          <Save className="h-4 w-4" aria-hidden />
          Opslaan als template
        </button>
      )}

      <Modal
        open={showSaveDialog}
        onClose={() => {
          setShowSaveDialog(false);
          setTemplateName('');
        }}
        title="Template opslaan"
        description="Sla huidige velden op als herbruikbare template (lokaal op dit apparaat)."
        footer={
          <>
            <button type="button" onClick={handleSave} className="btn-primary flex-1">
              Opslaan
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSaveDialog(false);
                setTemplateName('');
              }}
              className="btn-secondary flex-1"
            >
              Annuleren
            </button>
          </>
        }
      >
        <label className="form-label" htmlFor="template-name">
          Naam
        </label>
        <input
          id="template-name"
          type="text"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="Naam van de template"
          className="input-field w-full"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
        />
      </Modal>
    </div>
  );
}
