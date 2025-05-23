import React from 'react';

const TopBar = () => {
  return (
    <div className="bg-gray-100 border-b border-gray-300 px-6 py-4 flex items-center justify-between shadow-sm">
      <h1 className="text-2xl font-bold text-blue-800">NeuroLook</h1>

      <div className="flex items-center">
        {/* Optional Avatar */}
        <div className="w-8 h-8 bg-blue-800 text-white rounded-full font-bold flex items-center justify-center">
          U
        </div>
      </div>
    </div>
  );
};

export default TopBar;
