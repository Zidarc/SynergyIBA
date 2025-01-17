const supabaseUrl = 'https://ztzjruycuxyblnsgqjqi.supabase.co';  
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0empydXljdXh5Ymxuc2dxanFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NzI5OTEsImV4cCI6MjA1MjU0ODk5MX0.2ayQNIfLivLUH5rOnKJrSViIT4jX9Ww3A0xAFv9WlSE';

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

