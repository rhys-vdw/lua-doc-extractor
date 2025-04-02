export type Success<T> = [T, null];
export type Fail = [null, Error];
export type Result<T> = Success<T> | Fail;

export function isSuccess<T>(result: Result<T>): result is Success<T> {
  return result[1] === null;
}

export function isFail<T>(result: Result<T>): result is Fail {
  return result[1] !== null;
}

export function success<T>(value: T): Success<T> {
  return [value, null];
}

export function failAny(error: any): Fail {
  if (error instanceof Error) {
    return fail(error);
  }
  if (typeof error === "string") {
    return fail(new Error(error));
  }
  return fail(new Error(`Unknown error: ${error}`));
}

export function fail(error: Error): Fail {
  return [null as any, error];
}

export function toResult<T>(fn: () => T): Result<T> {
  try {
    return success(fn());
  } catch (e) {
    return failAny(e);
  }
}

export async function toResultAsync<T>(
  fn: () => Promise<T>
): Promise<Result<T>> {
  try {
    return success(await fn());
  } catch (e) {
    return failAny(e);
  }
}
