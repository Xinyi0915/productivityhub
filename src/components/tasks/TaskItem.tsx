import React from 'react';
import { Task } from '../../store/slices/tasksSlice';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface TaskItemProps {
  task: Task;
  onToggle: (e: React.MouseEvent) => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggle,
  onEdit,
  onDelete,
}) => {
  const groups = useSelector((state: RootState) => state.tasks.groups);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const taskGroup = groups.find((g) => g.id === task.groupId);

  // Check if the current user is the owner of the task or an admin
  const isOwner = task.userId === currentUser?.id;
  const isAdmin = currentUser?.role === 'admin';
  const canEdit = isOwner || isAdmin;

  // Format the deadline if it exists
  const formattedDeadline = task.deadline
    ? new Date(task.deadline).toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  // Check if task is overdue
  const isOverdue =
    task.deadline &&
    !task.completed &&
    new Date(task.deadline) < new Date();

  return (
    <div
      className={`rounded-lg border p-4 ${
        task.completed
          ? 'bg-gray-50 border-gray-200'
          : isOverdue
          ? 'bg-red-50 border-red-200'
          : 'bg-white border-gray-200 hover:border-gray-300'
      } transition-all shadow-sm`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border transition-colors ${
            task.completed
              ? 'bg-green-500 border-transparent'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {task.completed && (
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>

        <div className="flex-grow">
          <div className="flex items-center">
            {task.icon && (
              <span className="text-xl mr-2" title="Task icon">
                {task.icon}
              </span>
            )}
            <h3
              className={`font-medium ${
                task.completed ? 'text-gray-500 line-through' : 'text-gray-900'
              }`}
            >
              {task.title}
            </h3>
            
            {!isOwner && isAdmin && (
              <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                Admin View
              </span>
            )}
          </div>

          {task.description && (
            <p
              className={`mt-1 text-sm ${
                task.completed ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              {task.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {taskGroup && (
              <span
                className="px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${taskGroup.color}20`,
                  color: taskGroup.color,
                }}
              >
                {taskGroup.name}
              </span>
            )}

            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                task.priority === 'high'
                  ? 'bg-red-100 text-red-800'
                  : task.priority === 'medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>

            {formattedDeadline && (
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isOverdue
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {isOverdue ? 'Overdue: ' : 'Due: '}
                {formattedDeadline}
              </span>
            )}
            
            {task.username && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Created by: {task.username}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-shrink-0 ml-2">
          {canEdit && (
            <>
          <button
            onClick={onEdit}
            className="text-gray-400 hover:text-gray-600 p-1"
                title={isAdmin && !isOwner ? "Edit as admin" : "Edit"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-red-600 p-1"
                title={isAdmin && !isOwner ? "Delete as admin" : "Delete"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskItem; 