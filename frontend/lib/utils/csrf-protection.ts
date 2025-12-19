// import { doubleCsrf } from "csrf-csrf";

// const {
//     doubleCsrfProtection,
//     generateCsrfToken
// } = doubleCsrf({
//     getSecret: () => process.env.CSRF_SECRET || "your-csrf-secret-change-in-production",
//     cookieName: "x-csrf-token",
//     cookieOptions: {
//         sameSite: "lax",
//         path: "/",
//         secure: process.env.NODE_ENV === "production",
//         httpOnly: true,
//     },
//     size: 64,
//     ignoredMethods: ["GET", "HEAD", "OPTIONS"],
// });

// export { doubleCsrfProtection, generateCsrfToken };
