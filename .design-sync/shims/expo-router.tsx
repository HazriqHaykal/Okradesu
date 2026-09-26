/**
 * Web stand-in for expo-router inside Claude Design: components keep their
 * link props, but navigation is a no-op because there is no app router there.
 */
import type { ReactNode } from 'react';

export type Href = string | { pathname: string; params?: Record<string, string> };

const noop = (..._args: unknown[]) => {};
export const router = {
  navigate: noop,
  push: noop,
  replace: noop,
  back: noop,
  canGoBack: () => false,
  setParams: noop,
};

export function Link({ children }: { href: Href; asChild?: boolean; style?: unknown; children?: ReactNode }) {
  return <>{children}</>;
}

export const useLocalSearchParams = () => ({});
export const useRouter = () => router;
