import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

let supabase: any = null;
try {
  supabase = createClient();
} catch (error) {
  // Supabase client creation failed (e.g., during build time)
  console.warn('Supabase client creation failed:', error);
}

interface YooKassaPayment {
  amount: {
    value: string;
    currency: string;
  };
  confirmation: {
    type: string;
    return_url: string;
  };
  capture: boolean;
  description: string;
  metadata?: Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'RUB', description, return_url, user_id, plan_id } = await request.json();

    if (!amount || !description || !return_url || !user_id || !plan_id) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные поля' },
        { status: 400 }
      );
    }

    // Validate amount (minimum 1 ruble for YooKassa)
    const amountValue = parseFloat(amount);
    if (amountValue < 1) {
      return NextResponse.json(
        { error: 'Минимальная сумма платежа 1 рубль' },
        { status: 400 }
      );
    }

    const idempotenceKey = uuidv4();
    
    const paymentData: YooKassaPayment = {
      amount: {
        value: amountValue.toFixed(2),
        currency: currency,
      },
      confirmation: {
        type: 'redirect',
        return_url: return_url,
      },
      capture: true,
      description: description,
      metadata: {
        user_id: user_id,
        plan_id: plan_id,
        source: 'academgrad_web',
      },
    };

    // Create payment with YooKassa API
    const yookassaResponse = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`).toString('base64')}`,
        'Idempotence-Key': idempotenceKey,
      },
      body: JSON.stringify(paymentData),
    });

    if (!yookassaResponse.ok) {
      const errorData = await yookassaResponse.json();
      console.error('YooKassa API error:', errorData);
      return NextResponse.json(
        { error: 'Ошибка при создании платежа в ЮKassa' },
        { status: 400 }
      );
    }

    const payment = await yookassaResponse.json();

    // Save payment info to database (commented out due to missing table)
    // const { error: dbError } = await supabase
    //   .from('payments')
    //   .insert({
    //     id: payment.id,
    //     user_id: user_id,
    //     amount: amountValue,
    //     currency: currency,
    //     status: payment.status,
    //     provider: 'yookassa',
    //     provider_payment_id: payment.id,
    //     description: description,
    //     metadata: payment.metadata,
    //     created_at: new Date().toISOString(),
    //   });

    // if (dbError) {
    //   console.error('Database error:', dbError);
    //   // Continue even if DB insert fails, as payment is created
    // }

    return NextResponse.json({
      payment_id: payment.id,
      status: payment.status,
      confirmation_url: payment.confirmation?.confirmation_url,
      amount: payment.amount,
    });

  } catch (error) {
    console.error('Error creating YooKassa payment:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}