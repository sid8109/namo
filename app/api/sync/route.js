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
        { status: 400 },
      );
    }

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      return NextResponse.json(
        { success: false, error: "Store not found" },
        { status: 404 },
      );
    }

    const scannedRows = await prisma.scanned.findMany({
      where: { storeId },
      select: { id: true, barcode: true, count: true, updatedAt: true },
    });

    const barcodes = scannedRows
      .map((r) => String(r.barcode).trim())
      .filter(Boolean);

    if (!barcodes.length) {
      return NextResponse.json({
        success: true,
        data: [],
        missingBarcodes: [],
        meta: {
          scannedCount: 0,
          matchedCount: 0,
          missingCount: 0,
          rowCount: 0,
        },
      });
    }

    const storeDb = await getStoreConnection({
      dbIp: store.dbIp,
      dbPort: store.dbPort,
      dbName: store.dbName,
      dbUser: store.dbUser,
      dbPassword: store.dbPassword,
    });

    const req = storeDb.request().input("companyId", 2);
    const barcodeParams = barcodes.map((_, i) => `@barcode${i}`);
    barcodes.forEach((code, i) => req.input(`barcode${i}`, code));

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
      WHERE AA.CompanyId = @companyId
        AND (FF.Qty - FF.Outward) > 0
        AND FF.Barcode IN (${barcodeParams.join(",")})
    `;

    const result = await req.query(query);
    const allRows = result.recordset || [];

    const scannedByBarcode = new Map(
      scannedRows.map((r) => [String(r.barcode).trim(), r]),
    );

    const matchedBarcodes = new Set();
    const data = allRows.map((item) => {
      const barcodeKey = String(item.barcode || "").trim();
      if (barcodeKey) matchedBarcodes.add(barcodeKey);

      const scanRow = scannedByBarcode.get(barcodeKey);

      return {
        ...item,
        scannedId: scanRow?.id ?? null,
        scannedCount: scanRow?.count || 0,
      };
    });

    data.sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", undefined, {
        sensitivity: "base",
      }),
    );

    const missingBarcodes = barcodes.filter((b) => !matchedBarcodes.has(b));

    return NextResponse.json({
      success: true,
      data,
      missingBarcodes,
      meta: {
        scannedCount: barcodes.length,
        matchedCount: barcodes.length - missingBarcodes.length,
        missingCount: missingBarcodes.length,
        rowCount: data.length,
      },
    });
  } catch (error) {
    console.error("Sync route error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to sync scanned barcodes",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
