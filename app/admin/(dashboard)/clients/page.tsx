import prisma from '@/lib/db';
import ClientsManagerClient from './client';

export const metadata = {
  title: 'Clients & Organizations Worked With | Admin Dashboard',
};

export const dynamic = 'force-dynamic';

export default async function ClientsAdminPage() {
  const clients = await prisma.client.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <div className="text-xs font-mono tracking-widest text-blue-400 uppercase mb-1">CONTENT MANAGEMENT</div>
        <h1 className="text-2xl font-bold text-white mb-1.5">With Whom We Have Worked With</h1>
        <p className="text-sm text-gray-400 max-w-2xl">
          Manage client organizations, institutions, and partners displayed on the landing page.
        </p>
      </div>

      <ClientsManagerClient clients={clients} />
    </div>
  );
}
