'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Trash2 } from 'lucide-react';
import DocumentRow from '../../../../components/DocumentRow';
import FileUploadZone from '../../../../components/FileUploadZone';
import MetadataEditor from '../../../../components/MetadataEditor';
import LoadingSkeleton from '../../../../components/LoadingSkeleton';
import Modal from '../../../../components/Modal';

interface Document {
  name: string;
  displayName: string;
  state?: string;
  createTime?: string;
}

export default function DocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [metadata, setMetadata] = useState<Record<string, string | number>>({});
  const [maxTokens, setMaxTokens] = useState('');
  const [overlap, setOverlap] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingStore, setDeletingStore] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/stores/${id}/documents`);
      const data = await res.json();
      setDocuments(data.documents ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || uploading) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('displayName', selectedFile.name);
      if (maxTokens) formData.append('maxTokensPerChunk', maxTokens);
      if (overlap) formData.append('maxOverlapTokens', overlap);
      if (Object.keys(metadata).length > 0) formData.append('metadata', JSON.stringify(metadata));

      const res = await fetch(`/api/stores/${id}/documents`, { method: 'POST', body: formData });
      if (res.ok) {
        setSelectedFile(null);
        await fetchDocuments();
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteStore = async () => {
    if (deletingStore) return;
    setDeletingStore(true);
    try {
      const res = await fetch(`/api/stores/${id}?force=true`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/stores');
      }
    } finally {
      setDeletingStore(false);
    }
  };

  const handleDelete = async (docName: string) => {
    const docId = docName.split('/').pop();
    if (!docId) return;
    try {
      await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      await fetchDocuments();
    } catch {
      // silent
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push('/stores')}
          className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Documents</h1>
          <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">{id}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setLoading(true); fetchDocuments(); }}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--amber)] hover:bg-[var(--amber-glow)] transition-colors cursor-pointer"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Upload section */}
      <div className="mb-8 space-y-4">
        <FileUploadZone onFileSelect={handleFileSelect} uploading={uploading} />

        {selectedFile && (
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{selectedFile.name}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--amber)] text-[var(--bg-primary)] hover:bg-[var(--amber-dim)] disabled:opacity-50 shadow-[0_0_12px_var(--amber-glow)] transition-all cursor-pointer"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                  Max Tokens/Chunk
                </label>
                <input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(e.target.value)}
                  placeholder="256"
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--amber)] focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                  Overlap Tokens
                </label>
                <input
                  type="number"
                  value={overlap}
                  onChange={(e) => setOverlap(e.target.value)}
                  placeholder="64"
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--amber)] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <MetadataEditor onChange={setMetadata} />
          </div>
        )}
      </div>

      {/* Documents table */}
      {loading ? (
        <div>
          <LoadingSkeleton variant="row" count={5} />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-[var(--text-muted)]">No documents yet. Upload one above.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border-subtle)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider py-3 px-4">
                  Document
                </th>
                <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider py-3 px-4">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider py-3 px-4">
                  Created
                </th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, i) => (
                <DocumentRow
                  key={doc.name}
                  displayName={doc.displayName}
                  name={doc.name}
                  state={doc.state}
                  createTime={doc.createTime}
                  index={i}
                  onDelete={() => handleDelete(doc.name)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Store"
        actions={
          <>
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteStore}
              disabled={deletingStore}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {deletingStore ? 'Deleting...' : 'Delete Store'}
            </button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Are you sure you want to delete this store and all its documents? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
