import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/contracts/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/contracts/"!</div>
}
