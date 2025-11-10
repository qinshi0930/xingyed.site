import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/common/libs/auth";

export const { POST, GET } = toNextJsHandler(auth);
