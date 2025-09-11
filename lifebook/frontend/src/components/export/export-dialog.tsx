'use client';

import React, { useState, useCallback, useRef } from 'react';

// Types based on data model
interface ExportRequest {
  documentId: string;
  format: 'pdf' | 'html' | 'markdown' | 'word';
  parameters: {
    includeMetadata?: boolean;
    includeToc?: boolean;
    includePageNumbers?: boolean;
    headerFooter?: {
      header?: string;
      footer?: string;
    };
    styling?: {
      fontSize?: number;
      fontFamily?: string;
      margins?: {
        top: number;
        right: number;
        bottom: number;
        left: number;
      };
    };
    sections?: {
      included: string[];
      excluded: string[];
    };
  };
}

interface ExportStatus {
  id: string;
  documentId: string;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  filePath?: string;
  fileSize?: number;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

interface Document {
  id: string;
  title: string;
  wordCount: number;
  status: string;
  sections: Array<{
    id: string;
    title: string;
    level: number;
    wordCount: number;
  }>;
}

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
  onExport: (request: ExportRequest) => Promise<string>; // Returns export ID
  onDownload?: (exportId: string) => void;
  className?: string;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  document,
  onExport,
  onDownload,
  className = ''
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'html' | 'markdown' | 'word'>('pdf');
  const [exportParameters, setExportParameters] = useState({
    includeMetadata: true,
    includeToc: true,
    includePageNumbers: true,
    headerFooter: {
      header: '',
      footer: ''
    },
    styling: {
      fontSize: 12,
      fontFamily: 'Times New Roman',
      margins: {
        top: 2.5,
        right: 2.5,
        bottom: 2.5,
        left: 2.5
      }
    },
    sections: {
      included: document?.sections?.map(s => s.id) || [],
      excluded: []
    }
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<ExportStatus | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  const progressRef = useRef<HTMLDivElement>(null);

  // Format options
  const formatOptions = [
    {
      value: 'pdf',
      label: 'PDF',
      description: 'Portable Document Format - Best for printing and sharing',
      icon: '📄',
      features: ['Page numbers', 'Table of contents', 'Headers/footers', 'Custom styling']
    },
    {
      value: 'html',
      label: 'HTML',
      description: 'Web format - Best for online viewing',
      icon: '🌐',
      features: ['Interactive navigation', 'Responsive design', 'Search functionality']
    },
    {
      value: 'markdown',
      label: 'Markdown',
      description: 'Plain text format - Best for version control',
      icon: '📝',
      features: ['Plain text', 'Easy editing', 'Version control friendly']
    },
    {
      value: 'word',
      label: 'Word',
      description: 'Microsoft Word format - Best for collaborative editing',
      icon: '📘',
      features: ['Editable format', 'Comments support', 'Track changes']
    }
  ];

  // Font options
  const fontOptions = [
    'Times New Roman',
    'Arial',
    'Helvetica',
    'Georgia',
    'Palatino',
    'Garamond'
  ];

  // Handle format change
  const handleFormatChange = useCallback((format: typeof selectedFormat) => {
    setSelectedFormat(format);
    
    // Reset format-specific parameters
    if (format === 'markdown') {
      setExportParameters(prev => ({
        ...prev,
        includePageNumbers: false,
        headerFooter: { header: '', footer: '' }
      }));
    } else if (format === 'html') {
      setExportParameters(prev => ({
        ...prev,
        includePageNumbers: false
      }));
    }
  }, []);

  // Handle parameter change
  const handleParameterChange = useCallback((path: string, value: any) => {
    setExportParameters(prev => {
      const newParams = { ...prev };
      const keys = path.split('.');
      let current = newParams;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) {
          (current as any)[keys[i]] = {};
        }
        current = (current as any)[keys[i]];
      }
      
      (current as any)[keys[keys.length - 1]] = value;
      return newParams;
    });
  }, []);

  // Handle section selection
  const handleSectionToggle = useCallback((sectionId: string, included: boolean) => {
    setExportParameters(prev => ({
      ...prev,
      sections: {
        included: included 
          ? [...prev.sections.included, sectionId]
          : prev.sections.included.filter(id => id !== sectionId),
        excluded: included
          ? prev.sections.excluded.filter(id => id !== sectionId)
          : [...prev.sections.excluded, sectionId]
      }
    }));
  }, []);

  // Handle export
  const handleExport = useCallback(async () => {
    if (!document) return;

    setIsExporting(true);
    setExportStatus({
      id: 'temp-id',
      documentId: document.id,
      format: selectedFormat,
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString()
    });

    try {
      const exportRequest: ExportRequest = {
        documentId: document.id,
        format: selectedFormat,
        parameters: exportParameters
      };

      const exportId = await onExport(exportRequest);
      
      // Simulate progress updates (in real app, this would come from WebSocket/polling)
      const progressInterval = setInterval(() => {
        setExportStatus(prev => {
          if (!prev || prev.status === 'completed' || prev.status === 'failed') {
            clearInterval(progressInterval);
            return prev;
          }
          
          const newProgress = Math.min((prev.progress || 0) + 10, 90);
          return {
            ...prev,
            status: newProgress < 90 ? 'processing' : 'processing',
            progress: newProgress
          };
        });
      }, 500);

      // Complete after 5 seconds (mock)
      setTimeout(() => {
        clearInterval(progressInterval);
        setExportStatus(prev => prev ? {
          ...prev,
          id: exportId,
          status: 'completed',
          progress: 100,
          filePath: `/exports/${exportId}.${selectedFormat}`,
          fileSize: Math.floor(Math.random() * 1000000) + 100000, // Mock file size
          completedAt: new Date().toISOString()
        } : null);
        setIsExporting(false);
      }, 5000);

    } catch (error) {
      setExportStatus(prev => prev ? {
        ...prev,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Export failed'
      } : null);
      setIsExporting(false);
    }
  }, [document, selectedFormat, exportParameters, onExport]);

  // Handle download
  const handleDownload = useCallback(() => {
    if (exportStatus?.id && onDownload) {
      onDownload(exportStatus.id);
    }
  }, [exportStatus, onDownload]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Export Document</h2>
            <p className="text-sm text-gray-600 mt-1">
              Export "{document?.title}" ({document?.wordCount.toLocaleString()} words)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isExporting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Export Status */}
          {exportStatus && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Export Status</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  exportStatus.status === 'completed' ? 'bg-green-100 text-green-800' :
                  exportStatus.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {exportStatus.status}
                </span>
              </div>

              {exportStatus.status === 'processing' && (
                <div className="mb-2">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Processing...</span>
                    <span>{exportStatus.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${exportStatus.progress || 0}%` }}
                    />
                  </div>
                </div>
              )}

              {exportStatus.status === 'completed' && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <div>File size: {exportStatus.fileSize && formatFileSize(exportStatus.fileSize)}</div>
                    <div>Completed: {exportStatus.completedAt && new Date(exportStatus.completedAt).toLocaleString()}</div>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Download
                  </button>
                </div>
              )}

              {exportStatus.status === 'failed' && (
                <div className="text-sm text-red-600">
                  Error: {exportStatus.errorMessage}
                </div>
              )}
            </div>
          )}

          {/* Format Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Format</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formatOptions.map((format) => (
                <div
                  key={format.value}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedFormat === format.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleFormatChange(format.value as any)}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{format.icon}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{format.label}</h4>
                      <p className="text-sm text-gray-600">{format.description}</p>
                    </div>
                    {selectedFormat === format.value && (
                      <div className="ml-auto">
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Features: {format.features.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Basic Options */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Export Options</h3>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportParameters.includeMetadata}
                  onChange={(e) => handleParameterChange('includeMetadata', e.target.checked)}
                  className="mr-3"
                />
                <span className="text-sm">Include document metadata (author, dates, version)</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportParameters.includeToc}
                  onChange={(e) => handleParameterChange('includeToc', e.target.checked)}
                  className="mr-3"
                  disabled={selectedFormat === 'markdown'}
                />
                <span className="text-sm">Include table of contents</span>
              </label>

              {selectedFormat === 'pdf' && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportParameters.includePageNumbers}
                    onChange={(e) => handleParameterChange('includePageNumbers', e.target.checked)}
                    className="mr-3"
                  />
                  <span className="text-sm">Include page numbers</span>
                </label>
              )}
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <div className="mb-4">
            <button
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <span>Advanced Options</span>
              <svg 
                className={`w-4 h-4 ml-1 transform transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Advanced Options */}
          {showAdvancedOptions && (
            <div className="space-y-6">
              {/* Section Selection */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Sections to Include</h4>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded p-3">
                  {document?.sections?.map((section) => (
                    <label key={section.id} className="flex items-center py-2 border-b border-gray-100 last:border-b-0">
                      <input
                        type="checkbox"
                        checked={exportParameters.sections.included.includes(section.id)}
                        onChange={(e) => handleSectionToggle(section.id, e.target.checked)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{section.title}</span>
                          <span className="text-xs text-gray-500">H{section.level + 1}</span>
                          <span className="text-xs text-gray-500">{section.wordCount} words</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Styling Options (PDF only) */}
              {selectedFormat === 'pdf' && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Styling Options</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
                      <select
                        value={exportParameters.styling.fontFamily}
                        onChange={(e) => handleParameterChange('styling.fontFamily', e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      >
                        {fontOptions.map(font => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
                      <input
                        type="number"
                        value={exportParameters.styling.fontSize}
                        onChange={(e) => handleParameterChange('styling.fontSize', parseInt(e.target.value))}
                        min="8"
                        max="24"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Headers and Footers (PDF only) */}
              {selectedFormat === 'pdf' && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Headers & Footers</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Header Text</label>
                      <input
                        type="text"
                        value={exportParameters.headerFooter.header}
                        onChange={(e) => handleParameterChange('headerFooter.header', e.target.value)}
                        placeholder="e.g., Document Title | Company Name"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
                      <input
                        type="text"
                        value={exportParameters.headerFooter.footer}
                        onChange={(e) => handleParameterChange('headerFooter.footer', e.target.value)}
                        placeholder="e.g., Confidential | Page {pageNumber}"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {exportParameters.sections.included.length} of {document?.sections?.length || 0} sections selected
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || exportParameters.sections.included.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export {selectedFormat.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;