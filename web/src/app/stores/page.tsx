'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import StoreCard from '../../components/StoreCard';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import Modal from '../../components/Modal';

interface Store {
  name: string;
  displayName: string;
  createTime?: string;
  documentCount?: number;
}

export default function StoresPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Store | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchStores = useCallback(async () => {
    try {
      const res = await fetch('/api/stores');
      const data = await res.json();
      setStores(data.stores ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const createStore = async () => {
    if (!newName.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: newName.trim() }),
      });
      if (res.ok) {
        setModalOpen(false);
        setNewName('');
        await fetchStores();
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteStore = async () => {
    if (!deleteTarget || deleting) return;
    const id = deleteTarget.name.replace('fileSearchStores/', '');
    setDeleting(true);
    try {
      const res = await fetch(`/api/stores/${id}?force=true`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteTarget(null);
        await fetchStores();
      }
    } finally {
      setDeleting(false);
    }
  };

  const navigateToStore = (name: string) => {
    const id = name.replace('fileSearchStores/', '');
    router.push(`/stores/${id}/documents`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Stores</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Manage your file search stores</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--amber)] text-[var(--bg-primary)] text-sm font-semibold hover:bg-[var(--amber-dim)] shadow-[0_0_16px_var(--amber-glow)] transition-all duration-200 cursor-pointer"
        >
          <Plus size={16} />
          Create Store
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <LoadingSkeleton variant="card" count={6} />
        </div>
      ) : stores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-[var(--text-muted)]">No stores yet.</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((store, i) => (
            <StoreCard
              key={store.name}
              displayName={store.displayName}
              name={store.name}
              createTime={store.createTime}
              documentCount={store.documentCount}
              index={i}
              onClick={() => navigateToStore(store.name)}
              onDelete={() => setDeleteTarget(store)}
            />
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setNewName(''); }}
        title="Create Store"
        actions={
          <>
            <button
              onClick={() => { setModalOpen(false); setNewName(''); }}
              className="px-4 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={createStore}
              disabled={!newName.trim() || creating}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--amber)] text-[var(--bg-primary)] hover:bg-[var(--amber-dim)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </>
        }
      >
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
            Display Name
          </label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') createStore(); }}
            placeholder="My Document Store"
            autoFocus
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--amber)] focus:outline-none transition-colors"
          />
        </div>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Store"
        actions={
          <>
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteStore}
              disabled={deleting}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Are you sure you want to delete <span className="font-semibold text-[var(--text-primary)]">{deleteTarget?.displayName}</span>? This will also delete all documents inside it. This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
