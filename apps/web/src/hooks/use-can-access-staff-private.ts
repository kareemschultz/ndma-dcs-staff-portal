import { useQuery } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";

export function useCanAccessStaffPrivate(staffProfileId?: string) {
  const query = staffProfileId
    ? orpc.staff.canAccessPrivate.queryOptions({ input: { staffProfileId } })
    : {
        queryKey: ["staff.canAccessPrivate", null] as const,
        queryFn: async () => ({ allowed: false }),
        enabled: false,
      };

  return useQuery({
    ...query,
    enabled: !!staffProfileId,
    select: (data) => data?.allowed ?? false,
  });
}
