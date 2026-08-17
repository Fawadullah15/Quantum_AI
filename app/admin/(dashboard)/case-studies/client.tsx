'use client'

import { useState } from 'react'
import { createCaseStudy, updateCaseStudy, deleteCaseStudy } from './actions'
import type { CaseStudy } from '@prisma/client'

export default function CaseStudiesClient({ caseStudies }: { caseStudies: CaseStudy[] }) {
  const [isEditing, setIsEditing] = useState(false)
  const [current, setCurrent] = useState<CaseStudy | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEdit = (study: CaseStudy) => {
    setCurrent(study)
    setIsEditing(true)
  }

  const handleCreate = () => {
    setCurrent(null)
    setIsEditing(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this case study?')) {
      await deleteCaseStudy(id)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      const data = Object.fromEntries(formData.entries())
      
      if (current?.id) {
        await updateCaseStudy(current.id, data)
      } else {
        await createCaseStudy(data)
      }
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving case study:', error)
      alert('Failed to save case study')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isEditing) {
    return (
      <div className="bg-[#1f2937] p-6 rounded-lg border border-[#374151]">
        <h2 className="text-xl text-white mb-6 font-medium">{current ? 'Edit Case Study' : 'Create Case Study'}</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
              <input name="title" defaultValue={current?.title} required className="w-full bg-[#111827] border border-[#374151] text-white rounded-md p-2.5 focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Slug</label>
              <input name="slug" defaultValue={current?.slug} required className="w-full bg-[#111827] border border-[#374151] text-white rounded-md p-2.5 focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Client</label>
              <input name="client" defaultValue={current?.client} required className="w-full bg-[#111827] border border-[#374151] text-white rounded-md p-2.5 focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Industry</label>
              <input name="industry" defaultValue={current?.industry} required className="w-full bg-[#111827] border border-[#374151] text-white rounded-md p-2.5 focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Year</label>
              <input type="number" name="year" defaultValue={current?.year || new Date().getFullYear()} required className="w-full bg-[#111827] border border-[#374151] text-white rounded-md p-2.5 focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Order</label>
              <input type="number" name="order" defaultValue={current?.order || 0} required className="w-full bg-[#111827] border border-[#374151] text-white rounded-md p-2.5 focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] outline-none transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Problem</label>
            <textarea name="problem" defaultValue={current?.problem} required rows={3} className="w-full bg-[#111827] border border-[#374151] text-white rounded-md p-2.5 focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] outline-none transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Solution</label>
            <textarea name="solution" defaultValue={current?.solution} required rows={3} className="w-full bg-[#111827] border border-[#374151] text-white rounded-md p-2.5 focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] outline-none transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Implementation</label>
            <textarea name="implementation" defaultValue={current?.implementation} required rows={3} className="w-full bg-[#111827] border border-[#374151] text-white rounded-md p-2.5 focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] outline-none transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Results</label>
            <textarea name="results" defaultValue={current?.results} required rows={3} className="w-full bg-[#111827] border border-[#374151] text-white rounded-md p-2.5 focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] outline-none transition-colors" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Technologies</label>
              <input name="technologies" defaultValue={current?.technologies} required placeholder="React, Node.js, AI" className="w-full bg-[#111827] border border-[#374151] text-white rounded-md p-2.5 focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Services</label>
              <input name="services" defaultValue={current?.services} required placeholder="Web Development, AI Consulting" className="w-full bg-[#111827] border border-[#374151] text-white rounded-md p-2.5 focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] outline-none transition-colors" />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input type="checkbox" name="published" id="published" value="true" defaultChecked={current?.published} className="w-4 h-4 rounded border-[#374151] bg-[#111827] text-[#1677FF] focus:ring-[#1677FF]" />
            <label htmlFor="published" className="text-sm font-medium text-gray-300 select-none">Published (visible on website)</label>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-[#374151]">
            <button type="button" onClick={() => setIsEditing(false)} disabled={isSubmitting} className="px-4 py-2 rounded-md text-gray-300 hover:bg-[#374151] transition-colors font-medium disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-md bg-[#1677FF] text-white hover:bg-[#1677FF]/90 transition-colors font-medium disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Save Case Study'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="bg-[#1f2937] rounded-lg border border-[#374151] overflow-hidden shadow-sm">
      <div className="p-5 border-b border-[#374151] flex justify-between items-center bg-[#1f2937]">
        <h2 className="text-lg text-white font-medium">All Case Studies</h2>
        <button onClick={handleCreate} className="px-4 py-2 bg-[#1677FF] text-white rounded-md text-sm font-medium hover:bg-[#1677FF]/90 transition-colors">
          Add New Case Study
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#111827] text-gray-400 text-xs uppercase tracking-wider border-b border-[#374151]">
              <th className="p-4 font-medium">Title</th>
              <th className="p-4 font-medium">Client</th>
              <th className="p-4 font-medium">Industry</th>
              <th className="p-4 font-medium">Year</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#374151]">
            {caseStudies.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No case studies found. Click "Add New Case Study" to create one.
                </td>
              </tr>
            ) : (
              caseStudies.map((study) => (
                <tr key={study.id} className="text-gray-300 hover:bg-[#374151]/30 transition-colors">
                  <td className="p-4 font-medium text-white">{study.title}</td>
                  <td className="p-4 text-sm">{study.client}</td>
                  <td className="p-4 text-sm">{study.industry}</td>
                  <td className="p-4 text-sm">{study.year}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${study.published ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                      {study.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="p-4 text-right text-sm font-medium space-x-3">
                    <button onClick={() => handleEdit(study)} className="text-[#1677FF] hover:text-blue-400 transition-colors">Edit</button>
                    <button onClick={() => handleDelete(study.id)} className="text-red-500 hover:text-red-400 transition-colors">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
