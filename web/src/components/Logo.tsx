import Image from "next/image";
import Link from "next/link";

export default function Logo({
  className = "",
  width = 150,
}: {
  className?: string;
  width?: number;
}) {
  return (
    <Link href="/" className={`inline-block ${className}`} aria-label="Oucy Studios">
      <Image
        src="/logo.png"
        alt="Oucy Studios"
        width={width}
        height={Math.round((width * 960) / 3665)}
        priority
      />
    </Link>
  );
}
