'use client';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CreditCard, FileText, Plus, Copy, Check, Upload, X, Download, Trash2 } from 'lucide-react';
import Shell from '../../../components/Shell';
import { useUser, useMemoryVault } from '../../../hooks/useSupabase';

export default function MemoryPage() {
  const { user } = useUser();
  const { memories, loading, addMemory, deleteMemory } = useMemoryVault(user?.id || null);
  
  const [activeTab, setActiveTab] = useState<'bank' | 'document'>('bank');
  
  // Modals
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  
  // Bank Form State
  const [bankTitle, setBankTitle] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [accountName, setAccountName] = useState('');
  
  // Document Form State
  const [docTitle, setDocTitle] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddBank = async () => {
    if (!bankTitle || !bankName || !accountNumber) return;
    await addMemory('bank', bankTitle, { bankName, accountNumber, ifsc, accountName });
    setIsBankModalOpen(false);
    // reset
    setBankTitle(''); setBankName(''); setAccountNumber(''); setIfsc(''); setAccountName('');
  };

  const handleAddDocument = async () => {
    if (!docTitle || !docFile) return;
    setIsUploading(true);
    await addMemory('document', docTitle, {}, docFile);
    setIsUploading(false);
    setIsDocModalOpen(false);
    // reset
    setDocTitle(''); setDocFile(null);
  };

  const bankMemories = memories.filter(m => m.type === 'bank');
  const docMemories = memories.filter(m => m.type === 'document');

  return (
    <Shell>
      <div className="flex h-full w-full flex-col p-6 lg:p-10 relative z-10 overflow-y-auto scrollbar-hide">
        <div className="max-w-6xl mx-auto w-full space-y-8">
          
          {/* Header */}
          <div className="flex items-center gap-4 border-b border-[var(--border-color)] pb-6">
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-strong)] tracking-tight">Memory Vault</h1>
              <p className="text-sm text-[var(--text-muted)] mt-1">End-to-end encrypted secure storage for your sensitive information.</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('bank')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'bank' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-[var(--bg-panel)] text-[var(--text-muted)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)]'}`}
            >
              <CreditCard className="w-4 h-4" />
              Bank Information
            </button>
            <button 
              onClick={() => setActiveTab('document')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'document' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-[var(--bg-panel)] text-[var(--text-muted)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)]'}`}
            >
              <FileText className="w-4 h-4" />
              Secure Documents
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-20 text-[var(--text-muted)]">Decrypting vault...</div>
          ) : (
            <div className="pb-20">
              {activeTab === 'bank' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-[var(--text-strong)]">Saved Accounts</h2>
                    <button onClick={() => setIsBankModalOpen(true)} className="flex items-center gap-2 bg-[rgb(var(--accent-main))] text-[var(--text-strong)] px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-[rgb(var(--accent-main))]/20 hover:opacity-90 transition-opacity">
                      <Plus className="w-4 h-4" /> Add Account
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bankMemories.length === 0 && <p className="text-[var(--text-muted)] col-span-full">No bank information stored yet.</p>}
                    {bankMemories.map(memory => (
                      <div key={memory.id} className="relative group p-6 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-color)] hover:border-indigo-500/30 transition-all shadow-sm">
                         <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => deleteMemory(memory.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20"><Trash2 className="w-4 h-4" /></button>
                         </div>
                         <h3 className="text-lg font-bold text-[var(--text-strong)] mb-4">{memory.title}</h3>
                         <div className="space-y-3">
                           <div>
                             <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Bank Name</p>
                             <p className="text-sm text-[var(--text-main)] font-medium">{memory.data.bankName}</p>
                           </div>
                           <div>
                             <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Account Holder</p>
                             <p className="text-sm text-[var(--text-main)] font-medium">{memory.data.accountName}</p>
                           </div>
                           <div>
                             <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Account Number</p>
                             <div className="flex items-center justify-between bg-[var(--bg-main)] p-2 rounded-lg border border-[var(--border-color)]">
                               <p className="text-sm font-mono text-[var(--text-strong)]">{memory.data.accountNumber}</p>
                               <button onClick={() => handleCopy(memory.data.accountNumber, memory.id + 'acc')} className="text-[var(--text-muted)] hover:text-[var(--text-strong)]">
                                 {copiedId === memory.id + 'acc' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                               </button>
                             </div>
                           </div>
                           <div>
                             <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">IFSC Code</p>
                             <div className="flex items-center justify-between bg-[var(--bg-main)] p-2 rounded-lg border border-[var(--border-color)]">
                               <p className="text-sm font-mono text-[var(--text-strong)]">{memory.data.ifsc}</p>
                               <button onClick={() => handleCopy(memory.data.ifsc, memory.id + 'ifsc')} className="text-[var(--text-muted)] hover:text-[var(--text-strong)]">
                                 {copiedId === memory.id + 'ifsc' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                               </button>
                             </div>
                           </div>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'document' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-[var(--text-strong)]">Secure Documents</h2>
                    <button onClick={() => setIsDocModalOpen(true)} className="flex items-center gap-2 bg-[rgb(var(--accent-main))] text-[var(--text-strong)] px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-[rgb(var(--accent-main))]/20 hover:opacity-90 transition-opacity">
                      <Upload className="w-4 h-4" /> Upload Document
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {docMemories.length === 0 && <p className="text-[var(--text-muted)] col-span-full">No documents stored yet.</p>}
                    {docMemories.map(memory => (
                      <div key={memory.id} className="relative group flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-color)] hover:border-sky-500/30 transition-all shadow-sm">
                        <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-[var(--text-strong)] truncate">{memory.title}</h3>
                          <p className="text-xs text-[var(--text-muted)] uppercase mt-1">{memory.data.fileExt} • {new Date(memory.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <a href={memory.data.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-[var(--bg-hover)] text-[var(--text-main)] rounded-lg hover:text-[var(--text-strong)]">
                            <Download className="w-4 h-4" />
                          </a>
                          <button onClick={() => deleteMemory(memory.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bank Modal */}
      <AnimatePresence>
        {isBankModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-[var(--bg-panel)] border border-[var(--border-color-strong)] rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-[var(--text-strong)]">Add Bank Details</h3>
                <button onClick={() => setIsBankModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-strong)]"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Title (e.g., Primary Savings)</label>
                  <input type="text" value={bankTitle} onChange={e => setBankTitle(e.target.value)} className="w-full mt-1 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-2 text-[var(--text-main)] outline-none focus:border-[rgb(var(--accent-main))]" placeholder="Title" />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Bank Name</label>
                  <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} className="w-full mt-1 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-2 text-[var(--text-main)] outline-none focus:border-[rgb(var(--accent-main))]" placeholder="e.g., Chase Bank" />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Account Holder Name</label>
                  <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)} className="w-full mt-1 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-2 text-[var(--text-main)] outline-none focus:border-[rgb(var(--accent-main))]" placeholder="John Doe" />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Account Number</label>
                  <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="w-full mt-1 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-2 text-[var(--text-main)] font-mono outline-none focus:border-[rgb(var(--accent-main))]" placeholder="000000000" />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider">IFSC / Routing Code</label>
                  <input type="text" value={ifsc} onChange={e => setIfsc(e.target.value)} className="w-full mt-1 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-2 text-[var(--text-main)] font-mono outline-none focus:border-[rgb(var(--accent-main))]" placeholder="CODE1234" />
                </div>
                <button onClick={handleAddBank} disabled={!bankTitle || !bankName || !accountNumber} className="w-full mt-4 bg-[rgb(var(--accent-main))] text-[var(--text-strong)] font-bold py-3 rounded-xl shadow-lg disabled:opacity-50 hover:opacity-90">
                  Save Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Document Modal */}
      <AnimatePresence>
        {isDocModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-[var(--bg-panel)] border border-[var(--border-color-strong)] rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-[var(--text-strong)]">Upload Secure Document</h3>
                <button onClick={() => setIsDocModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-strong)]"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Document Title</label>
                  <input type="text" value={docTitle} onChange={e => setDocTitle(e.target.value)} className="w-full mt-1 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-2 text-[var(--text-main)] outline-none focus:border-[rgb(var(--accent-main))]" placeholder="e.g., Tax Returns 2026" />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2 block">File</label>
                  <input type="file" ref={fileInputRef} onChange={e => setDocFile(e.target.files?.[0] || null)} className="hidden" />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-[var(--border-color)] rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-sky-500/50 hover:bg-sky-500/5 transition-all text-center"
                  >
                    {docFile ? (
                      <div className="text-sky-400">
                        <FileText className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm font-semibold truncate max-w-xs">{docFile.name}</p>
                      </div>
                    ) : (
                      <div className="text-[var(--text-muted)]">
                        <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Click to select a file</p>
                        <p className="text-xs mt-1">PDF, DOCX, JPG, EXCEL etc.</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <button onClick={handleAddDocument} disabled={!docTitle || !docFile || isUploading} className="w-full mt-4 bg-[rgb(var(--accent-main))] text-[var(--text-strong)] font-bold py-3 rounded-xl shadow-lg disabled:opacity-50 hover:opacity-90 flex items-center justify-center">
                  {isUploading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-5 h-5 border-2 border-[var(--text-strong)] border-t-transparent rounded-full" />
                  ) : (
                    'Secure Upload'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </Shell>
  );
}
