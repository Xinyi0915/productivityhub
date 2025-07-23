import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Task, TaskGroup, createTask, updateTaskAsync } from '../../store/slices/tasksSlice';
import { useAppDispatch } from '../../hooks/useAppDispatch';

// Task icons grouped by category
const TASK_ICONS = [
  '📝', '✅', '📌', '🔖', '⏰', // General
  '💼', '👔', '🖥️', '📊', '📈', // Work
  '🏠', '🧹', '🧺', '🛒', '🍽️', // Home
  '📚', '🎓', '✏️', '🔬', '🧮', // Education
  '🏃', '🥗', '💊', '🧘', '😴', // Health
  '🎭', '🎬', '🎮', '🎵', '📷'  // Entertainment
];

interface TaskModalProps {
  task: Task | null;
  groups: TaskGroup[];
  onClose: () => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, groups, onClose }) => {
  const dispatch = useAppDispatch();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📝');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [groupId, setGroupId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Find default group
  const defaultGroup = groups.find(group => group.id === 'default');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setIcon(task.icon || '📝');
      setPriority(task.priority);
      
      // Parse deadline if it exists
      if (task.deadline) {
        const deadlineDate = new Date(task.deadline);
        setDeadlineDate(deadlineDate.toISOString().split('T')[0]);
        
        // Format time as HH:MM
        const hours = String(deadlineDate.getHours()).padStart(2, '0');
        const minutes = String(deadlineDate.getMinutes()).padStart(2, '0');
        setDeadlineTime(`${hours}:${minutes}`);
      } else {
        setDeadlineDate('');
        setDeadlineTime('');
      }
      
      setGroupId(task.groupId || '');
    } else {
      // Reset form when creating a new task
      setTitle('');
      setDescription('');
      setIcon('📝');
      setPriority('medium');
      setDeadlineDate('');
      setDeadlineTime('');
      // Set default group ID for new tasks
      setGroupId(defaultGroup?.id || '');
    }
  }, [task, defaultGroup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Combine date and time for deadline if both are provided
    let deadline: string | undefined = undefined;
    if (deadlineDate) {
      if (deadlineTime) {
        // Combine date and time in local timezone
        const [year, month, day] = deadlineDate.split('-').map(Number);
        const [hours, minutes] = deadlineTime.split(':').map(Number);
        const date = new Date(year, month - 1, day, hours, minutes);
        deadline = date.toISOString();
      } else {
        // Just date, set time to start of day in local timezone
        const [year, month, day] = deadlineDate.split('-').map(Number);
        const date = new Date(year, month - 1, day, 0, 0, 0, 0);
        deadline = date.toISOString();
      }
    }

    try {
    if (task) {
        await dispatch(
          updateTaskAsync({
          id: task.id,
          title,
          description,
          icon,
          priority,
          deadline,
          groupId,
        })
        ).unwrap();
    } else {
        await dispatch(
          createTask({
          title,
          description,
          icon,
          priority,
          deadline,
          groupId,
        })
        ).unwrap();
    }
    onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Failed to save task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {task ? 'Edit Task' : 'New Task'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-primary w-full"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-primary w-full h-24 resize-none"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Icon
            </label>
            <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
              {TASK_ICONS.map((taskIcon) => (
                <button
                  key={taskIcon}
                  type="button"
                  onClick={() => setIcon(taskIcon)}
                  className={`w-full h-10 rounded-lg flex items-center justify-center text-xl ${
                    icon === taskIcon 
                      ? 'bg-blue-100 border-2 border-blue-400' 
                      : 'hover:bg-gray-100'
                  }`}
                  disabled={isSubmitting}
                >
                  {taskIcon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group
            </label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="input-primary w-full"
              disabled={isSubmitting}
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Task['priority'])}
              className="input-primary w-full"
              disabled={isSubmitting}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deadline
            </label>
            <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                className="input-primary"
                disabled={isSubmitting}
                />
                <input
                  type="time"
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                className="input-primary"
                disabled={isSubmitting}
                />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : task ? 'Update Task' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal; 