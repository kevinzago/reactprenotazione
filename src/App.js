import logo from './logo.svg';
import './App.css';
import { useSession, useSupabaseClient, useSessionContext } from '@supabase/auth-helpers-react';
import { useState} from 'react';






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

 /*  async function googleSignIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        scopes: 'https://www.googleapis.com/auth/calendar'
      }
    });
    if(error) {
      alert("Error logging in to Google provider with Supabase");
      console.log(error);
    }
  } */


  async function googleSignIn() {
    const { error, session } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          access_type: 'offline',  // Richiedi un token di refresh
          prompt: 'consent',      // Forza il consenso dell'utente
        },
        scopes: 'https://www.googleapis.com/auth/calendar',
      },
    });
  
    if (error) {
      alert('Errore durante l\'accesso tramite il provider Google con Supabase');
      console.log(error);
    } else if (session) {
      // Estrai il provider_token dalla sessione
      const providerToken = session.provider_token;
  
      // Archivia il providerToken dove preferisci (local storage, cookie, database, server, ecc.)
      localStorage.setItem('providerToken', providerToken);
    
    // Calcola il tempo di scadenza del token di accesso
    const expiresIn = session.expires_in;  // Durata in secondi
    const expirationTime = Date.now() + expiresIn * 1000;  // Converti in millisecondi
    localStorage.setItem('tokenExpiration', expirationTime);
    console.log('Token di accesso ottenuto con successo:', providerToken);
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

  // Leggi il valore dal localStorage
  const providerToken = localStorage.getItem('providerToken');
  const tokenExpiration = localStorage.getItem('tokenExpiration');

  console.log('Provider Token:', providerToken);
  console.log('Token Expiration:', tokenExpiration);
  
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
  
  


  async function leggiEventoCalendario() {
    try {
      // evento partenza oggi 
      const eventStartTime = new Date()
      eventStartTime.setDate(eventStartTime.getDate())
      console.log(eventStartTime)
      const apiKey = 'AIzaSyCSad6CvkFdNozqiVAiabhOz0jUehdPTzE'; // Sostituisci con la tua chiave API Google
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${eventStartTime.toISOString()}&maxResults=1&orderBy=updated&singleEvents=true&key=${apiKey}`,{
         method: "GET",
         headers: {
          'Authorization': 'Bearer ' + session.provider_token
        }

         }
      );
  
      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(`Errore API: ${errorResponse.error.message}`);
      }
  
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error('Errore nella richiesta:', error);
    }
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
            <p></p>
            <button onClick={() => leggiEventoCalendario()}>Leggi evento Calendar  </button>
          </>
          :
          <>

            <p></p>
            <button onClick={() => googleSignIn()}>Sign In With Google</button>
          </>
          
         
        }
      </div>
    </div>
  );
}

export default App;
