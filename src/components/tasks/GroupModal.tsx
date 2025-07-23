import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { TaskGroup, addTaskGroup, updateTaskGroup } from '../../store/slices/tasksSlice';

interface GroupModalProps {
  group: TaskGroup | null;
  onClose: () => void;
}

const GroupModal: React.FC<GroupModalProps> = ({ group, onClose }) => {
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#4F46E5');

  const colors = [
    '#4F46E5', // indigo
    '#059669', // emerald
    '#DC2626', // red
    '#2563EB', // blue
    '#7C3AED', // violet
    '#DB2777', // pink
    '#EA580C', // orange
    '#CA8A04', // yellow
    '#0891B2', // cyan
  ];

  useEffect(() => {
    if (group) {
      setName(group.name);
      setColor(group.color);
    }
  }, [group]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (group) {
      dispatch(
        updateTaskGroup({
          id: group.id,
          name,
          color,
        })
      );
    } else {
      dispatch(
        addTaskGroup({
          name,
          color,
        })
      );
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {group ? 'Edit Group' : 'New Group'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-primary w-full"
              required
              placeholder="Enter group name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="grid grid-cols-3 gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-full h-10 rounded-lg border-2 transition-all ${
                    color === c ? 'border-gray-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {group ? 'Save Changes' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupModal; 