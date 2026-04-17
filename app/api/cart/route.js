import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    const customerId = searchParams.get("customerId");
    const companyId = searchParams.get("companyId");

    // Validate required fields
    if (!storeId || !companyId || !customerId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameters: storeId, companyId, customerId",
        },
        { status: 400 },
      );
    }

    // Verify store exists
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return NextResponse.json(
        { success: false, error: "Store not found" },
        { status: 404 },
      );
    }

    const where = {
      storeId,
      customerId: parseInt(customerId),
      companyId: parseInt(companyId),
    };

    const orders = await prisma.order.findMany({
      where,
    });

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Fetch cart error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch cart data",
        message: error.message,
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      storeId,
      customerId,
      companyId,
      itemDetailId,
      qty,
      ptr,
      productName,
      manufacturerName,
      mrp,
      rate,
    } = body;

    // Validate required fields
    if (
      !storeId ||
      !customerId ||
      !itemDetailId ||
      !companyId ||
      qty === undefined ||
      ptr === undefined ||
      !productName ||
      mrp === undefined ||
      rate === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: storeId, customerId, itemDetailId, qty, ptr, productName, mrp, rate",
        },
        { status: 400 },
      );
    }

    // Verify store exists
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return NextResponse.json(
        { success: false, error: "Store not found" },
        { status: 404 },
      );
    }

    // Create order entry
    const order = await prisma.order.create({
      data: {
        storeId,
        customerId: parseInt(customerId),
        companyId: parseInt(companyId),
        itemDetailId: parseInt(itemDetailId),
        qty: parseInt(qty),
        ptr: parseFloat(ptr),
        productName,
        manufacturerName: manufacturerName || null,
        mrp: parseFloat(mrp),
        rate: parseFloat(rate),
      },
    });

    return NextResponse.json({
      success: true,
      data: order,
      message: "Medicine added to cart",
    });
  } catch (error) {
    console.error("Cart error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to add medicine to cart",
        message: error.message,
      },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, storeId, companyId, ptr, qty } = body;

    if (!id || !storeId || !companyId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: id, storeId, companyId",
        },
        { status: 400 },
      );
    }

    // Verify store exists
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return NextResponse.json(
        { success: false, error: "Store not found" },
        { status: 404 },
      );
    }

    const updateData = {};
    if (ptr !== undefined) updateData.ptr = parseFloat(ptr);
    if (qty !== undefined) updateData.qty = parseInt(qty);

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 },
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id), storeId, companyId: parseInt(companyId) },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: "Order updated successfully",
    });
  } catch (error) {
    console.error("Update cart error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update order",
        message: error.message,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const storeId = searchParams.get("storeId");
    const companyId = searchParams.get("companyId");

    if (!id || !storeId || !companyId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters: id, storeId, companyId" },
        { status: 400 },
      );
    }

    // Verify store exists
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return NextResponse.json(
        { success: false, error: "Store not found" },
        { status: 404 },
      );
    }

    const order = await prisma.order.delete({
      where: { id: parseInt(id), storeId, companyId: parseInt(companyId) },
    });

    return NextResponse.json({
      success: true,
      data: order,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Delete cart error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete order",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
