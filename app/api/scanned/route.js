import { prisma } from "../../../lib/prisma"
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { barcode, storeId } = await request.json();

    if (!barcode || !storeId) {
      return NextResponse.json(
        { error: 'Barcode and storeId are required' },
        { status: 400 }
      );
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    const scanned = await prisma.scanned.upsert({
      where: { storeId_barcode: { storeId, barcode } },
      update: { count: { increment: 1 }, updatedAt: new Date() },
      create: { storeId, barcode, count: 1 },
    });

    return NextResponse.json(scanned, { status: 201 });
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json(
      { error: 'Failed to process scan' },
      { status: 500 }
    );
  }
}
