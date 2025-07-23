import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  Task,
  TaskGroup,
  addTask,
  toggleTask,
  deleteTask,
  setSelectedGroup,
  deleteTaskGroup,
  toggleTaskAndUpdateCoins,
  fetchTasks,
  createTask as createTaskAction,
  updateTaskAsync,
  deleteTaskAsync,
} from '../store/slices/tasksSlice';
import TaskModal from '../components/tasks/TaskModal';
import TaskItem from '../components/tasks/TaskItem';
import GroupModal from '../components/tasks/GroupModal';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { Action, UnknownAction } from '@reduxjs/toolkit';

const TasksPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tasks, groups, selectedGroupId, isLoading, error } = useSelector(
    (state: RootState) => state.tasks
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedGroupState, setSelectedGroupState] = useState<TaskGroup | null>(null);

  // Fetch tasks when component mounts
  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  const handleAddTask = () => {
    setSelectedTask(null);
    setShowAddModal(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setShowAddModal(true);
  };

  const handleViewTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetailsModal(true);
  };

  const handleCloseTaskDetails = () => {
    setShowTaskDetailsModal(false);
  };

  const handleAddGroup = () => {
    setSelectedGroupState(null);
    setShowGroupModal(true);
  };

  const handleEditGroup = (group: TaskGroup) => {
    setSelectedGroupState(group);
    setShowGroupModal(true);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this group? Tasks in this group will become uncategorized.')) {
      dispatch(deleteTaskGroup(groupId));
      if (selectedGroupId === groupId) {
        dispatch(setSelectedGroup(null) as unknown as UnknownAction);
      }
    }
  };

  const handleToggleTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      dispatch(toggleTaskAndUpdateCoins(taskId));
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  const handleDeleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this task?')) {
      dispatch(deleteTaskAsync(taskId));
    }
  };

  // Group tasks by their groupId
  const groupedTasks = tasks.reduce<{ [key: string]: Task[] }>(
    (acc, task) => {
      const groupId = task.groupId || 'default';
      if (!acc[groupId]) {
        acc[groupId] = [];
      }
      acc[groupId].push(task);
      return acc;
    },
    {}
  );

  // Filter tasks based on selected group
  const filteredTasks = selectedGroupId
    ? tasks.filter((task) => task.groupId === selectedGroupId)
    : tasks;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <div className="flex space-x-3">
            <button onClick={handleAddGroup} className="btn-secondary">
              Add Group
            </button>
            <button onClick={handleAddTask} className="btn-primary">
              Add Task
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg">
            Error loading tasks: {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}

        {/* Group Filter */}
        <div className="mb-8">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            <button
              onClick={() => dispatch(setSelectedGroup(null) as unknown as UnknownAction)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                !selectedGroupId
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Tasks
            </button>
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => dispatch(setSelectedGroup(group.id) as unknown as UnknownAction)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap flex items-center space-x-2 ${
                  selectedGroupId === group.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: group.color }}
                />
                <span>{group.name}</span>
                {selectedGroupId === group.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditGroup(group);
                    }}
                    className="ml-2 text-white hover:text-gray-200"
                  >
                    ✏️
                  </button>
                )}
                {selectedGroupId === group.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGroup(group.id);
                    }}
                    className="ml-2 text-white hover:text-gray-200"
                  >
                    🗑️
                  </button>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks List */}
        {selectedGroupId ? (
          // Show tasks for selected group
          <div className="space-y-4">
            {!isLoading && filteredTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No tasks in this group yet
              </p>
            ) : (
              filteredTasks.map((task) => (
                <div 
                  key={task.id} 
                  className="cursor-pointer"
                  onClick={() => handleViewTaskDetails(task)}
                >
                  <TaskItem
                    task={task}
                    onToggle={(e) => handleToggleTask(task.id, e)}
                    onEdit={(e) => { e.stopPropagation(); handleEditTask(task); }}
                    onDelete={(e) => handleDeleteTask(task.id, e)}
                  />
                </div>
              ))
            )}
          </div>
        ) : (
          // Show all tasks grouped
          <div className="space-y-8">
            {groups.map((group) => (
              <div key={group.id}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                    <h2 className="text-lg font-semibold text-gray-900">
                      {group.name}
                    </h2>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditGroup(group)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  {(groupedTasks[group.id] || []).map((task) => (
                    <div 
                      key={task.id} 
                      className="cursor-pointer"
                      onClick={() => handleViewTaskDetails(task)}
                    >
                      <TaskItem
                        task={task}
                        onToggle={(e) => handleToggleTask(task.id, e)}
                        onEdit={(e) => { e.stopPropagation(); handleEditTask(task); }}
                        onDelete={(e) => handleDeleteTask(task.id, e)}
                      />
                    </div>
                  ))}
                  {!groupedTasks[group.id]?.length && (
                    <p className="text-gray-500 text-sm pl-4">
                      No tasks in this group
                    </p>
                  )}
                </div>
              </div>
            ))}
            {/* Default Tasks */}
            {groupedTasks['default']?.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Tasks
                </h2>
                <div className="space-y-4">
                  {groupedTasks['default'].map((task) => (
                    <div 
                      key={task.id} 
                      className="cursor-pointer"
                      onClick={() => handleViewTaskDetails(task)}
                    >
                      <TaskItem
                        task={task}
                        onToggle={(e) => handleToggleTask(task.id, e)}
                        onEdit={(e) => { e.stopPropagation(); handleEditTask(task); }}
                        onDelete={(e) => handleDeleteTask(task.id, e)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Task Modal */}
        {showAddModal && (
          <TaskModal
            task={selectedTask}
            onClose={() => setShowAddModal(false)}
            groups={groups}
          />
        )}

        {/* Group Modal */}
        {showGroupModal && (
          <GroupModal
            group={selectedGroupState}
            onClose={() => setShowGroupModal(false)}
          />
        )}

        {/* Task Details Modal */}
        {showTaskDetailsModal && selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Task Details</h2>
                <button onClick={handleCloseTaskDetails} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={(e) => handleToggleTask(selectedTask.id, e)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedTask.completed
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {selectedTask.completed && (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <h3 className={`text-xl font-medium ${selectedTask.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {selectedTask.title}
                  </h3>
                </div>
                
                {selectedTask.description && (
                  <p className="text-gray-600 mt-4 p-3 bg-gray-50 rounded-md">
                    {selectedTask.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Priority</p>
                  <p className={`font-medium ${
                    selectedTask.priority === 'high' ? 'text-red-600' :
                    selectedTask.priority === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {selectedTask.priority.charAt(0).toUpperCase() + selectedTask.priority.slice(1)}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Group</p>
                  <div className="flex items-center gap-2">
                    {selectedTask.groupId ? (
                      <>
                        {groups.find(g => g.id === selectedTask.groupId) && (
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: groups.find(g => g.id === selectedTask.groupId)?.color }}
                          />
                        )}
                        <p className="font-medium">
                          {groups.find(g => g.id === selectedTask.groupId)?.name || 'Unknown'}
                        </p>
                      </>
                    ) : (
                      <p className="font-medium text-gray-600">Tasks</p>
                    )}
                  </div>
                </div>
                
                {selectedTask.deadline && (
                  <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                    <p className="text-sm text-gray-500">Deadline</p>
                    <p className="font-medium">
                      {new Date(selectedTask.deadline).toLocaleDateString()} {' '}
                      {new Date(selectedTask.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}
                
                {selectedTask.completedAt && (
                  <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="font-medium text-green-600">
                      {new Date(selectedTask.completedAt).toLocaleDateString()} {' '}
                      {new Date(selectedTask.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => {
                    handleCloseTaskDetails();
                    handleEditTask(selectedTask);
                  }} 
                  className="btn-secondary flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit Task
                </button>
                <button 
                  onClick={handleCloseTaskDetails} 
                  className="btn-primary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksPage; 