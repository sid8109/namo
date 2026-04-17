import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { barcode, storeId } = await request.json();

    if (!barcode || !storeId) {
      return NextResponse.json(
        { error: "Barcode and storeId are required" },
        { status: 400 },
      );
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const scanned = await prisma.scanned.upsert({
      where: { storeId_barcode: { storeId, barcode } },
      update: { count: { increment: 1 }, updatedAt: new Date() },
      create: { storeId, barcode, count: 1 },
    });

    return NextResponse.json(scanned, { status: 201 });
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json(
      { error: "Failed to process scan" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const { id, count } = await request.json();

    if (!id || count === undefined) {
      return NextResponse.json(
        { error: "id and count are required" },
        { status: 400 },
      );
    }

    if (typeof count !== "number" || count < 0) {
      return NextResponse.json(
        { error: "count must be a non-negative number" },
        { status: 400 },
      );
    }

    const updated = await prisma.scanned.update({
      where: { id },
      data: { count, updatedAt: new Date() },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Scanned item not found" },
        { status: 404 },
      );
    }

    console.error("Update scan error:", error);
    return NextResponse.json(
      { error: "Failed to update scan" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const deleted = await prisma.scanned.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, message: "Scanned entry deleted", data: deleted },
      { status: 200 },
    );
  } catch (error) {
    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Scanned item not found" },
        { status: 404 },
      );
    }

    console.error("Delete scan error:", error);
    return NextResponse.json(
      { error: "Failed to delete scan" },
      { status: 500 },
    );
  }
}
