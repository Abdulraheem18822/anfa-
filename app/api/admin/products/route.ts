import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with your project credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xmuiudkldqzxqbocbuwb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_PeroVP9Xv7r1iaKsqdxbqQ_jn7cpRVX';

const supabase = createClient(supabaseUrl, supabaseKey);

// GET: Fetch all products
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: data?.length || 0, products: data || [] }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Insert a new product
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      name,
      sku,
      price,
      originalPrice,
      category,
      gender,
      description,
      image,
      sizes,
      availableColors,
      isLive,
      tags,
    } = body;

    const productId = body.id || `prod-${Date.now()}`;
    const productName = title || name || 'Custom T-Shirt';

    const { data, error } = await supabase.from('products').insert([
      {
        id: productId,
        sku: sku || `ANFA-${Math.floor(1000 + Math.random() * 9000)}`,
        name: productName,
        price: Number(price || 799),
        original_price: originalPrice ? Number(originalPrice) : Number(price || 799) * 1.5,
        category: category || 'new',
        gender: gender || 'unisex',
        description: description || 'Premium 240 GSM heavyweight cotton tee.',
        image: image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
        sizes: sizes || ['S', 'M', 'L', 'XL', '2XL'],
        available_colors: availableColors || [{ name: 'Pitch Black', hex: '#1E1E24' }],
        is_live: isLive ?? true,
        tags: tags || ['streetwear', 'custom', 'pod'],
        created_at: new Date().toISOString(),
      },
    ]).select();

    if (error) {
      console.error('Supabase product insert error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        message: `Product [${productName}] created successfully in database.`,
        product: data?.[0] || body,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
