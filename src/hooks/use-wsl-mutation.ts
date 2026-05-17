import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { showErrorToast } from "@/lib/errors";

interface UseWslMutationOptions {
  invalidate?: QueryKey[];
}

export function useWslMutation(options: UseWslMutationOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fn,
      success,
    }: {
      fn: () => Promise<void>;
      success: string;
    }) => {
      await fn();
      return success;
    },
    onSuccess: (msg) => {
      toast({ title: msg });
      for (const key of options.invalidate ?? []) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
    onError: (e: Error) => showErrorToast(e),
  });
}
