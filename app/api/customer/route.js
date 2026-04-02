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
      SELECT 
        AA.Led_Id as id,
        AA.Usr_Code as userCode,
        AA.Led_Name as name,
        BB.GrpId as area,
        AA.Add_1 as address,
        AA.Drug_Lic_1 as drugLicense1,
        AA.Drug_Lic_2 as drugLicense2,
        AA.GSTIN as gstin
      FROM tbl_LedgerSetup AS AA
      LEFT JOIN tbl_GroupDetail BB ON AA.Grp_Id_Area = BB.GrpId
      WHERE AA.Type_Id = 3
      ORDER BY AA.Led_Name
    `;

    const result = await storeDb.request().query(query);

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
        error: "Failed to fetch companies data",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
