import { useState, useEffect, useRef, useCallback } from 'react';
import { getEmbedUrlForType } from '../../lib/embed-utils';
import { useStrata } from '../../contexts/StrataContext';
import { EmbedToolbar } from './EmbedToolbar';
import { GoogleDocEmbed } from './GoogleDocEmbed';
import { GoogleFormEmbed } from './GoogleFormEmbed';
import { GoogleMapEmbed } from './GoogleMapEmbed';
import { GoogleDrawingEmbed } from './GoogleDrawingEmbed';
import { GoogleVidEmbed } from './GoogleVidEmbed';
import { PdfEmbed } from './PdfEmbed';
import { GenericDriveEmbed } from './GenericDriveEmbed';
import { LucidchartEmbed } from './LucidchartEmbed';
import { MiroEmbed } from './MiroEmbed';
import { DrawIoEmbed } from './DrawIoEmbed';

/**
 * Main embed page component that routes to the correct service-specific component.
 * In Electron: the content area is a native WebContentsView managed via IPC.
 * In browser: falls back to the existing iframe-based embed components.
 */
export function EmbedPage({
  page,
  onUpdate,
  onToggleStar,
  onEditUrl,
  isStarred = false,
  isActive = false,
}) {
  const contentRef = useRef(null)
  const isElectron = !!window.electronAPI?.isElectron
  const { hibernatedSnapshots } = useStrata()
  const isHibernated = isElectron && hibernatedSnapshots.has(page?.id)
  const snapshot = hibernatedSnapshots.get(page?.id)

  // View mode state (edit/preview) - persist in page data or local
  const [viewMode, setViewMode] = useState(() => {
    if (page?.viewMode) return page.viewMode;
    if (page?.embedUrl?.includes('/preview')) return 'preview';
    return 'edit';
  });

  // Update view mode when page changes
  useEffect(() => {
    if (page?.viewMode) {
      setViewMode(page.viewMode);
    } else if (page?.embedUrl?.includes('/preview')) {
      setViewMode('preview');
    } else {
      setViewMode('edit');
    }
  }, [page?.id, page?.viewMode, page?.embedUrl]);

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (onUpdate) {
      const embedUrl = (page?.driveFileId && ['doc', 'sheet', 'slide'].includes(page?.type))
        ? getEmbedUrlForType(page.type, page.driveFileId, mode)
        : (mode === 'preview' && page?.embedUrl?.includes('/edit'))
          ? page.embedUrl.replace('/edit', '/preview')
          : (mode === 'edit' && page?.embedUrl?.includes('/preview'))
            ? page.embedUrl.replace('/preview', '/edit')
            : page?.embedUrl;
      onUpdate({ viewMode: mode, ...(embedUrl && { embedUrl }) });
    }
  };

  // Measure the content area bounds in CSS pixels
  // On high-DPI screens, multiply by devicePixelRatio if views appear offset.
  const getBounds = useCallback(() => {
    if (!contentRef.current) return null
    const rect = contentRef.current.getBoundingClientRect()
    return {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    }
  }, [])

  // Show or hide the native WebContentsView based on whether this page is active
  useEffect(() => {
    if (!isElectron || !page?.embedUrl) return
    if (isActive) {
      const bounds = getBounds()
      if (bounds && bounds.width > 0 && bounds.height > 0) {
        window.electronAPI.embed.show(page.id, page.embedUrl, bounds)
      }
    } else {
      window.electronAPI.embed.hide(page.id)
    }
    return () => {
      window.electronAPI.embed.hide(page.id)
    }
  }, [page?.id, page?.embedUrl, isElectron, getBounds, isActive])

  // Resize the native view whenever the content container changes size
  useEffect(() => {
    if (!isElectron || !contentRef.current) return
    const ro = new ResizeObserver(() => {
      const bounds = getBounds()
      if (bounds && bounds.width > 0 && bounds.height > 0) {
        window.electronAPI.embed.resize(page.id, bounds)
      }
    })
    ro.observe(contentRef.current)
    return () => ro.disconnect()
  }, [page?.id, isElectron, getBounds])

  // Safety net: re-sync bounds when the Electron window itself is resized
  useEffect(() => {
    if (!isElectron) return
    const handler = () => {
      if (!isActive) return
      const bounds = getBounds()
      if (bounds && bounds.width > 0 && bounds.height > 0) {
        window.electronAPI.embed.resize(page.id, bounds)
      }
    }
    window.electronAPI.onWindowResized(handler)
    // ipcRenderer.on returns the renderer; no cleanup needed for safety-net listener
  }, [page?.id, isElectron, getBounds, isActive])

  // Render the appropriate iframe-based embed component (browser fallback)
  const renderEmbed = () => {
    const type = page?.type;
    switch (type) {
      case 'doc':
      case 'sheet':
      case 'slide':
        return <GoogleDocEmbed page={page} viewMode={viewMode} />;
      case 'form':
        return <GoogleFormEmbed page={page} />;
      case 'map':
        return <GoogleMapEmbed page={page} />;
      case 'drawing':
        return <GoogleDrawingEmbed page={page} />;
      case 'vid':
        return <GoogleVidEmbed page={page} />;
      case 'pdf':
        return <PdfEmbed page={page} />;
      case 'miro':
        return <MiroEmbed page={page} />;
      case 'drawio':
        return <DrawIoEmbed page={page} />;
      case 'lucidchart':
        return <LucidchartEmbed page={page} />;
      case 'site':
      case 'script':
      case 'drive':
      default:
        return <GenericDriveEmbed page={page} />;
    }
  };

  if (!page) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        No page selected
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <EmbedToolbar
        page={page}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onEditUrl={onEditUrl}
        onToggleStar={onToggleStar}
        isStarred={isStarred}
      />
      <div ref={contentRef} className="flex-1 min-h-0 overflow-hidden relative">
        {isHibernated ? (
          <>
            {snapshot && (
              <img
                src={snapshot}
                className="w-full h-full object-cover object-top"
                alt="Hibernated page snapshot"
              />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 gap-3">
              <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl px-6 py-4 text-center shadow-lg">
                <div className="text-2xl mb-1">💤</div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Hibernated</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click this page to restore</p>
              </div>
            </div>
          </>
        ) : (
          /* In Electron: content is a native WebContentsView overlaid here */
          /* In browser: render existing iframe-based components */
          !isElectron && renderEmbed()
        )}
      </div>
    </div>
  );
}
