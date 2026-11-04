"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { useState, type ReactNode } from "react";

import type { AppRouter } from "@/server/trpc/routers/_app";

const {
  TRPCProvider: Provider,
  useTRPC,
} = createTRPCContext<AppRouter>();

export { useTRPC };

function getBaseUrl() {
  if (typeof window !== "undefined") {
    return "";
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function TRPCReactProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  const [trpcClient] = useState(() =>
    createTRPCClientInstance(),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Provider
        trpcClient={trpcClient}
        queryClient={queryClient}
      >
        {children}
      </Provider>
    </QueryClientProvider>
  );
}

function createTRPCClientInstance() {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
      }),
    ],
  });
}
