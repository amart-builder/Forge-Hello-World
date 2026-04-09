import CrmSubNav from "@/components/layout/CrmSubNav";

export default function CrmLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col h-full">
      <CrmSubNav />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
