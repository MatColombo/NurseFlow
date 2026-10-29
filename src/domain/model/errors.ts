export class IntegrityError extends Error {
  override name = 'IntegrityError';
}
export class ConflictError extends Error {
  override name = 'ConflictError';
}
export class ImmutableRecordError extends Error {
  override name = 'ImmutableRecordError';
}
