import { NextResponse } from "next/server";
import { getStoreConnection } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");

    if (!storeId) {
      return NextResponse.json(
        { success: false, error: "storeId is required" },
        { status: 400 }
      );
    }

    // Get store configuration from main database
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return NextResponse.json(
        { success: false, error: "Store not found" },
        { status: 404 }
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
        AA.S_IGSTPer as gst,
        AA.MRPRate as mrp,
        AA.PurcRate as purchaseRate,
        AA.PTRRate as ptrRate,
        AA.BulkPk_Pcs as bulkPack,
        AA.CasePk_Pcs as casePack,
        FF.BatchNo as batch,
        FF.ExpDate as expiry,
        (FF.Qty - FF.Outward) as qty,
        FF.MRP as batchMRP,
        FF.PTR as batchPTR,
        FF.NPR as npr,
        FF.Barcode as barcode
      FROM tbl_ItemMaster AS AA
      LEFT JOIN tbl_GroupDetail BB ON AA.Pckg_GrpId = BB.GrpId AND BB.Type_Id = 31
      LEFT JOIN tbl_LedgerSetup CC ON AA.Mfr_Led_Id = CC.Led_Id
      LEFT JOIN tbl_GroupDetail DD ON AA.Generic_GrpId = DD.GrpId AND DD.Type_Id = 48
      LEFT JOIN tbl_GroupDetail EE ON AA.ItemCatg_GrpId = EE.GrpId AND EE.Type_Id = 30
      LEFT JOIN tbl_Inward FF ON AA.ItemDetailId = FF.ItemDetailId
      WHERE AA.CompanyId = 2 AND (FF.Qty - FF.Outward) > 0
    `;

    const result = await storeDb.request()
      .input('companyId', 2)
      .query(query);

    // Group data by ItemDetailId
    const groupedData = {};
    
    result.recordset.forEach(item => {
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
          gst: item.gst,
          mrp: item.mrp,
          purchaseRate: item.purchaseRate,
          ptrRate: item.ptrRate,
          bulkPack: item.bulkPack,
          casePack: item.casePack,
          batches: [],
          totalQty: 0
        };
      }
      
      groupedData[item.id].batches.push({
        batch: item.batch,
        expiry: item.expiry,
        qty: item.qty,
        batchMRP: item.batchMRP,
        batchPTR: item.batchPTR,
        npr: item.npr,
        barcode: item.barcode
      });
      
      groupedData[item.id].totalQty += item.qty;
    });

    const groupedArray = Object.values(groupedData);

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
      { status: 500 }
    );
  }
}
