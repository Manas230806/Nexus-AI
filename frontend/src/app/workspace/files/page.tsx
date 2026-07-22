'use client';

import { useState } from 'react';
import { FileText, Folder, Image as ImageIcon, MoreVertical, Search, UploadCloud, File, Download, Trash2 } from 'lucide-react';
import Shell from '../../../components/Shell';
import { motion } from 'framer-motion';

type FileItem = {
  id: string;
  name: string;
  type: 'folder' | 'document' | 'image' | 'other';
  size: string;
  updatedAt: string;
};

const initialFiles: FileItem[] = [
  { id: '1', name: 'Design Assets', type: 'folder', size: '--', updatedAt: '2 hours ago' },
  { id: '2', name: 'Q3 Roadmaps', type: 'folder', size: '--', updatedAt: '1 day ago' },
  { id: '3', name: 'Project_Alpha_Brief.pdf', type: 'document', size: '2.4 MB', updatedAt: '3 hours ago' },
  { id: '4', name: 'hero-banner-v2.png', type: 'image', size: '4.1 MB', updatedAt: '5 hours ago' },
  { id: '5', name: 'Q2_Financials.xlsx', type: 'document', size: '1.1 MB', updatedAt: '2 days ago' },
];

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [search, setSearch] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setFiles([{
        id: Math.random().toString(),
        name: `New_Upload_${Math.floor(Math.random() * 100)}.pdf`,
        type: 'document',
        size: '1.5 MB',
        updatedAt: 'Just now'
      }, ...files]);
      setIsUploading(false);
    }, 1500);
  };

  const deleteFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'folder': return <Folder className="h-6 w-6 text-sky-400" fill="currentColor" fillOpacity={0.2} />;
      case 'image': return <ImageIcon className="h-6 w-6 text-violet-400" />;
      case 'document': return <FileText className="h-6 w-6 text-emerald-400" />;
      default: return <File className="h-6 w-6 text-[var(--text-muted)]" />;
    }
  };

  return (
    <Shell>
      <div className="flex h-full w-full flex-col space-y-6 p-6 lg:p-8">
        
        {/* Header & Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-[28px] border border-[var(--border-color-strong)] bg-[var(--bg-hover)] p-6 backdrop-blur-md">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-strong)] tracking-tight">Files & Documents</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Manage your project assets and shared files.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] group-focus-within:text-sky-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Search files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full sm:w-64 rounded-full border border-[var(--border-color-strong)] bg-[var(--bg-panel)]/50 pl-10 pr-4 text-sm text-[var(--text-main)] placeholder-slate-500 outline-none transition-all focus:border-sky-500/50 focus:bg-[var(--bg-hover-strong)]"
              />
            </div>
            <button 
              onClick={handleUpload}
              disabled={isUploading}
              className="flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-violet-500 px-5 text-sm font-semibold text-[var(--text-strong)] shadow-lg shadow-sky-500/20 transition hover:opacity-90 disabled:opacity-50"
            >
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                  Uploading...
                </span>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  Upload
                </>
              )}
            </button>
          </div>
        </div>

        {/* Files Grid */}
        <div className="flex-1 overflow-y-auto rounded-[28px] border border-[var(--border-color-strong)] bg-[var(--bg-panel)]/40 p-6 shadow-xl backdrop-blur-xl scrollbar-hide">
          {filteredFiles.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--bg-hover)] shadow-inner mb-4">
                <Search className="h-8 w-8 text-[var(--text-muted)]" />
              </div>
              <h3 className="text-lg font-medium text-[var(--text-strong)]">No files found</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">Try adjusting your search terms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredFiles.map((file) => (
                <motion.div 
                  key={file.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4, borderColor: 'rgba(56, 189, 248, 0.4)' }}
                  className="group relative flex flex-col rounded-[24px] border border-[var(--border-color-strong)] bg-[var(--bg-hover)] p-5 transition-all hover:bg-[var(--bg-hover-strong)] hover:shadow-[0_10px_40px_rgba(56,189,248,0.1)]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-panel)]/50 shadow-inner">
                      {getIcon(file.type)}
                    </div>
                    <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                      <button className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-[var(--bg-hover-strong)] text-[var(--text-muted)] hover:text-sky-300">
                        <Download className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteFile(file.id)} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-[var(--bg-hover-strong)] text-[var(--text-muted)] hover:text-rose-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="truncate font-medium text-[var(--text-main)]" title={file.name}>{file.name}</p>
                    <div className="mt-1 flex items-center justify-between text-xs text-[var(--text-muted)]">
                      <span>{file.size !== '--' ? file.size : 'Folder'}</span>
                      <span>{file.updatedAt}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Shell>
  );
}
