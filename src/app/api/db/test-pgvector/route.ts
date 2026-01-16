import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    console.log("[pgvector] /api/db/test-pgvector called");
    console.log("[pgvector] NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("[pgvector] NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY set:", !!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
    );

    
  const { data, error } = await supabase.rpc("test_vector_extension");
    console.log("[pgvector] test_vector_extension RPC result", { data, error });

    if (error || !data) {
      console.log("[pgvector] Vector store test failed", error);
      return NextResponse.json({
        success: false,
        message: `Vector store test failed: ${error ? error.message : "No data returned"}`,
      });
    }

    if (data === true) {
      console.log("[pgvector] pgvector extension working properly");
      return NextResponse.json({
        success: true,
        message: "pgvector extension working properly",
      });
    } else {
      console.log("[pgvector] pgvector extension test failed (data was false)");
      return NextResponse.json({
        success: false,
        message: "pgvector extension test failed (data was false)",
      });
    }
  } catch (error) {
    console.log("[pgvector] Vector test failed", error);
    if (error instanceof Error && error.stack) {
      console.log("[pgvector] Error stack:", error.stack);
    }
    return NextResponse.json({
      success: false,
      message: `Vector test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}
