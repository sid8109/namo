import { NextResponse } from "next/server";
import { getStoreConnection } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    const companyId = searchParams.get("companyId");
    const searchTerm = (searchParams.get("searchTerm") || "").trim();

    if (!storeId) {
      return NextResponse.json(
        { success: false, error: "storeId is required" },
        { status: 400 },
      );
    }

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "companyId is required" },
        { status: 400 },
      );
    }

    // Get store config
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return NextResponse.json(
        { success: false, error: "Store not found" },
        { status: 404 },
      );
    }

    // Connect to store DB
    const storeDb = await getStoreConnection({
      dbIp: store.dbIp,
      dbPort: store.dbPort,
      dbName: store.dbName,
      dbUser: store.dbUser,
      dbPassword: store.dbPassword,
    });

    const requestObj = storeDb
      .request()
      .input("companyId", parseInt(companyId));

    // Optional search
    let searchClause = "";
    if (searchTerm.length > 0) {
      searchClause = " AND AA.ItemName LIKE @searchTerm";
      requestObj.input("searchTerm", `%${searchTerm}%`);
    }

    // Optimized query
    const query = `
      SELECT 
        AA.ItemDetailId,
        AA.ItemUsrCode,
        Max(AA.ItemName) AS ProductName,
        Max(CC.GrpName) AS Packing,
        Max(BB.Led_Name) AS MfgrName,
        Max(DD.GrpName) AS Generics,
        Sum((EE.Qty + EE.SchQty) - (EE.Outward + EE.SchQtyIssued)) AS Qty,
        Max(AA.MRPRate) AS MRP,
        Max(AA.PTRRate) AS PTR
      FROM tbl_ItemMaster AS AA
      LEFT JOIN tbl_LedgerSetup BB 
        ON AA.Mfr_Led_Id = BB.Led_Id AND BB.Type_Id = 7
      LEFT JOIN tbl_GroupDetail CC 
        ON AA.Pckg_GrpId = CC.GrpId AND CC.Type_Id = 31
      LEFT JOIN tbl_GroupDetail DD 
        ON AA.Generic_GrpId = DD.GrpId AND DD.Type_Id = 48
      LEFT JOIN tbl_Inward EE 
        ON AA.ItemDetailId = EE.ItemDetailId
      WHERE
        AA.CompanyId = @companyId
        ${searchClause}
      GROUP BY 
        AA.ItemDetailId,
        AA.ItemUsrCode
      ORDER BY 
        AA.ItemUsrCode ASC
    `;

    const result = await requestObj.query(query);

    return NextResponse.json({
      success: true,
      data: result.recordset,
      count: result.recordset.length,
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch physical inventory summary",
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
      companyId,
      yearId,
      ledId_Party,
      itemDetailId,
      rate,
      qty,
      free = 0,
      orderDate,
    } = body;

    // Validation
    if (
      !storeId ||
      !companyId ||
      !yearId ||
      !ledId_Party ||
      !itemDetailId ||
      rate === undefined ||
      !qty ||
      !orderDate
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get store config
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return NextResponse.json(
        { success: false, error: "Store not found" },
        { status: 404 },
      );
    }

    // Connect to store DB
    const storeDb = await getStoreConnection({
      dbIp: store.dbIp,
      dbPort: store.dbPort,
      dbName: store.dbName,
      dbUser: store.dbUser,
      dbPassword: store.dbPassword,
    });

    // Generate unique OrderNo (alphanumeric)
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderNo = `ORD${timestamp}${random}`;

    // Get next ItemNo for this order
    const itemNoResult = await storeDb
      .request()
      .input("orderNo", orderNo)
      .query(
        "SELECT ISNULL(MAX(ItemNo), 0) + 1 AS NextItemNo FROM tbl_SO WHERE OrderNo = @orderNo",
      );

    const itemNo = itemNoResult.recordset[0]?.NextItemNo || 1;

    // Insert into tbl_SO
    const insertQuery = `
      INSERT INTO dbo.tbl_SO(LedId_Party, OrderNo, ItemNo, ItemDetailId, Rate, OrderDate, IssDate, ODone, Qty, Free, CompanyId, YearId)
      VALUES(@ledId_Party, @orderNo, @itemNo, @itemDetailId, @rate, @orderDate, @issDate, 1, @qty, @free, @companyId, @yearId)
    `;

    const result = await storeDb
      .request()
      .input("ledId_Party", parseInt(ledId_Party))
      .input("orderNo", orderNo)
      .input("itemNo", itemNo)
      .input("itemDetailId", parseInt(itemDetailId))
      .input("rate", parseFloat(rate))
      .input("orderDate", new Date(orderDate))
      .input("issDate", new Date(orderDate))
      .input("qty", parseInt(qty))
      .input("free", parseInt(free))
      .input("companyId", parseInt(companyId))
      .input("yearId", parseInt(yearId))
      .query(insertQuery);

    return NextResponse.json({
      success: true,
      message: "Sales order created successfully",
      orderNo,
      itemNo,
      rowsAffected: result.rowsAffected[0],
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create sales order",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
