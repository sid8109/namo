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

    // Get store configuration from main database
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return NextResponse.json(
        { success: false, error: "Store not found" },
        { status: 404 },
      );
    }

    // Connect to store's database
    const storeDb = await getStoreConnection({
      dbIp: store.dbIp,
      dbPort: store.dbPort,
      dbName: store.dbName,
      dbUser: store.dbUser,
      dbPassword: store.dbPassword,
    });

    // Build dynamic WHERE clause based on search criteria
    let whereClause = `AA.CompanyId = @companyId AND (FF.Qty - FF.Outward) >= 0`;
    const request_obj = storeDb
      .request()
      .input("companyId", parseInt(companyId));

    if (searchTerm) {
      switch (searchCriteria) {
        case "name":
          whereClause += " AND AA.ItemName LIKE @searchTerm";
          request_obj.input("searchTerm", `%${searchTerm}%`);
          break;
        case "generic":
          whereClause += " AND DD.GrpName LIKE @searchTerm";
          request_obj.input("searchTerm", `%${searchTerm}%`);
          break;
        case "location":
          whereClause += " AND AA.LOCN LIKE @searchTerm";
          request_obj.input("searchTerm", `%${searchTerm}%`);
          break;
        case "manufacturer":
          whereClause += " AND CC.Led_Name LIKE @searchTerm";
          request_obj.input("searchTerm", `%${searchTerm}%`);
          break;
        case "barcode":
          whereClause += " AND FF.Barcode LIKE @searchTerm";
          request_obj.input("searchTerm", `%${searchTerm}%`);
          break;
      }
    }

    // AA.MRPRate as mrp,
    // AA.PurcRate as purchaseRate,
    // AA.PTRRate as ptrRate,
    // AA.BulkPk_Pcs as bulkPack,
    // AA.CasePk_Pcs as casePack,

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
      FROM tbl_ItemMaster AS AA
      LEFT JOIN tbl_GroupDetail BB ON AA.Pckg_GrpId = BB.GrpId AND BB.Type_Id = 31
      LEFT JOIN tbl_LedgerSetup CC ON AA.Mfr_Led_Id = CC.Led_Id
      LEFT JOIN tbl_GroupDetail DD ON AA.Generic_GrpId = DD.GrpId AND DD.Type_Id = 48
      LEFT JOIN tbl_GroupDetail EE ON AA.ItemCatg_GrpId = EE.GrpId AND EE.Type_Id = 30
      LEFT JOIN tbl_Inward FF ON AA.ItemDetailId = FF.ItemDetailId
      WHERE ${whereClause}
    `;

    const result = await request_obj.query(query);

    // Group data by ItemDetailId
    const groupedData = {};

    result.recordset.forEach((item) => {
      if (!groupedData[item.id]) {
        groupedData[item.id] = {
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
        };
      }

      groupedData[item.id].batches.push({
        batch: item.batch,
        expiry: item.expiry,
        qty: item.qty,
        batchMRP: item.batchMRP,
        batchPTR: item.batchPTR,
        npr: item.npr,
        barcode: item.barcode,
      });

      groupedData[item.id].totalQty += item.qty;
    });

    const groupedArray = Object.values(groupedData).sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", undefined, {
        sensitivity: "base",
      }),
    );

    return NextResponse.json({
      success: true,
      data: groupedArray,
      count: groupedArray.length,
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
