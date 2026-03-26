import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const authHeaderPrefix = "Bearer ";

const workOrderPayloadSchema = z.object({
  customer: z.string().min(1),
  quote: z.string().optional(),
  address: z.string().min(1),
  amount: z.number().positive(),
  startDate: z.string().min(1),
  title: z.string().optional(),
  managementType: z.enum(["Fixed", "Self", "Company"]).optional(),
  amountKind: z.enum(["payout", "contract_total", "unknown"]).optional(),
});

const checkPayloadSchema = z.object({
  amount: z.number().positive(),
  date: z.string().min(1),
  payer: z.string().optional(),
  checkNumber: z.string().optional(),
  memo: z.string().optional(),
  jobs: z.array(
    z.object({
      quote: z.string().optional(),
      customer: z.string().optional(),
    }).refine(
      (value) => Boolean(value.quote?.trim() || value.customer?.trim()),
      { message: "Each check job reference needs a quote or customer." }
    )
  ).optional(),
});

const receiptPayloadSchema = z.object({
  amount: z.number().positive(),
  date: z.string().min(1),
  vendor: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
});

const intakeSchema = z.discriminatedUnion("documentType", [
  z.object({
    eventId: z.string().min(1).optional(),
    userId: z.string().optional(),
    documentType: z.literal("work_order"),
    confidence: z.number().min(0).max(1).optional(),
    rawText: z.string().optional(),
    source: z.object({
      channelId: z.string().min(1),
      conversationId: z.string().optional(),
      messageId: z.string().optional(),
      senderId: z.string().optional(),
      senderName: z.string().optional(),
    }).optional(),
    data: workOrderPayloadSchema,
  }),
  z.object({
    eventId: z.string().min(1).optional(),
    userId: z.string().optional(),
    documentType: z.literal("check"),
    confidence: z.number().min(0).max(1).optional(),
    rawText: z.string().optional(),
    source: z.object({
      channelId: z.string().min(1),
      conversationId: z.string().optional(),
      messageId: z.string().optional(),
      senderId: z.string().optional(),
      senderName: z.string().optional(),
    }).optional(),
    data: checkPayloadSchema,
  }),
  z.object({
    eventId: z.string().min(1).optional(),
    userId: z.string().optional(),
    documentType: z.literal("receipt"),
    confidence: z.number().min(0).max(1).optional(),
    rawText: z.string().optional(),
    source: z.object({
      channelId: z.string().min(1),
      conversationId: z.string().optional(),
      messageId: z.string().optional(),
      senderId: z.string().optional(),
      senderName: z.string().optional(),
    }).optional(),
    data: receiptPayloadSchema,
  }),
]);

function getSharedSecretFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.startsWith(authHeaderPrefix)
    ? authHeader.slice(authHeaderPrefix.length).trim()
    : "";
}

function normalizeCurrency(amount: number) {
  return Math.round(amount * 100) / 100;
}

function normalizeDateString(input: string) {
  const trimmed = input.trim();
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? new Date(`${trimmed}T12:00:00.000Z`)
    : new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${input}`);
  }

  return parsed.toISOString();
}

function buildJobTitle(customer: string, quote?: string, title?: string) {
  const explicitTitle = title?.trim();
  if (explicitTitle) {
    return explicitTitle;
  }

  const lastName = customer.trim().split(/\s+/).pop() || customer.trim();
  return quote?.trim() ? `${lastName} #${quote.trim()}` : lastName;
}

function hashEventId(eventId: string) {
  return createHash("sha256").update(eventId).digest("hex").slice(0, 32);
}

function resolveEventId(payload: z.infer<typeof intakeSchema>) {
  const explicitEventId = payload.eventId?.trim();
  if (explicitEventId) {
    return explicitEventId;
  }

  const messageId = payload.source?.messageId?.trim();
  if (messageId) {
    return `${payload.documentType}:${messageId}`;
  }

  return `${payload.documentType}:${hashEventId(JSON.stringify({
    rawText: payload.rawText ?? "",
    data: payload.data,
    source: payload.source ?? {},
  }))}`;
}

function normalizeLookupValue(value?: string) {
  return (value || "")
    .replace(/^#/, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

async function resolveJobsForCheck(
  userRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>,
  jobs: Array<{ quote?: string; customer?: string }>
) {
  if (jobs.length === 0) {
    return [];
  }

  const snapshot = await userRef.collection("jobs").get();
  const availableJobs = snapshot.docs.map((doc) => ({
    ref: doc.ref,
    quote: normalizeLookupValue(String(doc.get("quoteNumber") || "")),
    clientName: normalizeLookupValue(String(doc.get("clientName") || "")),
    title: normalizeLookupValue(String(doc.get("title") || "")),
  }));

  const matches = new Map<string, FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>>();

  for (const jobRef of jobs) {
    const quote = normalizeLookupValue(jobRef.quote);
    const customer = normalizeLookupValue(jobRef.customer);

    const match = availableJobs.find((job) => {
      const quoteMatched = quote ? job.quote === quote : false;
      const customerMatched = customer
        ? job.clientName === customer
          || job.clientName.includes(customer)
          || customer.includes(job.clientName)
          || job.title.includes(customer)
        : false;

      return quoteMatched || customerMatched;
    });

    if (match) {
      matches.set(match.ref.id, match.ref);
    }
  }

  return Array.from(matches.values());
}

async function resolveTargetUserId(explicitUserId?: string) {
  if (explicitUserId?.trim()) {
    return explicitUserId.trim();
  }

  if (process.env.OPENCLAW_TARGET_USER_ID?.trim()) {
    return process.env.OPENCLAW_TARGET_USER_ID.trim();
  }

  const configuredEmail = process.env.NEXT_PUBLIC_USER_EMAIL?.trim();
  if (configuredEmail) {
    const query = await adminDb
      .collection("users")
      .where("email", "==", configuredEmail)
      .limit(1)
      .get();

    if (!query.empty) {
      return query.docs[0].id;
    }
  }

  const usersSnapshot = await adminDb.collection("users").limit(2).get();
  if (usersSnapshot.size === 1) {
    return usersSnapshot.docs[0].id;
  }

  throw new Error("Unable to resolve target user. Set OPENCLAW_TARGET_USER_ID.");
}

export async function POST(request: NextRequest) {
  try {
    const expectedSecret = process.env.OPENCLAW_INGEST_SECRET?.trim()
      || process.env.PAINTFLOW_INGEST_SECRET?.trim();
    if (!expectedSecret) {
      return NextResponse.json(
        { error: "Missing OPENCLAW_INGEST_SECRET on server." },
        { status: 500 }
      );
    }

    const providedSecret = getSharedSecretFromRequest(request);
    if (providedSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = intakeSchema.parse(await request.json());
    const userId = await resolveTargetUserId(payload.userId);
    const createdAt = new Date().toISOString();
    const resolvedEventId = resolveEventId(payload);
    const eventHash = hashEventId(resolvedEventId);
    const userRef = adminDb.collection("users").doc(userId);
    const eventRef = userRef.collection("automationEvents").doc(eventHash);
    const settingsRef = adminDb.collection("settings").doc("global");
    const matchedCheckJobs = payload.documentType === "check"
      ? await resolveJobsForCheck(userRef, payload.data.jobs || [])
      : [];

    if (payload.documentType === "check" && matchedCheckJobs.length === 0) {
      return NextResponse.json(
        {
          error: "No related jobs matched this check.",
          details: "Include the quote number or customer name in the Discord message or on the check payload.",
        },
        { status: 422 }
      );
    }

    const result = await adminDb.runTransaction(async (transaction) => {
      const existingEvent = await transaction.get(eventRef);
      if (existingEvent.exists) {
        const existingData = existingEvent.data() || {};
        return {
          created: false,
          recordType: existingData.recordType,
          recordId: existingData.recordId,
          recordPath: existingData.recordPath,
          recordIds: existingData.recordIds || [],
          recordPaths: existingData.recordPaths || [],
          userId,
        };
      }

      let recordType: string = payload.documentType;
      let recordId = "";
      let recordPath = "";
      let recordIds: string[] = [];
      let recordPaths: string[] = [];

      const automationMetadata = {
        eventId: resolvedEventId,
        documentType: payload.documentType,
        confidence: payload.confidence ?? null,
        rawText: payload.rawText ?? "",
        source: payload.source ?? {},
        createdAt,
      };

      if (payload.documentType === "work_order") {
        const jobsCollection = userRef.collection("jobs");
        const recordRef = jobsCollection.doc();
        recordId = recordRef.id;
        recordPath = recordRef.path;
        recordIds = [recordRef.id];
        recordPaths = [recordRef.path];
        const managementType = payload.data.managementType ?? "Company";
        const amountKind = payload.data.amountKind ?? "unknown";
        let initialValue = normalizeCurrency(payload.data.amount);
        let budget = initialValue;
        let contractTotal = 0;

        if (managementType === "Self" || amountKind === "contract_total") {
          const settingsSnapshot = await transaction.get(settingsRef);
          const rawValue = settingsSnapshot.get("selfShare");
          const selfShareRatio = typeof rawValue === "number" && rawValue > 0
            ? rawValue / 100
            : 0.52;
          contractTotal = normalizeCurrency(payload.data.amount);
          initialValue = normalizeCurrency(contractTotal * selfShareRatio);
          budget = initialValue;
        }

        transaction.set(recordRef, {
          title: buildJobTitle(payload.data.customer, payload.data.quote, payload.data.title),
          clientName: payload.data.customer.trim(),
          quoteNumber: payload.data.quote?.trim() || "",
          address: payload.data.address.trim(),
          startDate: normalizeDateString(payload.data.startDate),
          initialValue,
          budget,
          contractTotal,
          managementType,
          createdAt,
          status: "Not Started",
          automation: automationMetadata,
        });
      }

      if (payload.documentType === "check") {
        recordType = "jobFinalization";
        const payer = payload.data.payer?.trim() || "";
        const finalizationDate = normalizeDateString(payload.data.date);
        const settlementMetadata = {
          amount: normalizeCurrency(payload.data.amount),
          date: finalizationDate,
          payer,
          checkNumber: payload.data.checkNumber?.trim() || "",
          memo: payload.data.memo?.trim() || "",
          createdAt,
        };

        for (const jobRef of matchedCheckJobs) {
          const jobSnapshot = await transaction.get(jobRef);
          if (!jobSnapshot.exists) {
            continue;
          }

          recordIds.push(jobRef.id);
          recordPaths.push(jobRef.path);

          transaction.set(jobRef, {
            status: "Finalized",
            finalizationDate,
            lastSettlement: settlementMetadata,
            automation: {
              ...automationMetadata,
              settlement: settlementMetadata,
            },
          }, { merge: true });
        }

        recordId = recordIds[0] || "";
        recordPath = recordPaths[0] || "";
      }

      if (payload.documentType === "receipt") {
        recordType = "generalExpense";
        const recordRef = userRef.collection("generalExpenses").doc();
        recordId = recordRef.id;
        recordPath = recordRef.path;
        recordIds = [recordRef.id];
        recordPaths = [recordRef.path];
        const category = payload.data.category?.trim() || "Other";
        const vendor = payload.data.vendor?.trim() || "";

        transaction.set(recordRef, {
          category,
          description: payload.data.description?.trim() || vendor || category,
          amount: normalizeCurrency(payload.data.amount),
          date: normalizeDateString(payload.data.date),
          vendor,
          createdAt,
          automation: automationMetadata,
        });
      }

      if (!recordId || !recordPath) {
        throw new Error("Failed to resolve destination for intake payload.");
      }

      transaction.set(eventRef, {
        eventId: resolvedEventId,
        documentType: payload.documentType,
        recordType,
        recordId,
        recordPath,
        recordIds,
        recordPaths,
        createdAt,
      });

      return {
        created: true,
        recordType,
        recordId,
        recordPath,
        recordIds,
        recordPaths,
        userId,
      };
    });

    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid intake payload", issues: error.issues },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("OpenClaw intake error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
