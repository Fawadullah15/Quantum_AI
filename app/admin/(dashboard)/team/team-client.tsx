"use client"

import { useState } from 'react'
import { createTeamMember, updateTeamMember, deleteTeamMember } from './actions'

type TeamMember = {
  id: string
  name: string
  role: string
  bio: string | null
  photo: string | null
  linkedin: string | null
  twitter: string | null
  order: number
  published: boolean
}

export default function TeamClient({ initialTeam }: { initialTeam: TeamMember[] }) {
  const [team, setTeam] = useState<TeamMember[]>(initialTeam)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    bio: '',
    photo: '',
    linkedin: '',
    twitter: '',
    order: 0,
    published: true,
  })

  const handleOpenModal = (member?: TeamMember) => {
    if (member) {
      setEditingId(member.id)
      setFormData({
        name: member.name,
        role: member.role,
        bio: member.bio || '',
        photo: member.photo || '',
        linkedin: member.linkedin || '',
        twitter: member.twitter || '',
        order: member.order,
        published: member.published,
      })
    } else {
      setEditingId(null)
      setFormData({
        name: '',
        role: '',
        bio: '',
        photo: '',
        linkedin: '',
        twitter: '',
        order: 0,
        published: true,
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => setIsModalOpen(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      await updateTeamMember(editingId, formData)
    } else {
      await createTeamMember(formData)
    }
    window.location.reload()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this team member?')) {
      await deleteTeamMember(id)
      window.location.reload()
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Team Members</h2>
        <button
          onClick={() => handleOpenModal()}
          className="bg-[#1677FF] hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add Team Member
        </button>
      </div>

      <div className="overflow-x-auto bg-[#1f2937] rounded-lg border border-[#374151]">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#374151] text-gray-100 uppercase font-medium">
            <tr>
              <th className="px-4 py-3">Photo</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {team.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No team members found.
                </td>
              </tr>
            ) : (
              team.map((member) => (
                <tr key={member.id} className="border-b border-[#374151] hover:bg-[#273242]">
                  <td className="px-4 py-3">
                    {member.photo ? (
                      <img src={member.photo} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-xs">No img</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-white">{member.name}</td>
                  <td className="px-4 py-3">{member.role}</td>
                  <td className="px-4 py-3">{member.order}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${member.published ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                      {member.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => handleOpenModal(member)}
                      className="text-[#1677FF] hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1f2937] p-6 rounded-lg w-full max-w-lg border border-[#374151]">
            <h3 className="text-xl font-semibold mb-4 text-white">
              {editingId ? 'Edit Team Member' : 'Add Team Member'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#111827] border border-[#374151] rounded px-3 py-2 text-white focus:outline-none focus:border-[#1677FF]"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Role</label>
                <input
                  type="text"
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-[#111827] border border-[#374151] rounded px-3 py-2 text-white focus:outline-none focus:border-[#1677FF]"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-[#111827] border border-[#374151] rounded px-3 py-2 text-white focus:outline-none focus:border-[#1677FF] h-24"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Photo URL</label>
                <input
                  type="text"
                  value={formData.photo}
                  onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                  className="w-full bg-[#111827] border border-[#374151] rounded px-3 py-2 text-white focus:outline-none focus:border-[#1677FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">LinkedIn URL</label>
                  <input
                    type="text"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    className="w-full bg-[#111827] border border-[#374151] rounded px-3 py-2 text-white focus:outline-none focus:border-[#1677FF]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Twitter URL</label>
                  <input
                    type="text"
                    value={formData.twitter}
                    onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                    className="w-full bg-[#111827] border border-[#374151] rounded px-3 py-2 text-white focus:outline-none focus:border-[#1677FF]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="w-24 bg-[#111827] border border-[#374151] rounded px-3 py-2 text-white focus:outline-none focus:border-[#1677FF]"
                  />
                </div>
                <div className="flex items-center space-x-2 mt-6">
                  <input
                    type="checkbox"
                    id="published"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="w-4 h-4 rounded bg-[#111827] border-[#374151] text-[#1677FF] focus:ring-[#1677FF]"
                  />
                  <label htmlFor="published" className="text-sm text-gray-400">Published</label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#374151]">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#1677FF] hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                >
                  {editingId ? 'Save Changes' : 'Create Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
