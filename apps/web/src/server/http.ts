import {
  compose,
  defaultFetch,
  withBaseUrl,
  withTimeout,
  type ExecutableHandler,
  type Result,
} from "@jamx/http"
import type { Operation } from "effection"
import { ServerConfigContext } from "./config"

/** Compose Jamx from scoped server config; callers inject the returned handler. */
export function* createServerHttp(): Operation<ExecutableHandler<Result>> {
  const { apiUrl } = yield* ServerConfigContext.expect()
  return compose(withBaseUrl(apiUrl), withTimeout(10_000))(defaultFetch)
}
