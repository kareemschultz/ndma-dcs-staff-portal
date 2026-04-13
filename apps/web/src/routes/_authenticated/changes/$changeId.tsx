import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/changes/$changeId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { changeId } = Route.useParams();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Temporary Change</h1>
      <p className="text-muted-foreground mt-1">ID: {changeId}</p>
    </div>
  );
}
