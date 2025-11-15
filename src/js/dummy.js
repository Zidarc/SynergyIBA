const supabaseUrl = 'https://pcexjmyvipuazanxuybh.supabase.co';  
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjZXhqbXl2aXB1YXphbnh1eWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxODY4MDQsImV4cCI6MjA3ODc2MjgwNH0.jynkTkG9aLy1s_MFPIK3c-fwlFxS8FKKOsIrxqNH0PQ';
//public anon key
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

const master = () => {
  console.log('MasterCoins row changed!');
  const dataElement = document.getElementById('data');
  dataElement.textContent = 'Change detected: MasterCoins row updated!';
};

supabaseClient
  .channel('userdata')
  .on('postgres_changes', 
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'userdata',
      filter: 'Team_password=eq.MC',
    }, 
    (payload) => {
      console.log('Change received!', payload);
      master();
    }
  )
  .subscribe();

