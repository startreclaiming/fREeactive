import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useEntitlement } from '@/lib/entitlement';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, FolderOpen, Plus, FileText, Home, DollarSign, Scale, Users, Trash2, X, Loader2, Search, Clock, LogIn, User } from 'lucide-react';

interface DocumentVaultProps {
  onBack: () => void;
  onOpenAuth?: () => void;
  onNavigate?: (section: string) => void;
}

interface Document {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  notes: string;
  created_at: string;
}

const DocumentVault: React.FC<DocumentVaultProps> = ({ onBack, onOpenAuth, onNavigate }) => {
  const { user } = useAuth();
  const { isProActive, loading: entitlementLoading } = useEntitlement();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('home');
  const [subcategory, setSubcategory] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    // Only ever query with a real user id — there is no "anonymous" vault, and
    // documents.user_id is a UUID column, so a literal 'anonymous' string always
    // errored and returned nothing anyway.
    if (user) loadDocuments();
  }, [user]);

  const loadDocuments = async () => {
    if (!user) return;
    const { data } = await supabase.from('documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setDocuments(data);
  };

  const addDocument = async () => {
    if (!title || !user) return;
    setLoading(true);
    await supabase.from('documents').insert({
      user_id: user.id,
      title,
      category,
      subcategory,
      notes,
    });
    setTitle(''); setSubcategory(''); setNotes('');
    setShowForm(false);
    await loadDocuments();
    setLoading(false);
  };

  const deleteDocument = async (id: string) => {
    await supabase.from('documents').delete().eq('id', id);
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const filtered = documents.filter(d => {
    const matchesSearch = search === '' || d.title.toLowerCase().includes(search.toLowerCase()) || d.notes?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'all' || d.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryIcons: Record<string, React.ReactNode> = {
    home: <Home className="w-4 h-4 text-blue-600" />,
    money: <DollarSign className="w-4 h-4 text-emerald-600" />,
    resolve: <Scale className="w-4 h-4 text-amber-600" />,
    community: <Users className="w-4 h-4 text-orange-600" />,
  };

  const categoryColors: Record<string, string> = {
    home: 'bg-blue-50 border-blue-200',
    money: 'bg-emerald-50 border-emerald-200',
    resolve: 'bg-amber-50 border-amber-200',
    community: 'bg-orange-50 border-orange-200',
  };

  // The Document Vault ("Permanent Audit Vault") is a PROactive-only feature per
  // PricingSection — gating on `user` alone let a signed-in user whose trial had
  // fully expired keep using it forever. Gate on entitlement, not just an account.
  if (!entitlementLoading && (!user || !isProActive)) {
    const expired = !!user && !isProActive;
    return (
      <div>
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FolderOpen className="w-10 h-10 text-purple-600" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-3">Secure Document Vault</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            {expired
              ? 'Your trial has ended. Upgrade to PROactive to keep storing and organizing your bills, receipts, legal papers, and maintenance records.'
              : 'Sign in to securely store and organize your bills, receipts, legal papers, and maintenance records.'}
          </p>
          <button
            onClick={expired ? () => onNavigate?.('pricing') : onOpenAuth}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg"
          >
            <LogIn className="w-5 h-5" /> {expired ? 'Upgrade to PROactive' : 'Sign In to Access Vault'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900">
            Document <span className="text-purple-600">Vault</span>
          </h2>
          <p className="text-gray-500 mt-2 text-lg">Securely store and organize your important documents.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" /> Add Document
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white">
            <option value="all">All Categories</option>
            <option value="home">Home</option>
            <option value="money">Money</option>
            <option value="resolve">Resolve</option>
            <option value="community">Community</option>
          </select>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Add Document</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Document Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Electric bill - March 2026" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white">
                  <option value="home">Home</option>
                  <option value="money">Money</option>
                  <option value="resolve">Resolve</option>
                  <option value="community">Community</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Subcategory (optional)</label>
                <input type="text" value={subcategory} onChange={e => setSubcategory(e.target.value)} placeholder="e.g., Utility bills, Legal filings..." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional details..." className="w-full h-24 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none" />
              </div>
              <button onClick={addDocument} disabled={loading || !title} className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Save Document
              </button>
            </div>
          </div>
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => (
            <div key={doc.id} className={`rounded-2xl border p-5 ${categoryColors[doc.category]} hover:shadow-md transition-all`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {categoryIcons[doc.category]}
                  <span className="text-xs font-semibold capitalize text-gray-500">{doc.category}</span>
                  {doc.subcategory && <span className="text-xs text-gray-400">/ {doc.subcategory}</span>}
                </div>
                <button onClick={() => deleteDocument(doc.id)} className="p-1.5 hover:bg-red-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">{doc.title}</h4>
              {doc.notes && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{doc.notes}</p>}
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                {new Date(doc.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-400">
            {documents.length === 0 ? 'No documents yet' : 'No matching documents'}
          </h3>
          <p className="text-gray-400 mt-2">
            {documents.length === 0 ? 'Start organizing your important documents here.' : 'Try adjusting your search or filter.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentVault;
