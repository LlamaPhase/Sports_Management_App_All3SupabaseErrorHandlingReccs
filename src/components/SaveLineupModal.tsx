import React, { useState, useContext } from 'react'; // Added useContext
    import { Save, X, AlertCircle } from 'lucide-react'; // Added AlertCircle
    import { TeamContext } from '../context/TeamContext'; // Import context

    interface SaveLineupModalProps {
      isOpen: boolean;
      onClose: () => void;
      // Removed onSave prop
    }

    const SaveLineupModal: React.FC<SaveLineupModalProps> = ({ isOpen, onClose }) => {
      const { saveLineup } = useContext(TeamContext); // Get saveLineup from context
      const [lineupName, setLineupName] = useState('');
      const [localError, setLocalError] = useState<string | null>(null); // Local error state
      const [isSubmitting, setIsSubmitting] = useState(false); // Loading state

      const handleSave = async () => {
        if (lineupName.trim()) {
          setIsSubmitting(true);
          setLocalError(null);
          const result = await saveLineup(lineupName.trim());
          setIsSubmitting(false);

          if (result instanceof Error) {
            setLocalError(result.message || 'Failed to save lineup.');
          } else {
            setLineupName(''); // Reset name after successful save
            onClose();
          }
        } else {
          setLocalError('Please enter a name for the lineup.');
        }
      };

      const handleClose = () => {
        setLineupName(''); // Reset name on close
        setLocalError(null);
        setIsSubmitting(false);
        onClose();
      };

      if (!isOpen) return null;

      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Save Lineup</h2>
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-700" disabled={isSubmitting}>
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              {/* Error Display */}
              {localError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative text-sm flex items-center space-x-2" role="alert">
                   <AlertCircle size={16} />
                   <span>{localError}</span>
                </div>
              )}

              <div>
                <label htmlFor="lineupName" className="block text-sm font-medium text-gray-700 mb-1">
                  Lineup Name
                </label>
                <input
                  type="text"
                  id="lineupName"
                  value={lineupName}
                  onChange={(e) => setLineupName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  placeholder="e.g., Starting Lineup"
                  autoFocus
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition flex items-center space-x-1 justify-center min-w-[90px] disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                     <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                   ) : (
                     <>
                       <Save size={18} />
                       <span>Save</span>
                     </>
                   )}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    };

    export default SaveLineupModal;
