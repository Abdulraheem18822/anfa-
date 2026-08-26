import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xmuiudkldqzxqbocbuwb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_PeroVP9Xv7r1iaKsqdxbqQ_jn7cpRVX';

const supabase = createClient(supabaseUrl, supabaseKey);

// GET: Fetch all products from Supabase
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    return Response.json(
      { success: true, count: data?.length || 0, products: data || [] },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (err: any) {
    return Response.json({ success: false, error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Insert a new product into Supabase products table
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
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    return Response.json(
      {
        success: true,
        message: `Product [${productName}] created successfully in database.`,
        product: data?.[0] || body,
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (err: any) {
    return Response.json({ success: false, error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}

// OPTIONS: Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
