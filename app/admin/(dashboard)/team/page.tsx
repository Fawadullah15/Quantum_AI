import prisma from '@/lib/db'
import TeamClient from './team-client'

export default async function TeamPage() {
  const teamMembers = await prisma.teamMember.findMany({
    orderBy: { order: 'asc' }
  })

  return (
    <div className="p-6 bg-[#111827] min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">Team Management</h1>
      <TeamClient initialTeam={teamMembers} />
    </div>
  )
}
