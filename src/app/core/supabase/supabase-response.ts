export function getSupabaseData<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) {
    throw result.error;
  }

  if (result.data === null) {
    throw new Error('Supabase did not return data.');
  }

  return result.data;
}

export function getSupabaseList<T>(result: { data: T[] | null; error: unknown }): T[] {
  if (result.error) {
    throw result.error;
  }

  return result.data || [];
}

export function throwSupabaseError(result: { error: unknown }): void {
  if (result.error) {
    throw result.error;
  }
}
