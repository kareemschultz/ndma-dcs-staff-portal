import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/compliance/training')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/compliance/training"!</div>
}
