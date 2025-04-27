import React, { useState, useEffect, useContext } from 'react'; // Added useContext
    import { User, Hash, X, Trash2, AlertCircle } from 'lucide-react'; // Added AlertCircle
    import { Player, TeamContext } from '../context/TeamContext'; // Import context
    import ConfirmModal from './ConfirmModal';

    interface EditPlayerModalProps {
      isOpen: boolean;
      onClose: () => void;
      player: Player | null;
      // Removed onUpdatePlayer, onDeletePlayer props
    }

    const EditPlayerModal: React.FC<EditPlayerModalProps> = ({ isOpen, onClose, player }) => {
      const { updatePlayer, deletePlayer } = useContext(TeamContext); // Get context functions
      const [firstName, setFirstName] = useState('');
      const [lastName, setLastName] = useState('');
      const [number, setNumber] = useState('');
      const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
      const [localError, setLocalError] = useState<string | null>(null); // Local error state
      const [isSubmitting, setIsSubmitting] = useState(false); // Loading state

      useEffect(() => {
        if (isOpen && player) {
          setFirstName(player.firstName);
          setLastName(player.lastName);
          setNumber(player.number);
          setLocalError(null); // Clear previous errors
          setIsSubmitting(false);
        } else if (!isOpen) {
            setFirstName('');
            setLastName('');
            setNumber('');
            setIsConfirmDeleteOpen(false);
            setLocalError(null);
            setIsSubmitting(false);
        }
      }, [isOpen, player]);

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (player && (firstName.trim() || lastName.trim())) {
          setIsSubmitting(true);
          setLocalError(null);
          const result = await updatePlayer(player.id, {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            number: number.trim(),
          });
          setIsSubmitting(false);
          if (result instanceof Error) {
            setLocalError(result.message || 'Failed to update player.');
          } else {
            onClose();
          }
        } else {
          setLocalError("Please enter at least a first or last name.");
        }
      };

      const handleDeleteClick = () => {
        setIsConfirmDeleteOpen(true);
      };

      const handleConfirmDelete = async () => {
        if (player) {
          setIsSubmitting(true); // Use submitting state for delete as well
          setLocalError(null);
          const result = await deletePlayer(player.id);
          setIsSubmitting(false);
          setIsConfirmDeleteOpen(false); // Close confirm modal regardless of outcome

          if (result instanceof Error) {
            setLocalError(result.message || 'Failed to delete player.');
            // Keep the edit modal open to show the error
          } else {
            onClose(); // Close edit modal on successful delete
          }
        }
      };

      if (!isOpen || !player) return null;

      return (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Edit Player</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700" disabled={isSubmitting}>
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error Display */}
                {localError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative text-sm flex items-center space-x-2" role="alert">
                     <AlertCircle size={16} />
                     <span>{localError}</span>
                  </div>
                )}

                {/* Input fields */}
                <div>
                  <label htmlFor="editFirstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User size={18} className="text-gray-400" /></span>
                    <input type="text" id="editFirstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500" placeholder="e.g., John" disabled={isSubmitting} />
                  </div>
                </div>
                <div>
                  <label htmlFor="editLastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User size={18} className="text-gray-400" /></span>
                    <input type="text" id="editLastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500" placeholder="e.g., Doe" disabled={isSubmitting} />
                  </div>
                </div>
                <div>
                  <label htmlFor="editNumber" className="block text-sm font-medium text-gray-700 mb-1">Number (Optional)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Hash size={18} className="text-gray-400" /></span>
                    <input type="text" id="editNumber" value={number} onChange={(e) => setNumber(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500" placeholder="e.g., 10" disabled={isSubmitting} />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4">
                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition flex items-center space-x-1 disabled:opacity-50"
                    title="Delete Player"
                    disabled={isSubmitting}
                  >
                    <Trash2 size={18} />
                    <span>Delete</span>
                  </button>
                  <div className="flex space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition" disabled={isSubmitting}>Cancel</button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition flex items-center justify-center min-w-[130px] disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                         <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                       ) : (
                         'Save Changes'
                       )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Confirmation Modal for Delete */}
          <ConfirmModal
            isOpen={isConfirmDeleteOpen}
            onClose={() => setIsConfirmDeleteOpen(false)}
            onConfirm={handleConfirmDelete}
            title="Delete Player"
            message={`Are you sure you want to delete ${player.firstName} ${player.lastName}? This action cannot be undone.`}
            confirmText="Delete Player"
          />
        </>
      );
    };

    export default EditPlayerModal;
