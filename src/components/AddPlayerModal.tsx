import React, { useState, useEffect, useContext } from 'react'; // Added useContext
    import { User, Hash, X, AlertCircle } from 'lucide-react'; // Added AlertCircle
    import { TeamContext } from '../context/TeamContext'; // Import context

    interface AddPlayerModalProps {
      isOpen: boolean;
      onClose: () => void;
      // Removed onAddPlayer prop, will use context directly
    }

    const AddPlayerModal: React.FC<AddPlayerModalProps> = ({ isOpen, onClose }) => {
      const { addPlayer } = useContext(TeamContext); // Get addPlayer from context
      const [firstName, setFirstName] = useState('');
      const [lastName, setLastName] = useState('');
      const [number, setNumber] = useState('');
      const [localError, setLocalError] = useState<string | null>(null); // Local error state
      const [isSubmitting, setIsSubmitting] = useState(false); // Loading state

      useEffect(() => {
        // Reset form when modal opens
        if (isOpen) {
          setFirstName('');
          setLastName('');
          setNumber('');
          setLocalError(null); // Clear previous errors
          setIsSubmitting(false);
        }
      }, [isOpen]);

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (firstName.trim() || lastName.trim()) { // Require at least one name part
          setIsSubmitting(true);
          setLocalError(null);
          const result = await addPlayer(firstName.trim(), lastName.trim(), number.trim());
          setIsSubmitting(false);

          if (result instanceof Error) {
            setLocalError(result.message || 'Failed to add player.');
          } else {
            onClose(); // Close modal on success
          }
        } else {
          setLocalError("Please enter at least a first or last name.");
        }
      };

      if (!isOpen) return null;

      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Player</h2>
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

              {/* Input Fields (remain the same) */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                  </span>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    placeholder="e.g., John"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                  </span>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    placeholder="e.g., Doe"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">
                  Number (Optional)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash size={18} className="text-gray-400" />
                  </span>
                  <input
                    type="text" // Use text to allow leading zeros if needed, or number for numeric input
                    id="number"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    placeholder="e.g., 10"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition flex items-center justify-center min-w-[110px] disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                     <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                   ) : (
                     'Add Player'
                   )}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    };

    export default AddPlayerModal;
