import SignatureBuilder from "@/components/admin/SignatureBuilder";

export const dynamic = "force-dynamic";
export const metadata = { title: "Firmas de email · Oucy Studios" };

export default function FirmaPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl">Firmas de email</h1>
      <p className="mb-8 mt-1 max-w-2xl text-muted">
        Crea tu firma de correo con la imagen de Oucy Studios. Rellena tus datos,
        cópiala y pégala en los ajustes de firma de Gmail, Outlook o Apple Mail.
      </p>
      <SignatureBuilder />
    </div>
  );
}
