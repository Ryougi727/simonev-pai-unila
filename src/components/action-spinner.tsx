import { LoaderCircle } from "lucide-react";

export function ActionSpinner() {
  return <LoaderCircle size={15} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />;
}
