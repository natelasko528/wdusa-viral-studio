import { NextResponse } from "next/server";
import {
  deleteStoredCredential,
  isEncryptionConfigured,
  isStorableCredentialName,
  isWritePinConfigured,
  listCredentialStatus,
  upsertStoredCredential,
  verifyAdminPin,
  type StorableCredentialName,
} from "@/lib/stored-credentials";

export async function GET() {
  try {
    const items = await listCredentialStatus();
    return NextResponse.json({
      items,
      encryptionConfigured: isEncryptionConfigured(),
      requiresAdminPin: isWritePinConfigured(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      name?: string;
      value?: string;
      adminPin?: string;
    };

    if (!verifyAdminPin(body.adminPin)) {
      return NextResponse.json(
        { error: "Invalid or missing SETTINGS_ADMIN_PIN" },
        { status: 401 },
      );
    }

    if (!isEncryptionConfigured()) {
      return NextResponse.json(
        {
          error:
            "SETTINGS_ENCRYPTION_KEY must be set on the server before saving credentials to the database",
        },
        { status: 400 },
      );
    }

    const name = body.name as string | undefined;
    if (!name || !isStorableCredentialName(name)) {
      return NextResponse.json(
        { error: "Invalid or unknown credential name" },
        { status: 400 },
      );
    }

    if (typeof body.value !== "string" || !body.value.trim()) {
      return NextResponse.json({ error: "Non-empty value required" }, { status: 400 });
    }

    await upsertStoredCredential(name as StorableCredentialName, body.value);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = (await req.json()) as {
      name?: string;
      adminPin?: string;
    };

    if (!verifyAdminPin(body.adminPin)) {
      return NextResponse.json(
        { error: "Invalid or missing SETTINGS_ADMIN_PIN" },
        { status: 401 },
      );
    }

    const name = body.name as string | undefined;
    if (!name || !isStorableCredentialName(name)) {
      return NextResponse.json(
        { error: "Invalid or unknown credential name" },
        { status: 400 },
      );
    }

    await deleteStoredCredential(name as StorableCredentialName);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
