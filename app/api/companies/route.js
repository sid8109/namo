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

    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

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

    const query = `
      SELECT 
        CompanyId,
        CompanyName,
        YearId,
        YearNo,
        FrmTo_Date
      FROM (
        SELECT 
          AA.CompanyId,
          AA.CompanyName,
          BB.YearId,
          BB.YearNo,
          BB.FrmTo_Date,
          ROW_NUMBER() OVER (
            PARTITION BY AA.CompanyId 
            ORDER BY BB.YearNo DESC
          ) as rn
        FROM tbl_Company AA
        LEFT JOIN tbl_Year BB 
          ON AA.CompanyId = BB.CompanyId
      ) t
      WHERE rn <= 2
      ORDER BY CompanyId, YearNo DESC
    `;

    const result = await storeDb.request().query(query);

    // Efficient grouping
    const map = new Map();

    for (const row of result.recordset) {
      if (!map.has(row.CompanyId)) {
        map.set(row.CompanyId, {
          companyId: row.CompanyId,
          companyName: row.CompanyName,
          years: [],
        });
      }

      if (row.YearId) {
        map.get(row.CompanyId).years.push({
          yearId: row.YearId,
          yearNo: row.YearNo,
          frmToDate: row.FrmTo_Date,
        });
      }
    }

    const data = Array.from(map.values());

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch company data",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
