"use client";

import { useQuery } from "@tanstack/react-query";
import { apiErrorMessage } from "@/lib/api-error-message";

export interface ClientOption {
  id: string;
  name: string;
  clientType: string;
  phone: string;
  city: string;
}

export function useClients(q = "") {
  return useQuery({
    queryKey: ["clients", q],
    queryFn: async () => {
      const res = await fetch(`/api/clients?simple=1&q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(apiErrorMessage(json));
      return json.data.items as ClientOption[];
    },
  });
}
