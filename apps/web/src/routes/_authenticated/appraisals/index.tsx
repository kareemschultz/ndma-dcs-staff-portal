import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/appraisals/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/appraisals/"!</div>
}
