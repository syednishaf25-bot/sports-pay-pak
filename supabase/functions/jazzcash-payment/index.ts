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

    const { orderId, amount, currency = 'PKR' } = await req.json()

    if (!orderId || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Fetch order details from database
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // JazzCash Configuration (Replace with your actual credentials)
    const JAZZCASH_CONFIG = {
      merchant_id: Deno.env.get('JAZZCASH_MERCHANT_ID') ?? '',
      password: Deno.env.get('JAZZCASH_PASSWORD') ?? '',
      integrity_salt: Deno.env.get('JAZZCASH_INTEGRITY_SALT') ?? '',
      return_url: `${Deno.env.get('SITE_URL')}/payment/success`,
      cancel_url: `${Deno.env.get('SITE_URL')}/payment/cancel`,
    }

    // Generate JazzCash payment payload
    const paymentData = {
      pp_Version: '1.1',
      pp_TxnType: 'MWALLET',
      pp_Language: 'EN',
      pp_MerchantID: JAZZCASH_CONFIG.merchant_id,
      pp_SubMerchantID: '',
      pp_Password: JAZZCASH_CONFIG.password,
      pp_BankID: 'TBANK',
      pp_ProductID: 'RETL',
      pp_TxnRefNo: order.order_number,
      pp_Amount: (amount * 100).toString(), // JazzCash expects amount in paisa
      pp_TxnCurrency: currency,
      pp_TxnDateTime: new Date().toISOString().replace(/[-:]/g, '').slice(0, 14),
      pp_BillReference: order.order_number,
      pp_Description: `Payment for Order ${order.order_number}`,
      pp_TxnExpiryDateTime: new Date(Date.now() + 30 * 60 * 1000).toISOString().replace(/[-:]/g, '').slice(0, 14),
      pp_ReturnURL: JAZZCASH_CONFIG.return_url,
      pp_CancelURL: JAZZCASH_CONFIG.cancel_url,
      pp_SecureHash: '', // Will be calculated below
    }

    // Calculate secure hash (simplified version - implement proper HMAC-SHA256)
    const hashString = Object.keys(paymentData)
      .filter(key => key !== 'pp_SecureHash')
      .sort()
      .map(key => paymentData[key])
      .join('&') + '&' + JAZZCASH_CONFIG.integrity_salt

    // In production, implement proper HMAC-SHA256 hash calculation
    const crypto = await import('node:crypto')
    const hash = crypto.createHash('sha256').update(hashString).digest('hex')
    paymentData.pp_SecureHash = hash

    // Update payment record with JazzCash reference
    const { error: paymentError } = await supabaseClient
      .from('payments')
      .update({
        transaction_id: order.order_number,
        response_data: paymentData,
        status: 'initiated'
      })
      .eq('order_id', orderId)

    if (paymentError) {
      console.error('Payment update error:', paymentError)
    }

    // Return payment form data for frontend
    return new Response(
      JSON.stringify({
        success: true,
        payment_url: 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/', // Use production URL for live
        form_data: paymentData,
        order_number: order.order_number,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('JazzCash payment error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})