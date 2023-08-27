import logo from './logo.svg';
import './App.css';
import { useSession, useSupabaseClient, useSessionContext } from '@supabase/auth-helpers-react';
import { useState } from 'react';



function App() {
  const [ start, setStart ] = useState(new Date());
  const [ end, setEnd ] = useState(new Date());
  const [ eventName, setEventName ] = useState("");
  const [ eventDescription, setEventDescription ] = useState("");

  const session = useSession(); // tokens, when session exists we have a user
  const supabase = useSupabaseClient(); // talk to supabase!
  const { isLoading } = useSessionContext();
  
  if(isLoading) {
    return <></>
  }

  async function googleSignIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar'
      }
    });
    if(error) {
      alert("Error logging in to Google provider with Supabase");
      console.log(error);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function createCalendarEvent() {
    console.log("Creating calendar event");
    const event = {
      'summary': eventName,
      'description': eventDescription,
      'start': {
        'dateTime': start.toISOString(), // Date.toISOString() ->
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone // America/Los_Angeles
      },
      'end': {
        'dateTime': end.toISOString(), // Date.toISOString() ->
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone // America/Los_Angeles
      }
    }
    await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        'Authorization':'Bearer ' + session.provider_token // Access token for google
      },
      body: JSON.stringify(event)
    }).then((data) => {
      return data.json();
    }).then((data) => {
      console.log(data);
      alert("Event created, check your Google Calendar!");
    });
  }

  console.log(session);
  console.log(start);
  console.log(eventName);
  console.log(eventDescription);
 
  async function readCalendarEvent() {
    console.log("Read calendar event");
    fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=2023-08-25T00:00:00Z&maxResults=1&orderBy=updated&singleEvents=true", {
      method: "GET",
      headers: {
        'Authorization': 'Bearer ' + session.provider_token
      }
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(errorResponse => {
          throw new Error(`API Error: ${errorResponse.error.message}`);
        });
      }
      return response.json();
    })
    .then(data => {
      console.log(data);
    })
    .catch(error => {
      console.error('Fetch error:', error);
    });

    

  }
  
 
// Load the Google API client library
gapi.load('client:auth2', initClient);

function initClient() {
  // Initialize the API client with your API key or OAuth credentials
  gapi.client.init({
    apiKey: 'YOUR_API_KEY',
    clientId: 'YOUR_CLIENT_ID',
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
    scope: "https://www.googleapis.com/auth/calendar.readonly",
  }).then(function() {
    // Call the function to retrieve events
    listUpcomingEvents();
  });
}

function listUpcomingEvents() {
  // Set the minimum start time for events (timeMin)
  var now = new Date();
  var timeMin = now.toISOString(); // Current time in ISO format

  // Make the API request to retrieve events
  gapi.client.calendar.events.list({
    'calendarId': 'primary', // Use 'primary' for the user's primary calendar
    'timeMin': timeMin,
    'showDeleted': false,
    'singleEvents': true,
    'orderBy': 'startTime'
  }).then(function(response) {
    var events = response.result.items;

    if (events.length > 0) {
      console.log('Upcoming events:');
      for (var i = 0; i < events.length; i++) {
        var event = events[i];
        var start = event.start.dateTime || event.start.date;
        console.log('%s - %s', start, event.summary);
      }
    } else {
      console.log('No upcoming events found.');
    }
  });
}



  
  return (
    <div className="App">
      <div style={{width: "400px", margin: "30px auto"}}>
        {session ?
          <>
            <h2>Hey there {session.user.email}</h2>
            <p>Start of your event</p>
          
            <p>End of your event</p>
      
            <p>Event name</p>
            <input type="text" onChange={(e) => setEventName(e.target.value)} />
            <p>Event description</p>
            <input type="text" onChange={(e) => setEventDescription(e.target.value)} />
            <hr />
            <button onClick={() => createCalendarEvent()}>Create Calendar Event</button>
            <p></p>
            <button onClick={() => signOut()}>Sign Out</button>
            <p></p>
            <button onClick={() => readCalendarEvent()}>Read Calendar  </button>
          </>
          :
          <>
             
            <button onClick={() => googleSignIn()}>Sign In With Google</button>
          </>
          
         
        }
      </div>
    </div>
  );
}

export default App;
