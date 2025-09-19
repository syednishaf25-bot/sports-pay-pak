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

    const { orderId, amount } = await req.json()

    if (!orderId || !amount) {
      return new Response(
        JSON.stringify({ error: 'Order ID and amount are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // EasyPaisa configuration (sandbox/production)
    const easypaisaConfig = {
      storeId: Deno.env.get('EASYPAISA_STORE_ID') || 'your_store_id',
      integrationKey: Deno.env.get('EASYPAISA_INTEGRATION_KEY') || 'your_integration_key',
      paymentUrl: Deno.env.get('EASYPAISA_PAYMENT_URL') || 'https://easypay.easypaisa.com.pk/easypay/Confirm.jsf',
      postBackURL: `${Deno.env.get('SUPABASE_URL')}/functions/v1/easypaisa-callback`,
      returnURL: `${Deno.env.get('SITE_URL')}/payment/success`,
    }

    // Prepare payment data for EasyPaisa
    const paymentData = {
      pp_Version: '1.1',
      pp_TxnType: 'MWALLET',
      pp_Language: 'EN',
      pp_MerchantID: easypaisaConfig.storeId,
      pp_SubMerchantID: '',
      pp_Password: easypaisaConfig.integrationKey,
      pp_BankID: 'TBANK',
      pp_ProductID: 'RETL',
      pp_TxnRefNo: order.order_number,
      pp_Amount: (amount * 100).toString(), // Convert to paisa
      pp_TxnCurrency: 'PKR',
      pp_TxnDateTime: new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14),
      pp_BillReference: order.order_number,
      pp_Description: `Payment for Order ${order.order_number}`,
      pp_TxnExpiryDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace(/[-:.]/g, '').slice(0, 14),
      pp_ReturnURL: easypaisaConfig.returnURL,
      pp_PostBackURL: easypaisaConfig.postBackURL,
    }

    // Calculate secure hash (simplified - implement proper HMAC-SHA256 for production)
    const hashString = Object.values(paymentData).join('&')
    const pp_SecureHash = btoa(hashString).slice(0, 32) // Simplified hash

    paymentData.pp_SecureHash = pp_SecureHash

    // Create payment record
    const { error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        order_id: orderId,
        amount: amount,
        provider: 'easypaisa',
        currency: 'PKR',
        status: 'initiated',
        transaction_id: order.order_number,
        response_data: paymentData
      })

    if (paymentError) {
      console.error('Payment creation error:', paymentError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl: easypaisaConfig.paymentUrl,
        formData: paymentData,
        orderNumber: order.order_number
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('EasyPaisa payment error:', error)
    return new Response(
      JSON.stringify({ error: 'Payment processing failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})