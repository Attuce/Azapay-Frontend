import type { Operation } from "effection"
import type { Either } from "fp-ts/Either"

/** Errors a feature can return without exposing backend response bodies. */
export type AppError =
  | { readonly kind: "invalid-request"; readonly operation: string }
  | { readonly kind: "invalid-response"; readonly operation: string }
  | { readonly kind: "transport"; readonly operation: string }
  | {
      readonly kind: "http-status"
      readonly operation: string
      readonly status: number
    }

/** The explicit success or failure channel for application work. */
export type Outcome<T> = Either<AppError, T>

/** An Effection operation whose expected failures use `Outcome`. */
export type UseCase<T> = Operation<Outcome<T>>
