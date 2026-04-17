import { NextResponse } from "next/server";
import { getStoreConnection } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

export async function POST(request) {
  try {
    const body = await request.json();
    const { storeId, companyId, yearId, customerId } = body;

    // Validate required fields
    if (!storeId || !companyId || !yearId || !customerId) {
      return NextResponse.json(
        {
          success: false,
          error: "storeId, companyId, yearId, and customerId are required",
        },
        { status: 400 },
      );
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return NextResponse.json(
        { success: false, error: "Store not found" },
        { status: 404 },
      );
    }

    // Fetch orders from local DB
    const orders = await prisma.order.findMany({
      where: {
        storeId,
        companyId,
        customerId,
      },
    });

    if (orders.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No orders to sync",
      });
    }

    const storeDb = await getStoreConnection({
      dbIp: store.dbIp,
      dbPort: store.dbPort,
      dbName: store.dbName,
      dbUser: store.dbUser,
      dbPassword: store.dbPassword,
    });

    const batchId = uuidv4();

    // Batch insert all orders into remote DB
    if (orders.length > 0) {
      try {
        const outwardQuery = `
          INSERT INTO dbo.tbl_SO(
            LedId_Party,
            OrderNo,
            ItemNo,
            ItemDetailId,
            Rate,
            OrderDate,
            IssDate,
            ODone,
            Qty,
            Free,
            CompanyId,
            YearId
          )
          VALUES 
          ${orders
            .map(
              (_, i) =>
                `(@ledIdParty${i}, @orderNo, @itemNo${i}, @itemDetailId${i}, @rate${i}, @orderDate${i}, @orderDate${i}, 1, @qty${i}, "Free", @companyId${i}, @yearId)`,
            )
            .join(",\n          ")}
        `;

        const request_obj = storeDb.request();
        request_obj.input("orderNo", batchId);
        request_obj.input("yearId", yearId);

        orders.forEach((order, i) => {
          request_obj.input(`ledIdParty${i}`, order.customerId);
          request_obj.input(`itemNo${i}`, 1);
          request_obj.input(`itemDetailId${i}`, order.itemDetailId);
          request_obj.input(`rate${i}`, order.rate);
          request_obj.input(`orderDate${i}`, order.orderedAt);
          request_obj.input(`qty${i}`, order.qty);
          request_obj.input(`companyId${i}`, order.companyId);
        });

        await request_obj.query(outwardQuery);
      } catch (error) {
        console.error("Batch insert error:", error);
      }
    }

    // Delete all orders from local DB
    const orderIds = orders.map((order) => order.id);

    await prisma.order.deleteMany({
      where: {
        id: { in: orderIds },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Orders synced successfully",
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to sync orders",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
