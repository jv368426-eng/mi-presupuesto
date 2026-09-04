import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { Category, TransactionType } from '@/types';
import { getIcon, availableIcons, availableColors } from '@/lib/icons';

interface CategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (cat: Omit<Category, 'id' | 'created_at'>) => Promise<unknown>;
  onUpdate: (id: string, cat: Partial<Category>) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  editingCategory: Category | null;
  categories: Category[];
}

export function CategoryModal({
  open,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  editingCategory,
  categories,
}: CategoryModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [color, setColor] = useState(availableColors[0]);
  const [icon, setIcon] = useState('Wallet');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (editingCategory) {
        setName(editingCategory.name);
        setType(editingCategory.type);
        setColor(editingCategory.color);
        setIcon(editingCategory.icon);
        setBudgetLimit(
          editingCategory.budget_limit != null
            ? String(editingCategory.budget_limit)
            : '',
        );
      } else {
        setName('');
        setType('expense');
        setColor(availableColors[0]);
        setIcon('Wallet');
        setBudgetLimit('');
      }
      setError(null);
    }
  }, [open, editingCategory]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Introduce un nombre');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const maxSort = Math.max(0, ...categories.map((c) => c.sort_order));
      const payload = {
        name: name.trim(),
        type,
        color,
        icon,
        budget_limit: type === 'expense' && budgetLimit ? parseFloat(budgetLimit) : null,
        sort_order: editingCategory ? editingCategory.sort_order : maxSort + 1,
      };
      if (editingCategory) {
        await onUpdate(editingCategory.id, payload);
      } else {
        await onSave(payload);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingCategory) return;
    setSaving(true);
    try {
      await onDelete(editingCategory.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md max-h-[90vh] overflow-y-auto bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-800 shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <h2 className="text-lg font-semibold text-white">
            {editingCategory ? 'Editar categoría' : 'Nueva categoría'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-3 rounded-2xl font-medium transition-all ${
                type === 'expense'
                  ? 'bg-rose-500/20 text-rose-400 ring-2 ring-rose-500/50'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-3 rounded-2xl font-medium transition-all ${
                type === 'income'
                  ? 'bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/50'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Ingreso
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Suscripciones"
              className="w-full bg-slate-800 text-white rounded-2xl px-4 py-3 outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-sky-500 transition-all"
              autoFocus
            />
          </div>

          {type === 'expense' && (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">
                Límite mensual (€) — opcional
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(e.target.value)}
                placeholder="Sin límite"
                className="w-full bg-slate-800 text-white rounded-2xl px-4 py-3 outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-sky-500 transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {availableColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-9 h-9 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Icono
            </label>
            <div className="grid grid-cols-8 gap-2">
              {availableIcons.map((iconName) => {
                const Icon = getIcon(iconName);
                const selected = icon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                      selected
                        ? 'bg-slate-700 ring-2 ring-sky-500'
                        : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                    style={selected ? { color } : undefined}
                  >
                    <Icon size={18} />
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="text-sm text-rose-400 bg-rose-500/10 rounded-xl px-4 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            {editingCategory && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-2xl bg-sky-500 text-white font-semibold hover:bg-sky-400 transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : editingCategory ? 'Guardar cambios' : 'Crear categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
