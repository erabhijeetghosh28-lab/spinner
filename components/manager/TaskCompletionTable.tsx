'use client';

import { useState } from 'react';

interface TaskCompletion {
  id: string;
  taskType: string;
  targetUrl: string;
  submittedAt: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'FAILED';
  customer: {
    id: string;
    phoneLast4: string;
  };
  task: {
    bonusSpins: number;
    description: string;
  };
}

interface TaskCompletionTableProps {
  tasks: TaskCompletion[];
  onViewDetails: (task: TaskCompletion) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

type SortField = 'customer' | 'taskType' | 'submittedAt' | 'status';
type SortDirection = 'asc' | 'desc';

export default function TaskCompletionTable({
  tasks,
  onViewDetails,
  page,
  totalPages,
  onPageChange
}: TaskCompletionTableProps) {
  const [sortField, setSortField] = useState<SortField>('submittedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'customer':
        comparison = a.customer.phoneLast4.localeCompare(b.customer.phoneLast4);
        break;
      case 'taskType':
        comparison = a.taskType.localeCompare(b.taskType);
        break;
      case 'submittedAt':
        comparison = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="text-slate-600 ml-1">⇅</span>;
    }
    return (
      <span className="text-amber-500 ml-1">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📭</div>
        <p className="text-slate-400 text-lg">No tasks found</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th
                className="text-left py-3 px-4 text-slate-400 text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-amber-400 transition-colors"
                onClick={() => handleSort('customer')}
              >
                Customer ID
                <SortIcon field="customer" />
              </th>
              <th className="text-left py-3 px-4 text-slate-400 text-xs font-medium uppercase tracking-wider">
                Phone Last 4
              </th>
              <th
                className="text-left py-3 px-4 text-slate-400 text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-amber-400 transition-colors"
                onClick={() => handleSort('taskType')}
              >
                Task Type
                <SortIcon field="taskType" />
              </th>
              <th
                className="text-left py-3 px-4 text-slate-400 text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-amber-400 transition-colors"
                onClick={() => handleSort('submittedAt')}
              >
                Submission Time
                <SortIcon field="submittedAt" />
              </th>
              <th
                className="text-left py-3 px-4 text-slate-400 text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-amber-400 transition-colors"
                onClick={() => handleSort('status')}
              >
                Status
                <SortIcon field="status" />
              </th>
              <th className="text-right py-3 px-4 text-slate-400 text-xs font-medium uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.map((task) => (
              <tr
                key={task.id}
                className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer"
              >
                <td className="py-4 px-4">
                  <div className="text-slate-300 text-sm font-mono">
                    {task.customer.id.slice(0, 8)}...
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-white text-sm font-medium">
                    ***{task.customer.phoneLast4}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-white text-sm">{task.taskType}</div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-slate-300 text-sm">
                    {new Date(task.submittedAt).toLocaleDateString()}
                  </div>
                  <div className="text-slate-500 text-xs">
                    {new Date(task.submittedAt).toLocaleTimeString()}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.status === 'PENDING'
                        ? 'bg-amber-500/20 text-amber-400'
                        : task.status === 'VERIFIED'
                        ? 'bg-green-500/20 text-green-400'
                        : task.status === 'REJECTED'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-slate-500/20 text-slate-400'
                    }`}
                  >
                    {task.status}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <button
                    onClick={() => onViewDetails(task)}
                    className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500 hover:text-white text-amber-400 rounded-lg text-sm font-medium transition-all"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6 pt-6 border-t border-slate-800">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
          >
            Previous
          </button>
          <span className="text-slate-400 text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
