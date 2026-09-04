import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import type { Transaction, Category, TransactionType } from '@/types';
import { getIcon } from '@/lib/icons';
import { todayISO, getCurrencySymbol } from '@/lib/format';

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id' | 'created_at' | 'category'>) => Promise<unknown>;
  onUpdate: (id: string, tx: Partial<Transaction>) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  categories: Category[];
  editingTransaction: Transaction | null;
}

export function TransactionModal({
  open,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  categories,
  editingTransaction,
}: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState(todayISO());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (editingTransaction) {
        setType(editingTransaction.type);
        setAmount(String(editingTransaction.amount));
        setDescription(editingTransaction.description);
        setCategoryId(editingTransaction.category_id ?? '');
        setDate(editingTransaction.date);
      } else {
        setType('expense');
        setAmount('');
        setDescription('');
        setCategoryId('');
        setDate(todayISO());
      }
      setError(null);
    }
  }, [open, editingTransaction]);

  if (!open) return null;

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Introduce una cantidad válida');
      return;
    }
    if (!description.trim()) {
      setError('Introduce una descripción');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        type,
        amount: numAmount,
        description: description.trim(),
        category_id: categoryId || null,
        date,
      };
      if (editingTransaction) {
        await onUpdate(editingTransaction.id, payload);
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
    if (!editingTransaction) return;
    setSaving(true);
    try {
      await onDelete(editingTransaction.id);
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
      <div className="relative w-full sm:max-w-md bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-800 shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">
            {editingTransaction ? 'Editar movimiento' : 'Nuevo movimiento'}
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
              onClick={() => {
                setType('expense');
                setCategoryId('');
              }}
              className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-medium transition-all ${
                type === 'expense'
                  ? 'bg-rose-500/20 text-rose-400 ring-2 ring-rose-500/50'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <TrendingDown size={18} />
              Gasto
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategoryId('');
              }}
              className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-medium transition-all ${
                type === 'income'
                  ? 'bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/50'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <TrendingUp size={18} />
              Ingreso
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Cantidad
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full bg-slate-800 text-white text-2xl font-bold rounded-2xl px-4 py-3 pl-10 outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-sky-500 transition-all"
                autoFocus
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-500">
                {getCurrencySymbol()}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Descripción
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Compra supermercado"
              className="w-full bg-slate-800 text-white rounded-2xl px-4 py-3 outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-sky-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Categoría
            </label>
            <div className="flex flex-wrap gap-2">
              {filteredCategories.map((cat) => {
                const Icon = getIcon(cat.icon);
                const selected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(selected ? '' : cat.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      selected
                        ? 'ring-2'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                    style={
                      selected
                        ? {
                            backgroundColor: `${cat.color}20`,
                            color: cat.color,
                            boxShadow: `0 0 0 2px ${cat.color}80`,
                          }
                        : undefined
                    }
                  >
                    <Icon size={16} />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Fecha
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-800 text-white rounded-2xl px-4 py-3 outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-sky-500 transition-all"
            />
          </div>

          {error && (
            <div className="text-sm text-rose-400 bg-rose-500/10 rounded-xl px-4 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            {editingTransaction && (
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
              {saving ? 'Guardando...' : editingTransaction ? 'Guardar cambios' : 'Añadir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
