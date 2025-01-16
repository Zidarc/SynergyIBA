// Initialize the Supabase client in the browser (client-side)
// Replace these values with your Supabase project URL and anon key
const supabaseUrl = 'https://ztzjruycuxyblnsgqjqi.supabase.co';  // Replace with your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0empydXljdXh5Ymxuc2dxanFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NzI5OTEsImV4cCI6MjA1MjU0ODk5MX0.2ayQNIfLivLUH5rOnKJrSViIT4jX9Ww3A0xAFv9WlSE';  // Replace with your Supabase anonymous API key

const supabase = createClient(supabaseUrl, supabaseKey);

// Function to handle the insert
const master = () => {
  console.log('MasterCoins row changed!');
  // Update the HTML element with the detected change
  const dataElement = document.getElementById('data');
  dataElement.textContent = 'Change detected: MasterCoins row updated!';
};

// Listen to changes in 'userdata' table for 'Team_password' = 'MasterCoins'
supabase
  .channel('userdata')
  .on('postgres_changes', 
    {
      event: 'UPDATE', // We are listening for updates (changes)
      schema: 'public',
      table: 'userdata',
      filter: 'Team_password=eq.MasterCoins', // Filter for the row where Team_password = 'MasterCoins'
    }, 
    (payload) => {
      console.log('Change received!', payload);
      master();  // Call the master function to update the UI
    }
  )
  .subscribe();
