import { getVaultEntries } from "@/lib/admin-data";
import { vaultKeyConfigured } from "@/lib/crypto";
import VaultManager from "@/components/admin/VaultManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contraseñas" };

export default async function VaultPage() {
  let entries = [] as Awaited<ReturnType<typeof getVaultEntries>>;
  let ready = true;
  try {
    entries = await getVaultEntries();
  } catch {
    ready = false;
  }

  return (
    <div>
      <h1 className="font-serif text-3xl">Contraseñas</h1>
      <p className="mb-8 mt-1 max-w-2xl text-muted">
        Guarda de forma segura las claves del equipo (redes, proveedores, correo…).
        Se cifran antes de guardarse y solo tú, con sesión de admin, puedes verlas.
        Usa el generador para crear contraseñas fuertes.
      </p>
      {!ready ? (
        <div className="border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Ejecuta la migración <b>008_vault.sql</b> en Supabase para activar el gestor.
        </div>
      ) : (
        <VaultManager entries={entries} keyConfigured={vaultKeyConfigured()} />
      )}
    </div>
  );
}
