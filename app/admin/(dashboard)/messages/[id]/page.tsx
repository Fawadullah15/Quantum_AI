import { notFound } from "next/navigation"
import Link from "next/link"
import { revalidatePath } from "next/cache"
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from "@/lib/db"

export const dynamic = 'force-dynamic'

export default async function MessageDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const message = await prisma.contactSubmission.findUnique({
    where: { id }
  });
  
  if (!message) {
    notFound();
  }

  // Server actions
  async function updateStatus(formData: FormData) {
    "use server"
    const session = await getServerSession(authOptions);
    if (!session) throw new Error('Unauthorized');

    const status = formData.get('status') as string
    await prisma.contactSubmission.update({
      where: { id },
      data: { status }
    })
    revalidatePath(`/admin/messages/${id}`)
    revalidatePath('/admin/messages')
    revalidatePath('/admin')
  }

  async function updateNotes(formData: FormData) {
    "use server"
    const session = await getServerSession(authOptions);
    if (!session) throw new Error('Unauthorized');

    const notes = formData.get('notes') as string
    await prisma.contactSubmission.update({
      where: { id },
      data: { notes }
    })
    revalidatePath(`/admin/messages/${id}`)
    revalidatePath('/admin/messages')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/admin/messages" style={{ color: '#9ca3af', textDecoration: 'none' }}>
          ← Back to Messages
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', margin: 0 }}>Message Details</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ backgroundColor: '#0a0f1a', border: '1px solid #1f2937', borderRadius: '8px', padding: '24px' }}>
            <h2 style={{ fontSize: '1.125rem', margin: '0 0 16px 0', color: '#fff', borderBottom: '1px solid #1f2937', paddingBottom: '12px' }}>Contact Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '4px' }}>Name</div>
                <div style={{ color: '#fff', fontWeight: 500 }}>{message.name}</div>
              </div>
              <div>
                <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '4px' }}>Email</div>
                <div style={{ color: '#fff' }}>
                  <a href={`mailto:${message.email}`} style={{ color: '#06b6d4', textDecoration: 'none' }}>{message.email}</a>
                </div>
              </div>
              <div>
                <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '4px' }}>Company</div>
                <div style={{ color: '#fff' }}>{message.company || '-'}</div>
              </div>
              <div>
                <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '4px' }}>Phone</div>
                <div style={{ color: '#fff' }}>{message.phone || '-'}</div>
              </div>
              <div>
                <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '4px' }}>Date Received</div>
                <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{new Date(message.createdAt).toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#0a0f1a', border: '1px solid #1f2937', borderRadius: '8px', padding: '24px' }}>
            <h2 style={{ fontSize: '1.125rem', margin: '0 0 16px 0', color: '#fff', borderBottom: '1px solid #1f2937', paddingBottom: '12px' }}>Project Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '4px' }}>Project Type</div>
                <div style={{ color: '#fff' }}>{message.projectType || '-'}</div>
              </div>
              <div>
                <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '4px' }}>Budget</div>
                <div style={{ color: '#fff' }}>{message.budget || '-'}</div>
              </div>
            </div>
            <div>
              <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '8px' }}>Message</div>
              <div style={{ color: '#fff', backgroundColor: '#111827', padding: '16px', borderRadius: '6px', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {message.message}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ backgroundColor: '#0a0f1a', border: '1px solid #1f2937', borderRadius: '8px', padding: '24px' }}>
            <h2 style={{ fontSize: '1.125rem', margin: '0 0 16px 0', color: '#fff' }}>Status</h2>
            <form action={updateStatus} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <select 
                name="status" 
                defaultValue={message.status}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  backgroundColor: '#111827', 
                  color: '#fff', 
                  border: '1px solid #374151', 
                  borderRadius: '6px' 
                }}
              >
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="CLOSED">Closed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
              <button 
                type="submit"
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#1f2937',
                  color: '#fff',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Update Status
              </button>
            </form>
          </div>

          <div style={{ backgroundColor: '#0a0f1a', border: '1px solid #1f2937', borderRadius: '8px', padding: '24px' }}>
            <h2 style={{ fontSize: '1.125rem', margin: '0 0 16px 0', color: '#fff' }}>Internal Notes</h2>
            <form action={updateNotes} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <textarea 
                name="notes"
                defaultValue={message.notes || ''}
                placeholder="Add internal notes here..."
                rows={5}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  backgroundColor: '#111827', 
                  color: '#fff', 
                  border: '1px solid #374151', 
                  borderRadius: '6px',
                  resize: 'vertical'
                }}
              />
              <button 
                type="submit"
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#06b6d4',
                  color: '#030712',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Save Notes
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
