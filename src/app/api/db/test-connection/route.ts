import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    
    
    let errorMessage: string | null = null;
    try {
      const { error } = await supabase.from('agent_state').select('id', { head: true, count: 'exact' }).limit(1);
      if (error) errorMessage = error.message;
    } catch (inner) {
      errorMessage = inner instanceof Error ? inner.message : 'Unknown query error';
    }

    if (errorMessage) {
      
      const missingRelation = /42P01|relation .* does not exist/i.test(errorMessage);
      if (!missingRelation) {
        return NextResponse.json({ success: false, message: `Database connection failed: ${errorMessage}` });
      }
    }
    return NextResponse.json({ success: true, message: 'Supabase connection successful' });
  } catch (error) {
    return NextResponse.json({ success: false, message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
}

