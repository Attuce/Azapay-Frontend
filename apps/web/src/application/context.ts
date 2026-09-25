import type { ExecutableHandler, Result } from "@jamx/http"
import type { Logger } from "@jamx/logger"
import { createContext } from "effection"

/** The Jamx handler supplied for one application workflow. */
export const HttpContext =
  createContext<ExecutableHandler<Result>>("azapay.http")

/** The Jamx logger supplied for one application workflow. */
export const LoggerContext = createContext<Logger>("azapay.logger")
