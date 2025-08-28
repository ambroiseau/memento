import React from 'react'

export const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-[Caprasimo] text-[rgba(0,0,0,1)] mb-4">memento</h1>
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  )
}