"use client";

import { useQuery } from "@tanstack/react-query";
import type { UserRole } from "@prisma/client";
import { apiErrorMessage } from "@/lib/api-error-message";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: UserRole;
  specialization: string | null;
}

export function useTeam() {
  return useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const res = await fetch(`/api/team?simple=1`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(apiErrorMessage(json));
      return json.data.items as TeamMember[];
    },
    staleTime: 60 * 1000,
  });
}
