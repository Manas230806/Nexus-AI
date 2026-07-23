'use client';

import { useState } from 'react';
import { 
  FileText, Folder, Image as ImageIcon, MoreVertical, Search, 
  UploadCloud, File, Download, Trash2, X, Plus, Users, AlignLeft, 
  ArrowLeft
} from 'lucide-react';
import Shell from '../../../components/Shell';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspaceFiles, useUser } from '../../../hooks/useSupabase';

type FolderItemType = 'document' | 'image' | 'contact' | 'note';

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(dateString));
};

export default function FilesPage() {
  const { user } = useUser();
  const { folders, items, loading, createFolder, deleteFolder, createItem, deleteItem } = useWorkspaceFiles(user?.id || null);

  const [search, setSearch] = useState('');
  
  // Navigation State
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  // Modals
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [addItemType, setAddItemType] = useState<FolderItemType>('document');
  const [addItemName, setAddItemName] = useState('');

  const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  
  const activeFolder = folders.find(f => f.id === activeFolderId);
  const folderItems = items.filter(i => i.folder_id === activeFolderId);
  const filteredItems = folderItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await createFolder(newFolderName.trim());
    setNewFolderName('');
    setIsNewFolderModalOpen(false);
  };

  const handleAddItem = async () => {
    if (!addItemName.trim() || !activeFolderId) return;
    
    let sizeDesc = '1.2 MB';
    if (addItemType === 'contact') sizeDesc = 'Contact Info';
    if (addItemType === 'note') sizeDesc = 'Text Note';

    await createItem(activeFolderId, addItemName.trim(), addItemType, sizeDesc);

    setAddItemName('');
    setIsAddItemModalOpen(false);
  };

  const handleDeleteFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteFolder(id);
    if (activeFolderId === id) setActiveFolderId(null);
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-6 w-6 text-violet-400" />;
      case 'document': return <FileText className="h-6 w-6 text-emerald-400" />;
      case 'contact': return <Users className="h-6 w-6 text-amber-400" />;
      case 'note': return <AlignLeft className="h-6 w-6 text-sky-400" />;
      default: return <File className="h-6 w-6 text-[var(--text-muted)]" />;
    }
  };

  return (
    <Shell>
      <div className="flex h-full w-full flex-col space-y-6 p-6 lg:p-8 overflow-y-auto">
        
        {/* Header & Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-[28px] border border-[var(--border-color-strong)] bg-[var(--bg-hover)] p-6 backdrop-blur-md shrink-0">
          <div className="flex flex-col items-start gap-1">
            {activeFolderId ? (
              <button onClick={() => setActiveFolderId(null)} className="flex items-center gap-2 text-sm font-semibold text-sky-400 hover:text-sky-300 transition-colors mb-2">
                <ArrowLeft className="h-4 w-4" /> Back to Folders
              </button>
            ) : null}
            <h1 className="text-2xl font-semibold text-[var(--text-strong)] tracking-tight">
              {activeFolderId ? activeFolder?.name : 'Files & Documents'}
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {activeFolderId ? `${folderItems.length} items inside` : 'Manage your workspace folders and shared files.'}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] group-focus-within:text-sky-400 transition-colors" />
              <input 
                type="text" 
                placeholder={activeFolderId ? "Search items..." : "Search folders..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full sm:w-64 rounded-full border border-[var(--border-color-strong)] bg-[var(--bg-panel)]/50 pl-10 pr-4 text-sm text-[var(--text-main)] placeholder-slate-500 outline-none transition-all focus:border-sky-500/50 focus:bg-[var(--bg-hover-strong)]"
              />
            </div>
            
            {!activeFolderId ? (
              <button 
                onClick={() => setIsNewFolderModalOpen(true)}
                className="flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-violet-500 px-5 text-sm font-semibold text-[var(--text-strong)] shadow-lg shadow-sky-500/20 transition hover:opacity-90 whitespace-nowrap"
              >
                <Folder className="h-4 w-4" />
                New Folder
              </button>
            ) : (
              <button 
                onClick={() => setIsAddItemModalOpen(true)}
                className="flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-5 text-sm font-semibold text-[var(--text-strong)] shadow-lg shadow-emerald-500/20 transition hover:opacity-90 whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto rounded-[28px] border border-[var(--border-color-strong)] bg-[var(--bg-panel)]/40 p-6 shadow-xl backdrop-blur-xl scrollbar-hide min-h-[400px]">
          
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center py-20 text-[var(--text-muted)]">
               <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--border-color-strong)] border-t-sky-500 mb-4"></div>
               Loading workspace...
            </div>
          ) : !activeFolderId ? (
            /* FOLDERS VIEW */
            filteredFolders.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center py-20">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--bg-hover)] shadow-inner mb-4">
                  <Folder className="h-8 w-8 text-[var(--text-muted)]" />
                </div>
                <h3 className="text-lg font-medium text-[var(--text-strong)]">No folders found</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">Create a new folder to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredFolders.map((folder) => {
                  const itemsInFolder = items.filter(i => i.folder_id === folder.id);
                  return (
                    <motion.div 
                      key={folder.id}
                      layout
                      onClick={() => {
                        setActiveFolderId(folder.id);
                        setSearch('');
                      }}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -4, borderColor: 'rgba(56, 189, 248, 0.4)' }}
                      className="group relative flex flex-col rounded-[24px] border border-[var(--border-color-strong)] bg-[var(--bg-hover)] p-5 transition-all hover:bg-[var(--bg-hover-strong)] hover:shadow-[0_10px_40px_rgba(56,189,248,0.1)] cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-panel)]/50 shadow-inner">
                          <Folder className="h-6 w-6 text-sky-400" fill="currentColor" fillOpacity={0.2} />
                        </div>
                        <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                          <button onClick={(e) => handleDeleteFolder(folder.id, e)} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-[var(--bg-hover-strong)] text-[var(--text-muted)] hover:text-rose-400">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="truncate font-bold text-[var(--text-main)]" title={folder.name}>{folder.name}</p>
                        <div className="mt-1 flex items-center justify-between text-xs font-medium text-[var(--text-muted)]">
                          <span>{itemsInFolder.length} item{itemsInFolder.length !== 1 ? 's' : ''}</span>
                          <span>{formatDate(folder.created_at)}</span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )
          ) : (
            /* ITEMS VIEW */
            filteredItems.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center py-20">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--bg-hover)] shadow-inner mb-4">
                  <File className="h-8 w-8 text-[var(--text-muted)]" />
                </div>
                <h3 className="text-lg font-medium text-[var(--text-strong)]">This folder is empty</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">Add documents, images, contacts, or notes.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredItems.map((item) => (
                  <motion.div 
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -4, borderColor: 'rgba(56, 189, 248, 0.4)' }}
                    className="group relative flex flex-col rounded-[24px] border border-[var(--border-color-strong)] bg-[var(--bg-hover)] p-5 transition-all hover:bg-[var(--bg-hover-strong)] hover:shadow-[0_10px_40px_rgba(56,189,248,0.1)]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-panel)]/50 shadow-inner">
                        {getItemIcon(item.type)}
                      </div>
                      <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                        {['document', 'image'].includes(item.type) && (
                          <button className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-[var(--bg-hover-strong)] text-[var(--text-muted)] hover:text-sky-300">
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => deleteItem(item.id)} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-[var(--bg-hover-strong)] text-[var(--text-muted)] hover:text-rose-400">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="truncate font-medium text-[var(--text-main)]" title={item.name}>{item.name}</p>
                      <div className="mt-1 flex items-center justify-between text-xs text-[var(--text-muted)]">
                        <span>{item.size}</span>
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          )}
        </div>

      </div>

      {/* New Folder Modal */}
      <AnimatePresence>
        {isNewFolderModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="w-full max-w-md rounded-[24px] border border-[var(--border-color-strong)] bg-[var(--bg-panel)] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[var(--text-strong)]">Create New Folder</h2>
                <button onClick={() => setIsNewFolderModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-strong)]">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--text-main)] mb-2">Folder Name</label>
                <input 
                  type="text" 
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Project Alpha"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFolder();
                  }}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color-strong)] text-[var(--text-strong)] rounded-xl px-4 py-3 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all" 
                />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setIsNewFolderModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors">Cancel</button>
                <button onClick={handleCreateFolder} className="px-5 py-2.5 rounded-xl font-semibold bg-sky-500 text-white shadow-md hover:bg-sky-400 transition-colors">Create Folder</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Add Item Modal */}
        {isAddItemModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="w-full max-w-lg rounded-[24px] border border-[var(--border-color-strong)] bg-[var(--bg-panel)] p-6 shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6 shrink-0">
                <h2 className="text-xl font-bold text-[var(--text-strong)] truncate max-w-[80%]">Add Item to {activeFolder?.name}</h2>
                <button onClick={() => setIsAddItemModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-strong)]">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-y-auto scrollbar-hide flex-1 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-main)] mb-3">What do you want to add?</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button onClick={() => setAddItemType('document')} className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${addItemType === 'document' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-[var(--border-color-strong)] bg-[var(--bg-hover)] text-[var(--text-muted)] hover:border-[var(--border-color)]'}`}>
                      <FileText className="h-6 w-6" />
                      <span className="text-xs font-bold uppercase">Document</span>
                    </button>
                    <button onClick={() => setAddItemType('image')} className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${addItemType === 'image' ? 'border-violet-500 bg-violet-500/10 text-violet-400' : 'border-[var(--border-color-strong)] bg-[var(--bg-hover)] text-[var(--text-muted)] hover:border-[var(--border-color)]'}`}>
                      <ImageIcon className="h-6 w-6" />
                      <span className="text-xs font-bold uppercase">Image</span>
                    </button>
                    <button onClick={() => setAddItemType('contact')} className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${addItemType === 'contact' ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-[var(--border-color-strong)] bg-[var(--bg-hover)] text-[var(--text-muted)] hover:border-[var(--border-color)]'}`}>
                      <Users className="h-6 w-6" />
                      <span className="text-xs font-bold uppercase">Contact</span>
                    </button>
                    <button onClick={() => setAddItemType('note')} className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${addItemType === 'note' ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-[var(--border-color-strong)] bg-[var(--bg-hover)] text-[var(--text-muted)] hover:border-[var(--border-color)]'}`}>
                      <AlignLeft className="h-6 w-6" />
                      <span className="text-xs font-bold uppercase">Note</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                    {addItemType === 'document' || addItemType === 'image' ? 'File Name (Mock Upload)' : 
                     addItemType === 'contact' ? 'Contact Name & Number' : 'Note Title'}
                  </label>
                  <input 
                    type="text" 
                    value={addItemName}
                    onChange={(e) => setAddItemName(e.target.value)}
                    placeholder={
                      addItemType === 'document' ? 'e.g. Q4_Report.pdf' : 
                      addItemType === 'image' ? 'e.g. screenshot.jpg' : 
                      addItemType === 'contact' ? 'e.g. John Doe (555-0192)' : 
                      'e.g. Meeting Minutes'
                    }
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddItem();
                    }}
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color-strong)] text-[var(--text-strong)] rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" 
                  />
                  
                  {/* Mock content area for note/contact to make it look realistic */}
                  {(addItemType === 'contact' || addItemType === 'note') && (
                    <textarea 
                      placeholder={addItemType === 'contact' ? 'Additional contact details...' : 'Type your note here...'}
                      rows={3}
                      className="w-full bg-[var(--bg-main)] border border-[var(--border-color-strong)] text-[var(--text-strong)] rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all mt-3 resize-none"
                    ></textarea>
                  )}
                  
                  {(addItemType === 'document' || addItemType === 'image') && (
                    <div className="mt-3 flex items-center justify-center w-full rounded-xl border-2 border-dashed border-[var(--border-color-strong)] p-6 bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)] hover:border-[var(--border-color)] transition-all cursor-pointer">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <UploadCloud className="h-4 w-4" /> Click to browse or drag file here
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--border-color)] shrink-0">
                <button onClick={() => setIsAddItemModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors">Cancel</button>
                <button onClick={handleAddItem} className="px-5 py-2.5 rounded-xl font-semibold bg-emerald-500 text-white shadow-md hover:bg-emerald-400 transition-colors">Save Item</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Shell>
  );
}
