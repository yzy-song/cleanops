export const metadata = {
  title: "Book a Cleaning Service",
  description: "Book professional cleaning services online",
};

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <main>{children}</main>
    </div>
  );
}
