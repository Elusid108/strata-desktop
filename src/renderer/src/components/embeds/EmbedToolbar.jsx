import { Star, Edit3, ExternalLink, ArrowLeft, ArrowRight, Home, Plus } from '../icons';
import { shouldShowEditToggle, getTypeDisplayName } from '../../lib/embed-utils';
import { DRIVE_SERVICE_ICONS } from '../../lib/constants';

const isWebpageType = (type) => type === 'webpage' || type === 'site';
const isElectron = !!window.electronAPI?.isElectron;

/**
 * Toolbar for embed pages with controls for view mode, edit URL, and browser navigation
 */
export function EmbedToolbar({
  page,
  viewMode,
  onViewModeChange,
  onEditUrl,
  onToggleStar,
  isStarred,
  onAddPageFromUrl,
}) {
  const showEditToggle = shouldShowEditToggle(page?.type);
  const showNavButtons = isWebpageType(page?.type) && isElectron;
  
  const serviceIcon = DRIVE_SERVICE_ICONS.find(s => s.type === page?.type);
  const typeName = getTypeDisplayName(page?.type);

  const renderIcon = () => {
    if (page?.icon) {
      return <span className="text-xl">{page.icon}</span>;
    }
    if (page?.faviconUrl) {
      return <img src={page.faviconUrl} alt={typeName} className="w-5 h-5 rounded" />;
    }
    if (serviceIcon?.url) {
      return <img src={serviceIcon.url} alt={typeName} className="w-5 h-5" />;
    }
    return <span className="text-xl">📄</span>;
  };

  const handleGoBack = () => {
    window.electronAPI?.embed?.goBack(page.id);
  };

  const handleGoForward = () => {
    window.electronAPI?.embed?.goForward(page.id);
  };

  const handleGoHome = () => {
    window.electronAPI?.embed?.navigate(page.id, page.embedUrl);
  };

  const handleAddCurrentPage = async () => {
    const currentUrl = await window.electronAPI?.embed?.getCurrentUrl(page.id);
    if (currentUrl && onAddPageFromUrl) {
      onAddPageFromUrl(currentUrl);
    }
  };

  const navBtnClass = "p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors";

  return (
    <div className="flex-shrink-0 px-4 py-1.5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
      {/* Left: Nav buttons, Icon, Title, Type, Star */}
      <div className="flex items-center gap-2">
        {showNavButtons && (
          <div className="flex items-center gap-0.5 mr-1 border-r border-gray-200 dark:border-gray-600 pr-2">
            <button onClick={handleGoBack} className={navBtnClass} title="Back">
              <ArrowLeft size={16} />
            </button>
            <button onClick={handleGoForward} className={navBtnClass} title="Forward">
              <ArrowRight size={16} />
            </button>
            <button onClick={handleGoHome} className={navBtnClass} title="Home">
              <Home size={16} />
            </button>
            <button onClick={handleAddCurrentPage} className={navBtnClass} title="Save current page as new page">
              <Plus size={16} />
            </button>
          </div>
        )}
        {renderIcon()}
        <div className="flex flex-col">
          <h1 className="text-base font-semibold dark:text-white">{page?.name || 'Untitled'}</h1>
          <span className="text-xs text-gray-500 dark:text-gray-400">{typeName}</span>
        </div>
        {/* Star button */}
        <button
          onClick={onToggleStar}
          className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
            isStarred ? 'text-yellow-500' : 'text-gray-400'
          }`}
          title={isStarred ? 'Unstar' : 'Star'}
        >
          <Star size={16} className={isStarred ? "text-yellow-400 fill-current" : "text-gray-400"} />
        </button>
        {/* Edit URL button */}
        <button
          onClick={onEditUrl}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-colors"
          title="Edit URL"
        >
          <Edit3 size={16} />
        </button>
      </div>
      
      {/* Right: Edit/Preview toggle, Popout */}
      <div className="flex items-center gap-2">
        {showEditToggle && (
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${viewMode === 'edit' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>Edit</span>
            <button
              type="button"
              role="switch"
              aria-checked={viewMode === 'preview'}
              onClick={() => onViewModeChange(viewMode === 'edit' ? 'preview' : 'edit')}
              className="relative w-11 h-6 rounded-full bg-blue-500 dark:bg-blue-600 p-1 shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              <span
                className="block w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ease-out"
                style={{ transform: viewMode === 'edit' ? 'translateX(0)' : 'translateX(20px)' }}
              />
            </button>
            <span className={`text-sm font-medium ${viewMode === 'preview' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>Preview</span>
          </div>
        )}
        
        {page?.embedUrl && (
          <a
            href={page.webViewLink || page.embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            title="Open in new tab"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  );
}
