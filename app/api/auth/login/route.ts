import { NextResponse } from "next/server";
import { AuthService } from "@/server/services/auth.service";
import { loginSchema } from "@/server/validation/auth.validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid login data",
          details: result.error.issues,
        },
        { status: 400 }
      );
    }

    const login = await AuthService.login(result.data);

    const response = NextResponse.json(
      {
        user: login.user,
        business: login.business,
      },
      { status: 200 }
    );

    response.cookies.set({
      name: "shopflow_session",
      value: login.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Invalid email or password"
    ) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    console.error("Login failed:", error);

    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}