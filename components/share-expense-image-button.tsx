"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Share2, Loader2 } from "lucide-react";

interface BalanceRow {
  playerId: string;
  name: string;
  balance: number;
}

interface TransactionRow {
  fromPlayerId: string;
  toPlayerId: string;
  amount: number;
  fromName: string;
  toName: string;
}

const WIDTH = 1080;
const PADDING_X = 72;
const ROW_HEIGHT = 76;

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 1 && ctx.measureText(`${truncated}…`).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}…`;
}

/**
 * Draws a clean, fixed light-themed settlement card to an offscreen
 * canvas — always the same look regardless of the viewer's site theme,
 * since this is meant to be read as a standalone image in a chat, not
 * inside the app.
 */
function drawSettlementCard(
  tournamentName: string,
  balances: BalanceRow[],
  transactions: TransactionRow[]
): HTMLCanvasElement {
  const balancesHeight = balances.length * ROW_HEIGHT;
  const settleHeight = Math.max(transactions.length, 1) * ROW_HEIGHT;
  const height = 300 + balancesHeight + 100 + settleHeight + 160;

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, WIDTH, height);

  let y = 96;
  ctx.fillStyle = "#047857";
  ctx.font = "700 36px system-ui, -apple-system, sans-serif";
  ctx.fillText("🏸 CourtSide", PADDING_X, y);

  y += 64;
  ctx.fillStyle = "#111827";
  ctx.font = "700 48px system-ui, -apple-system, sans-serif";
  ctx.fillText(truncate(ctx, tournamentName, WIDTH - PADDING_X * 2), PADDING_X, y);

  y += 44;
  ctx.fillStyle = "#6b7280";
  ctx.font = "500 30px system-ui, -apple-system, sans-serif";
  ctx.fillText("Expense Split", PADDING_X, y);

  y += 64;
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PADDING_X, y);
  ctx.lineTo(WIDTH - PADDING_X, y);
  ctx.stroke();

  y += 56;
  ctx.fillStyle = "#6b7280";
  ctx.font = "700 28px system-ui, -apple-system, sans-serif";
  ctx.fillText("BALANCES", PADDING_X, y);
  y += 24;

  for (const b of balances) {
    y += 52;
    ctx.fillStyle = "#111827";
    ctx.font = "500 34px system-ui, -apple-system, sans-serif";
    ctx.fillText(truncate(ctx, b.name, 560), PADDING_X, y);

    const label = b.balance === 0 ? "Settled" : b.balance > 0 ? `+₹${b.balance}` : `-₹${Math.abs(b.balance)}`;
    ctx.fillStyle = b.balance === 0 ? "#6b7280" : b.balance > 0 ? "#059669" : "#dc2626";
    ctx.font = "700 34px system-ui, -apple-system, sans-serif";
    const labelWidth = ctx.measureText(label).width;
    ctx.fillText(label, WIDTH - PADDING_X - labelWidth, y);
  }

  y += 72;
  ctx.strokeStyle = "#e5e7eb";
  ctx.beginPath();
  ctx.moveTo(PADDING_X, y);
  ctx.lineTo(WIDTH - PADDING_X, y);
  ctx.stroke();

  y += 56;
  ctx.fillStyle = "#6b7280";
  ctx.font = "700 28px system-ui, -apple-system, sans-serif";
  ctx.fillText("SETTLE UP", PADDING_X, y);
  y += 24;

  if (transactions.length === 0) {
    y += 52;
    ctx.fillStyle = "#6b7280";
    ctx.font = "500 34px system-ui, -apple-system, sans-serif";
    ctx.fillText("Everyone's settled up! 🎉", PADDING_X, y);
  } else {
    for (const t of transactions) {
      y += 52;
      ctx.fillStyle = "#111827";
      ctx.font = "500 32px system-ui, -apple-system, sans-serif";
      const line = `${t.fromName} → ${t.toName}`;
      ctx.fillText(truncate(ctx, line, 560), PADDING_X, y);

      const amountLabel = `₹${t.amount}`;
      ctx.font = "700 34px system-ui, -apple-system, sans-serif";
      const labelWidth = ctx.measureText(amountLabel).width;
      ctx.fillText(amountLabel, WIDTH - PADDING_X - labelWidth, y);
    }
  }

  ctx.fillStyle = "#9ca3af";
  ctx.font = "500 26px system-ui, -apple-system, sans-serif";
  const footer = "via courtside.art";
  const footerWidth = ctx.measureText(footer).width;
  ctx.fillText(footer, (WIDTH - footerWidth) / 2, height - 60);

  return canvas;
}

export function ShareExpenseImageButton({
  tournamentName,
  balances,
  transactions,
}: {
  tournamentName: string;
  balances: BalanceRow[];
  transactions: TransactionRow[];
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleShare = async () => {
    setIsGenerating(true);
    try {
      const canvas = drawSettlementCard(tournamentName, balances, transactions);
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );
      if (!blob) {
        toast.error("Couldn't generate the image");
        return;
      }

      const file = new File([blob], `${tournamentName} expenses.png`, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `${tournamentName} — Expense Split`,
          });
          return;
        } catch {
          // user cancelled the share sheet — fall through to download
          return;
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tournamentName} expenses.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Image downloaded — share it wherever you like");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button variant="secondary" onClick={handleShare} disabled={isGenerating}>
      {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
      Share as Image
    </Button>
  );
}
