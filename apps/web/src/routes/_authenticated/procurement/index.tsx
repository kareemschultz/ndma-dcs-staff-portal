import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/procurement/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/procurement/"!</div>
}
