import React from "react";

interface PortfolioModalProps {
  onClose: () => void;
  onCreate: (e: React.FormEvent) => void;
  name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
}

export default function PortfolioModal({
  onClose,
  onCreate,
  name,
  setName,
}: PortfolioModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg w-[400px] shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Create New Portfolio</h3>
        <form onSubmit={onCreate}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Portfolio name"
            className="w-full p-3 border-2 border-gray-200 rounded mb-4"
            autoFocus
            required
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
