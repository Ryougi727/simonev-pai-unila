import { LoaderCircle } from "lucide-react";

export function ActionSpinner() {
  return <LoaderCircle size={15} aria-hidden="true" className="action-spinner inline-block shrink-0 animate-spin motion-reduce:animate-none" />;
}
