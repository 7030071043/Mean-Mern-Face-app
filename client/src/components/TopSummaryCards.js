// src/components/TopSummaryCards.js
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, UserCheck, TimerOff, ClipboardList, ListTodo } from 'lucide-react';

const summaryData = [
  {
    icon: <Users className="text-blue-500 w-6 h-6" />,
    label: 'Total Workers',
    value: 120,
  },
  {
    icon: <UserCheck className="text-green-600 w-6 h-6" />,
    label: 'Present Today',
    value: 85,
  },
  {
    icon: <TimerOff className="text-red-500 w-6 h-6" />,
    label: 'Absent Today',
    value: 35,
  },
  {
    icon: <ClipboardList className="text-yellow-500 w-6 h-6" />,
    label: 'Tasks Assigned',
    value: 60,
  },
  {
    icon: <ListTodo className="text-purple-600 w-6 h-6" />,
    label: 'Pending Tasks',
    value: 18,
  },
];

export default function TopSummaryCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {summaryData.map((item, index) => (
        <Card key={index} className="shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-6 gap-2">
            {item.icon}
            <div className="text-xl font-semibold">{item.value}</div>
            <div className="text-sm text-muted-foreground">{item.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
