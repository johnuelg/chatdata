import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hello World App" },
      { name: "description", content: "A simple hello world app." },
      { property: "og:title", content: "Hello World App" },
      { property: "og:description", content: "A simple hello world app." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <main className="text-center">
        <h1 className="text-4xl font-bold text-foreground">Hello, World!</h1>
      </main>
    </div>
  );
}
