import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/incidents/$incidentId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { incidentId } = Route.useParams();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Incident</h1>
      <p className="text-muted-foreground mt-1">ID: {incidentId}</p>
    </div>
  );
}
