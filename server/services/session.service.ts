import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  hashSessionToken,
} from "@/lib/session";

const SESSION_DURATION_DAYS = 7;

export class SessionService {
  static async createSession(userId: string) {
    const token = createSessionToken();
    const tokenHash = hashSessionToken(token);

    const expiresAt = new Date();

    expiresAt.setDate(
      expiresAt.getDate() + SESSION_DURATION_DAYS
    );

    const session = await prisma.session.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      session,
      token,
    };
  }

  static async getSessionByToken(token: string) {
    const tokenHash = hashSessionToken(token);

    const session = await prisma.session.findUnique({
      where: {
        tokenHash,
      },
      include: {
        user: {
          include: {
            business: true,
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    if (session.expiresAt <= new Date()) {
      await prisma.session.delete({
        where: {
          id: session.id,
        },
      });

      return null;
    }

    return session;
  }

  static async deleteSession(token: string) {
    const tokenHash = hashSessionToken(token);

    await prisma.session.deleteMany({
      where: {
        tokenHash,
      },
    });
  }
}