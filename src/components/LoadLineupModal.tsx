import React, { useState, useContext } from 'react'; // Added useContext
    import { Download, Trash2, X, AlertCircle } from 'lucide-react'; // Added AlertCircle
    import { SavedLineup, TeamContext } from '../context/TeamContext'; // Import context

    interface LoadLineupModalProps {
      isOpen: boolean;
      onClose: () => void;
      savedLineups: SavedLineup[];
      // Removed onLoad, onDelete props
    }

    const LoadLineupModal: React.FC<LoadLineupModalProps> = ({ isOpen, onClose, savedLineups }) => {
      const { loadLineup, deleteLineup } = useContext(TeamContext); // Get context functions
      const [selectedLineupId, setSelectedLineupId] = useState<string | null>(null);
      const [localError, setLocalError] = useState<string | null>(null); // Local error state
      const [isLoading, setIsLoading] = useState(false); // Loading state for load action
      const [isDeleting, setIsDeleting] = useState<string | null>(null); // Track which lineup is being deleted

      const handleLoad = async () => {
        if (selectedLineupId) {
          setIsLoading(true);
          setLocalError(null);
          const result = await loadLineup(selectedLineupId);
          setIsLoading(false);

          if (result instanceof Error) {
            setLocalError(result.message || 'Failed to load lineup.');
          } else if (result === true) {
            onClose();
          } else {
            // Should not happen if result is boolean or Error
            setLocalError('An unexpected error occurred while loading.');
          }
        } else {
          setLocalError('Please select a lineup to load.');
        }
      };

      const handleDelete = async (e: React.MouseEvent, lineupId: string, lineupName: string) => {
        e.stopPropagation(); // Prevent row selection when clicking delete
        if (window.confirm(`Are you sure you want to delete the lineup "${lineupName}"?`)) {
          setIsDeleting(lineupId);
          setLocalError(null);
          const result = await deleteLineup(lineupId);
          setIsDeleting(null);

          if (result instanceof Error) {
            setLocalError(result.message || 'Failed to delete lineup.');
          } else {
            // If the deleted lineup was selected, deselect it
            if (selectedLineupId === lineupId) {
              setSelectedLineupId(null);
            }
          }
        }
      };

      const handleClose = () => {
          setSelectedLineupId(null);
          setLocalError(null);
          setIsLoading(false);
          setIsDeleting(null);
          onClose();
      }

      if (!isOpen) return null;

      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Load Lineup</h2>
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-700" disabled={isLoading || !!isDeleting}>
                <X size={24} />
              </button>
            </div>

            {/* Error Display */}
            {localError && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative text-sm flex items-center space-x-2" role="alert">
                 <AlertCircle size={16} />
                 <span>{localError}</span>
              </div>
            )}

            <div className="space-y-4 max-h-60 overflow-y-auto mb-4 pr-2">
              {savedLineups.length === 0 ? (
                <p className="text-gray-500 text-center">No saved lineups found.</p>
              ) : (
                savedLineups.map((lineup) => (
                  <div
                    key={lineup.id} // Use ID as key
                    onClick={() => setSelectedLineupId(lineup.id)}
                    className={`flex justify-between items-center p-3 border rounded-md cursor-pointer transition-colors ${
                      selectedLineupId === lineup.id
                        ? 'bg-red-100 border-red-300'
                        : 'hover:bg-gray-100 border-gray-200'
                    } ${isDeleting === lineup.id ? 'opacity-50' : ''}`} // Dim if being deleted
                  >
                    <span className="font-medium">{lineup.name}</span>
                    <button
                      onClick={(e) => handleDelete(e, lineup.id, lineup.name)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1 -mr-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={`Delete lineup ${lineup.name}`}
                      disabled={isLoading || !!isDeleting} // Disable while loading or another delete is in progress
                    >
                      {isDeleting === lineup.id ? (
                         <svg className="animate-spin h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                       ) : (
                         <Trash2 size={18} />
                       )}
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                disabled={isLoading || !!isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLoad}
                disabled={!selectedLineupId || savedLineups.length === 0 || isLoading || !!isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition flex items-center space-x-1 justify-center min-w-[90px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                   <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                 ) : (
                   <>
                     <Download size={18} />
                     <span>Load</span>
                   </>
                 )}
              </button>
            </div>
          </div>
        </div>
      );
    };

    export default LoadLineupModal;
