import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/compliance/items')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/compliance/items"!</div>
}
