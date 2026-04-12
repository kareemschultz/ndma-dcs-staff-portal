import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/audit/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/audit/"!</div>
}
