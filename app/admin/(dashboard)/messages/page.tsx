import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

async function markAsRead(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  await prisma.contactSubmission.update({
    where: { id },
    data: { status: 'CONTACTED' },
  });
  revalidatePath('/admin/messages');
}

async function markAsUnread(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  await prisma.contactSubmission.update({
    where: { id },
    data: { status: 'NEW' },
  });
  revalidatePath('/admin/messages');
}

async function deleteMessage(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  await prisma.contactSubmission.delete({
    where: { id },
  });
  revalidatePath('/admin/messages');
}

export default async function MessagesPage() {
  const messages = await prisma.contactSubmission.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div style={{ padding: '2rem', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Contact Messages</h1>
      </div>

      <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '0.5rem', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#1f2937', borderBottom: '1px solid #374151' }}>
              <tr>
                <th style={{ padding: '1rem', fontWeight: '600', color: '#9ca3af' }}>Date</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: '#9ca3af' }}>Contact Info</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: '#9ca3af' }}>Project Type</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: '#9ca3af' }}>Message</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: '#9ca3af' }}>Status</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: '#9ca3af', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                    No messages found.
                  </td>
                </tr>
              ) : (
                messages.map((msg: any) => (
                  <tr key={msg.id} style={{ borderBottom: '1px solid #1f2937', backgroundColor: msg.status === 'NEW' ? 'rgba(22, 119, 255, 0.05)' : 'transparent' }}>
                    <td style={{ padding: '1rem', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                      {new Date(msg.createdAt).toLocaleDateString()}
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>{msg.name}</div>
                      {msg.company && <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.25rem' }}>{msg.company}</div>}
                      <a href={`mailto:${msg.email}`} style={{ color: '#1677FF', textDecoration: 'none', fontSize: '0.875rem' }}>
                        {msg.email}
                      </a>
                    </td>
                    <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                      <span style={{ backgroundColor: '#374151', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.875rem' }}>
                        {msg.projectType}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', verticalAlign: 'top', maxWidth: '300px' }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#d1d5db', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {msg.message}
                      </p>
                    </td>
                    <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: msg.status === 'NEW' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: msg.status === 'NEW' ? '#60a5fa' : '#34d399'
                      }}>
                        {msg.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {msg.status === 'NEW' ? (
                          <form action={markAsRead}>
                            <input type="hidden" name="id" value={msg.id} />
                            <button
                              type="submit"
                              style={{
                                backgroundColor: '#1677FF',
                                color: 'white',
                                padding: '0.375rem 0.75rem',
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                            >
                              Mark Read
                            </button>
                          </form>
                        ) : (
                          <form action={markAsUnread}>
                            <input type="hidden" name="id" value={msg.id} />
                            <button
                              type="submit"
                              style={{
                                backgroundColor: 'transparent',
                                color: '#9ca3af',
                                padding: '0.375rem 0.75rem',
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem',
                                border: '1px solid #4b5563',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                            >
                              Mark Unread
                            </button>
                          </form>
                        )}
                        <form action={deleteMessage}>
                          <input type="hidden" name="id" value={msg.id} />
                          <button
                            type="submit"
                            style={{
                              backgroundColor: 'transparent',
                              color: '#ef4444',
                              padding: '0.375rem 0.75rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              border: '1px solid rgba(239, 68, 68, 0.5)',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
