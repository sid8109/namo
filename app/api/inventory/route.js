import { NextResponse } from "next/server";
import { getStoreConnection } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    const companyId = searchParams.get("companyId");
    const searchCriteria = searchParams.get("searchCriteria");
    const searchTerm = searchParams.get("searchTerm");

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

    // Build WHERE clause
    let whereClause = `AA.CompanyId = @companyId AND (FF.Qty - FF.Outward) >= 0`;
    const request_obj = storeDb
      .request()
      .input("companyId", parseInt(companyId));

    if (searchTerm) {
      switch (searchCriteria) {
        case "name":
          whereClause += " AND AA.ItemName LIKE @searchTerm";
          break;
        case "generic":
          whereClause += " AND DD.GrpName LIKE @searchTerm";
          break;
        case "location":
          whereClause += " AND AA.LOCN LIKE @searchTerm";
          break;
        case "manufacturer":
          whereClause += " AND CC.Led_Name LIKE @searchTerm";
          break;
        case "barcode":
          whereClause += " AND FF.Barcode LIKE @searchTerm";
          break;
      }

      request_obj.input("searchTerm", `%${searchTerm}%`);
    }

    // Optimized flat query
    const query = `
      SELECT 
        AA.ItemDetailId as id,
        AA.ItemUsrCode as itemCode,
        AA.ItemName as name,
        BB.GrpName AS packing,
        CC.Led_Name AS manufacturer,
        AA.Mfr_NickName,
        AA.LOCN as location,
        AA.LOCA,
        DD.GrpName AS generic,
        EE.GrpName AS category,
        AA.HSN,
        FF.BatchNo as batch,
        FF.ExpDate as expiry,
        (FF.Qty - FF.Outward) as qty,
        FF.MRP as batchMRP,
        (ISNULL(FF.PTR, 0) * (1 + (ISNULL(AA.S_IGSTPer, 0) / 100.0))) as batchPTR,
        FF.NPR as npr,
        FF.Barcode as barcode
      FROM tbl_ItemMaster AA
      LEFT JOIN tbl_GroupDetail BB 
        ON AA.Pckg_GrpId = BB.GrpId AND BB.Type_Id = 31
      LEFT JOIN tbl_LedgerSetup CC 
        ON AA.Mfr_Led_Id = CC.Led_Id
      LEFT JOIN tbl_GroupDetail DD 
        ON AA.Generic_GrpId = DD.GrpId AND DD.Type_Id = 48
      LEFT JOIN tbl_GroupDetail EE 
        ON AA.ItemCatg_GrpId = EE.GrpId AND EE.Type_Id = 30
      LEFT JOIN tbl_Inward FF 
        ON AA.ItemDetailId = FF.ItemDetailId
      WHERE ${whereClause}
      ORDER BY AA.ItemName ASC
    `;

    const result = await request_obj.query(query);

    // Efficient grouping using Map
    const groupedMap = new Map();

    for (const item of result.recordset) {
      if (!groupedMap.has(item.id)) {
        groupedMap.set(item.id, {
          id: item.id,
          itemCode: item.itemCode,
          name: item.name,
          packing: item.packing,
          manufacturer: item.manufacturer,
          Mfr_NickName: item.Mfr_NickName,
          location: item.location,
          LOCA: item.LOCA,
          generic: item.generic,
          category: item.category,
          HSN: item.HSN,
          batches: [],
          totalQty: 0,
        });
      }

      const entry = groupedMap.get(item.id);

      entry.batches.push({
        batch: item.batch,
        expiry: item.expiry,
        qty: item.qty,
        batchMRP: item.batchMRP,
        batchPTR: item.batchPTR,
        npr: item.npr,
        barcode: item.barcode,
      });

      entry.totalQty += item.qty;
    }

    const data = Array.from(groupedMap.values());

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch inventory data",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
