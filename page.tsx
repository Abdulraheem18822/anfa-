import { createClient } from './utils/supabase/server';

export default async function Page() {
  // Demo SSR page component using Supabase server helper
  const cookieStore = {
    getAll: () => [],
    set: () => {},
  };
  const supabase = createClient(cookieStore);

  const { data: products } = await supabase.from('products').select('*');

  return (
    <div style={{ padding: 20 }}>
      <h1>Supabase Connected Products</h1>
      <ul>
        {products?.map((item: any) => (
          <li key={item.id}>{item.name || item.title} - ₹{item.price}</li>
        ))}
      </ul>
    </div>
  );
}
