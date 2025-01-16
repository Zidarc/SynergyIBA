import { createClient } from '@supabase/supabase-js'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Function to handle insert
const master = () => {
  console.log('MasterCoins row changed!')
  // Update the HTML element with the detected change
  const dataElement = document.getElementById('data');
  dataElement.textContent = 'Change detected: MasterCoins row updated!';
}


supabase
  .channel('userdata')
  .on('postgres_changes', 
    {
      event: 'UPDATE', 
      schema: 'public',
      table: 'userdata',
      filter: 'Team_password=eq.MasterCoins',
    }, 
    (payload) => {
      console.log('Change received!', payload)
      master();  // Call the master function to update the UI
    }
  )
  .subscribe()
