import { clerkMiddleware } from "@clerk/nextjs/server";

// /app は誰でもアクセス可能（ログインはサブスク済みユーザーのオプション機能）
export default clerkMiddleware();

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
