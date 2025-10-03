import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('Creating admin user...');

    // Create admin user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'tahir@gmail.com',
      password: 'tahir',
      email_confirm: true,
      user_metadata: {
        full_name: 'Tahir Admin'
      }
    });

    if (authError) {
      // Check if user already exists
      if (authError.message.includes('already registered')) {
        console.log('Admin user already exists, fetching user...');
        
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;
        
        const existingUser = users.find(u => u.email === 'tahir@gmail.com');
        if (!existingUser) throw new Error('User exists but could not be found');

        // Ensure profile exists
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: existingUser.id,
            full_name: 'Tahir Admin'
          }, { onConflict: 'id' });

        if (profileError) console.error('Profile error:', profileError);

        // Ensure admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: existingUser.id,
            role: 'admin'
          }, { onConflict: 'user_id,role' });

        if (roleError) throw roleError;

        // Remove customer role if exists
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', existingUser.id)
          .eq('role', 'customer');

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Admin user already exists and role verified',
            userId: existingUser.id 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw authError;
    }

    console.log('Admin user created:', authData.user.id);

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: 'Tahir Admin'
      });

    if (profileError && !profileError.message.includes('duplicate')) {
      console.error('Profile creation error:', profileError);
    }

    // Assign admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'admin'
      });

    if (roleError && !roleError.message.includes('duplicate')) {
      throw roleError;
    }

    // Remove customer role if it was created
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', authData.user.id)
      .eq('role', 'customer');

    console.log('Admin setup complete');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin user created successfully',
        email: 'tahir@gmail.com',
        password: 'tahir',
        userId: authData.user.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
