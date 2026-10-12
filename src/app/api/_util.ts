import { NextResponse } from "next/server";
import { TEMPLATE_IDS } from "@/remotion/registry";
import type { TemplateId } from "@/remotion/lib/types";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

export const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export const asTemplate = (v: unknown): TemplateId | null => (typeof v === "string" && (TEMPLATE_IDS as string[]).includes(v) ? (v as TemplateId) : null);

export const readBody = async <T>(req: Request): Promise<T | null> => {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
};
