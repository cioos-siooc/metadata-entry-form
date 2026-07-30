import { useRouter, type Href } from "expo-router";
import { useCallback } from "react";

/**
 * Back, for a screen that might have been opened directly.
 *
 * `router.back()` throws "The action 'GO_BACK' was not handled by any
 * navigator" when there is no history — which happens far more often than it
 * sounds: a deep link from an email, a notification, or a QA build launched
 * straight into a route. Every back affordance in the app needs somewhere
 * sensible to land instead, so each caller names its own parent.
 */
export function useGoBack(fallback: Href) {
  const router = useRouter();

  return useCallback(() => {
    if (router.canGoBack()) router.back();
    // `replace`, not `push`: the screen being left should not remain behind the
    // parent, or "back" from there returns to it.
    else router.replace(fallback);
  }, [router, fallback]);
}
