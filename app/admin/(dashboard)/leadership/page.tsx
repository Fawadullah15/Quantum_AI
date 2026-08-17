import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function deleteMember(id: string) {
  "use server";
  await prisma.leadership.delete({ where: { id } });
  revalidatePath("/admin/leadership");
}

async function toggleActive(id: string, isActive: boolean) {
  "use server";
  await prisma.leadership.update({ where: { id }, data: { isActive: !isActive } });
  revalidatePath("/admin/leadership");
}

export default async function AdminLeadershipPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const members = await prisma.leadership.findMany({
    orderBy: { displayOrder: "asc" },
  });

  return (
    <div style={{ padding: "2rem", color: "#F8FAFC", fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Leadership</h1>
          <p style={{ color: "#9CA3AF", marginTop: "0.25rem", fontSize: "0.875rem" }}>
            {members.length} member{members.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/admin/leadership/new" style={{ background: "#2563EB", color: "#fff", padding: "0.625rem 1.25rem", borderRadius: "6px", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600 }}>
          + Add Member
        </Link>
      </div>

      {members.length === 0 ? (
        <div style={{ background: "#1F2937", border: "1px dashed #374151", borderRadius: "8px", padding: "4rem", textAlign: "center", color: "#6B7280" }}>
          <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>No leadership members yet.</p>
          <Link href="/admin/leadership/new" style={{ color: "#2563EB" }}>Add your first member</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {members.map((m) => (
            <div key={m.id} style={{ background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1.5rem" }}>
              <div style={{ width: 52, height: 52, borderRadius: "6px", background: "#111827", border: "1px solid #374151", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {m.photo ? (
                  <img src={m.photo} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: "1.25rem", color: "#4B5563" }}>{m.name.charAt(0)}</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                  <span style={{ fontWeight: 600 }}>{m.name}</span>
                  <span style={{ fontSize: "0.7rem", fontFamily: "monospace", background: "#374151", padding: "0.1rem 0.5rem", borderRadius: "4px", color: "#9CA3AF" }}>{m.publicId}</span>
                  {!m.isActive && <span style={{ fontSize: "0.7rem", background: "#7F1D1D", color: "#FCA5A5", padding: "0.1rem 0.5rem", borderRadius: "4px" }}>INACTIVE</span>}
                </div>
                <div style={{ color: "#6B7280", fontSize: "0.8125rem" }}>{m.position.replace("_", " ")}{m.department ? " · " + m.department : ""}</div>
              </div>
              <div style={{ color: "#4B5563", fontFamily: "monospace", fontSize: "0.875rem" }}>#{m.displayOrder + 1}</div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Link href={"/admin/leadership/" + m.id + "/edit"} style={{ background: "#374151", color: "#D1D5DB", padding: "0.375rem 0.75rem", borderRadius: "5px", textDecoration: "none", fontSize: "0.8125rem" }}>Edit</Link>
                <form action={toggleActive.bind(null, m.id, m.isActive)}>
                  <button type="submit" style={{ background: m.isActive ? "#064E3B" : "#1F2937", color: m.isActive ? "#6EE7B7" : "#9CA3AF", border: "1px solid " + (m.isActive ? "#065F46" : "#374151"), padding: "0.375rem 0.75rem", borderRadius: "5px", cursor: "pointer", fontSize: "0.8125rem" }}>{m.isActive ? "Active" : "Inactive"}</button>
                </form>
                <form action={deleteMember.bind(null, m.id)}>
                  <button type="submit" style={{ background: "#7F1D1D", color: "#FCA5A5", border: "none", padding: "0.375rem 0.75rem", borderRadius: "5px", cursor: "pointer", fontSize: "0.8125rem" }}>Delete</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}