import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import EditLeadershipForm from "./EditLeadershipForm";

export const dynamic = "force-dynamic";

export default async function EditLeadershipPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");
  const member = await prisma.leadership.findUnique({ where: { id: (await params).id } });
  if (!member) notFound();
  return <EditLeadershipForm member={member} />;
}