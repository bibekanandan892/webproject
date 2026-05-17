import { getVariant, type VariantId } from "./registry";

interface VariantHostProps {
  id: VariantId;
}

/**
 * Wraps a variant's root component in a div carrying [data-variant="<id>"].
 * That attribute drives all variant-scoped CSS in src/app/globals.css.
 */
export function VariantHost({ id }: VariantHostProps) {
  const v = getVariant(id);
  if (!v) return null;
  const Component = v.Component;
  return (
    <div data-variant={id} className="min-h-screen">
      <Component />
    </div>
  );
}
