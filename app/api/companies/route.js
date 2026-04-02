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

    const query = `
      SELECT TOP 2
        AA.CompanyId,
        AA.CompanyName,
        BB.YearId,
        BB.YearNo,
        BB.FrmTo_Date
      FROM tbl_Company AS AA
      LEFT JOIN tbl_Year BB ON AA.CompanyId = BB.CompanyId
      ORDER BY BB.YearNo DESC
    `;

    const result = await storeDb.request().query(query);

    // Group data by CompanyId
    const groupedData = {};

    result.recordset.forEach((item) => {
      if (!groupedData[item.CompanyId]) {
        groupedData[item.CompanyId] = {
          companyId: item.CompanyId,
          companyName: item.CompanyName,
          years: [],
        };
      }

      if (item.YearId) {
        groupedData[item.CompanyId].years.push({
          yearId: item.YearId,
          yearNo: item.YearNo,
          frmToDate: item.FrmTo_Date,
        });
      }
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
        error: "Failed to fetch company data",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
