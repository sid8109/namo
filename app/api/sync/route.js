import { NextResponse } from "next/server";
import { getStoreConnection } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    const companyId = searchParams.get("companyId");

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
        meta: {
          scannedCount: 0,
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

    const req = storeDb.request().input("companyId", parseInt(companyId));

    const valuesClause = barcodes.map((_, i) => `(@barcode${i})`).join(",");

    barcodes.forEach((code, i) => {
      req.input(`barcode${i}`, code);
    });

    const query = `
      WITH BarcodeList AS (
        SELECT barcode
        FROM (VALUES ${valuesClause}) AS t(barcode)
      )
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
        FF.qty,
        FF.MRP as batchMRP,
        ISNULL(FF.PTR, 0) as batchPTR,
        (ISNULL(FF.PTR, 0) * (1 + (ISNULL(AA.S_IGSTPer, 0) / 100.0))) as batchPTRWithGST,
        FF.NPR as npr,
        FF.Barcode as barcode,
        FF.MyTYpe,
        FF.UsrId,
        FF.MyItemNo,
        FF.SuppId 
      FROM BarcodeList BL
      INNER JOIN (
        SELECT 
          ItemDetailId,
          BatchNo,
          ExpDate,
          (Qty - Outward) as qty,
          MRP,
          PTR,
          NPR,
          Barcode,
          MyTYpe,
          UsrId,
          MyItemNo,
          SuppId
        FROM tbl_Inward
        WHERE (Qty - Outward) >= 0
      ) FF ON FF.Barcode = BL.barcode
      INNER JOIN tbl_ItemMaster AA 
        ON AA.ItemDetailId = FF.ItemDetailId
      LEFT JOIN tbl_GroupDetail BB 
        ON AA.Pckg_GrpId = BB.GrpId AND BB.Type_Id = 31
      LEFT JOIN tbl_LedgerSetup CC 
        ON AA.Mfr_Led_Id = CC.Led_Id
      LEFT JOIN tbl_GroupDetail DD 
        ON AA.Generic_GrpId = DD.GrpId AND DD.Type_Id = 48
      LEFT JOIN tbl_GroupDetail EE 
        ON AA.ItemCatg_GrpId = EE.GrpId AND EE.Type_Id = 30
      WHERE AA.CompanyId = @companyId
        AND FF.Barcode = BL.barcode
      ORDER BY AA.ItemName ASC
    `;

    const result = await req.query(query);
    const rows = result.recordset || [];

    const scannedMap = new Map(
      scannedRows.map((r) => [String(r.barcode).trim(), r]),
    );

    const matchedBarcodes = new Set();

    const data = rows.map((item) => {
      const key = String(item.barcode || "").trim();
      if (key) matchedBarcodes.add(key);

      const scan = scannedMap.get(key);

      return {
        ...item,
        scannedId: scan?.id ?? null,
        scannedCount: scan?.count || 0,
      };
    });

    console.log("Matched barcodes:", data);

    return NextResponse.json({
      success: true,
      data,
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

export async function POST(request) {
  try {
    const body = await request.json();
    const { storeId, companyId = 2, yearId, items = [] } = body;

    console.log("Sync POST payload:", {
      storeId,
      companyId,
      yearId,
      itemsCount: items,
    });

    if (!storeId || !yearId) {
      return NextResponse.json(
        { success: false, error: "storeId and yearId are required" },
        { status: 400 },
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "No items to sync" },
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

    const storeDb = await getStoreConnection({
      dbIp: store.dbIp,
      dbPort: store.dbPort,
      dbName: store.dbName,
      dbUser: store.dbUser,
      dbPassword: store.dbPassword,
    });

    const inwardItems = [];
    const outwardItems = [];
    const syncedScannedIds = [];

    // Process each item and calculate difference
    for (const item of items) {
      const systemQty = item.qty || 0;
      const scannedQty = item.scannedCount || 0;
      const difference = scannedQty - systemQty;

      if (difference === 0) {
        syncedScannedIds.push(item.scannedId);
        continue;
      }
      if (difference > 0) {
        inwardItems.push({ ...item, difference });
      } else {
        outwardItems.push({ ...item, difference });
      }
    }

    // // Insert inward records
    // if (inwardItems.length > 0) {
    //   const inwardQuery = `
    //     INSERT INTO tbl_Inward
    //     (CompanyId, YearId, MyType, UsrDate, MyItemNo, UsrId, LedId_Trading, ItemDetailId, BatchNo, ExpDate, Qty, Rate, GrsAmt, PTR, MRP, RateType, S_IGSTPer)
    //     VALUES
    //     ${inwardItems
    //       .map(
    //         (_, i) =>
    //           `(@companyId, @yearId, 'STKIN', CAST(GETDATE() AS DATE), 'AUTO', 1, NULL, @itemDetailId${i}, @batchNo${i}, @expDate${i}, @qty${i}, @rate${i}, @rate${i} * @qty${i}, @rate${i}, @rate${i}, 'MRP', @gstPer${i})`,
    //       )
    //       .join(",\n        ")}
    //   `;

    //   let inwardReq = storeDb
    //     .request()
    //     .input("companyId", parseInt(companyId))
    //     .input("yearId", parseInt(yearId));

    //   inwardItems.forEach((item, i) => {
    //     inwardReq
    //       .input(`itemDetailId${i}`, item.itemDetailId)
    //       .input(`batchNo${i}`, item.batchNo)
    //       .input(`expDate${i}`, item.expDate)
    //       .input(`qty${i}`, item.qty)
    //       .input(`rate${i}`, parseFloat(item.rate))
    //       .input(`gstPer${i}`, item.gstPer);
    //   });

    //   await inwardReq.query(inwardQuery);
    // }

    // Insert outward records
    if (outwardItems.length > 0) {
      // Retrieve the max MyId and current UsrId
      const idsQuery = `
        SELECT ISNULL(MAX(MyId), 0) as maxMyId, MAX(UsrId) as usrId FROM tbl_Outward WHERE CompanyId = @companyId
      `;
      const idsResult = await storeDb
        .request()
        .input("companyId", parseInt(companyId))
        .query(idsQuery);
      const { maxMyId = 0, usrId = 1 } = idsResult.recordset[0] || {};

      let nextMyId = maxMyId + 1;
      let nextUsrId = usrId + 1;

      console.log("Next MyId:", nextMyId, "Next UsrId:", nextUsrId);
      const outwardQuery = `
        INSERT INTO tbl_Outward 
        (MyId, UsrDate, MyType, MyItemNo, UsrId, LedId_Party, LedId_Trading, StkFrom, StkFromId, StkFromItemNo, ItemDetailId, BatchNo, Qty, CP, PTR, SPTR, MRP, NSR, GrpId_Reason, SuppId, PNote, CompanyId, YearId)
        VALUES 
        ${outwardItems
          .map(
            (_, i) =>
              `(@myId${i}, CAST(GETDATE() AS DATE), 'STKOT', @scannedId${i}, @usrId${i}, 0, 0, @stkFrom${i}, @stkFromId${i}, @stkFromItemNo${i}, @itemDetailId${i}, @batchNo${i}, @qty${i}, @npr${i}, @batchPTR${i}, @sptr${i}, @batchMRP${i}, @npr${i}, 15, @suppId${i}, 'Namo Webapp', @companyId, @yearId)`,
          )
          .join(",\n        ")}
      `;

      let outwardReq = storeDb
        .request()
        .input("companyId", parseInt(companyId))
        .input("yearId", parseInt(yearId));

      outwardItems.forEach((item, i) => {
        console.log(`Adding input for item ${i}:`, {
          myId: nextMyId + i,
          usrId: nextUsrId + i,
          itemDetailId: item.id,
          batch: item.batch,
          qty: Math.abs(item.difference),
        });
        outwardReq
          .input(`myId${i}`, nextMyId + i)
          .input(`usrId${i}`, nextUsrId + i)
          .input(`scannedId${i}`, item.scannedId || 1)
          .input(`stkFrom${i}`, item.MyTYpe || "")
          .input(`stkFromId${i}`, item.UsrId || 0)
          .input(`stkFromItemNo${i}`, item.MyItemNo || 0)
          .input(`itemDetailId${i}`, item.id)
          .input(`batchNo${i}`, item.batch)
          .input(`qty${i}`, Math.abs(item.difference))
          .input(`npr${i}`, parseFloat(item.npr || 0))
          .input(`batchPTR${i}`, parseFloat(item.batchPTR || 0))
          .input(`sptr${i}`, parseFloat(item.batchPTRWithGST || 0))
          .input(`batchMRP${i}`, parseFloat(item.batchMRP || 0))
          .input(`suppId${i}`, item.suppId || 0);
      });

      console.log("Executing outward query with items:", outwardItems);

      await outwardReq.query(outwardQuery);
    }

    // Clear all scanned records
    await prisma.scanned.deleteMany({
      where: { storeId },
    });

    return NextResponse.json({
      success: true,
      message: "Sync completed successfully",
      inwardCount: inwardItems.length,
      outwardCount: outwardItems.length,
      totalSynced: items.length,
    });
  } catch (error) {
    console.error("Sync POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to sync inventory",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
