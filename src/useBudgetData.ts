import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Transaction, Category } from '@/types';

export function useBudgetData() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [txRes, catRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('*, category:categories(*)')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('sort_order'),
      ]);

      if (txRes.error) throw txRes.error;
      if (catRes.error) throw catRes.error;

      setTransactions(txRes.data as Transaction[]);
      setCategories(catRes.data as Category[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addTransaction = useCallback(
    async (tx: Omit<Transaction, 'id' | 'created_at' | 'category'>) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          type: tx.type,
          amount: tx.amount,
          description: tx.description,
          category_id: tx.category_id,
          date: tx.date,
        })
        .select('*, category:categories(*)')
        .single();
      if (error) throw error;
      setTransactions((prev) => [data as Transaction, ...prev]);
      return data as Transaction;
    },
    [],
  );

  const updateTransaction = useCallback(
    async (id: string, tx: Partial<Transaction>) => {
      const { data, error } = await supabase
        .from('transactions')
        .update({
          type: tx.type,
          amount: tx.amount,
          description: tx.description,
          category_id: tx.category_id,
          date: tx.date,
        })
        .eq('id', id)
        .select('*, category:categories(*)')
        .single();
      if (error) throw error;
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? (data as Transaction) : t)),
      );
      return data as Transaction;
    },
    [],
  );

  const deleteTransaction = useCallback(async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addCategory = useCallback(
    async (cat: Omit<Category, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: cat.name,
          type: cat.type,
          color: cat.color,
          icon: cat.icon,
          budget_limit: cat.budget_limit,
          sort_order: cat.sort_order,
        })
        .select('*')
        .single();
      if (error) throw error;
      setCategories((prev) => [...prev, data as Category].sort((a, b) => a.sort_order - b.sort_order));
      return data as Category;
    },
    [],
  );

  const updateCategory = useCallback(
    async (id: string, cat: Partial<Category>) => {
      const { data, error } = await supabase
        .from('categories')
        .update({
          name: cat.name,
          type: cat.type,
          color: cat.color,
          icon: cat.icon,
          budget_limit: cat.budget_limit,
          sort_order: cat.sort_order,
        })
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? (data as Category) : c)).sort((a, b) => a.sort_order - b.sort_order),
      );
      return data as Category;
    },
    [],
  );

  const deleteCategory = useCallback(async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return {
    transactions,
    categories,
    loading,
    error,
    reload: loadData,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}
