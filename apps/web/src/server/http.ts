import {
  compose,
  defaultFetch,
  withAuth,
  withBaseUrl,
  withTimeout,
  type ExecutableHandler,
  type Result,
} from "@jamx/http"
import type { Operation } from "effection"
import { AccessTokenContext } from "../application/context"
import { ServerConfigContext } from "./config"

/** Compose Jamx from scoped server config; callers inject the returned handler. */
export function* createServerHttp(): Operation<ExecutableHandler<Result>> {
  const { apiUrl } = yield* ServerConfigContext.expect()
  return compose(withBaseUrl(apiUrl), withTimeout(10_000))(defaultFetch)
}

/** Compose Jamx with the token captured from this workflow's context. */
export function* createAuthenticatedServerHttp(): Operation<
  ExecutableHandler<Result>
> {
  const { apiUrl } = yield* ServerConfigContext.expect()
  const accessToken = yield* AccessTokenContext.expect()

  return compose(
    withBaseUrl(apiUrl),
    withTimeout(10_000),
    withAuth(accessToken)
  )(defaultFetch)
}
