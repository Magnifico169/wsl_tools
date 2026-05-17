import { toast } from "@/hooks/use-toast";

export function showErrorToast(error: Error, title = "Ошибка") {
  toast({
    title,
    description: error.message,
    variant: "destructive",
  });
}

export async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
  toast({ title: "Скопировано в буфер обмена" });
}
