import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/compliance/ppe')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/compliance/ppe"!</div>
}
