import { useStrata } from '../../contexts/StrataContext';
import { useRef, useEffect } from 'react';
import { useAppActions } from '../../hooks/useAppActions';

export function GenericDriveEmbed({ page }) {
  const { pageContents } = useStrata();
  const { updateLocalName, syncRenameToDrive } = useAppActions();
  const pageContent = pageContents?.[page.id];
  const webviewRef = useRef(null);

  // Fix the raw .json loading bug
  let finalUrl = page.embedUrl;
  if (!finalUrl && pageContent?.content) {
    try {
      const parsed = JSON.parse(pageContent.content);
      finalUrl = parsed.url || pageContent.content;
    } catch (e) {
      finalUrl = pageContent.content;
    }
  }

  useEffect(() => {
    const wv = webviewRef.current;
    if (!wv) return;

    const handlePageTitle = (e) => {
      if (e.title && e.title !== page.name && (page.name === 'Website' || page.name === 'Webpage')) {
        updateLocalName('page', page.id, e.title);
        syncRenameToDrive('page', page.id);
      }
    };

    wv.addEventListener('page-title-updated', handlePageTitle);
    return () => wv.removeEventListener('page-title-updated', handlePageTitle);
  }, [page.id, page.name, updateLocalName, syncRenameToDrive]);

  if (!finalUrl) {
    return <div className="p-4 text-sm text-gray-500">Loading URL...</div>;
  }

  return (
    <div className="w-full h-full bg-white relative">
      <webview
        ref={webviewRef}
        src={finalUrl}
        className="w-full h-full border-none"
        allowpopups="true"
      />
    </div>
  );
}
