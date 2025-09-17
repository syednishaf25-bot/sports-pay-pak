import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse JazzCash callback data
    const formData = await req.formData()
    const callbackData: { [key: string]: string } = {}
    
    for (const [key, value] of formData) {
      callbackData[key] = value.toString()
    }

    const {
      pp_TxnRefNo,
      pp_ResponseCode,
      pp_ResponseMessage,
      pp_Amount,
      pp_AuthCode,
      pp_RetreivalReferenceNo,
      pp_SecureHash
    } = callbackData

    // Verify secure hash (implement proper verification)
    const expectedHash = 'verify_hash_here' // Implement hash verification logic
    
    // Find order by reference number
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('order_number', pp_TxnRefNo)
      .single()

    if (orderError || !order) {
      console.error('Order not found:', pp_TxnRefNo)
      return new Response('Order not found', { status: 404 })
    }

    // Update payment status based on response code
    const paymentStatus = pp_ResponseCode === '000' ? 'completed' : 'failed'
    const orderStatus = pp_ResponseCode === '000' ? 'paid' : 'cancelled'

    // Update payment record
    const { error: paymentError } = await supabaseClient
      .from('payments')
      .update({
        status: paymentStatus,
        transaction_id: pp_RetreivalReferenceNo || pp_TxnRefNo,
        response_data: {
          ...callbackData,
          processed_at: new Date().toISOString(),
        }
      })
      .eq('order_id', order.id)

    // Update order status
    const { error: orderUpdateError } = await supabaseClient
      .from('orders')
      .update({
        status: orderStatus,
        updated_at: new Date().toISOString(),
        pp_txn_ref_no: pp_RetreivalReferenceNo,
      })
      .eq('id', order.id)

    if (paymentError || orderUpdateError) {
      console.error('Database update error:', { paymentError, orderUpdateError })
    }

    // Send confirmation email (implement email service)
    if (pp_ResponseCode === '000') {
      // TODO: Send order confirmation email
      console.log(`Order ${pp_TxnRefNo} paid successfully`)
    }

    // Redirect user based on payment result
    const redirectUrl = pp_ResponseCode === '000' 
      ? `${Deno.env.get('SITE_URL')}/payment/success?order=${pp_TxnRefNo}`
      : `${Deno.env.get('SITE_URL')}/payment/failed?order=${pp_TxnRefNo}&error=${encodeURIComponent(pp_ResponseMessage)}`

    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl,
      },
    })

  } catch (error) {
    console.error('JazzCash callback error:', error)
    
    const errorUrl = `${Deno.env.get('SITE_URL')}/payment/failed?error=${encodeURIComponent('Payment processing error')}`
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': errorUrl,
      },
    })
  }
})