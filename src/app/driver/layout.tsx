import { ArrowLeft, Truck } from 'lucide-react';
import Link from 'next/link';

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background">
      {children}
    </div>
  );
}
