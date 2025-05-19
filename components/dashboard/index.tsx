import React from "react";

function Dashboard() {
  return (
    <div className="p-6 bg-emerald-50 min-h-screen">
      <h1 className="text-3xl font-bold text-emerald-700 mb-6">Your Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl text-emerald-600 mb-2">Macro Overview</h2>
          <p className="text-gray-600">Track your daily macro intake here.</p>
          {/* Placeholder for chart or data visualization */}
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl text-emerald-600 mb-2">Meal Plan Adherence</h2>
          <p className="text-gray-600">See how well you&apos;re sticking to your plan.</p>
          {/* Placeholder for adherence metrics */}
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl text-emerald-600 mb-2">Health Goals</h2>
          <p className="text-gray-600">Monitor progress towards your goals.</p>
          {/* Placeholder for goal tracking */}
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 