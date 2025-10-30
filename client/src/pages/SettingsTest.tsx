import { useState } from 'react';

export function SettingsTest() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Settings Test Page</h1>
      <p>Count: {count}</p>
      <button 
        onClick={() => setCount(count + 1)}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Increment
      </button>
    </div>
  );
}
