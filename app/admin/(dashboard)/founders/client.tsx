'use client'

import { useState } from 'react'
import { Founder } from '@prisma/client'
import { createFounder, updateFounder, deleteFounder } from './actions'

export default function FoundersClient({ initialFounders }: { initialFounders: Founder[] }) {
  const [founders, setFounders] = useState<Founder[]>(initialFounders)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Founder>>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleCreate = () => {
    setIsEditing('new')
    setFormData({
      name: '',
      role: '',
      bio: '',
      photo: '',
      linkedin: '',
      twitter: '',
      github: '',
      order: 0,
      published: true
    })
  }

  const handleEdit = (founder: Founder) => {
    setIsEditing(founder.id)
    setFormData(founder)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this founder?')) return
    setIsLoading(true)
    await deleteFounder(id)
    setFounders(founders.filter(f => f.id !== id))
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (isEditing === 'new') {
      await createFounder(formData as any)
    } else if (isEditing) {
      await updateFounder(isEditing, formData as any)
    }
    
    window.location.reload()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Founders Management</h1>
        <button
          onClick={handleCreate}
          className="bg-[#1677FF] text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Add Founder
        </button>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1f2937] p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">
              {isEditing === 'new' ? 'Create Founder' : 'Edit Founder'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  required
                  type="text"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#111827] border border-gray-700 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                <input
                  required
                  type="text"
                  value={formData.role || ''}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-[#111827] border border-gray-700 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
                <textarea
                  required
                  value={formData.bio || ''}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-[#111827] border border-gray-700 rounded p-2 text-white h-24"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Photo URL</label>
                <input
                  type="text"
                  value={formData.photo || ''}
                  onChange={e => setFormData({ ...formData, photo: e.target.value })}
                  className="w-full bg-[#111827] border border-gray-700 rounded p-2 text-white"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">LinkedIn</label>
                  <input
                    type="text"
                    value={formData.linkedin || ''}
                    onChange={e => setFormData({ ...formData, linkedin: e.target.value })}
                    className="w-full bg-[#111827] border border-gray-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Twitter</label>
                  <input
                    type="text"
                    value={formData.twitter || ''}
                    onChange={e => setFormData({ ...formData, twitter: e.target.value })}
                    className="w-full bg-[#111827] border border-gray-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">GitHub</label>
                  <input
                    type="text"
                    value={formData.github || ''}
                    onChange={e => setFormData({ ...formData, github: e.target.value })}
                    className="w-full bg-[#111827] border border-gray-700 rounded p-2 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Order</label>
                  <input
                    type="number"
                    value={formData.order || 0}
                    onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    className="w-full bg-[#111827] border border-gray-700 rounded p-2 text-white"
                  />
                </div>
                <div className="flex items-center mt-6">
                  <label className="flex items-center text-sm font-medium text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.published ?? true}
                      onChange={e => setFormData({ ...formData, published: e.target.checked })}
                      className="mr-2 h-4 w-4 rounded border-gray-700 bg-[#111827] text-[#1677FF] focus:ring-[#1677FF]"
                    />
                    Published
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsEditing(null)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#1677FF] text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {founders.map(founder => (
          <div key={founder.id} className="bg-[#1f2937] border border-gray-700 rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center mb-4">
                {founder.photo ? (
                  <img src={founder.photo} alt={founder.name} className="w-16 h-16 rounded-full object-cover mr-4" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center mr-4">
                    <span className="text-xl text-white font-bold">{founder.name.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white">{founder.name}</h3>
                  <p className="text-[#1677FF] text-sm">{founder.role}</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-4 line-clamp-3">{founder.bio}</p>
              <div className="flex justify-between items-center text-sm">
                <span className={`px-2 py-1 rounded text-xs ${founder.published ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                  {founder.published ? 'Published' : 'Draft'}
                </span>
                <span className="text-gray-500">Order: {founder.order}</span>
              </div>
            </div>
            <div className="border-t border-gray-700 p-4 bg-gray-800/50 flex justify-end space-x-2">
              <button
                onClick={() => handleEdit(founder)}
                className="text-sm px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(founder.id)}
                className="text-sm px-3 py-1 bg-red-900/50 text-red-400 rounded hover:bg-red-900/80 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        
        {founders.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-[#1f2937] border border-gray-700 rounded-lg">
            No founders found. Create one to get started.
          </div>
        )}
      </div>
    </div>
  )
}
